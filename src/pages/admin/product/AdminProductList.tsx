import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { axiosInstance } from "../../../components/ToolBak";
import "../../../styles/admin/AdminProductList.css";

type Product = {
  id?: number;
  productId: number;
  categoryId?: number;
  categoryName?: string;
  brand?: string;
  name: string;
  price: number;
  discount?: string;
  productType?: string;
  aiApplyEnabled: string;
  status: string;
};

type ProductPageResponse = {
  content: Product[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements?: number;
  empty?: boolean;
};

type Category = {
  id?: number;
  categoryId?: number;
  parentId?: number | null;
  name: string;
  sortOrder?: number;
  visible?: string;
  parent?: {
    id?: number;
    categoryId?: number;
    name?: string;
  } | null;
};

const PAGE_SIZE = 10;

const AdminProductList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Math.max(
    (Number(searchParams.get("page") ?? "1") || 1) - 1,
    0,
  );

  const keyword = searchParams.get("keyword") ?? "";
  const mainCategoryId = searchParams.get("mainCategoryId") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";

  const [searchInput, setSearchInput] = useState(keyword);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const mainCategories = useMemo(
    () =>
      categories
        .filter((category) => {
          const parentId =
            category.parentId ??
            category.parent?.categoryId ??
            category.parent?.id ??
            null;

          return parentId === null && category.visible !== "N";
        })
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories],
  );

  const subCategories = useMemo(() => {
    if (!mainCategoryId) {
      return [];
    }

    const selectedMainId = Number(mainCategoryId);

    return categories
      .filter((category) => {
        const parentId =
          category.parentId ??
          category.parent?.categoryId ??
          category.parent?.id ??
          null;

        return parentId === selectedMainId && category.visible !== "N";
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories, mainCategoryId]);

  const updateParams = (
    updates: Record<string, string | null>,
    replace = false,
  ) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    setSearchParams(next, { replace });
  };

  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoryLoading(true);

        const response =
          await axiosInstance.get<Category[]>("/category/find_all");

        setCategories(
          response.data.map((category) => ({
            ...category,
            categoryId: category.categoryId ?? category.id ?? 0,
            parentId:
              category.parentId ??
              category.parent?.categoryId ??
              category.parent?.id ??
              null,
          })),
        );
      } catch (e) {
        console.error("카테고리 조회 오류", e);
      } finally {
        setCategoryLoading(false);
      }
    };

    loadCategories();
  }, []);

  const loadProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string | number> = {
        page,
        size: PAGE_SIZE,
        sort: "new",
      };

      if (keyword.trim()) {
        params.keyword = keyword.trim();
      }

      if (categoryId) {
        params.categoryId = Number(categoryId);
      } else if (mainCategoryId) {
        params.mainCategoryId = Number(mainCategoryId);
      }

      const response = await axiosInstance.get<ProductPageResponse>(
        "/product/admin/page",
        { params },
      );

      const data = response.data;

      setProducts(
        (data.content ?? []).map((product) => ({
          ...product,
          productId: product.productId ?? product.id ?? 0,
        })),
      );

      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);

      if ((data.totalPages ?? 0) > 0 && page >= (data.totalPages ?? 0)) {
        const lastPage = Math.max((data.totalPages ?? 1) - 1, 0);

        updateParams({ page: String(lastPage + 1) }, true);
      }
    } catch (e) {
      console.error("상품 목록 조회 오류", e);

      setError(e instanceof Error ? e.message : "상품 조회 오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage, keyword, mainCategoryId, categoryId]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    updateParams({
      keyword: searchInput.trim() || null,
      page: "1",
    });
  };

  const handleMainCategoryChange = (value: string) => {
    updateParams({
      mainCategoryId: value || null,
      categoryId: null,
      page: "1",
    });
  };

  const handleSubCategoryChange = (value: string) => {
    updateParams({
      categoryId: value || null,
      page: "1",
    });
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchParams({ page: "1" });
  };

  const movePage = (page: number) => {
    if (page < 0 || page >= totalPages) {
      return;
    }

    updateParams({
      page: String(page + 1),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteProduct = async (productId: number, productName: string) => {
    const confirmed = window.confirm(
      `"${productName}" 상품을 판매중지 처리하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.delete(`/product/${productId}`);

      alert("상품이 판매중지 처리되었습니다.");

      await loadProducts(currentPage);
    } catch (e) {
      console.error("상품 판매중지 오류", e);

      alert(
        e instanceof Error ? e.message : "상품 처리 중 오류가 발생했습니다.",
      );
    }
  };

  const resumeProduct = async (productId: number, productName: string) => {
    const confirmed = window.confirm(
      `"${productName}" 상품 판매를 재개하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.put(`/product/${productId}/resume`);

      alert("상품 판매가 재개되었습니다.");

      await loadProducts(currentPage);
    } catch (e) {
      console.error("상품 판매재개 오류", e);

      alert(
        e instanceof Error ? e.message : "상품 처리 중 오류가 발생했습니다.",
      );
    }
  };

  const displayStatus = (status?: string) => {
    switch (status) {
      case "ON_SALE":
        return "판매중";
      case "SOLD_OUT":
        return "품절";
      case "STOPPED":
        return "판매중지";
      case "HIDDEN":
        return "숨김";
      default:
        return status || "-";
    }
  };

  const currentQueryString = searchParams.toString();

  return (
    <main className="admin-product-list-page">
      <div className="admin-product-header">
        <div>
          <p>PRODUCT MANAGEMENT</p>
          <h1>상품 관리</h1>
          <span>총 {totalElements.toLocaleString()}개</span>
        </div>

        <button type="button" onClick={() => navigate("/admin/products/new")}>
          + 상품 등록
        </button>
      </div>

      <div className="admin-product-filter">
        <form className="admin-product-search" onSubmit={handleSearch}>
          <input
            type="search"
            value={searchInput}
            placeholder="상품명, 브랜드, 카테고리 검색"
            onChange={(event) => setSearchInput(event.target.value)}
          />

          <button type="submit">검색</button>
        </form>

        <div className="admin-product-filter-selects">
          <select
            value={mainCategoryId}
            disabled={categoryLoading}
            onChange={(event) => handleMainCategoryChange(event.target.value)}
          >
            <option value="">전체 대분류</option>

            {mainCategories.map((category) => {
              const id = category.categoryId ?? category.id ?? 0;

              return (
                <option key={`main-${id}`} value={String(id)}>
                  {category.name}
                </option>
              );
            })}
          </select>

          <select
            value={categoryId}
            disabled={!mainCategoryId || subCategories.length === 0}
            onChange={(event) => handleSubCategoryChange(event.target.value)}
          >
            <option value="">
              {mainCategoryId && subCategories.length === 0
                ? "하위 카테고리 없음"
                : "전체 하위분류"}
            </option>

            {subCategories.map((category) => {
              const id = category.categoryId ?? category.id ?? 0;

              return (
                <option key={`sub-${id}`} value={String(id)}>
                  {category.name}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            className="admin-product-filter-reset"
            onClick={resetFilters}
          >
            초기화
          </button>
        </div>
      </div>

      {loading && (
        <div className="admin-message">상품을 불러오는 중입니다.</div>
      )}

      {error && <div className="admin-message">{error}</div>}

      {!loading && !error && (
        <>
          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>브랜드</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>상품 유형</th>
                  <th>가격</th>
                  <th>판매상태</th>
                  <th>AI BEAUTY</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="admin-product-empty">
                      검색 조건에 맞는 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.productId}
                      className="admin-product-row"
                      onClick={() =>
                        navigate(
                          `/admin/products/${product.productId}${
                            currentQueryString ? `?${currentQueryString}` : ""
                          }`,
                        )
                      }
                    >
                      <td>{product.productId}</td>
                      <td>{product.brand ?? "-"}</td>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.categoryName ?? "-"}</td>
                      <td>{product.productType ?? "-"}</td>
                      <td>{product.price.toLocaleString()}원</td>
                      <td
                        className={
                          product.status === "판매중지"
                            ? "admin-product-status-stopped"
                            : ""
                        }
                      >
                        {displayStatus(product.status)}
                      </td>
                      <td>{product.aiApplyEnabled}</td>
                      <td>
                        <div className="admin-product-actions">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              navigate(
                                `/admin/products/${product.productId}/edit${
                                  currentQueryString
                                    ? `?${currentQueryString}`
                                    : ""
                                }`,
                              );
                            }}
                          >
                            수정
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              if (product.status === "STOPPED") {
                                resumeProduct(product.productId, product.name);
                              } else {
                                deleteProduct(product.productId, product.name);
                              }
                            }}
                          >
                            {product.status === "판매중지"
                              ? "판매재개"
                              : "판매중지"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-product-pagination">
              <button
                type="button"
                className="pagination-arrow"
                disabled={currentPage === 0}
                onClick={() => movePage(currentPage - 1)}
                aria-label="이전 페이지"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index)
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
                    <span className="admin-pagination-item" key={page}>
                      {showEllipsis && (
                        <span className="admin-pagination-ellipsis">…</span>
                      )}

                      <button
                        type="button"
                        className={`pagination-number ${
                          currentPage === page ? "active" : ""
                        }`}
                        onClick={() => movePage(page)}
                      >
                        {page + 1}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                className="pagination-arrow"
                disabled={currentPage === totalPages - 1}
                onClick={() => movePage(currentPage + 1)}
                aria-label="다음 페이지"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default AdminProductList;
