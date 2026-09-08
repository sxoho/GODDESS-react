import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { axiosInstance, getSpringApiUrl } from "../../../components/ToolBak";
import "../../../styles/admin/AdminProductDetail.css";

type ProductImage = {
  id: number;
  productColorId: number;
  fileOrigin: string;
  fileSaved: string;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
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
  images: ProductImage[];
};

type ProductVariant = {
  id: number;
  productId: number;
  variantName: string;
  variantDescription?: string;
  visible: string;
  sortOrder: number;
};

type ProductOption = {
  id: number;
  productId: number;
  productColorId: number;
  colorName: string;
  productVariantId: number;
  variantName: string;
  addPrice: number;
  stock: number;
  visible: string;
};

type Product = {
  id: number;
  categoryId: number;
  parentCategoryId?: number | null;
  categoryName: string;
  brand: string;
  name: string;
  description?: string;
  price: number;
  discount?: string;
  usageInfo?: string;
  productType?: string;
  volume?: string;
  skinType?: string;
  personalColor?: string;
  aiApplyEnabled: string;
  status: string;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

const AdminProductDetail = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<ProductVariant[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryString = searchParams.toString();

  const listUrl = queryString
    ? `/admin/products?${queryString}`
    : "/admin/products";

  const editUrl = queryString
    ? `/admin/products/${productId}/edit?${queryString}`
    : `/admin/products/${productId}/edit`;

  useEffect(() => {
    if (!productId) {
      setError("상품 번호가 없습니다.");
      setLoading(false);
      return;
    }

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          productResponse,
          colorResponse,
          sizeResponse,
          optionResponse,
        ] = await Promise.all([
          axiosInstance.get<Product>(`/product/${productId}`),
          axiosInstance.get<ProductColor[]>(
            `/product_color/product/${productId}`
          ),
          axiosInstance.get<ProductVariant[]>(
            `/product_variant/product/${productId}`
          ),
          axiosInstance.get<ProductOption[]>(
            `/product_option/product/${productId}`
          ),
        ]);

        setProduct(productResponse.data);
        setColors(colorResponse.data ?? []);
        setSizes(sizeResponse.data ?? []);
        setOptions(optionResponse.data ?? []);
      } catch (e) {
        console.error("관리자 상품 상세 조회 오류", e);
        setError(
          e instanceof Error
            ? e.message
            : "상품 정보를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [productId]);

  const images = useMemo(
    () =>
      colors
        .flatMap((color) =>
          (color.images ?? []).map((image) => ({
            ...image,
            colorName: color.colorName,
          }))
        )
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [colors]
  );

  const totalStock = useMemo(
    () =>
      options.reduce(
        (sum, option) => sum + (Number(option.stock) || 0),
        0
      ),
    [options]
  );

  const imageUrl = (path?: string) => {
    if (!path) return "";

    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    ) {
      return path;
    }

    return `${getSpringApiUrl()}${
      path.startsWith("/") ? path : `/${path}`
    }`;
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

  const formatDate = (value?: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("ko-KR");
  };

  if (loading) {
    return (
      <main className="admin-product-detail-page">
        <div className="admin-product-detail-message">
          상품 정보를 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="admin-product-detail-page">
        <div className="admin-product-detail-message">
          <p>{error || "상품을 찾을 수 없습니다."}</p>
          <button type="button" onClick={() => navigate(listUrl)}>
            목록으로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-product-detail-page">
      <div className="admin-product-detail-header">
        <div>
          <p>PRODUCT MANAGEMENT</p>
          <h1>상품 정보</h1>
          <span>
            #{product.id} · {product.brand || "-"}
          </span>
        </div>

        <div className="admin-product-detail-header-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => navigate(listUrl)}
          >
            목록으로
          </button>

          <button
            type="button"
            className="primary"
            onClick={() => navigate(editUrl)}
          >
            상품 수정
          </button>
        </div>
      </div>

      <section className="admin-product-detail-summary">
        <div>
          <span>상품명</span>
          <strong>{product.name}</strong>
        </div>
        <div>
          <span>카테고리</span>
          <strong>{product.categoryName || "-"}</strong>
        </div>
        <div>
          <span>판매상태</span>
          <strong>{displayStatus(product.status)}</strong>
        </div>
        <div>
          <span>총 재고</span>
          <strong>{totalStock.toLocaleString()}개</strong>
        </div>
      </section>

      <section className="admin-product-detail-section">
        <div className="admin-product-detail-section-title">
          <span>01</span>
          <div>
            <h2>기본 정보</h2>
            <p>상품의 기본 등록 정보를 확인합니다.</p>
          </div>
        </div>

        <dl className="admin-product-detail-info-grid">
          <div>
            <dt>상품 번호</dt>
            <dd>{product.id}</dd>
          </div>
          <div>
            <dt>브랜드</dt>
            <dd>{product.brand || "-"}</dd>
          </div>
          <div>
            <dt>카테고리</dt>
            <dd>{product.categoryName || "-"}</dd>
          </div>
          <div>
            <dt>판매 가격</dt>
            <dd>{product.price.toLocaleString()}원</dd>
          </div>
          <div>
            <dt>할인</dt>
            <dd>{product.discount || "-"}</dd>
          </div>
          <div>
            <dt>AI BEAUTY</dt>
            <dd>{product.aiApplyEnabled}</dd>
          </div>
          <div>
            <dt>판매 상태</dt>
            <dd>{displayStatus(product.status)}</dd>
          </div>
          <div>
            <dt>조회수</dt>
            <dd>{(product.viewCount ?? 0).toLocaleString()}</dd>
          </div>
          <div>
            <dt>상품 유형</dt>
            <dd>{product.productType || "-"}</dd>
          </div>
          <div>
            <dt>용량 / 중량</dt>
            <dd>{product.volume || "-"}</dd>
          </div>
          <div>
            <dt>추천 피부 타입</dt>
            <dd>{product.skinType || "-"}</dd>
          </div>
          <div>
            <dt>추천 퍼스널컬러</dt>
            <dd>{product.personalColor || "-"}</dd>
          </div>
          <div className="full">
            <dt>사용 방법</dt>
            <dd className="description">
              {product.usageInfo || "등록된 사용 방법이 없습니다."}
            </dd>
          </div>
          <div>
            <dt>등록일</dt>
            <dd>{formatDate(product.createdAt)}</dd>
          </div>
          <div>
            <dt>수정일</dt>
            <dd>{formatDate(product.updatedAt)}</dd>
          </div>
          <div className="full">
            <dt>상품 설명</dt>
            <dd className="description">
              {product.description || "등록된 상품 설명이 없습니다."}
            </dd>
          </div>
        </dl>
      </section>

      <section className="admin-product-detail-section">
        <div className="admin-product-detail-section-title">
          <span>02</span>
          <div>
            <h2>색상</h2>
            <p>상품에 등록된 색상 정보를 확인합니다.</p>
          </div>
        </div>

        {colors.length === 0 ? (
          <div className="admin-product-detail-empty">
            등록된 색상이 없습니다.
          </div>
        ) : (
          <div className="admin-product-color-list">
            {colors.map((color) => (
              <div className="admin-product-color-card" key={color.id}>
                <span
                  className="admin-product-color-chip"
                  style={{ background: color.colorCode || "#fff" }}
                />
                <div>
                  <strong>{color.colorName}</strong>
                  <p>{color.colorCode || "-"}</p>
                </div>
                <div className="admin-product-color-meta">
                  {color.isMain === "Y" && <span>대표 색상</span>}
                  <span>이미지 {color.images?.length ?? 0}장</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-product-detail-section">
        <div className="admin-product-detail-section-title">
          <span>03</span>
          <div>
            <h2>상품 이미지</h2>
            <p>색상별로 등록된 썸네일 및 상세 이미지를 확인합니다.</p>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="admin-product-detail-empty">
            등록된 이미지가 없습니다.
          </div>
        ) : (
          <div className="admin-product-image-grid">
            {images.map((image) => (
              <article className="admin-product-image-card" key={image.id}>
                <div className="admin-product-image-preview">
                  <img
                    src={imageUrl(image.filePath)}
                    alt={image.fileOrigin || product.name}
                  />
                </div>

                <div className="admin-product-image-info">
                  <strong>{image.colorName}</strong>
                  <span>{image.imageType}</span>
                  {image.isMain === "Y" && <span>대표</span>}
                  <p>{image.fileSaved}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-product-detail-section">
        <div className="admin-product-detail-section-title">
          <span>04</span>
          <div>
            <h2>상품 규격</h2>
            <p>상품에 등록된 옵션 정보를 확인합니다.</p>
          </div>
        </div>

        {sizes.length === 0 ? (
          <div className="admin-product-detail-empty">
            등록된 상품 규격이 없습니다.
          </div>
        ) : (
          <div className="admin-product-size-list">
            {sizes.map((size) => (
              <div className="admin-product-size-card" key={size.id}>
                <strong>{size.variantName}</strong>
                <span>{size.variantDescription || "-"}</span>
                <small>{size.visible === "Y" ? "노출" : "숨김"}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-product-detail-section">
        <div className="admin-product-detail-section-title">
          <span>05</span>
          <div>
            <h2>판매 옵션 및 재고</h2>
            <p>색상과 규격 조합별 판매 재고를 확인합니다.</p>
          </div>
        </div>

        {options.length === 0 ? (
          <div className="admin-product-detail-empty">
            등록된 판매 옵션이 없습니다.
          </div>
        ) : (
          <div className="admin-product-option-table-wrap">
            <table className="admin-product-option-table">
              <thead>
                <tr>
                  <th>옵션 ID</th>
                  <th>색상</th>
                  <th>규격</th>
                  <th>추가금액</th>
                  <th>재고</th>
                  <th>노출</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option) => (
                  <tr key={option.id}>
                    <td>{option.id}</td>
                    <td>{option.colorName}</td>
                    <td>{option.variantName}</td>
                    <td>
                      {(option.addPrice ?? 0).toLocaleString()}원
                    </td>
                    <td>
                      <strong>{option.stock.toLocaleString()}개</strong>
                    </td>
                    <td>{option.visible === "Y" ? "노출" : "숨김"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="admin-product-detail-bottom-actions">
        <button type="button" onClick={() => navigate(listUrl)}>
          목록으로
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => navigate(editUrl)}
        >
          상품 수정
        </button>
      </div>
    </main>
  );
};

export default AdminProductDetail;
