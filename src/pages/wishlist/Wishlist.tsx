import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";

import { useGlobalStore } from "../../store/store";
import "../../styles/wishlist/Wishlist.css";

const API_BASE = "http://localhost:9103";
const PAGE_SIZE = 12;

type WishlistItem = {
  id: number;
  productId: number;
  categoryId?: number;
  brand?: string;
  productName: string;
  price: number;
  discount?: string;
  createdAt?: string;
};

type WishlistPageResponse = {
  content: WishlistItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements?: number;
  empty?: boolean;
};

type WishlistCategory = {
  categoryId: number;
  categoryName: string;
  parentId?: number | null;
  parentName?: string | null;
  productCount: number;
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

type WishlistViewItem = WishlistItem & {
  imageUrl?: string;
};

type MainCategoryGroup = {
  id: number;
  name: string;
  count: number;
  children: WishlistCategory[];
};

const Wishlist = () => {
  const navigate = useNavigate();

  const { sw, memberId } = useGlobalStore();

  const [items, setItems] = useState<WishlistViewItem[]>([]);

  const [categoryRows, setCategoryRows] = useState<WishlistCategory[]>([]);

  const [loading, setLoading] = useState(true);

  const [removingId, setRemovingId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<
    number | null
  >(null);

  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    number | null
  >(null);

  const [searchInput, setSearchInput] = useState("");

  const [keyword, setKeyword] = useState("");

  const [currentPage, setCurrentPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [totalElements, setTotalElements] = useState(0);

  const getImageUrl = (path?: string) => {
    if (!path) {
      return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `${API_BASE}${path}`;
  };

  const getThumbnail = (colors: ProductColor[]) => {
    const visibleColors = colors
      .filter((color) => color.visible !== "N")
      .sort((a, b) => {
        if (a.isMain === "Y" && b.isMain !== "Y") {
          return -1;
        }

        if (a.isMain !== "Y" && b.isMain === "Y") {
          return 1;
        }

        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    const images = visibleColors.flatMap((color) =>
      (color.images ?? []).map((image) => ({
        ...image,
        colorIsMain: color.isMain,
      })),
    );

    const thumbnail =
      images
        .filter((image) => image.imageType === "THUMBNAIL")
        .sort((a, b) => {
          if (a.isMain === "Y" && b.isMain !== "Y") {
            return -1;
          }

          if (a.isMain !== "Y" && b.isMain === "Y") {
            return 1;
          }

          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        })[0] ??
      images
        .filter((image) => image.isMain === "Y" || image.imageType === "MAIN")
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0] ??
      images[0];

    return thumbnail?.filePath ? getImageUrl(thumbnail.filePath) : "";
  };

  /**
   * 내가 찜한 상품에 실제로 존재하는
   * 카테고리만 서버에서 조회한다.
   */
  const loadCategories = async () => {
    if (!sw || memberId <= 0) {
      setCategoryRows([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/wishlist/member/${memberId}/categories`,
      );

      if (!response.ok) {
        throw new Error("찜 카테고리를 불러오지 못했습니다.");
      }

      const data: WishlistCategory[] = await response.json();

      setCategoryRows(data ?? []);
    } catch (e) {
      console.error("찜 카테고리 조회 오류", e);
    }
  };

  /**
   * 서버 검색 / 카테고리 필터 / 페이징
   */
  const loadWishlist = async (page = currentPage) => {
    if (!sw || memberId <= 0) {
      setItems([]);
      setTotalPages(0);
      setTotalElements(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
      });

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      if (selectedMainCategoryId !== null) {
        params.set("mainCategoryId", String(selectedMainCategoryId));
      }

      if (selectedSubCategoryId !== null) {
        params.set("categoryId", String(selectedSubCategoryId));
      }

      const response = await fetch(
        `${API_BASE}/wishlist/member/${memberId}/page?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("찜 목록을 불러오지 못했습니다.");
      }

      const pageData: WishlistPageResponse = await response.json();

      const viewData = await Promise.all(
        (pageData.content ?? []).map(async (item) => {
          try {
            const colorResponse = await fetch(
              `${API_BASE}/product_color/product/${item.productId}`,
            );

            const colors: ProductColor[] = colorResponse.ok
              ? await colorResponse.json()
              : [];

            return {
              ...item,
              imageUrl: getThumbnail(colors),
            };
          } catch {
            return item;
          }
        }),
      );

      setItems(viewData);

      setTotalPages(pageData.totalPages ?? 0);

      setTotalElements(pageData.totalElements ?? 0);

      if (
        (pageData.totalPages ?? 0) > 0 &&
        page >= (pageData.totalPages ?? 0)
      ) {
        setCurrentPage(Math.max((pageData.totalPages ?? 1) - 1, 0));
      }
    } catch (e) {
      console.error("찜 목록 조회 오류", e);

      setError(
        e instanceof Error ? e.message : "찜 목록 조회 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [sw, memberId]);

  useEffect(() => {
    loadWishlist(currentPage);
  }, [
    sw,
    memberId,
    currentPage,
    keyword,
    selectedMainCategoryId,
    selectedSubCategoryId,
  ]);

  /**
   * 서버가 내려준 카테고리 통계를
   * 대분류 / 하위분류 구조로 만든다.
   */
  const mainCategoryGroups = useMemo<MainCategoryGroup[]>(() => {
    const map = new Map<number, MainCategoryGroup>();

    categoryRows.forEach((row) => {
      const isMain = row.parentId == null;

      const mainId = isMain ? row.categoryId : Number(row.parentId);

      const mainName = isMain ? row.categoryName : row.parentName || "기타";

      if (!map.has(mainId)) {
        map.set(mainId, {
          id: mainId,
          name: mainName,
          count: 0,
          children: [],
        });
      }

      const group = map.get(mainId)!;

      group.count += Number(row.productCount ?? 0);

      if (!isMain) {
        group.children.push(row);
      }
    });

    return Array.from(map.values());
  }, [categoryRows]);

  const selectedChildren = useMemo(
    () =>
      mainCategoryGroups.find((group) => group.id === selectedMainCategoryId)
        ?.children ?? [],
    [mainCategoryGroups, selectedMainCategoryId],
  );

  const selectMainCategory = (categoryId: number) => {
    if (selectedMainCategoryId === categoryId) {
      setSelectedMainCategoryId(null);

      setSelectedSubCategoryId(null);
    } else {
      setSelectedMainCategoryId(categoryId);

      setSelectedSubCategoryId(null);
    }

    setCurrentPage(0);
  };

  const selectSubCategory = (categoryId: number) => {
    setSelectedSubCategoryId(
      selectedSubCategoryId === categoryId ? null : categoryId,
    );

    setCurrentPage(0);
  };

  const resetFilters = () => {
    setSelectedMainCategoryId(null);

    setSelectedSubCategoryId(null);

    setSearchInput("");
    setKeyword("");
    setCurrentPage(0);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setKeyword(searchInput.trim());

    setCurrentPage(0);
  };

  const clearSearch = () => {
    setSearchInput("");
    setKeyword("");
    setCurrentPage(0);
  };

  const movePage = (page: number) => {
    if (page < 0 || page >= totalPages) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const removeWishlist = async (productId: number) => {
    if (!sw || memberId <= 0) {
      return;
    }

    try {
      setRemovingId(productId);

      const response = await fetch(
        `${API_BASE}/wishlist/member/${memberId}/product/${productId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("찜 삭제에 실패했습니다.");
      }

      await Promise.all([loadCategories(), loadWishlist(currentPage)]);
    } catch (e) {
      console.error("찜 삭제 오류", e);

      window.alert(
        e instanceof Error ? e.message : "찜 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  const getDiscountRate = (discount?: string) => {
    if (!discount) {
      return 0;
    }

    const value = Number(discount.replace(/[^0-9]/g, ""));

    return Number.isNaN(value) ? 0 : value;
  };

  if (!sw || memberId <= 0) {
    return (
      <main className="wishlist-page">
        <section className="wishlist-login-required">
          <p>WISHLIST</p>

          <h1>찜한 상품</h1>

          <span>로그인 후 찜한 상품을 확인할 수 있습니다.</span>

          <button type="button" onClick={() => navigate("/login")}>
            로그인하기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <div className="wishlist-layout">
        <aside className="wishlist-sidebar">
          <div className="wishlist-sidebar-sticky">
            <p className="wishlist-sidebar-eyebrow">MY WISHLIST</p>

            <h1>LIKE</h1>

            <div className="wishlist-category-filter">
              <h2>카테고리 필터</h2>

              <div className="wishlist-category-list">
                {mainCategoryGroups.map((group) => (
                  <div className="wishlist-category-group" key={group.id}>
                    <button
                      type="button"
                      className={`wishlist-main-category ${
                        selectedMainCategoryId === group.id ? "active" : ""
                      }`}
                      onClick={() => selectMainCategory(group.id)}
                    >
                      <span>{group.name}</span>

                      {selectedMainCategoryId === group.id ? (
                        <span className="wishlist-category-close">×</span>
                      ) : (
                        <span className="wishlist-category-plus">+</span>
                      )}
                    </button>

                    {selectedMainCategoryId === group.id &&
                      selectedChildren.length > 0 && (
                        <div className="wishlist-sub-category-list">
                          {selectedChildren.map((child) => (
                            <button
                              key={child.categoryId}
                              type="button"
                              className={
                                selectedSubCategoryId === child.categoryId
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                selectSubCategory(child.categoryId)
                              }
                            >
                              {child.categoryName}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>

              <div className="wishlist-filter-actions">
                <button type="button" className="wishlist-show-products">
                  {totalElements}개의 상품 보기
                </button>

                <button
                  type="button"
                  className="wishlist-reset-filter"
                  onClick={resetFilters}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className="wishlist-main">
          <div className="wishlist-main-header">
            <div>
              <p>MY COLLECTION</p>

              <h2>찜한 상품</h2>
            </div>

            <span>{totalElements} ITEMS</span>
          </div>

          <form className="wishlist-search" onSubmit={handleSearch}>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                const value = event.target.value;

                setSearchInput(value);

                if (value.trim() === "") {
                  setKeyword("");
                  setCurrentPage(0);
                }
              }}
              placeholder="상품명, 브랜드, 카테고리를 검색하세요."
              aria-label="찜 상품 검색"
            />

            {searchInput && (
              <button
                type="button"
                className="wishlist-search-clear"
                onClick={clearSearch}
              >
                CLEAR
              </button>
            )}

            <button type="submit" className="wishlist-search-submit">
              SEARCH
            </button>
          </form>

          {loading && (
            <div className="wishlist-message">
              찜한 상품을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="wishlist-message">
              <strong>{error}</strong>

              <button type="button" onClick={() => loadWishlist(currentPage)}>
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <section className="wishlist-empty">
              <strong>검색 결과가 없습니다.</strong>

              <p>다른 검색어나 카테고리를 선택해보세요.</p>

              <button type="button" onClick={resetFilters}>
                필터 초기화
              </button>
            </section>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <section className="wishlist-grid">
                {items.map((item) => {
                  const discountRate = getDiscountRate(item.discount);

                  const salePrice =
                    discountRate > 0
                      ? Math.round(item.price * (1 - discountRate / 100))
                      : item.price;

                  return (
                    <article key={item.id} className="wishlist-card">
                      <div
                        className="wishlist-image-wrap"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/products/${item.productId}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            navigate(`/products/${item.productId}`);
                          }
                        }}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} />
                        ) : (
                          <div className="wishlist-no-image">NO IMAGE</div>
                        )}

                        <button
                          type="button"
                          className="wishlist-heart active"
                          disabled={removingId === item.productId}
                          aria-label="찜 삭제"
                          onClick={(event) => {
                            event.stopPropagation();

                            removeWishlist(item.productId);
                          }}
                        >
                          ♥
                        </button>
                      </div>

                      <div className="wishlist-info">
                        <span className="wishlist-brand">
                          {item.brand || "ONNIVER"}
                        </span>

                        <button
                          type="button"
                          className="wishlist-product-name"
                          onClick={() =>
                            navigate(`/products/${item.productId}`)
                          }
                        >
                          {item.productName}
                        </button>

                        <div className="wishlist-price">
                          {discountRate > 0 ? (
                            <>
                              <strong className="wishlist-discount">
                                {discountRate}%
                              </strong>

                              <strong>{salePrice.toLocaleString()}원</strong>

                              <del>{item.price.toLocaleString()}원</del>
                            </>
                          ) : (
                            <strong>{item.price.toLocaleString()}원</strong>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              {totalPages > 1 && (
                <nav
                  className="wishlist-pagination"
                  aria-label="찜 상품 페이지"
                >
                  <button
                    type="button"
                    className="wishlist-pagination-arrow"
                    disabled={currentPage === 0}
                    onClick={() => movePage(currentPage - 1)}
                  >
                    ‹
                  </button>

                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, index) => index,
                  )
                    .filter(
                      (page) =>
                        page === 0 ||
                        page === totalPages - 1 ||
                        Math.abs(page - currentPage) <= 2,
                    )
                    .map((page, index, visiblePages) => {
                      const previousPage = visiblePages[index - 1];

                      const showEllipsis =
                        previousPage !== undefined && page - previousPage > 1;

                      return (
                        <span key={page} className="wishlist-pagination-item">
                          {showEllipsis && (
                            <span className="wishlist-pagination-ellipsis">
                              …
                            </span>
                          )}

                          <button
                            type="button"
                            className={currentPage === page ? "active" : ""}
                            aria-current={
                              currentPage === page ? "page" : undefined
                            }
                            onClick={() => movePage(page)}
                          >
                            {page + 1}
                          </button>
                        </span>
                      );
                    })}

                  <button
                    type="button"
                    className="wishlist-pagination-arrow"
                    disabled={currentPage === totalPages - 1}
                    onClick={() => movePage(currentPage + 1)}
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Wishlist;
