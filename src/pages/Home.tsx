import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { BRAND } from "../config/brand";

import "../styles/home/Home.css";

const API_BASE = "http://localhost:9104";

type Product = {
  id?: number;
  productId: number;
  name: string;
  brand?: string;
  aiApplyEnabled: string;
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
  if (!filePath) {
    return "";
  }

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  return `${API_BASE}${filePath}`;
};

const Home = () => {
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const [products, setProducts] = useState<Product[]>([]);

  const [productColors, setProductColors] = useState<ProductColor[]>([]);

  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  /* =========================
     HOME PRODUCTS
  ========================= */

  useEffect(() => {
    const loadHomeProducts = async () => {
      try {
        const [productResponse, colorResponse, imageResponse] =
          await Promise.all([
            fetch(`${API_BASE}/product/find_all`),

            fetch(`${API_BASE}/product_color/find_all`),

            fetch(`${API_BASE}/product_color_image/find_all`),
          ]);

        if (!productResponse.ok || !colorResponse.ok || !imageResponse.ok) {
          throw new Error("홈 상품을 불러오지 못했습니다.");
        }

        const productData: Product[] = await productResponse.json();

        const colorData: ProductColor[] = await colorResponse.json();

        const imageData: ProductImage[] = await imageResponse.json();

        setProducts(
          productData.map((product) => ({
            ...product,

            productId: product.productId ?? product.id ?? 0,
          })),
        );

        setProductColors(
          colorData.map((color) => ({
            ...color,

            productcolorId: color.productcolorId ?? color.id ?? 0,
          })),
        );

        setProductImages(
          imageData.map((image) => ({
            ...image,

            colorimageId: image.colorimageId ?? image.id ?? 0,

            productcolorId: image.productcolorId ?? image.productColorId ?? 0,
          })),
        );

        setLoadState("ready");
      } catch (error) {
        console.error("홈 상품 조회 오류", error);

        setLoadState("error");
      }
    };

    loadHomeProducts();
  }, []);

  /* =========================
     MAIN IMAGE
  ========================= */

  const getMainImage = (productId: number) => {
    const colors = productColors
      .filter((color) => color.productId === productId && color.visible === "Y")
      .sort((a, b) => {
        if (a.isMain === "Y" && b.isMain !== "Y") {
          return -1;
        }

        if (a.isMain !== "Y" && b.isMain === "Y") {
          return 1;
        }

        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    const colorIds = new Set(colors.map((color) => color.productcolorId));

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

  /* =========================
     NEW PRODUCT
  ========================= */

  const newProducts = useMemo(() => {
    return [...products]
      .filter(
        (product) =>
          product.status !== "판매중지" && getMainImage(product.productId),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime(),
      )
      .slice(0, 4);
  }, [products, productColors, productImages]);

  /* =========================
     AI BEAUTY SERVICE
  ========================= */

  const beautyServices = [
    {
      mode: "makeup",

      number: "01",

      title: "MAKEUP",

      korean: "메이크업",

      description:
        "립, 아이, 블러셔와 베이스까지 내 얼굴에서 먼저 확인해보세요.",
    },

    {
      mode: "hair-style",

      number: "02",

      title: "HAIR STYLE",

      korean: "헤어스타일",

      description: "단발부터 긴 머리까지 새로운 스타일을 경험해보세요.",
    },

    {
      mode: "hair-color",

      number: "03",

      title: "HAIR COLOR",

      korean: "헤어컬러",

      description: "한 번의 클릭으로 달라지는 나만의 헤어 컬러를 찾아보세요.",
    },
  ];

  return (
    <main className="home">
      {/* =================================
    HERO
================================= */}

      <section className="home-hero">
        <div className="home-hero-bg">
          <span className="hero-blur hero-blur-1" />
          <span className="hero-blur hero-blur-2" />
          <span className="hero-blur hero-blur-3" />
        </div>

        <div className="home-hero-art home-hero-art-only">
          <div className="hero-art-glow" />

          <div className="hero-orbit hero-orbit-outer">
            <span className="orbit-bead orbit-bead-1" />
            <span className="orbit-bead orbit-bead-2" />
          </div>

          <div className="hero-orbit hero-orbit-middle">
            <span className="orbit-bead orbit-bead-3" />
          </div>

          <div className="hero-orbit hero-orbit-inner" />

          <div className="hero-beauty-core">
            <div className="hero-core-highlight" />

            <div className="hero-core-ring">
              <span>BEAUTY</span>
              <i />
              <span>COLOR</span>
              <i />
              <span>STYLE</span>
            </div>

            <div className="hero-core-center">
              <small>DISCOVER</small>
              <strong>YOU</strong>
              <small>GODDESS</small>
            </div>
          </div>

          <div className="hero-swatch hero-swatch-lip">
            <span />
            <small>LIP</small>
          </div>

          <div className="hero-swatch hero-swatch-eye">
            <span />
            <small>EYE</small>
          </div>

          <div className="hero-swatch hero-swatch-blush">
            <span />
            <small>BLUSH</small>
          </div>

          <div className="hero-swatch hero-swatch-hair">
            <span />
            <small>HAIR</small>
          </div>

          <span className="hero-mini-dot mini-dot-1" />
          <span className="hero-mini-dot mini-dot-2" />
          <span className="hero-mini-dot mini-dot-3" />

          <span className="hero-side-text hero-side-text-left">
            MAKEUP · SKIN · COLOR
          </span>

          <span className="hero-side-text hero-side-text-right">
            AI BEAUTY EXPERIENCE
          </span>
        </div>

        <div className="home-scroll">
          <span>SCROLL</span>
          <i />
        </div>
      </section>

    

      {/* =================================
          AI BEAUTY CARDS
      ================================= */}

      <section className="home-ai">
        <div className="home-section-heading">
          <div>
            
            <p className="home-section-label">AI BEAUTY</p>

            <h2>
              TRY YOUR
              <br />
            </h2>
          </div>

          <p className="home-section-side">3 BEAUTY EXPERIENCES</p>
        </div>

        <div className="home-ai-grid">
          {beautyServices.map((service) => (
            <button
              className="home-ai-card"
              key={service.mode}
              onClick={() => navigate(`/beauty?mode=${service.mode}`)}
            >
              <div className="home-ai-card-top">
                <span>{service.number}</span>

                <span className="home-ai-arrow">↗</span>
              </div>

              <div
                className={`home-ai-motion home-ai-motion-${service.number}`}
              >
                <span />
                <span />
                <span />
              </div>

              <div className="home-ai-copy">
                <small>{service.korean}</small>

                <h3>{service.title}</h3>

                <p>{service.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =================================
          FACE / AI MAKEUP DETAIL
      ================================= */}

      <section className="home-makeup-experience">
        <div className="home-section-heading">
          <div>
            <p className="home-section-label">AI MAKEUP EXPERIENCE</p>

         
          </div>

          <p className="home-section-side">REAL BEAUTY EXPERIENCE</p>
        </div>

        <div className="makeup-experience-layout">
          {/* FACE CHARACTER */}

          <div className="makeup-face-area">
            <div className="makeup-face-background">
              <span className="makeup-face-circle face-circle-1" />
              <span className="makeup-face-circle face-circle-2" />
            </div>

            <div className="makeup-face-character">
              {/* HAIR */}

              <div className="face-hair face-hair-back" />

              {/* FACE */}

              <div className="face-shape">
                <div className="face-brow face-brow-left" />
                <div className="face-brow face-brow-right" />

                <div className="face-eye face-eye-left">
                  <span />
                </div>

                <div className="face-eye face-eye-right">
                  <span />
                </div>

                <div className="face-nose" />

                <div className="face-blush face-blush-left" />
                <div className="face-blush face-blush-right" />

                <div className="face-highlight" />

                <div className="face-lips">
                  <span />
                </div>
              </div>

              <div className="face-hair face-hair-left" />
              <div className="face-hair face-hair-right" />
            </div>

            {/* FLOATING MAKEUP COLORS */}

            <span className="makeup-float-color makeup-float-lip">LIP</span>

            <span className="makeup-float-color makeup-float-eye">EYE</span>

            <span className="makeup-float-color makeup-float-blush">BLUSH</span>
          </div>

          {/* FEATURE LIST */}

          <div className="makeup-feature-area">
            <p className="makeup-feature-intro">
              등록한 얼굴 사진 위에 실제 제품의 컬러와 스타일을 적용해보세요.
            </p>

            <div className="makeup-feature-list">
              <div className="makeup-feature-item">
                <span className="makeup-feature-dot makeup-dot-lip" />

                <div>
                  <strong>LIP COLOR</strong>

                  <p>실제 립 제품의 컬러를 내 얼굴에 먼저 적용해보세요.</p>
                </div>

                <span className="makeup-feature-number">01</span>
              </div>

              <div className="makeup-feature-item">
                <span className="makeup-feature-dot makeup-dot-eye" />

                <div>
                  <strong>EYE MAKEUP</strong>

                  <p>아이섀도 컬러와 분위기를 눈매에 적용합니다.</p>
                </div>

                <span className="makeup-feature-number">02</span>
              </div>

              <div className="makeup-feature-item">
                <span className="makeup-feature-dot makeup-dot-blush" />

                <div>
                  <strong>BLUSH & HIGHLIGHT</strong>

                  <p>블러셔와 하이라이터로 얼굴의 분위기를 바꿔보세요.</p>
                </div>

                <span className="makeup-feature-number">03</span>
              </div>

              <div className="makeup-feature-item">
                <span className="makeup-feature-dot makeup-dot-base" />

                <div>
                  <strong>BASE SHADE</strong>

                  <p>19호 · 21호 · 23호 등 베이스 컬러를 비교합니다.</p>
                </div>

                <span className="makeup-feature-number">04</span>
              </div>
            </div>

            <button
              className="makeup-experience-button"
              onClick={() => navigate("/beauty?mode=makeup")}
            >
              AI 메이크업 체험하기
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* =================================
          BEAUTY ANALYSIS
      ================================= */}

      <section className="home-analysis">
        <div className="home-section-heading">
          <div>

            <h2 className="analysis-title">
             BEAUTY CHECK
            </h2>
          </div>

          <span className="home-section-count">03</span>
        </div>

        <div className="analysis-grid">
          {/* SKIN */}

          <article className="analysis-card skin-analysis-card">
            <div className="analysis-card-top">
              <span>01</span>

              <span>SKIN ANALYSIS</span>
            </div>

            <div className="analysis-card-content">
              <p className="analysis-card-korean">피부 타입 자가진단</p>

              <h3>
                WHAT DOES
                <br />
                YOUR SKIN
                <em> NEED?</em>
              </h3>

              <p className="analysis-card-description">
                피부 타입을 확인하고 맞춤 제품을 찾아보세요.
              </p>

              <div className="skin-type-list">
                <span>건성</span>

                <span>지성</span>

                <span>복합성</span>

                <span>중성</span>

                <span>민감성</span>
              </div>

              <button
                className="analysis-start-button"
                onClick={() => navigate("/diagnosis/skin")}
              >
                피부 진단 시작하기
                <span>→</span>
              </button>
            </div>

            <div className="skin-analysis-visual">
              <span className="skin-orbit skin-orbit-1" />
              <span className="skin-orbit skin-orbit-2" />

              <div className="skin-analysis-center">SKIN</div>
            </div>
          </article>

          {/* PERSONAL COLOR */}

          <article className="analysis-card color-analysis-card">
            <div className="analysis-card-top">
              <span>02</span>

              <span>PERSONAL COLOR</span>
            </div>

            <div className="analysis-card-content">
              <p className="analysis-card-korean">퍼스널컬러 자가진단</p>

              <h3>
                FIND YOUR
                <br />
                TRUE
                <em> COLOR.</em>
              </h3>

              <p className="analysis-card-description">
                나에게 어울리는 컬러를 가볍게 확인해보세요.
              </p>

              <button
                className="analysis-start-button"
                onClick={() => navigate("/diagnosis/personal-color")}
              >
                퍼스널컬러 진단 시작하기
                <span>→</span>
              </button>
            </div>

            <div className="personal-color-visual">
              <div className="personal-color-axis axis-horizontal" />
              <div className="personal-color-axis axis-vertical" />

              <span className="personal-axis-label axis-warm">WARM</span>

              <span className="personal-axis-label axis-cool">COOL</span>

              <span className="personal-axis-label axis-light">LIGHT</span>

              <span className="personal-axis-label axis-deep">DEEP</span>

              <div className="season-color season-spring">
                <strong>SPRING</strong>

                <small>WARM</small>
              </div>

              <div className="season-color season-summer">
                <strong>SUMMER</strong>

                <small>COOL</small>
              </div>

              <div className="season-color season-autumn">
                <strong>AUTUMN</strong>

                <small>WARM</small>
              </div>

              <div className="season-color season-winter">
                <strong>WINTER</strong>

                <small>COOL</small>
              </div>
            </div>
          </article>
        </div>

        <div className="analysis-recommend-flow">
          <span>CHECK</span>
          <i>→</i>
          <span>DISCOVER</span>
          <i>→</i>
          <span>YOUR BEAUTY</span>
        </div>
      </section>

      {/* =================================
          NEW PRODUCTS
      ================================= */}

      <section className="home-products">
        <div className="home-section-heading">
          <div>
            <p className="home-section-label">NEW ARRIVALS</p>

            <h2>NEW.</h2>
          </div>

          <button
            className="home-view-all"
            onClick={() => navigate("/products")}
          >
            VIEW ALL
            <span>↗</span>
          </button>
        </div>

        {loadState === "loading" ? (
          <div className="home-state">상품을 불러오고 있어요.</div>
        ) : loadState === "error" ? (
          <div className="home-state">
            <p>상품을 불러오지 못했어요.</p>

            <button onClick={() => navigate("/products")}>
              상품 보러가기 →
            </button>
          </div>
        ) : newProducts.length === 0 ? (
          <div className="home-state">새로운 상품을 준비하고 있어요.</div>
        ) : (
          <div className="home-product-grid">
            {newProducts.map((product, index) => (
              <button
                className="home-product-card"
                key={product.productId}
                onClick={() => navigate(`/products/${product.productId}`)}
              >
                <div className="home-product-image">
                  <img
                    src={getMainImage(product.productId)}
                    alt={product.name}
                    loading="lazy"
                  />

                  <span className="home-product-number">0{index + 1}</span>

                  <span className="home-product-view">VIEW</span>
                </div>

                <div className="home-product-info">
                  <span>{product.brand || BRAND.name}</span>

                  <strong>{product.name}</strong>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* =================================
          CATEGORY MARQUEE
      ================================= */}

      <section className="home-marquee">
        <div className="home-marquee-track">
          <span>MAKEUP</span>

          <i>✦</i>

          <span>SKINCARE</span>

          <i>✦</i>

          <span>HAIR</span>

          <i>✦</i>

          <span>BEAUTY</span>

          <i>✦</i>

          <span>MAKEUP</span>

          <i>✦</i>

          <span>SKINCARE</span>

          <i>✦</i>

          <span>HAIR</span>

          <i>✦</i>

          <span>BEAUTY</span>
        </div>
      </section>

      {/* =================================
          END
      ================================= */}

      <section className="home-ending">
        <span className="ending-glow" />

        <p>FIND YOUR BEAUTY</p>

        <h2>
          BE YOUR
          <br />
          OWN
          <em> GODDESS.</em>
        </h2>

        <button onClick={() => navigate("/beauty?mode=makeup")}>
          START EXPERIENCE
          <span>→</span>
        </button>
      </section>
    </main>
  );
};

export default Home;
