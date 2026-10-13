import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import "../../styles/admin/AdminProductReview.css";

import { getSpringApiUrl } from '../../components/ToolBak';

const BASE_URL = getSpringApiUrl();

type Review = {
  id: number;
  memberId: number;
  memberNickname: string;
  orderDetailId?: number | null;
  productId: number;
  productName: string;
  beautySaveId?: number | null;
  beautyImageUrl?: string | null;
  title: string;
  content: string;
  rating: number;
  visible: string;
  createdAt: string;
  updatedAt?: string | null;
};

type ReviewPage = {
  content: Review[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

const AdminProductReview = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam - 1 : 0;
  const keyword = searchParams.get("keyword") ?? "";
  const visible = searchParams.get("visible") ?? "";
  const rating = searchParams.get("rating") ?? "";

  const [inputKeyword, setInputKeyword] = useState(keyword);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openedReviewId, setOpenedReviewId] = useState<number | null>(null);

  const changeParams = (
    changes: Record<string, string | null>,
    replace = false
  ) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });

    setSearchParams(next, { replace });
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        size: "10",
      });

      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (visible) params.set("visible", visible);
      if (rating) params.set("rating", rating);

      const response = await fetch(
        `${BASE_URL}/product_review/admin/page?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("상품 리뷰를 불러오지 못했습니다.");
      }

      const data: ReviewPage = await response.json();

      setReviews(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);

      if ((data.totalPages ?? 0) > 0 && page >= data.totalPages) {
        changeParams({ page: String(data.totalPages) }, true);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "상품 리뷰 조회 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInputKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    loadReviews();
  }, [page, keyword, visible, rating]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    changeParams({
      keyword: inputKeyword.trim() || null,
      page: "1",
    });
  };

  const handleVisible = async (review: Review) => {
    const nextVisible = review.visible === "Y" ? "N" : "Y";

    const response = await fetch(
      `${BASE_URL}/product_review/${review.id}/visible`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: nextVisible }),
      }
    );

    if (!response.ok) {
      window.alert("리뷰 공개 상태 변경에 실패했습니다.");
      return;
    }

    await loadReviews();
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value.slice(0, 10)
      : date.toLocaleDateString("ko-KR");
  };

  return (
    <main className="admin-review-page">
      <section className="admin-review-heading">
        <div>
          <p>PRODUCT REVIEW</p>
          <h1>상품 후기 관리</h1>
          <span>등록된 상품 리뷰를 검색하고 공개 상태를 관리합니다.</span>
        </div>

        <strong>{totalElements}<small> REVIEWS</small></strong>
      </section>

      <section className="admin-review-filter">
        <form onSubmit={handleSearch}>
          <input
            type="search"
            value={inputKeyword}
            placeholder="상품명, 닉네임, 리뷰 제목 검색"
            onChange={(event) => setInputKeyword(event.target.value)}
          />
          <button type="submit">검색</button>
        </form>

        <select
          value={visible}
          onChange={(event) =>
            changeParams({
              visible: event.target.value || null,
              page: "1",
            })
          }
        >
          <option value="">전체 공개상태</option>
          <option value="Y">공개</option>
          <option value="N">숨김</option>
        </select>

        <select
          value={rating}
          onChange={(event) =>
            changeParams({
              rating: event.target.value || null,
              page: "1",
            })
          }
        >
          <option value="">전체 별점</option>
          {[5, 4, 3, 2, 1].map((score) => (
            <option key={score} value={score}>{score}점</option>
          ))}
        </select>

        <button
          type="button"
          className="admin-review-reset"
          onClick={() => {
            setInputKeyword("");
            setSearchParams({});
          }}
        >
          초기화
        </button>
      </section>

      <section className="admin-review-table-wrap">
        <div className="admin-review-table-head">
          <span>번호</span><span>상품</span><span>리뷰</span>
          <span>작성자</span><span>별점</span><span>등록일</span><span>상태</span>
        </div>

        {loading ? (
          <div className="admin-review-message">상품 리뷰를 불러오는 중입니다.</div>
        ) : error ? (
          <div className="admin-review-message">
            <p>{error}</p>
            <button type="button" onClick={loadReviews}>다시 불러오기</button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="admin-review-message">검색 조건에 맞는 리뷰가 없습니다.</div>
        ) : (
          <div className="admin-review-list">
            {reviews.map((review) => {
              const opened = openedReviewId === review.id;

              return (
                <article key={review.id}>
                  <button
                    type="button"
                    className="admin-review-row"
                    onClick={() => setOpenedReviewId(opened ? null : review.id)}
                  >
                    <span>#{review.id}</span>
                    <span className="admin-review-product">
                      <strong>{review.productName}</strong>
                      <small>PRODUCT #{review.productId}</small>
                    </span>
                    <span className="admin-review-title">{review.title}</span>
                    <span>{review.memberNickname}</span>
                    <span>{review.rating}.0</span>
                    <span>{formatDate(review.createdAt)}</span>
                    <span>{review.visible === "Y" ? "공개" : "숨김"}</span>
                  </button>

                  {opened && (
                    <div className="admin-review-detail">
                      <strong>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </strong>
                      <h3>{review.title}</h3>
                      <p>{review.content}</p>

                      <div className="admin-review-detail-actions">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/products/${review.productId}?tab=review`)
                          }
                        >
                          상품 페이지 바로가기
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVisible(review)}
                        >
                          {review.visible === "Y"
                            ? "리뷰 숨기기"
                            : "리뷰 공개하기"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!loading && !error && totalPages > 1 && (
        <nav className="admin-review-pagination">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => changeParams({ page: String(page) })}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, index) => index).map(
            (target) => (
              <button
                key={target}
                type="button"
                className={target === page ? "active" : ""}
                onClick={() =>
                  changeParams({ page: String(target + 1) })
                }
              >
                {target + 1}
              </button>
            )
          )}

          <button
            type="button"
            disabled={page === totalPages - 1}
            onClick={() => changeParams({ page: String(page + 2) })}
          >
            ›
          </button>
        </nav>
      )}
    </main>
  );
};

export default AdminProductReview;
