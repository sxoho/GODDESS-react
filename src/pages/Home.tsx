import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/home/Home.css";

const API_BASE = `http://${window.location.hostname}:9102`;

type Product = {
  id?: number;
  productId: number;
  name: string;
  brand?: string;
  fittingEnabled: string;
  status: string;
  createdAt?: string;
};

type ProductColor = {
  id?: number;
  productcolorId: number;
  productId: number;
  isMain: string;
  sortOrder: number;
  visible: string;
};

type ProductImage = {
  id?: number;
  colorimageId: number;
  productcolorId: number;
  productColorId?: number;
  filePath: string;
  isMain: string;
  imageType?: string;
  sortOrder?: number;
};

const getImageUrl = (filePath?: string) => {
  if (!filePath) return "";

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return filePath;
  }

  return `${API_BASE}${filePath}`;
};

const Home = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    const loadHomeProducts = async () => {
      try {
        const [productResponse, colorResponse, imageResponse] =
          await Promise.all([
            fetch(`${API_BASE}/product/find_all`),
            fetch(`${API_BASE}/product_color/find_all`),
            fetch(`${API_BASE}/product_color_image/find_all`),
          ]);

        if (
          !productResponse.ok ||
          !colorResponse.ok ||
          !imageResponse.ok
        ) {
          throw new Error("홈 상품을 불러오지 못했습니다.");
        }

        const productData: Product[] = await productResponse.json();
        const colorData: ProductColor[] = await colorResponse.json();
        const imageData: ProductImage[] = await imageResponse.json();

        setProducts(
          productData.map((product) => ({
            ...product,
            productId: product.productId ?? product.id ?? 0,
          }))
        );

        setProductColors(
          colorData.map((color) => ({
            ...color,
            productcolorId: color.productcolorId ?? color.id ?? 0,
          }))
        );

        setProductImages(
          imageData.map((image) => ({
            ...image,
            colorimageId: image.colorimageId ?? image.id ?? 0,
            productcolorId:
              image.productcolorId ?? image.productColorId ?? 0,
          }))
        );
      } catch (error) {
        console.error("홈 상품 조회 오류", error);
      }
    };

    loadHomeProducts();
  }, []);

  const getMainImage = (productId: number) => {
    const colors = productColors
      .filter(
        (color) =>
          color.productId === productId &&
          color.visible === "Y"
      )
      .sort((a, b) => {
        if (a.isMain === "Y" && b.isMain !== "Y") return -1;
        if (a.isMain !== "Y" && b.isMain === "Y") return 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    const colorIds = new Set(
      colors.map((color) => color.productcolorId)
    );

    const images = productImages
      .filter((image) => colorIds.has(image.productcolorId))
      .sort((a, b) => {
        const aThumbnail = a.imageType === "THUMBNAIL" ? 0 : 1;
        const bThumbnail = b.imageType === "THUMBNAIL" ? 0 : 1;

        if (aThumbnail !== bThumbnail) {
          return aThumbnail - bThumbnail;
        }

        const aMain = a.isMain === "Y" ? 0 : 1;
        const bMain = b.isMain === "Y" ? 0 : 1;

        if (aMain !== bMain) {
          return aMain - bMain;
        }

        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    return getImageUrl(images[0]?.filePath);
  };

  const fittingProducts = useMemo(() => {
    return [...products]
      .filter(
        (product) =>
          product.fittingEnabled === "Y" &&
          product.status !== "판매중지" &&
          getMainImage(product.productId)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      )
      .slice(0, 5);
  }, [products, productColors, productImages]);

  const newProducts = useMemo(() => {
    return [...products]
      .filter(
        (product) =>
          product.status !== "판매중지" &&
          getMainImage(product.productId)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      )
      .slice(0, 4);
  }, [products, productColors, productImages]);

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-meta">
          <span>ONNIVER</span>
          <span>AI VIRTUAL FITTING</span>
          <span>2026</span>
        </div>

        <div className="home-title-area">
          <p>TRY IT BEFORE YOU WEAR IT</p>

          <h1>
            YOUR LOOK,
            <br />
            BEFORE YOU WEAR.
          </h1>

          <div className="home-actions">
            <button
              type="button"
              onClick={() => navigate("/fitting")}
            >
              AI FITTING
            </button>

            <button
              type="button"
              onClick={() => navigate("/products")}
            >
              SHOP
            </button>
          </div>
        </div>

        <div className="home-product-stage">
          {fittingProducts.map((product, index) => (
            <button
              key={product.productId}
              type="button"
              className={`home-floating-product home-product-${index + 1}`}
              onClick={() =>
                navigate(`/products/${product.productId}`)
              }
            >
              <img
                src={getMainImage(product.productId)}
                alt={product.name}
              />

              <span className="home-product-info">
                <small>
                  LOOK {String(index + 1).padStart(2, "0")}
                </small>

                <strong>{product.name}</strong>
              </span>
            </button>
          ))}
        </div>

        <div className="home-bottom-copy">
          <p>
            ONE PHOTO.
            <br />
            EVERY LOOK.
          </p>

          <span>
            실제 ONNIVER 상품으로
            <br />
            나만의 스타일을 미리 경험해보세요.
          </span>
        </div>
      </section>

      <section className="home-new">
        <div className="home-section-heading">
          <div>
            <span>NEW ARRIVALS</span>
            <h2>새로 들어온 상품</h2>
          </div>

          <button
            type="button"
            onClick={() => navigate("/products")}
          >
            VIEW ALL →
          </button>
        </div>

        <div className="home-new-grid">
          {newProducts.map((product) => (
            <button
              key={product.productId}
              type="button"
              className="home-new-card"
              onClick={() =>
                navigate(`/products/${product.productId}`)
              }
            >
              <div className="home-new-image">
                <img
                  src={getMainImage(product.productId)}
                  alt={product.name}
                  loading="lazy"
                />
              </div>

              <div className="home-new-info">
                <span>{product.brand || "ONNIVER"}</span>
                <strong>{product.name}</strong>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="home-how">
        <div className="home-how-heading">
          <span>HOW IT WORKS</span>
          <h2>간단하게, 미리 입어보세요.</h2>
        </div>

        <div className="home-how-grid">
          <div className="home-how-item">
            <span>01</span>
            <strong>PHOTO</strong>
            <p>내 사진을 등록합니다.</p>
          </div>

          <div className="home-how-item">
            <span>02</span>
            <strong>SELECT</strong>
            <p>입어볼 상품을 선택합니다.</p>
          </div>

          <div className="home-how-item">
            <span>03</span>
            <strong>FITTING</strong>
            <p>AI 피팅 결과를 확인합니다.</p>
          </div>
        </div>

        <button
          type="button"
          className="home-how-start"
          onClick={() => navigate("/fitting")}
        >
          START AI FITTING →
        </button>
      </section>

      {/* =========================
          고객 문의 바로가기
      ========================= */}
      <section className="home-customer-qna">
        <div className="home-customer-qna-copy">
          <span>CUSTOMER SERVICE</span>

          <h2>도움이 필요하신가요?</h2>

          <p>
            주문, 배송, 교환·반품 등 이용 중 궁금한 점을 남겨주세요.
            <br />
            마이페이지 Q&A에서 답변을 확인할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/customer_qna")}
        >
          고객 문의하기 →
        </button>
      </section>
    </main>
  );
};

export default Home;