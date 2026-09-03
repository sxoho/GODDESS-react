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

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
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

        setLoadState("ready");
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
        setLoadState("error");
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
    <div className="gd-home">
      <section className="gd-hero" aria-labelledby="gd-hero-title">
        <div className="gd-hero-copy">
          <p className="gd-eyebrow">{BRAND.name} BEAUTY EDIT</p>
          <h1 id="gd-hero-title">취향을 발견하는<br />새로운 뷰티.</h1>
          <p className="gd-hero-korean">매일의 루틴부터 새로운 메이크업까지.<br />지금, 나에게 맞는 뷰티를 만나보세요.</p>
          <button className="gd-button" onClick={() => navigate("/products")}>상품 둘러보기 <span aria-hidden="true">→</span></button>
        </div>
        <div className="gd-hero-visual">
          <img src="/images/goddess/beauty-editorial.webp" alt="자연스러운 로즈빛 메이크업 뷰티 화보" width="1254" height="1254" fetchPriority="high" />
        </div>
      </section>
      <section className="gd-new" aria-labelledby="gd-new-title">
        <div className="gd-section-top"><div><h2 id="gd-new-title">NEW ARRIVALS</h2><p className="gd-section-description">새롭게 들어온 상품을 만나보세요.</p></div><button className="gd-text-button" onClick={() => navigate("/products")}>전체 상품 보기 <span aria-hidden="true">↗</span></button></div>
        {loadState === "loading" ? <p className="gd-empty" role="status">상품을 불러오고 있어요.</p> : loadState === "error" ? <div className="gd-empty" role="status"><p>상품을 불러오지 못했어요.</p><button className="gd-text-button" onClick={() => navigate("/products")}>상품 목록으로 이동 →</button></div> : newProducts.length === 0 ? <p className="gd-empty">새로운 상품을 준비하고 있어요.</p> : (
          <div className="gd-product-grid">{newProducts.map((product) => (
            <button key={product.productId} className="gd-product" onClick={() => navigate(`/products/${product.productId}`)}>
              <div className="gd-product-image"><img src={getMainImage(product.productId)} alt={product.name} loading="lazy" /></div>
              <div className="gd-product-info"><span>{product.brand || BRAND.name}</span><strong>{product.name}</strong></div>
            </button>
          ))}</div>
        )}
      </section>
      <section className="gd-discover" aria-labelledby="gd-discover-title">
        <div className="gd-section-top"><div><h2 id="gd-discover-title">AI BEAUTY</h2><p className="gd-section-description">메이크업부터 헤어까지, 나에게 어울리는 변화를 찾아보세요.</p></div><span className="gd-section-aside">서비스 준비 중</span></div>
        <div className="gd-services">
          {[
            { mode: "makeup", no: "01", title: "메이크업", text: "나에게 어울리는 색, 새로운 메이크업.", tag: "COLOR YOUR MOOD" },
            { mode: "hair-style", no: "02", title: "헤어스타일", text: "단발부터 웨이브까지, 스타일의 변화.", tag: "CHANGE YOUR LOOK" },
            { mode: "hair-color", no: "03", title: "헤어컬러", text: "한 톤의 차이로 달라지는 분위기.", tag: "FIND YOUR SHADE" },
          ].map((service) => (
            <button className="gd-service" key={service.mode} onClick={() => navigate(`/beauty?mode=${service.mode}`)}>
              <span className="gd-service-meta">{service.no}</span>
              <h3>{service.title}<span aria-hidden="true">↗</span></h3><p>{service.text}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
