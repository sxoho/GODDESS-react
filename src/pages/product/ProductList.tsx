import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../styles/product/ProductList.css";
import { useGlobalStore } from "../../store/store";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:9104";
const PAGE_SIZE = 24;
const TEMP_IMAGE = "/images/goddess/beauty-editorial.webp";

const SKIN_TYPE_FILTERS = [
  { value: "복합성", label: "Combination" },
  { value: "건성", label: "Dry" },
  { value: "중성", label: "Normal" },
  { value: "지성", label: "Oily" },
  { value: "민감성", label: "Sensitive" },
];

const PERSONAL_COLOR_FILTERS = [
  { value: "봄웜", label: "Spring Warm" },
  { value: "여름쿨", label: "Summer Cool" },
  { value: "가을웜", label: "Autumn Warm" },
  { value: "겨울쿨", label: "Winter Cool" },
];

type Category = {
  id?: number;
  categoryId?: number;
  parentId?: number | null;
  name: string;
  description?: string;
  sortOrder?: number;
  visible?: string;
};

type Product = {
  id: number;
  categoryId: number;
  parentCategoryId?: number | null;
  categoryName?: string;
  name: string;
  brand?: string;
  description?: string;
  price: number;
  discount?: number;
  aiApplyEnabled?: string;
  productType?: string;
  volume?: string;
  skinType?: string;
  personalColor?: string;
  status: string;
  viewCount?: number;
  createdAt?: string;
};

type ProductColor = {
  id: number;
  productId: number;
  colorId: number;
  colorName: string;
  colorCode: string;
  isMain: string;
  sortOrder: number;
  aiApplyEnabled: string;
  visible: string;
};

type ProductImage = {
  id: number;
  productColorId?: number;
  productcolorId?: number;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
};

type PageResponse = {
  content: Product[];
  totalPages: number;
  totalElements: number;
};

