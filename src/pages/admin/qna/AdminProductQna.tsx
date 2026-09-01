import { useEffect, useState } from "react";

import { useGlobalStore } from "../../../store/store";
import { getSpringApiUrl } from "../../../components/ToolBak";

import "../../../styles/admin/qna/AdminProductQna.css";

type ProductQna = {
  id: number;
  productId: number;
  productName?: string;
  memberId: number;
  memberNickname?: string;
  title: string;
  content: string;
  secret: string;
  answer?: string | null;
  answererId?: number | null;
  status: string;
  createdAt: string;
  answerDate?: string | null;
};


type ProductQnaPageResponse = {
  content: ProductQna[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

type Product = {
  id?: number;
  productId?: number;
  brand?: string;
  name: string;
  price: number;
  discount?: string;
};

type ProductImage = {
  id: number;
  productColorId: number;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
};

type ProductColor = {
  id: number;
  productId: number;
  colorName: string;
  isMain: string;
  sortOrder: number;
  visible: string;
  images?: ProductImage[];
};

type ProductPreview = {
  productId: number;
  brand: string;
  name: string;
  price: number;
  discount?: string;
  imageUrl: string;
};

const API_BASE = getSpringApiUrl();

const AdminProductQna = () => {
  const { memberId, gradeId } = useGlobalStore();

  const [items, setItems] = useState<ProductQna[]>([]);
  const [productMap, setProductMap] = useState<Record<number, ProductPreview>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selected, setSelected] = useState<ProductQna | null>(null);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  const getImageUrl = (path?: string) => {
    if (!path) return "";

    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      return path;
    }

    return `${API_BASE}${path}`;
  };

  const getThumbnail = (colors: ProductColor[]) => {
    const visibleColors = colors
      .filter((color) => color.visible !== "N")
      .sort((a, b) => {
        if (a.isMain === "Y" && b.isMain !== "Y") return -1;
        if (a.isMain !== "Y" && b.isMain === "Y") return 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    const images = visibleColors.flatMap((color) =>
      (color.images ?? []).map((image) => ({
        ...image,
        colorIsMain: color.isMain,
      }))
    );

    const thumbnail =
      images
        .filter((image) => image.imageType === "THUMBNAIL")
        .sort((a, b) => {
          if (a.isMain === "Y" && b.isMain !== "Y") return -1;
          if (a.isMain !== "Y" && b.isMain === "Y") return 1;
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        })[0] ??
      images
        .filter(
          (image) =>
            image.isMain === "Y" ||
            image.imageType === "MAIN"
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        )[0] ??
      images[0];

    return thumbnail?.filePath
      ? getImageUrl(thumbnail.filePath)
      : "";
  };

  const getDiscountRate = (discount?: string) => {
    if (!discount) return 0;

    const value = Number(
      discount.replace(/[^0-9]/g, "")
    );

    return Number.isNaN(value)
      ? 0
      : value;
  };

  const getSalePrice = (
    price: number,
    discount?: string
  ) => {
    const rate = getDiscountRate(discount);

    if (rate <= 0) {
      return price;
    }

    return Math.round(
      price * (1 - rate / 100)
    );
  };

  const loadProductPreview = async (
    productId: number
  ): Promise<ProductPreview> => {
    try {
      const [productResponse, colorResponse] =
        await Promise.all([
          fetch(
            `${API_BASE}/product/${productId}`
          ),
          fetch(
            `${API_BASE}/product_color/product/${productId}`
          ),
        ]);

      const product: Product | null =
        productResponse.ok
          ? await productResponse.json()
          : null;

      const colors: ProductColor[] =
        colorResponse.ok
          ? await colorResponse.json()
          : [];

      return {
        productId,
        brand:
          product?.brand ??
          "ONNIVER",
        name:
          product?.name ??
          `상품 #${productId}`,
        price:
          product?.price ??
          0,
        discount:
          product?.discount,
        imageUrl:
          getThumbnail(colors),
      };
    } catch (e) {
      console.error(
        `상품 ${productId} 미리보기 조회 오류`,
        e
      );

      return {
        productId,
        brand: "ONNIVER",
        name: `상품 #${productId}`,
        price: 0,
        imageUrl: "",
      };
    }
  };

  const loadQna = async (
    page = currentPage
  ) => {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams({
          page: String(page),
          size: "10",
        });

      if (keyword.trim()) {
        params.set(
          "keyword",
          keyword.trim()
        );
      }

      if (status !== "ALL") {
        params.set(
          "status",
          status
        );
      }

      const response = await fetch(
        `${API_BASE}/product_qna/admin/page?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          "상품 문의 목록을 불러오지 못했습니다."
        );
      }

      const pageData:
        ProductQnaPageResponse =
          await response.json();

      const data =
        pageData.content ?? [];

      setItems(data);
      setTotalPages(
        pageData.totalPages ?? 0
      );
      setTotalElements(
        pageData.totalElements ?? 0
      );

      const uniqueProductIds =
        Array.from(
          new Set(
            data.map(
              (item) =>
                item.productId
            )
          )
        );

      const previews =
        await Promise.all(
          uniqueProductIds.map(
            (productId) =>
              loadProductPreview(
                productId
              )
          )
        );

      const nextProductMap:
        Record<number, ProductPreview> =
          {};

      previews.forEach(
        (preview) => {
          nextProductMap[
            preview.productId
          ] = preview;
        }
      );

      setProductMap(
        nextProductMap
      );
    } catch (e) {
      console.error(
        "상품 문의 조회 오류",
        e
      );

      setError(
        e instanceof Error
          ? e.message
          : "조회 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQna(currentPage);
  }, [
    currentPage,
    keyword,
    status,
  ]);



  const openDetail = (
    item: ProductQna
  ) => {
    setSelected(item);
    setAnswer(
      item.answer ?? ""
    );
  };

  const openProductPage = (
    productId: number
  ) => {
    window.open(
      `/products/${productId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const submitAnswer =
    async () => {
      if (!selected) {
        return;
      }

      if (
        Number(gradeId) !== 4
      ) {
        alert(
          "관리자만 답변을 등록할 수 있습니다."
        );
        return;
      }

      if (!answer.trim()) {
        alert(
          "답변 내용을 입력해주세요."
        );
        return;
      }

      try {
        setSaving(true);

        const response =
          await fetch(
            `${API_BASE}/product_qna/${selected.id}/answer`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  answererId:
                    memberId,
                  answer:
                    answer.trim(),
                }
              ),
            }
          );

        if (!response.ok) {
          const message =
            await response.text();

          throw new Error(
            message ||
              "답변 등록에 실패했습니다."
          );
        }

        const updated:
          ProductQna =
            await response.json();

        setItems((prev) =>
          prev.map((item) =>
            item.id === updated.id
              ? updated
              : item
          )
        );

        setSelected(
          updated
        );

        setAnswer(
          updated.answer ?? ""
        );

        alert(
          "답변이 저장되었습니다."
        );

        await loadQna(
          currentPage
        );
      } catch (e) {
        console.error(
          "상품 문의 답변 오류",
          e
        );

        alert(
          e instanceof Error
            ? e.message
            : "답변 저장 중 오류가 발생했습니다."
        );
      } finally {
        setSaving(false);
      }
    };

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value.slice(
        0,
        10
      );
    }

    return date.toLocaleDateString(
      "ko-KR"
    );
  };

  return (
    <div className="admin-qna-page">

      <div className="admin-qna-title">
        <div>
          <p>
            PRODUCT Q&A
          </p>

          <h1>
            상품 문의 관리
          </h1>
        </div>

        <span>
          전체 {totalElements}건
        </span>
      </div>

      <div className="admin-qna-toolbar">

        <div className="admin-qna-status-filter">
          {[
            ["ALL", "전체"],
            ["WAITING", "답변대기"],
            ["ANSWERED", "답변완료"],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  status === value
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setStatus(value);
                  setCurrentPage(0);
                }}
              >
                {label}
              </button>
            )
          )}
        </div>

        <form
          className="admin-qna-search-form"
          onSubmit={(event) => {
            event.preventDefault();
            setKeyword(
              searchInput.trim()
            );
            setCurrentPage(0);
          }}
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              const value =
                event.target.value;

              setSearchInput(value);

              if (
                value.trim() === ""
              ) {
                setKeyword("");
                setCurrentPage(0);
              }
            }}
            placeholder="상품명, 상품번호, 문의 제목, 작성자 검색"
          />

          <button
            type="submit"
          >
            검색
          </button>
        </form>
      </div>

      {loading ? (
        <div className="admin-qna-message">
          상품 문의를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="admin-qna-message">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => loadQna(currentPage)}
          >
            다시 불러오기
          </button>
        </div>
      ) : (
        <div className="admin-qna-table-wrap">

          <div className="admin-qna-table-head">
            <span>문의번호</span>
            <span>상태</span>
            <span>
              상품 / 문의 제목
            </span>
            <span>작성자</span>
            <span>작성일</span>
          </div>

          {items.length ===
          0 ? (
            <div className="admin-qna-message">
              조건에 맞는 상품 문의가 없습니다.
            </div>
          ) : (
            items.map(
              (item) => {
                const product =
                  productMap[
                    item.productId
                  ];

                return (
                  <button
                    type="button"
                    className="admin-qna-row"
                    key={item.id}
                    onClick={() =>
                      openDetail(
                        item
                      )
                    }
                  >
                    <span className="admin-qna-id">
                      #{item.id}
                    </span>

                    <span
                      className={`admin-qna-badge ${item.status.toLowerCase()}`}
                    >
                      {item.status ===
                      "ANSWERED"
                        ? "답변완료"
                        : item.status ===
                            "CLOSED"
                          ? "종료"
                          : "답변대기"}
                    </span>

                    <span className="admin-qna-subject">
                      <span className="admin-qna-product-inline">
                        <span className="admin-qna-list-thumb">
                          {product?.imageUrl ? (
                            <img
                              src={
                                product.imageUrl
                              }
                              alt={
                                product.name
                              }
                            />
                          ) : (
                            <span>
                              NO IMAGE
                            </span>
                          )}
                        </span>

                        <span className="admin-qna-product-text">
                          <small>
                            {product?.brand ||
                              "ONNIVER"} · 상품 #
                            {item.productId}
                          </small>

                          <b>
                            {product?.name ||
                              `상품 #${item.productId}`}
                          </b>

                          <strong>
                            {item.secret ===
                            "Y"
                              ? "[비밀글] "
                              : ""}
                            {item.title}
                          </strong>
                        </span>
                      </span>
                    </span>

                    <span>
                      {item.memberNickname ||
                        `회원 #${item.memberId}`}
                    </span>

                    <span>
                      {formatDate(
                        item.createdAt
                      )}
                    </span>
                  </button>
                );
              }
            )
          )}
        </div>
      )}

      {!loading &&
        !error &&
        totalPages > 1 && (
          <nav
            className="admin-qna-pagination"
            aria-label="관리자 상품문의 페이지"
          >
            <button
              type="button"
              disabled={
                currentPage === 0
              }
              onClick={() =>
                setCurrentPage(
                  currentPage - 1
                )
              }
            >
              ‹
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => index
            )
              .filter(
                (page) =>
                  page === 0 ||
                  page ===
                    totalPages - 1 ||
                  Math.abs(
                    page -
                      currentPage
                  ) <= 2
              )
              .map(
                (
                  page,
                  index,
                  pages
                ) => {
                  const previous =
                    pages[
                      index - 1
                    ];

                  return (
                    <span
                      key={page}
                    >
                      {previous !==
                        undefined &&
                        page -
                          previous >
                          1 && (
                          <i>
                            …
                          </i>
                        )}

                      <button
                        type="button"
                        className={
                          currentPage ===
                          page
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                      >
                        {page + 1}
                      </button>
                    </span>
                  );
                }
              )}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages - 1
              }
              onClick={() =>
                setCurrentPage(
                  currentPage + 1
                )
              }
            >
              ›
            </button>
          </nav>
        )}

      {selected && (
        <div
          className="admin-qna-modal-backdrop"
          onClick={() =>
            setSelected(null)
          }
        >
          <section
            className="admin-qna-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-qna-modal-head">
              <div>
                <span>
                  {selected.status ===
                  "ANSWERED"
                    ? "답변완료"
                    : "답변대기"}
                </span>

                <h2>
                  {selected.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
              >
                ×
              </button>
            </div>

            {(() => {
              const product =
                productMap[
                  selected.productId
                ];

              const salePrice =
                product
                  ? getSalePrice(
                      product.price,
                      product.discount
                    )
                  : 0;

              const discountRate =
                product
                  ? getDiscountRate(
                      product.discount
                    )
                  : 0;

              return (
                <section className="admin-qna-product-card">
                  <div className="admin-qna-product-image">
                    {product?.imageUrl ? (
                      <img
                        src={
                          product.imageUrl
                        }
                        alt={
                          product.name
                        }
                      />
                    ) : (
                      <span>
                        NO IMAGE
                      </span>
                    )}
                  </div>

                  <div className="admin-qna-product-info">
                    <span>
                      PRODUCT
                    </span>

                    <strong>
                      {product?.brand ||
                        "ONNIVER"}
                    </strong>

                    <h3>
                      {product?.name ||
                        `상품 #${selected.productId}`}
                    </h3>

                    <p>
                      상품번호 #
                      {selected.productId}
                    </p>

                    {product &&
                      product.price >
                        0 && (
                        <div className="admin-qna-product-price">
                          {discountRate >
                            0 && (
                            <em>
                              {discountRate}%
                            </em>
                          )}

                          <b>
                            {salePrice.toLocaleString()}
                            원
                          </b>

                          {discountRate >
                            0 && (
                            <del>
                              {product.price.toLocaleString()}
                              원
                            </del>
                          )}
                        </div>
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        openProductPage(
                          selected.productId
                        )
                      }
                    >
                      상품 페이지 보기 →
                    </button>
                  </div>
                </section>
              );
            })()}

            <dl className="admin-qna-meta">
              <div>
                <dt>작성자</dt>
                <dd>
                  {selected.memberNickname ||
                    `회원 #${selected.memberId}`}
                </dd>
              </div>

              <div>
                <dt>작성일</dt>
                <dd>
                  {formatDate(
                    selected.createdAt
                  )}
                </dd>
              </div>

              <div>
                <dt>공개</dt>
                <dd>
                  {selected.secret ===
                  "Y"
                    ? "비밀글"
                    : "공개글"}
                </dd>
              </div>

              <div>
                <dt>문의번호</dt>
                <dd>
                  #{selected.id}
                </dd>
              </div>
            </dl>

            <div className="admin-qna-question">
              <strong>
                문의 내용
              </strong>

              <p>
                {selected.content}
              </p>
            </div>

            <div className="admin-qna-answer-box">
              <label htmlFor="admin-qna-answer">
                관리자 답변
              </label>

              <textarea
                id="admin-qna-answer"
                rows={7}
                value={answer}
                onChange={(event) =>
                  setAnswer(
                    event.target.value
                  )
                }
                placeholder="고객에게 전달할 답변을 입력해주세요."
              />

              {selected.answerDate && (
                <small>
                  최근 답변일{" "}
                  {formatDate(
                    selected.answerDate
                  )}
                </small>
              )}
            </div>

            <div className="admin-qna-modal-actions">
              <button
                type="button"
                className="cancel"
                onClick={() =>
                  setSelected(null)
                }
              >
                닫기
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={
                  submitAnswer
                }
              >
                {saving
                  ? "저장 중..."
                  : selected.answer
                    ? "답변 수정"
                    : "답변 등록"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminProductQna;
