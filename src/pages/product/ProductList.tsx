import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../styles/product/ProductList.css";
import { useGlobalStore } from "../../store/store";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:9104";
const PAGE_SIZE = 24;
const TEMP_IMAGE = "/images/goddess/beauty-editorial.webp";

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

  const categoryParam = params.get("category") || "ALL";
  const subParam = params.get("sub") || "ALL";
  const sort = params.get("sort") || "recommended";
  const keyword = params.get("keyword") || "";
  const aiOnly = params.get("ai") === "Y";
  const page = Math.max(1, Number(params.get("page") || 1));

  const topCategories = useMemo(
    () => categories
      .filter((c) => (c.parentId ?? null) === null && c.visible !== "N")
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories],
  );

  const selectedTop = topCategories.find((c) => String(c.id ?? c.categoryId) === categoryParam);
  const subCategories = useMemo(() => {
    if (!selectedTop) return [];
    const topId = Number(selectedTop.id ?? selectedTop.categoryId);
    return categories
      .filter((c) => Number(c.parentId) === topId && c.visible !== "N")
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories, selectedTop]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/category/find_all`).then((r) => r.json()),
      fetch(`${API_BASE}/product_color/find_all`).then((r) => r.json()),
      fetch(`${API_BASE}/product_color_image/find_all`).then((r) => r.json()),
    ])
      .then(([categoryData, colorData, imageData]) => {
        setCategories(categoryData);
        setColors(colorData);
        setImages(imageData);
      })
      .catch(() => setError("상품 메타데이터를 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    const q = new URLSearchParams({
      page: String(page - 1),
      size: String(PAGE_SIZE),
      sort,
    });
    if (keyword.trim()) q.set("keyword", keyword.trim());
    if (selectedTop) q.set("mainCategoryId", String(selectedTop.id ?? selectedTop.categoryId));
    if (subParam !== "ALL") q.set("categoryId", subParam);

    setLoading(true);
    setError("");
    fetch(`${API_BASE}/product/page?${q.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<PageResponse>;
      })
      .then((data) => {
        setProducts((data.content ?? []).filter((p) => !aiOnly || p.aiApplyEnabled === "Y"));
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      })
      .catch(() => setError("상품 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [page, sort, keyword, selectedTop, subParam, aiOnly]);

  useEffect(() => {
    if (!sw || memberId <= 0) {
      setWishlist([]);
      return;
    }
    fetch(`${API_BASE}/wishlist/member/${memberId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setWishlist((Array.isArray(data) ? data : []).map((x) => Number(x.productId))))
      .catch(() => setWishlist([]));
  }, [sw, memberId]);

  const setQuery = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
    if (!("page" in patch)) next.set("page", "1");
    setParams(next);
  };

  const productThumb = (productId: number) => {
    const productColors = colors
      .filter((c) => c.productId === productId && c.visible !== "N")
      .sort((a, b) => Number(b.isMain === "Y") - Number(a.isMain === "Y") || a.sortOrder - b.sortOrder);
    const colorIds = new Set(productColors.map((c) => c.id));
    const found = images
      .filter((img) => colorIds.has(Number(img.productcolorId ?? img.productColorId)) && img.imageType === "THUMBNAIL")
      .sort((a, b) => Number(b.isMain === "Y") - Number(a.isMain === "Y") || a.sortOrder - b.sortOrder)[0];
    return imageUrl(found?.filePath);
  };

  const toggleWishlist = async (productId: number) => {
    if (!sw || memberId <= 0) {
      alert("로그인 후 찜할 수 있습니다.");
      navigate("/login");
      return;
    }
    const liked = wishlist.includes(productId);
    if (liked) {
      const res = await fetch(`${API_BASE}/wishlist/member/${memberId}/product/${productId}`, { method: "DELETE" });
      if (res.ok) setWishlist((prev) => prev.filter((id) => id !== productId));
    } else {
      const res = await fetch(`${API_BASE}/wishlist/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, productId }),
      });
      if (res.ok) setWishlist((prev) => [...prev, productId]);
    }
  };

  return (
    <main className="product-list-page">
      <section className="product-page-heading">
        <div className="product-page-heading-copy"><p>GODDESS COLLECTION</p><h1>SHOP</h1></div>
      </section>

      <div className="product-search-area">
        <input
          type="search"
          value={keyword}
          placeholder="상품명 또는 브랜드를 검색하세요."
          onChange={(e) => setQuery({ keyword: e.target.value || null })}
        />
      </div>

      <nav className="product-main-tabs" aria-label="상품 대분류">
        <button className={categoryParam === "ALL" ? "active" : ""} onClick={() => setQuery({ category: "ALL", sub: "ALL" })}>ALL</button>
        {topCategories.map((c) => {
          const id = String(c.id ?? c.categoryId);
          return <button key={id} className={categoryParam === id ? "active" : ""} onClick={() => setQuery({ category: id, sub: "ALL" })}>{c.name}</button>;
        })}
      </nav>

      {selectedTop && subCategories.length > 0 && (
        <nav className="product-sub-tabs" aria-label="상품 소분류">
          <button className={subParam === "ALL" ? "active" : ""} onClick={() => setQuery({ sub: "ALL" })}>전체</button>
          {subCategories.map((c) => {
            const id = String(c.id ?? c.categoryId);
            return <button key={id} className={subParam === id ? "active" : ""} onClick={() => setQuery({ sub: id })}>{c.name}</button>;
          })}
        </nav>
      )}

      <div className="product-toolbar">
        <label><input type="checkbox" checked={aiOnly} onChange={(e) => setQuery({ ai: e.target.checked ? "Y" : null })} /> AI 적용 가능 상품만</label>
        <select value={sort} onChange={(e) => setQuery({ sort: e.target.value })}>
          <option value="recommended">추천순</option>
          <option value="new">신상품순</option>
          <option value="priceLow">낮은 가격순</option>
          <option value="priceHigh">높은 가격순</option>
        </select>
      </div>

      {loading && <div className="product-state-message">상품을 불러오는 중입니다...</div>}
      {error && <div className="product-state-message error">{error}</div>}
      {!loading && !error && products.length === 0 && <div className="product-state-message">조건에 맞는 상품이 없습니다.</div>}

      <section className="product-grid">
        {products.map((product) => {
          const discount = Number(product.discount || 0);
          const salePrice = Math.round(product.price * (1 - discount / 100));
          const liked = wishlist.includes(product.id);
          return (
            <article className="product-card" key={product.id}>
              <div className="product-image-wrapper" onClick={() => navigate(`/products/${product.id}`)}>
                <img src={productThumb(product.id)} alt={product.name} />
                {product.aiApplyEnabled === "Y" && <span className="product-ai-badge">AI BEAUTY</span>}
                <button className={`product-heart ${liked ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}>{liked ? "♥" : "♡"}</button>
              </div>
              <div className="product-information">
                <span className="product-brand">{product.brand || "GODDESS"}</span>
                <button className="product-name" onClick={() => navigate(`/products/${product.id}`)}>{product.name}</button>
                <div className="product-price">
                  {discount > 0 && <strong className="product-discount-rate">{discount}%</strong>}
                  <strong className="product-sale-price">{salePrice.toLocaleString()}원</strong>
                  {discount > 0 && <del className="product-original-price">{product.price.toLocaleString()}원</del>}
                </div>
                {(product.volume || product.skinType || product.personalColor) && (
                  <small>{[product.volume, product.skinType, product.personalColor].filter(Boolean).join(" · ")}</small>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {totalPages > 1 && (
        <div className="product-pagination">
          <button disabled={page <= 1} onClick={() => setQuery({ page: String(page - 1) })}>PREV</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setQuery({ page: String(page + 1) })}>NEXT</button>
        </div>
      )}
    </main>
  );
}