const imageUrl = (path?: string) => {
  if (!path) return TEMP_IMAGE;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

export default function ProductList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { sw, memberId } = useGlobalStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const categoryParam = params.get("category") || "ALL";
  const subParam = params.get("sub") || "ALL";
  const sort = params.get("sort") || "recommended";
  const viewMode = params.get("view") === "shade" ? "shade" : "product";
  const aiOnly = params.get("ai") === "Y";
  const skinTypeParam = params.get("skinType") || "";
  const personalColorParam = params.get("personalColor") || "";
  const page = Math.max(1, Number(params.get("page") || 1));

  const selectedSkinTypes = useMemo(
    () => skinTypeParam.split(",").filter(Boolean),
    [skinTypeParam],
  );

  const selectedPersonalColors = useMemo(
    () => personalColorParam.split(",").filter(Boolean),
    [personalColorParam],
  );

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSkinTypes, setDraftSkinTypes] = useState<string[]>(selectedSkinTypes);
  const [draftPersonalColors, setDraftPersonalColors] =
    useState<string[]>(selectedPersonalColors);
  const [draftAiOnly, setDraftAiOnly] = useState(aiOnly);

  const activeFilterCount =
    selectedSkinTypes.length +
    selectedPersonalColors.length +
    (aiOnly ? 1 : 0);

  const topCategories = useMemo(
  () =>
    categories
      .filter(
        (category) =>
          (category.parentId ?? null) === null &&
          category.visible !== "N" &&
          category.name !== "헤어",
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  [categories],
);

  const selectedTop = topCategories.find(
    (category) =>
      String(category.id ?? category.categoryId) === categoryParam,
  );

  const subCategories = useMemo(() => {
    if (!selectedTop) return [];

    const topId = Number(selectedTop.id ?? selectedTop.categoryId);

    return categories
      .filter(
        (category) =>
          Number(category.parentId) === topId && category.visible !== "N",
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories, selectedTop]);

  useEffect(() => {
    setDraftSkinTypes(selectedSkinTypes);
    setDraftPersonalColors(selectedPersonalColors);
    setDraftAiOnly(aiOnly);
  }, [skinTypeParam, personalColorParam, aiOnly]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/category/find_all`).then((response) => response.json()),
      fetch(`${API_BASE}/product_color/find_all`).then((response) =>
        response.json(),
      ),
      fetch(`${API_BASE}/product_color_image/find_all`).then((response) =>
        response.json(),
      ),
    ])
      .then(([categoryData, colorData, imageData]) => {
        setCategories(categoryData);
        setColors(colorData);
        setImages(imageData);
      })
      .catch(() => setError("상품 메타데이터를 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams({
      page: String(page - 1),
      size: String(PAGE_SIZE),
      sort,
    });

    if (selectedTop) {
      query.set(
        "mainCategoryId",
        String(selectedTop.id ?? selectedTop.categoryId),
      );
    }

    if (subParam !== "ALL" && !Number.isNaN(Number(subParam))) {
      query.set("categoryId", subParam);
    }

    // Spring /product/page 필터와 연결
    // 여러 값은 comma-separated 문자열로 전달된다.
    // 예: skinType=건성,복합성 / personalColor=봄웜,여름쿨
    if (skinTypeParam) {
      query.set("skinType", skinTypeParam);
    }

    if (personalColorParam) {
      query.set("personalColor", personalColorParam);
    }

    if (aiOnly) {
      query.set("aiApplyEnabled", "Y");
    }

    setLoading(true);
    setError("");

    fetch(`${API_BASE}/product/page?${query.toString()}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<PageResponse>;
      })
      .then((data) => {
        setProducts(data.content ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setTotalElements(data.totalElements ?? 0);
      })
      .catch(() => setError("상품 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [
    page,
    sort,
    selectedTop,
    subParam,
    aiOnly,
    skinTypeParam,
    personalColorParam,
  ]);

  useEffect(() => {
    if (!sw || memberId <= 0) {
      setWishlist([]);
      return;
    }

    fetch(`${API_BASE}/wishlist/member/${memberId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) =>
        setWishlist(
          (Array.isArray(data) ? data : []).map((item) =>
            Number(item.productId),
          ),
        ),
      )
      .catch(() => setWishlist([]));
  }, [sw, memberId]);

  const setQuery = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);

    Object.entries(patch).forEach(([key, value]) => {
      if (value == null) next.delete(key);
      else next.set(key, value);
    });

    if (!("page" in patch)) next.set("page", "1");
    setParams(next);
  };

  const toggleDraftValue = (
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const openFilters = () => {
    setDraftSkinTypes(selectedSkinTypes);
    setDraftPersonalColors(selectedPersonalColors);
    setDraftAiOnly(aiOnly);
    setFilterOpen((current) => !current);
  };

  const cancelFilters = () => {
    setDraftSkinTypes(selectedSkinTypes);
    setDraftPersonalColors(selectedPersonalColors);
    setDraftAiOnly(aiOnly);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftSkinTypes([]);
    setDraftPersonalColors([]);
    setDraftAiOnly(false);
  };

  const applyFilters = () => {
    setQuery({
      skinType: draftSkinTypes.length > 0 ? draftSkinTypes.join(",") : null,
      personalColor:
        draftPersonalColors.length > 0
          ? draftPersonalColors.join(",")
          : null,
      ai: draftAiOnly ? "Y" : null,
    });
    setFilterOpen(false);
  };

  const productThumb = (productId: number) => {
    const productColors = colors
      .filter((color) => color.productId === productId && color.visible !== "N")
      .sort(
        (a, b) =>
          Number(b.isMain === "Y") - Number(a.isMain === "Y") ||
          a.sortOrder - b.sortOrder,
      );

    const colorIds = new Set(productColors.map((color) => color.id));

    const productImages = images
      .filter((image) =>
        colorIds.has(Number(image.productcolorId ?? image.productColorId)),
      )
      .sort(
        (a, b) =>
          Number(b.imageType === "THUMBNAIL") -
            Number(a.imageType === "THUMBNAIL") ||
          Number(b.isMain === "Y") - Number(a.isMain === "Y") ||
          a.sortOrder - b.sortOrder,
      );

    return imageUrl(productImages[0]?.filePath);
  };

  const shadeThumb = (productColorId: number) => {
    const shadeImages = images
      .filter(
        (image) =>
          Number(image.productcolorId ?? image.productColorId) === productColorId,
      )
      .sort(
        (a, b) =>
          Number(b.imageType === "THUMBNAIL") -
            Number(a.imageType === "THUMBNAIL") ||
          Number(b.isMain === "Y") - Number(a.isMain === "Y") ||
          a.sortOrder - b.sortOrder,
      );

    return imageUrl(shadeImages[0]?.filePath);
  };

  const getProductColors = (productId: number) =>
    colors
      .filter((color) => color.productId === productId && color.visible !== "N")
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const toggleWishlist = async (productId: number) => {
    if (!sw || memberId <= 0) {
      alert("로그인 후 찜할 수 있습니다.");
      navigate("/login");
      return;
    }

    const liked = wishlist.includes(productId);

    if (liked) {
      const response = await fetch(
        `${API_BASE}/wishlist/member/${memberId}/product/${productId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        setWishlist((previous) =>
          previous.filter((id) => id !== productId),
        );
      }
      return;
    }

    const response = await fetch(`${API_BASE}/wishlist/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, productId }),
    });

    if (response.ok) {
      setWishlist((previous) => [...previous, productId]);
    }
  };

  return (
    <main className="product-list-page">
      {/* Glossier처럼 헤더 바로 아래에 붙는 카테고리 바 */}
      <section className="shop-filter-bar">
        <div className="shop-filter-left">
          <button
            type="button"
            className={
              !selectedTop && categoryParam === "ALL" && subParam === "ALL"
                ? "active"
                : ""
            }
            onClick={() =>
              setQuery({
                category: null,
                sub: null,
              })
            }
          >
            All
          </button>

          {selectedTop &&
            subCategories.map((category) => {
              const id = String(category.id ?? category.categoryId);

              return (
                <button
                  type="button"
                  key={id}
                  className={subParam === id ? "active" : ""}
                  onClick={() => setQuery({ sub: id })}
                >
                  {category.name}
                </button>
              );
            })}

          {!selectedTop &&
            topCategories.map((category) => {
              const id = String(category.id ?? category.categoryId);

              return (
                <button
                  type="button"
                  key={id}
                  className={categoryParam === id ? "active" : ""}
                  onClick={() =>
                    setQuery({ category: id, sub: "ALL" })
                  }
                >
                  {category.name}
                </button>
              );
            })}
        </div>

        <div className="shop-filter-right">
          <div className="shop-view-menu">
            <button
              type="button"
              className="shop-view-trigger"
              aria-haspopup="menu"
            >
              <span>View</span>
              <strong>({viewMode === "shade" ? "Shade" : "Product"})</strong>
            </button>

            <div className="shop-view-dropdown" role="menu">
              <button
                type="button"
                className={viewMode === "product" ? "active" : ""}
                onClick={() => setQuery({ view: null })}
              >
                Product
              </button>

              <button
                type="button"
                className={viewMode === "shade" ? "active" : ""}
                onClick={() => setQuery({ view: "shade" })}
              >
                Shade
              </button>
            </div>
          </div>

          <button
            type="button"
            className={`shop-filter-trigger ${filterOpen ? "active" : ""}`}
            onClick={openFilters}
            aria-expanded={filterOpen}
          >
            Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : "(0)"}
          </button>

          <label className="shop-sort">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                setQuery({ sort: event.target.value })
              }
            >
              <option value="recommended">Featured</option>
              <option value="new">Newest</option>
              <option value="priceLow">Price: Low</option>
              <option value="priceHigh">Price: High</option>
            </select>
          </label>

          <span className="shop-product-count">
            {loading ? "—" : `${totalElements}`}
          </span>
        </div>
      </section>

      {filterOpen && (
        <div
          className="shop-filter-modal-backdrop"
          role="presentation"
          onMouseDown={cancelFilters}
        >
          <section
            className="shop-filter-modal"
            role="dialog"
            aria-modal="true"
            aria-label="상품 필터"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="shop-filter-modal-header">
              <h2>Filters</h2>
              <button
                type="button"
                className="shop-filter-modal-close"
                aria-label="필터 닫기"
                onClick={cancelFilters}
              >
                ×
              </button>
            </header>

            <div className="shop-filter-modal-body">
              <div className="shop-filter-group">
                <p>Skin Type Filters</p>

                <div className="shop-filter-chip-list">
                  {SKIN_TYPE_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={
                        draftSkinTypes.includes(filter.value) ? "selected" : ""
                      }
                      onClick={() =>
                        toggleDraftValue(
                          filter.value,
                          draftSkinTypes,
                          setDraftSkinTypes,
                        )
                      }
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="shop-filter-group">
                <p>Personal Color Filters</p>

                <div className="shop-filter-chip-list">
                  {PERSONAL_COLOR_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={
                        draftPersonalColors.includes(filter.value)
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        toggleDraftValue(
                          filter.value,
                          draftPersonalColors,
                          setDraftPersonalColors,
                        )
                      }
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="shop-filter-group">
                <p>AI Beauty</p>

                <button
                  type="button"
                  className={`shop-filter-ai-chip ${
                    draftAiOnly ? "selected" : ""
                  }`}
                  onClick={() => setDraftAiOnly((current) => !current)}
                >
                  AI TRY-ON AVAILABLE
                </button>
              </div>
            </div>

            <footer className="shop-filter-modal-footer">
              <button
                type="button"
                className="shop-filter-clear"
                onClick={clearFilters}
              >
                Clear all
              </button>

              <div>
                <button
                  type="button"
                  className="shop-filter-cancel"
                  onClick={cancelFilters}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="shop-filter-apply"
                  onClick={applyFilters}
                >
                  Apply
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {loading && (
        <div className="product-state-message">
          상품을 불러오는 중입니다...
        </div>
      )}

      {error && (
        <div className="product-state-message error">{error}</div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="product-state-message">
          조건에 맞는 상품이 없습니다.
        </div>
      )}

      {!loading && !error && products.length > 0 && viewMode === "product" && (
        <section className="product-grid">
          {/* 첫 번째 칸: GODDESS 프로모션 타일 */}
          <article className="shop-promo-card">
            <div className="shop-promo-copy">
              <small>GODDESS BEAUTY</small>

              <h2>
                TRY
                <br />
                BEFORE
                <br />
                YOU BUY.
              </h2>

              <p>
                메이크업과 헤어를
                <br />
                내 얼굴에 먼저 적용해보세요.
              </p>

              <button
                type="button"
                onClick={() => navigate("/beauty?mode=makeup")}
              >
                AI BEAUTY
              </button>
            </div>
          </article>

          {products.map((product) => {
            const discount = Number(product.discount || 0);
            const salePrice = Math.round(
              product.price * (1 - discount / 100),
            );
            const liked = wishlist.includes(product.id);
            const productColors = getProductColors(product.id);

            return (
              <article className="product-card" key={product.id}>
                <div
                  className="product-image-wrapper"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/products/${product.id}`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      navigate(`/products/${product.id}`);
                    }
                  }}
                >
                  <img
                    src={productThumb(product.id)}
                    alt={product.name}
                  />

                  {product.aiApplyEnabled === "Y" && (
                    <button
                      type="button"
                      className="product-ai-badge"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(
                          `/beauty?mode=makeup&productId=${product.id}`,
                        );
                      }}
                    >
                      AI TRY-ON
                    </button>
                  )}

                  <button
                    type="button"
                    className={`product-heart ${
                      liked ? "active" : ""
                    }`}
                    aria-label={
                      liked
                        ? "찜 목록에서 삭제"
                        : "찜 목록에 추가"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                  >
                    {liked ? "♥" : "♡"}
                  </button>
                </div>

                <div className="product-information">
                  <div className="product-title-row">
                    <button
                      type="button"
                      className="product-name"
                      onClick={() =>
                        navigate(`/products/${product.id}`)
                      }
                    >
                      {product.name}
                    </button>

                    <strong className="product-price">
                      {salePrice.toLocaleString()}원
                    </strong>
                  </div>

                  <p className="product-subtitle">
                    {product.description ||
                      product.brand ||
                      "GODDESS BEAUTY"}
                  </p>

                  {discount > 0 && (
                    <div className="product-sale-info">
                      <strong>{discount}%</strong>
                      <del>
                        {product.price.toLocaleString()}원
                      </del>
                    </div>
                  )}

                  {productColors.length > 0 && (
                    <div className="product-shades">
                      {productColors.slice(0, 8).map((color) => (
                        <span
                          key={`${product.id}-${color.id}`}
                          title={color.colorName}
                          style={{
                            backgroundColor: color.colorCode,
                          }}
                        />
                      ))}

                      {productColors.length > 8 && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/products/${product.id}`)
                          }
                        >
                          +{productColors.length - 8}
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="product-card-action"
                    onClick={() =>
                      navigate(`/products/${product.id}`)
                    }
                  >
                    View product
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {!loading && !error && products.length > 0 && viewMode === "shade" && (
        <section className="shade-view">
          {products.map((product) => {
            const discount = Number(product.discount || 0);
            const salePrice = Math.round(
              product.price * (1 - discount / 100),
            );
            const productColors = getProductColors(product.id);

            return (
              <article className="shade-product-group" key={`shade-${product.id}`}>
                <header className="shade-product-header">
                  <button
                    type="button"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.name}
                  </button>
                  <span>
                    {product.description || product.brand || "GODDESS BEAUTY"}
                  </span>
                </header>

                {productColors.length > 0 ? (
                  <div className="shade-card-row">
                    {productColors.map((color) => (
                      <button
                        type="button"
                        className="shade-card"
                        key={`${product.id}-shade-${color.id}`}
                        onClick={() =>
                          navigate(
                            `/products/${product.id}?productColorId=${color.id}`,
                          )
                        }
                      >
                        <div className="shade-card-image">
                          <img
                            src={shadeThumb(color.id)}
                            alt={`${product.name} ${color.colorName}`}
                          />
                        </div>

                        <div className="shade-card-info">
                          <div className="shade-card-name-row">
                            <span
                              className="shade-color-dot"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <strong>{color.colorName}</strong>
                          </div>

                          <span>{salePrice.toLocaleString()}원</span>

                          {discount > 0 && (
                            <small>
                              {discount}% · {product.price.toLocaleString()}원
                            </small>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="shade-empty">
                    등록된 색상이 없습니다.
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="product-pagination" aria-label="상품 페이지">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setQuery({ page: String(page - 1) })
            }
          >
            PREV
          </button>

          <span>
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setQuery({ page: String(page + 1) })
            }
          >
            NEXT
          </button>
        </nav>
      )}
    </main>
  );
}
