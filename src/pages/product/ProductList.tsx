import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "../../styles/product/ProductList.css";
import { useGlobalStore } from "../../store/store";

const API_BASE = `http://${window.location.hostname}:9102`;

const TEMP_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80";

const getImageUrl = (filePath?: string) => {
  if (!filePath) {
    return TEMP_IMAGE;
  }

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return filePath;
  }

  return `${API_BASE}${filePath}`;
};

const PAGE_SIZE = 24;

type MainCategory = "BEST" | "WOMEN" | "MEN" | "EYEWEAR" | "ACCESSORIES";
type SortType = "recommended" | "popular" | "newest" | "lowPrice" | "highPrice";
type RankingPeriod = "realtime" | "daily" | "weekly" | "monthly";

type Category = {
  id?: number;
  categoryId: number;
  parentId?: number | null;
  name: string;
  description?: string;
  sortOrder?: number;
  visible?: string;
  parent?: Category | null;
};

type Product = {
  id?: number;
  productId: number;
  category?: Category | null;
  categoryId?: number;
  name: string;
  brand?: string;
  description?: string;
  price: number;
  discount?: string;
  material?: string;
  washing?: string;
  fittingEnabled: string;
  status: string;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type ProductColorMaster = {
  id?: number;
  colorId: number;
  colorName: string;
  colorCode: string;
};

type ProductColor = {
  id?: number;
  productcolorId: number;
  productId: number;
  colorId: number;
  colorName: string;
  colorCode: string;
  isMain: string;
  sortOrder: number;
  fittingEnabled: string;
  visible: string;
};

type ProductImage = {
  id?: number;
  colorimageId: number;
  productcolorId: number;
  productColorId?: number;
  productId?: number;
  filePath: string;
  isMain: string;
  imageType?: string;
  sortOrder?: number;
};

type ProductPageResponse = {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

const mainCategories: MainCategory[] = [
  "BEST",
  "WOMEN",
  "MEN",
  "EYEWEAR",
  "ACCESSORIES",
];

const categoryTitleMap: Record<MainCategory, string> = {
  BEST: "베스트",
  WOMEN: "여성의류",
  MEN: "남성의류",
  EYEWEAR: "아이웨어",
  ACCESSORIES: "액세서리",
};

const rankingPeriodLabels: Record<RankingPeriod, string> = {
  realtime: "실시간",
  daily: "일간",
  weekly: "주간",
  monthly: "월간",
};

const mainCategoryNameMap: Record<Exclude<MainCategory, "BEST">, string[]> = {
  WOMEN: ["여성", "여성의류"],
  MEN: ["남성", "남성의류"],
  EYEWEAR: ["아이웨어", "안경"],
  ACCESSORIES: ["액세서리", "악세서리"],
};

type ProductCardImageProps = {
  productId: number;
  alt: string;
  productImages: ProductImage[];
  productColors: ProductColor[];
  selectedColorId: number | null;
};

const ProductCardImage = ({
  productId,
  alt,
  productImages,
  productColors,
  selectedColorId,
}: ProductCardImageProps) => {
  const [imageIndex, setImageIndex] = useState(0);

  const images = useMemo(() => {
    // 상품에 연결된 PRODUCT_COLOR만 추린다.
    const currentProductColors = productColors
      .filter(
        (color) =>
          color.productId === productId &&
          color.visible === "Y"
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    // 색상 필터가 선택된 경우에는 해당 색상의 썸네일만 사용한다.
    const targetProductColors =
      selectedColorId !== null
        ? currentProductColors.filter(
            (color) => color.colorId === selectedColorId
          )
        : currentProductColors;

    const targetProductColorIds = new Set(
      targetProductColors.map((color) => color.productcolorId)
    );

    // 관리자 상품 등록에서 THUMBNAIL로 등록한 사진만 상품 목록 슬라이드에 사용한다.
    // DETAIL 이미지는 상품 설명 전용이므로 여기서는 제외한다.
    const thumbnailImages = productImages
      .filter(
        (image) =>
          targetProductColorIds.has(image.productcolorId) &&
          image.imageType === "THUMBNAIL"
      )
      .sort((a, b) => {
        const colorA = targetProductColors.find(
          (color) => color.productcolorId === a.productcolorId
        );
        const colorB = targetProductColors.find(
          (color) => color.productcolorId === b.productcolorId
        );

        const colorOrderA = colorA?.sortOrder ?? 0;
        const colorOrderB = colorB?.sortOrder ?? 0;

        if (colorOrderA !== colorOrderB) {
          return colorOrderA - colorOrderB;
        }

        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    // 선택한 색상에 THUMBNAIL이 있으면 해당 이미지를 사용한다.
    if (thumbnailImages.length > 0) {
      return thumbnailImages;
    }

    // 선택한 색상에 썸네일이 없으면 상품 전체의 대표 THUMBNAIL을 사용한다.
    // 색상은 여러 개 등록하되 목록용 썸네일은 한 색상에만 등록해도 된다.
    const fallbackThumbnailImages = productImages
      .filter(
        (image) =>
          currentProductColors.some(
            (color) => color.productcolorId === image.productcolorId
          ) &&
          image.imageType === "THUMBNAIL"
      )
      .sort((a, b) => {
        const colorA = currentProductColors.find(
          (color) => color.productcolorId === a.productcolorId
        );
        const colorB = currentProductColors.find(
          (color) => color.productcolorId === b.productcolorId
        );

        const mainA = colorA?.isMain === "Y" ? 0 : 1;
        const mainB = colorB?.isMain === "Y" ? 0 : 1;

        if (mainA !== mainB) {
          return mainA - mainB;
        }

        const colorOrderA = colorA?.sortOrder ?? 0;
        const colorOrderB = colorB?.sortOrder ?? 0;

        if (colorOrderA !== colorOrderB) {
          return colorOrderA - colorOrderB;
        }

        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });

    if (fallbackThumbnailImages.length > 0) {
      return fallbackThumbnailImages;
    }

    // 기존 등록 상품 호환용:
    // THUMBNAIL 타입 자체가 없는 상품은 기존 MAIN 대표 이미지를 사용한다.
    return productImages
      .filter(
        (image) =>
          currentProductColors.some(
            (color) => color.productcolorId === image.productcolorId
          ) &&
          image.isMain === "Y" &&
          (!image.imageType || image.imageType === "MAIN")
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [productId, productImages, productColors, selectedColorId]);

  useEffect(() => {
    setImageIndex(0);
  }, [images]);

  useEffect(() => {
    // 썸네일이 한 장이면 고정, 두 장 이상이면 자동 슬라이드한다.
    if (images.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <img
      src={getImageUrl(images[imageIndex]?.filePath)}
      alt={alt}
    />
  );
};

const ProductList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sw, memberId } = useGlobalStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<ProductColorMaster[]>([]);
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initialMainCategory = (() => {
    const category = searchParams.get("category") as MainCategory | null;
    return category && mainCategories.includes(category) ? category : "WOMEN";
  })();

  const initialSubCategory =
    searchParams.get("sub") ??
    (initialMainCategory === "BEST" ? "전체" : "ALL");

  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory>(initialMainCategory);
  const [selectedSubCategory, setSelectedSubCategory] =
    useState(initialSubCategory);
  const [sortType, setSortType] = useState<SortType>("recommended");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [aiOnly, setAiOnly] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [rankingPeriod, setRankingPeriod] =
    useState<RankingPeriod>("realtime");

  const initialPage = Math.max(
    1,
    Number(searchParams.get("page") ?? "1") || 1
  );

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const loadMetaData = async () => {
      try {
        const [
          categoryResponse,
          colorResponse,
          productColorResponse,
          imageResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/category/find_all`),
          fetch(`${API_BASE}/product_color_info/find_all`),
          fetch(`${API_BASE}/product_color/find_all`),
          fetch(`${API_BASE}/product_color_image/find_all`),
        ]);

        if (!categoryResponse.ok) {
          throw new Error("카테고리 목록을 불러오지 못했습니다.");
        }
        if (!colorResponse.ok) {
          throw new Error("색상 목록을 불러오지 못했습니다.");
        }
        if (!productColorResponse.ok) {
          throw new Error("상품별 색상 목록을 불러오지 못했습니다.");
        }
        if (!imageResponse.ok) {
          throw new Error("상품 이미지 목록을 불러오지 못했습니다.");
        }

        const rawCategoryData: Category[] = await categoryResponse.json();
        const rawColorData: ProductColorMaster[] = await colorResponse.json();
        const rawProductColorData: ProductColor[] =
          await productColorResponse.json();
        const rawImageData: ProductImage[] = await imageResponse.json();

        const categoryData = rawCategoryData.map((category) => ({
          ...category,
          categoryId: category.categoryId ?? category.id ?? 0,
          parentId:
            category.parentId ??
            category.parent?.categoryId ??
            category.parent?.id ??
            null,
          parent: category.parent
            ? {
                ...category.parent,
                categoryId:
                  category.parent.categoryId ?? category.parent.id ?? 0,
              }
            : category.parent,
        }));

        const colorData = rawColorData.map((color) => ({
          ...color,
          colorId: color.colorId ?? color.id ?? 0,
        }));

        const productColorData = rawProductColorData.map((color) => ({
          ...color,
          productcolorId: color.productcolorId ?? color.id ?? 0,
        }));

        const imageData = rawImageData.map((image) => ({
          ...image,
          colorimageId: image.colorimageId ?? image.id ?? 0,
          productcolorId:
            image.productcolorId ?? image.productColorId ?? 0,
        }));

        setCategories(categoryData);
        setColors(colorData);
        setProductColors(productColorData);
        setProductImages(imageData);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "데이터 조회 중 오류가 발생했습니다."
        );
      }
    };

    loadMetaData();
  }, []);

  /**
   * 로그인 회원의 찜 목록 조회
   * 새로고침해도 DB 기준으로 하트 상태를 유지한다.
   */
  useEffect(() => {
    const loadWishlist = async () => {
      if (!sw || memberId <= 0) {
        setWishlist([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/wishlist/member/${memberId}`
        );

        if (!response.ok) {
          throw new Error("찜 목록을 불러오지 못했습니다.");
        }

        const data: Array<{
          productId: number;
        }> = await response.json();

        setWishlist(
          data.map((item) => Number(item.productId))
        );
      } catch (e) {
        console.error("찜 목록 조회 오류", e);
      }
    };

    loadWishlist();
  }, [sw, memberId]);

  const getCategoryNames = (product: Product) => {
    const names: string[] = [];

    const productCategoryId =
      product.categoryId ?? product.category?.categoryId;

    if (!productCategoryId) return names;

    const category = categories.find(
      (item) => item.categoryId === productCategoryId
    );

    if (!category) return names;

    names.push(category.name);

    // 기존 DTO가 parent 객체를 내려주는 경우
    if (category.parent?.name) {
      names.push(category.parent.name);
    }

    // 합친 DTO가 parentId만 내려주는 경우
    if (category.parentId) {
      const parentCategory = categories.find(
        (item) => item.categoryId === category.parentId
      );

      if (parentCategory?.name && !names.includes(parentCategory.name)) {
        names.push(parentCategory.name);
      }
    }

    return names;
  };

  const matchesMainCategory = (product: Product, category: MainCategory) => {
    if (category === "BEST") return true;
    const names = getCategoryNames(product);
    return mainCategoryNameMap[category].some((name) => names.includes(name));
  };

  const subCategories = useMemo(() => {
    if (selectedMainCategory === "BEST") {
      return ["전체", "여성의류", "남성의류", "아이웨어", "신발", "모자", "AI 피팅 가능 상품"];
    }

    const parentNames = mainCategoryNameMap[selectedMainCategory];
    const parentIds = categories
      .filter((category) => parentNames.includes(category.name))
      .map((category) => category.categoryId);

    const children = categories
      .filter((category) => {
        const parentId =
          category.parentId ?? category.parent?.categoryId ?? null;

        return parentId !== null && parentIds.includes(parentId);
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((category) => category.name);

    const extras = selectedMainCategory === "EYEWEAR" ? ["AI FITTING"] : [];
    return ["ALL", "NEW", ...children, ...extras];
  }, [categories, selectedMainCategory]);


  const getMainCategoryId = () => {
    if (selectedMainCategory === "BEST") return null;

    const names = mainCategoryNameMap[selectedMainCategory];

    const mainCategory = categories.find((category) => {
      const parentId =
        category.parentId ?? category.parent?.categoryId ?? null;

      return names.includes(category.name) && parentId === null;
    });

    return mainCategory?.categoryId ?? null;
  };

  const getSelectedSubCategoryId = () => {
    if (
      selectedMainCategory === "BEST" ||
      selectedSubCategory === "ALL" ||
      selectedSubCategory === "NEW" ||
      selectedSubCategory === "AI FITTING"
    ) {
      return null;
    }

    const mainCategoryId = getMainCategoryId();
    if (!mainCategoryId) return null;

    const subCategory = categories.find((category) => {
      const parentId =
        category.parentId ?? category.parent?.categoryId ?? null;

      return (
        parentId === mainCategoryId &&
        category.name === selectedSubCategory
      );
    });

    return subCategory?.categoryId ?? null;
  };

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        if (selectedMainCategory === "BEST") {
          const params = new URLSearchParams();

          const keyword = searchKeyword.trim();
          if (keyword) {
            params.set("keyword", keyword);
          }

          const url = params.toString()
            ? `${API_BASE}/product/best?${params.toString()}`
            : `${API_BASE}/product/best`;

          const response = await fetch(url);

          if (!response.ok) {
            throw new Error("BEST 상품 목록을 불러오지 못했습니다.");
          }

          const rawProducts: Product[] = await response.json();

          const productData = rawProducts
            .slice(0, 100)
            .map((product) => ({
              ...product,
              productId: product.productId ?? product.id ?? 0,
            }));

          setProducts(productData);
          setTotalElements(productData.length);
          setTotalPages(1);
          return;
        }

        const params = new URLSearchParams({
          page: String(currentPage - 1),
          size: String(PAGE_SIZE),
          sort: selectedSubCategory === "NEW" ? "newest" : sortType,
        });

        const subCategoryId = getSelectedSubCategoryId();
        const mainCategoryId = getMainCategoryId();

        // 현재 CATEGORY 테이블에 존재하지 않는 대분류라면
        // 카테고리 조건 없이 전체 상품을 조회하지 않는다.
        // 예: DB에 아직 "아이웨어" 대분류가 없는 경우
        if (mainCategoryId === null) {
          setProducts([]);
          setTotalElements(0);
          setTotalPages(1);
          return;
        }

        if (subCategoryId !== null) {
          params.set("categoryId", String(subCategoryId));
        } else {
          params.set("mainCategoryId", String(mainCategoryId));
        }

        const keyword = searchKeyword.trim();
        if (keyword) {
          params.set("keyword", keyword);
        }

        const response = await fetch(
          `${API_BASE}/product/page?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("상품 페이지를 불러오지 못했습니다.");
        }

        const pageData: ProductPageResponse = await response.json();

        const productData = pageData.content.map((product) => ({
          ...product,
          productId: product.productId ?? product.id ?? 0,
        }));

        setProducts(productData);
        setTotalElements(pageData.totalElements);
        setTotalPages(Math.max(pageData.totalPages, 1));
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "상품 조회 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    categories,
    currentPage,
    selectedMainCategory,
    selectedSubCategory,
    sortType,
    searchKeyword,
  ]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const categoryNames = getCategoryNames(product);

      if (selectedMainCategory === "BEST") {
        if (selectedSubCategory === "여성의류" && !matchesMainCategory(product, "WOMEN")) return false;
        if (selectedSubCategory === "남성의류" && !matchesMainCategory(product, "MEN")) return false;
        if (selectedSubCategory === "아이웨어" && !matchesMainCategory(product, "EYEWEAR")) return false;
        if (selectedSubCategory === "신발" && !categoryNames.includes("신발")) return false;
        if (selectedSubCategory === "모자" && !categoryNames.includes("모자")) return false;
        if (selectedSubCategory === "AI 피팅 가능 상품" && product.fittingEnabled !== "Y") return false;
      } else {
        if (
          selectedSubCategory === "AI FITTING" &&
          product.fittingEnabled !== "Y"
        ) {
          return false;
        }
      }

      if (aiOnly && product.fittingEnabled !== "Y") return false;

      if (selectedColorId !== null) {
        const hasSelectedColor = productColors.some(
          (color) =>
            color.productId === product.productId &&
            color.colorId === selectedColorId &&
            color.visible === "Y"
        );

        if (!hasSelectedColor) return false;
      }

      return true;
    });

    if (selectedMainCategory === "BEST") {
      if (rankingPeriod === "realtime") {
        result = [...result].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
      } else if (rankingPeriod === "daily") {
        result = [...result].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        );
      } else if (rankingPeriod === "weekly") {
        const discountNumber = (value?: string) => Number(value?.replace(/[^0-9]/g, "") || 0);
        result = [...result].sort((a, b) => discountNumber(b.discount) - discountNumber(a.discount));
      } else {
        result = [...result].sort(
          (a, b) =>
            Number(b.fittingEnabled === "Y") - Number(a.fittingEnabled === "Y") ||
            (b.viewCount ?? 0) - (a.viewCount ?? 0),
        );
      }
    }

    return result;
  }, [products, productColors, selectedColorId, selectedMainCategory, selectedSubCategory, aiOnly, searchKeyword, sortType, rankingPeriod]);

  const handleMainCategoryChange = (category: MainCategory) => {
    const nextSubCategory = category === "BEST" ? "전체" : "ALL";

    setSelectedMainCategory(category);
    setSelectedSubCategory(nextSubCategory);
    setCurrentPage(1);

    setSearchParams({
      category,
      sub: nextSubCategory,
      ...(category === "BEST" ? {} : { page: "1" }),
    });
  };

  /**
   * 상품 목록 찜 추가 / 삭제
   */
  const toggleWishlist = async (productId: number) => {
    if (!sw || memberId <= 0) {
      const goLogin = window.confirm(
        "로그인 후 찜할 수 있습니다. 로그인 페이지로 이동하시겠습니까?"
      );

      if (goLogin) {
        navigate("/login");
      }

      return;
    }

    const isLiked = wishlist.includes(productId);

    try {
      if (isLiked) {
        const response = await fetch(
          `${API_BASE}/wishlist/member/${memberId}/product/${productId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("찜 삭제에 실패했습니다.");
        }

        setWishlist((prev) =>
          prev.filter((id) => id !== productId)
        );
      } else {
        const response = await fetch(
          `${API_BASE}/wishlist/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              memberId: memberId,
              productId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("찜 등록에 실패했습니다.");
        }

        setWishlist((prev) =>
          prev.includes(productId)
            ? prev
            : [...prev, productId]
        );
      }
    } catch (e) {
      console.error("찜 처리 오류", e);

      window.alert(
        e instanceof Error
          ? e.message
          : "찜 처리 중 오류가 발생했습니다."
      );
    }
  };

  const getProductColors = (productId: number) =>
    productColors
      .filter(
        (color) =>
          color.productId === productId &&
          color.visible === "Y"
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const renderProductCard = (product: Product, rank?: number) => {
    const isLiked = wishlist.includes(product.productId);

    return (
      <article key={product.productId} className="product-card">
        <div
          className="product-image-wrapper"
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/products/${product.productId}`)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              navigate(`/products/${product.productId}`);
            }
          }}
        >
          {rank && <span className="product-rank">{rank}</span>}

          <ProductCardImage
            productId={product.productId}
            alt={product.name}
            productImages={productImages}
            productColors={productColors}
            selectedColorId={selectedColorId}
          />

          <div className="product-badge-list">
            {product.fittingEnabled === "Y" && (
              <span className="product-ai-badge">AI FITTING</span>
            )}
          </div>

          <button
            type="button"
            className={`product-heart ${isLiked ? "active" : ""}`}
            aria-label={isLiked ? "찜 목록에서 삭제" : "찜 목록에 추가"}
            onClick={(event) => {
              event.stopPropagation();
              toggleWishlist(product.productId);
            }}
          >
            {isLiked ? "♥" : "♡"}
          </button>
        </div>

        <div className="product-information">
          <span className="product-brand">
            {product.brand || "브랜드 없음"}
          </span>

          <button
            type="button"
            className="product-name"
            onClick={() => navigate(`/products/${product.productId}`)}
          >
            {product.name}
          </button>

          <div className="product-price">
            {Number(product.discount || 0) > 0 ? (
              <>
                <strong className="product-discount-rate">
                  {product.discount}%
                </strong>

                <strong className="product-sale-price">
                  {Math.round(
                    product.price *
                      (1 - Number(product.discount || 0) / 100)
                  ).toLocaleString()}
                  원
                </strong>

                <del className="product-original-price">
                  {product.price.toLocaleString()}원
                </del>
              </>
            ) : (
              <strong className="product-sale-price">
                {product.price.toLocaleString()}원
              </strong>
            )}
          </div>

          <div className="product-card-colors" aria-label={`${product.name} 색상`}>
            {getProductColors(product.productId).map((color) => (
              <span
                key={`card-color-${product.productId}-${color.productcolorId}`}
                className="product-card-color-dot"
                title={color.colorName}
                style={{ backgroundColor: color.colorCode }}
              />
            ))}
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="product-list-page">
      <section className="product-page-heading">
        <div className="product-page-heading-copy">
          <p>ONNIVER COLLECTION</p>
          <h1>SHOP</h1>
        </div>

        <button
          type="button"
          className="product-search-button"
          aria-label={isSearchOpen ? "검색창 닫기" : "검색창 열기"}
          onClick={() => setIsSearchOpen((prev) => !prev)}
        >
          {isSearchOpen ? (
            "×"
          ) : (
            <svg
              className="product-search-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <line
                x1="16"
                y1="16"
                x2="21"
                y2="21"
              />
            </svg>
          )}
        </button>
      </section>

      {isSearchOpen && (
        <div className="product-search-area">
          <input
            type="search"
            value={searchKeyword}
            placeholder="상품명, 브랜드, 카테고리를 검색하세요."
            aria-label="상품 검색"
            autoFocus
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
          {searchKeyword && (
            <button type="button" onClick={() => setSearchKeyword("")}>CLEAR</button>
          )}
        </div>
      )}

      <nav className="product-main-categories" aria-label="상품 대분류">
        {mainCategories.map((category) => (
          <button
            key={`main-category-${category}`}
            type="button"
            className={selectedMainCategory === category ? "active" : ""}
            onClick={() => handleMainCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      {loading && <div className="product-empty"><strong>상품을 불러오는 중입니다.</strong></div>}
      {error && <div className="product-empty"><strong>{error}</strong></div>}

      {!loading && !error && selectedMainCategory === "BEST" ? (
        <section className="best-product-section">
          <div className="best-category-row">
            {subCategories.map((category, index) => (
              <button
                key={`best-sub-${category}-${index}`}
                type="button"
                className={selectedSubCategory === category ? "active" : ""}
                onClick={() => {
                  setSelectedSubCategory(category);
                  setCurrentPage(1);
                  setSearchParams({
                    category: selectedMainCategory,
                    sub: category,
                    ...(selectedMainCategory === "BEST"
                      ? {}
                      : { page: "1" }),
                  });
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="best-ranking-row">
            <div className="best-ranking-tabs">
              {(Object.keys(rankingPeriodLabels) as RankingPeriod[]).map((period) => (
                <button
                  key={`ranking-${period}`}
                  type="button"
                  className={rankingPeriod === period ? "active" : ""}
                  onClick={() => setRankingPeriod(period)}
                >
                  {rankingPeriodLabels[period]}
                </button>
              ))}
            </div>
            <span className="best-result-count">{Math.min(totalElements, 100)} ITEMS</span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="product-grid best-product-grid">
              {filteredProducts.map((product, index) => renderProductCard(product, index + 1))}
            </div>
          ) : (
            <div className="product-empty">
              <strong>검색 결과가 없습니다.</strong>
              <p>다른 카테고리나 검색어를 선택해보세요.</p>
            </div>
          )}
        </section>
      ) : !loading && !error ? (
        <div className="product-content">
          <aside className="product-sidebar">
            <div className="product-sidebar-sticky">
              <p className="product-sidebar-eyebrow">CATEGORY</p>
              <h1>{categoryTitleMap[selectedMainCategory]}</h1>

              <nav className="product-sidebar-menu" aria-label="상품 세부 카테고리">
                {subCategories.map((category, index) => (
                  <button
                    key={`sidebar-sub-${category}-${index}`}
                    type="button"
                    className={selectedSubCategory === category ? "active" : ""}
                    onClick={() => {
                  setSelectedSubCategory(category);
                  setCurrentPage(1);
                  setSearchParams({
                    category: selectedMainCategory,
                    sub: category,
                    ...(selectedMainCategory === "BEST"
                      ? {}
                      : { page: "1" }),
                  });
                }}
                  >
                    {category}
                  </button>
                ))}
              </nav>

              <div className="product-color-filter">
                <h3>색상</h3>
                <div className="product-color-grid">
                  {colors.map((color) => (
                    <button
                      key={`filter-color-${color.colorId}-${color.colorName}`}
                      type="button"
                      className={`product-color-option ${
                        selectedColorId === color.colorId ? "active" : ""
                      }`}
                      onClick={() =>
                        setSelectedColorId(
                          selectedColorId === color.colorId ? null : color.colorId
                        )
                      }
                    >
                      <span
                        className="product-color-circle"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <span>{color.colorName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="product-main">
            <div className="product-sort-row">
              <div className="product-result-count">
                <strong>{totalElements}</strong>
                <span> ITEMS</span>
              </div>

              <select
                value={sortType}
                aria-label="상품 정렬"
                onChange={(event) => {
                  setSortType(event.target.value as SortType);
                  setCurrentPage(1);
                  setSearchParams({
                    category: selectedMainCategory,
                    sub: selectedSubCategory,
                    page: "1",
                  });
                }}
              >
                <option value="recommended">추천순</option>
                <option value="popular">인기순</option>
                <option value="newest">신상품순</option>
                <option value="lowPrice">낮은 가격순</option>
                <option value="highPrice">높은 가격순</option>
              </select>
            </div>

            <div className="product-ai-filter">
              <label>
                <input
                  type="checkbox"
                  checked={aiOnly}
                  onChange={(event) => setAiOnly(event.target.checked)}
                />
                <span className="product-ai-checkbox" />
                AI 피팅 가능 상품만 보기
              </label>
            </div>

            {filteredProducts.length > 0 ? (
              <>
                <div className="product-grid">
                  {filteredProducts.map((product) =>
                    renderProductCard(product)
                  )}
                </div>

                {totalPages > 1 && (
                  <nav
                    className="product-pagination"
                    aria-label="상품 페이지"
                  >
                    <button
                      type="button"
                      className="product-pagination-arrow"
                      disabled={currentPage === 1}
                      onClick={() => {
                        const nextPage = currentPage - 1;
                        setCurrentPage(nextPage);
                        setSearchParams({
                          category: selectedMainCategory,
                          sub: selectedSubCategory,
                          page: String(nextPage),
                        });
                      }}
                    >
                      ‹
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    )
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 2
                      )
                      .map((page, index, visiblePages) => {
                        const previousPage = visiblePages[index - 1];
                        const showEllipsis =
                          previousPage !== undefined &&
                          page - previousPage > 1;

                        return (
                          <span
                            key={`pagination-${page}`}
                            className="product-pagination-item"
                          >
                            {showEllipsis && (
                              <span className="product-pagination-ellipsis">
                                …
                              </span>
                            )}

                            <button
                              type="button"
                              className={
                                currentPage === page ? "active" : ""
                              }
                              aria-current={
                                currentPage === page
                                  ? "page"
                                  : undefined
                              }
                              onClick={() => {
                                setCurrentPage(page);
                                setSearchParams({
                                  category: selectedMainCategory,
                                  sub: selectedSubCategory,
                                  page: String(page),
                                });
                              }}
                            >
                              {page}
                            </button>
                          </span>
                        );
                      })}

                    <button
                      type="button"
                      className="product-pagination-arrow"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        const nextPage = currentPage + 1;
                        setCurrentPage(nextPage);
                        setSearchParams({
                          category: selectedMainCategory,
                          sub: selectedSubCategory,
                          page: String(nextPage),
                        });
                      }}
                    >
                      ›
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="product-empty">
                <strong>검색 결과가 없습니다.</strong>
                <p>다른 카테고리나 검색어를 선택해보세요.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword("");
                    setSelectedSubCategory("ALL");
                    setCurrentPage(1);
                    setSearchParams({
                      category: selectedMainCategory,
                      sub: "ALL",
                      page: "1",
                    });
                    setAiOnly(false);
                    setSelectedColorId(null);
                  }}
                >
                  필터 초기화
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
};

export default ProductList;
