import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import "../../styles/product/ProductDetail.css";
import { useGlobalStore } from "../../store/store";
import { addCartItem } from "../../api/cartApi";
import { useSimpleModal } from "../../contexts/SimpleModalContext";

const API_BASE = "http://localhost:9104";

const TEMP_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=90";

const getImageUrl = (filePath?: string) => {
  if (!filePath) return TEMP_IMAGE;

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  return `${API_BASE}${filePath}`;
};

type Category = {
  categoryId: number;
  name: string;
  parent?: Category | null;
};

type Product = {
  id?: number;
  productId: number;
  category?: Category | null;
  categoryId?: number;
  parentCategoryId?: number | null;
  categoryName?: string;
  usageInfo?: string;
  productType?: string;
  volume?: string;
  skinType?: string;
  personalColor?: string;
  brand?: string;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  material?: string;
  washing?: string;
  aiApplyEnabled: string;
  status: string;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
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
  aiApplyEnabled: string;
  visible: string;
};

type ProductColorImage = {
  id?: number;
  colorimageId: number;
  productcolorId: number;
  productColorId?: number;
  productId?: number;
  fileOrigin: string;
  fileSaved: string;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
  createdAt?: string;
};

type ProductSize = {
  id: number;
  productId: number;
  sizeName: string;
  sizeDescription?: string;
  visible: string;
  sortOrder: number;
};

type ProductVariantApi = {
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
  productSizeId: number;
  sizeName: string;
  productVariantId?: number;
  variantName?: string;
  addPrice: number;
  stock: number;
  visible: string;
};

type ProductReview = {
  id: number;
  memberId: number;
  memberNickname: string;
  productId: number;
  productName: string;
  colorName?: string | null;
  variantName?: string | null;
  beautySaveId?: number | null;
  beautyImageUrl?: string | null;
  title: string;
  content: string;
  rating: number;
  createdAt: string;
  updatedAt?: string | null;
};

type ProductReviewPageResponse = {
  content: ProductReview[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

type ProductReviewSummary = {
  reviewCount: number;
  averageRating: number;
};

type ProductReviewAiSummary = {
  summary: string;
};

type ProductQna = {
  id: number;
  productId: number;
  memberId: number;
  memberNickname: string;
  title: string;
  content: string;
  secret: string;
  answer?: string | null;
  answererId?: number | null;
  status: string;
  createdAt: string;
  answerDate?: string | null;
};

type ProductQnaPageResponse = {
  content: ProductQna[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

const ProductDetail = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sw, memberId, loginId } = useGlobalStore();
  const { openAlert, openConfirm } = useSimpleModal();

  const [product, setProduct] = useState<Product | null>(null);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [productImages, setProductImages] = useState<ProductColorImage[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [cartSelections, setCartSelections] = useState<
    Array<{
      optionId: number;
      colorName: string;
      sizeName: string;
      addPrice: number;
      stock: number;
      quantity: number;
    }>
  >([]);

  const [addedCartSelections, setAddedCartSelections] = useState<
    Array<{
      optionId: number;
      colorName: string;
      sizeName: string;
      addPrice: number;
      stock: number;
      quantity: number;
    }>
  >([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const initialTab = (() => {
    const tab = searchParams.get("tab");

    if (tab === "review" || tab === "qna" || tab === "delivery") {
      return tab;
    }

    return "info";
  })();

  const [activeTab, setActiveTab] = useState<
    "info" | "review" | "qna" | "delivery"
  >(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewList, setReviewList] = useState<ProductReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [reviewTotalElements, setReviewTotalElements] = useState(0);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary>({
    reviewCount: 0,
    averageRating: 0,
  });
  const [reviewAiSummary, setReviewAiSummary] = useState("");
  const [reviewAiLoading, setReviewAiLoading] = useState(false);

  const reviewPageParam = Number(searchParams.get("reviewPage") ?? "1");

  const reviewPage =
    Number.isFinite(reviewPageParam) && reviewPageParam > 0
      ? reviewPageParam - 1
      : 0;

  const [qnaList, setQnaList] = useState<ProductQna[]>([]);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [qnaError, setQnaError] = useState("");
  const [qnaFormOpen, setQnaFormOpen] = useState(false);
  const [qnaTitle, setQnaTitle] = useState("");
  const [qnaContent, setQnaContent] = useState("");
  const [qnaSecret, setQnaSecret] = useState(false);
  const [qnaSaving, setQnaSaving] = useState(false);
  const [openedQnaId, setOpenedQnaId] = useState<number | null>(null);
  const [editingQnaId, setEditingQnaId] = useState<number | null>(null);
  const qnaPageParam = Number(searchParams.get("qnaPage") ?? "1");

  const qnaPage =
    Number.isFinite(qnaPageParam) && qnaPageParam > 0 ? qnaPageParam - 1 : 0;

  const [qnaTotalPages, setQnaTotalPages] = useState(0);
  const [qnaTotalElements, setQnaTotalElements] = useState(0);

  const changeTab = (tab: "info" | "review" | "qna" | "delivery") => {
    setActiveTab(tab);

    const nextParams = new URLSearchParams(searchParams);

    if (tab === "info") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    if (tab !== "review") {
      nextParams.delete("reviewPage");
    } else if (!nextParams.get("reviewPage")) {
      nextParams.set("reviewPage", "1");
    }

    if (tab !== "qna") {
      nextParams.delete("qnaPage");
    } else if (!nextParams.get("qnaPage")) {
      nextParams.set("qnaPage", "1");
    }

    setSearchParams(nextParams, {
      replace: false,
    });
  };

  const changeReviewPage = (page: number, replace = false) => {
    const safePage = Math.max(page, 0);

    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("tab", "review");
    nextParams.set("reviewPage", String(safePage + 1));

    setSearchParams(nextParams, { replace });
  };

  const changeQnaPage = (page: number, replace = false) => {
    const safePage = Math.max(page, 0);

    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("tab", "qna");
    nextParams.set("qnaPage", String(safePage + 1));

    setSearchParams(nextParams, { replace });
  };

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab === "review" || tab === "qna" || tab === "delivery") {
      setActiveTab(tab);
    } else {
      setActiveTab("info");
    }
  }, [searchParams]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        setError("");

        const [
          productResponse,
          colorResponse,
          imageResponse,
          sizeResponse,
          optionResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/product/${productId}`),
          fetch(`${API_BASE}/product_color/find_all`),
          fetch(`${API_BASE}/product_color_image/find_all`),
          fetch(`${API_BASE}/product_variant/product/${productId}`),
          fetch(`${API_BASE}/product_option/product/${productId}`),
        ]);

        if (!productResponse.ok) {
          throw new Error("상품 정보를 불러오지 못했습니다.");
        }

        if (!colorResponse.ok) {
          throw new Error("상품 색상 정보를 불러오지 못했습니다.");
        }

        if (!imageResponse.ok) {
          throw new Error("상품 이미지 정보를 불러오지 못했습니다.");
        }

        if (!sizeResponse.ok) {
          throw new Error("상품 사이즈 정보를 불러오지 못했습니다.");
        }

        if (!optionResponse.ok) {
          throw new Error("상품 옵션 정보를 불러오지 못했습니다.");
        }

        const rawProductData: Product = await productResponse.json();
        const rawColorData: ProductColor[] = await colorResponse.json();
        const rawImageData: ProductColorImage[] = await imageResponse.json();
        const rawSizeData: ProductVariantApi[] = await sizeResponse.json();
        const rawOptionData: ProductOption[] = await optionResponse.json();

        const productData: Product = {
          ...rawProductData,
          productId:
            rawProductData.productId ?? rawProductData.id ?? Number(productId),
        };

        const colorData: ProductColor[] = rawColorData
          .map((color) => ({
            ...color,
            productcolorId: color.productcolorId ?? color.id ?? 0,
          }))
          .filter(
            (color) =>
              color.productId === productData.productId &&
              color.visible === "Y",
          )
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        const imageData: ProductColorImage[] = rawImageData.map((image) => ({
          ...image,
          colorimageId: image.colorimageId ?? image.id ?? 0,
          productcolorId: image.productcolorId ?? image.productColorId ?? 0,
        }));

        const sizeData: ProductSize[] = rawSizeData
          .filter((variant) => variant.visible === "Y")
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((variant) => ({
            id: variant.id,
            productId: variant.productId,
            sizeName: variant.variantName,
            sizeDescription: variant.variantDescription,
            visible: variant.visible,
            sortOrder: variant.sortOrder,
          }));

        const optionData: ProductOption[] = rawOptionData
          .filter((option) => option.visible === "Y")
          .map((option) => ({
            ...option,
            productSizeId: option.productVariantId ?? option.productSizeId,
            sizeName: option.variantName ?? option.sizeName,
          }));

        setProduct(productData);
        setColors(colorData);
        setProductImages(imageData);
        setSizes(sizeData);
        setOptions(optionData);

        const mainColor =
          colorData.find((color) => color.isMain === "Y") ?? colorData[0];

        if (mainColor) {
          setSelectedColorId(mainColor.colorId);
        } else {
          setSelectedColorId(null);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "상품 상세 조회 중 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [productId]);

  /**
   * 상품 리뷰 서버 페이징 조회
   */
  const loadProductReviews = async (page = reviewPage) => {
    if (!productId) return;

    try {
      setReviewLoading(true);
      setReviewError("");

      const response = await fetch(
        `${API_BASE}/product_review/product/${productId}/page?page=${page}&size=5`,
      );

      if (!response.ok) {
        throw new Error("상품 리뷰를 불러오지 못했습니다.");
      }

      const data: ProductReviewPageResponse = await response.json();

      setReviewList(data.content ?? []);
      setReviewTotalPages(data.totalPages ?? 0);
      setReviewTotalElements(data.totalElements ?? 0);

      if ((data.totalPages ?? 0) > 0 && page >= data.totalPages) {
        changeReviewPage(data.totalPages - 1, true);
      }
    } catch (e) {
      console.error("상품 리뷰 조회 오류", e);

      setReviewError(
        e instanceof Error
          ? e.message
          : "상품 리뷰 조회 중 오류가 발생했습니다.",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const loadReviewSummary = async () => {
    if (!productId) return;

    try {
      const response = await fetch(
        `${API_BASE}/product_review/product/${productId}/summary`,
      );

      if (!response.ok) {
        return;
      }

      const data: ProductReviewSummary = await response.json();

      setReviewSummary({
        reviewCount: data.reviewCount ?? 0,
        averageRating: data.averageRating ?? 0,
      });
    } catch (e) {
      console.error("리뷰 요약 조회 오류", e);
    }
  };

  const loadReviewAiSummary = async () => {
    if (!productId) return;

    try {
      setReviewAiLoading(true);

      const response = await fetch(
        `${API_BASE}/product_review/product/${productId}/ai-summary`,
      );

      if (!response.ok) {
        setReviewAiSummary("AI 리뷰 요약을 불러오지 못했습니다.");
        return;
      }

      const data: ProductReviewAiSummary = await response.json();

      setReviewAiSummary(data.summary || "아직 요약할 리뷰가 없습니다.");
    } catch (e) {
      console.error("AI 리뷰 요약 조회 오류", e);

      setReviewAiSummary("AI 리뷰 요약을 불러오지 못했습니다.");
    } finally {
      setReviewAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "review") {
      loadProductReviews(reviewPage);
      loadReviewSummary();
      loadReviewAiSummary();
    }
  }, [activeTab, productId, reviewPage]);

  const formatReviewDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 10);
    }

    return date.toLocaleDateString("ko-KR");
  };

  const getReviewImageUrl = (filePath?: string | null) => {
    if (!filePath) return "";

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    return `${API_BASE}${filePath}`;
  };

  const renderStars = (rating: number) => {
    const safeRating = Math.max(0, Math.min(5, Math.round(rating)));

    return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
  };

  /**
   * AI 리뷰 요약은 길어져도 화면이 커지지 않도록
   * 최대 3개의 핵심 포인트만 화면에 표시한다.
   *
   * FastAPI가 줄바꿈/불릿/제목:내용 형식으로 응답하면 우선 활용하고,
   * 한 문단으로 길게 응답해도 문장 단위로 나눠 최대 3개까지만 보여준다.
   */
  const aiSummaryItems = useMemo(() => {
    const raw = (reviewAiSummary || "").trim();

    if (
      !raw ||
      raw === "아직 요약할 리뷰가 없습니다." ||
      raw === "AI 리뷰 요약을 불러오지 못했습니다."
    ) {
      return [];
    }

    const clean = (value: string) =>
      value
        .replace(/\*\*/g, "")
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-•○●▪︎◦*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();

    const truncate = (value: string, max: number) =>
      value.length > max ? `${value.slice(0, max).trim()}…` : value;

    const rawLines = raw
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const pairedItems: Array<{ title: string; body: string }> = [];

    for (let i = 0; i < rawLines.length && pairedItems.length < 3; i += 1) {
      const line = rawLines[i];

      if (/^[-•○●▪︎◦*]\s*/.test(line)) {
        const titleLine = clean(line);
        const nextLine = rawLines[i + 1];

        if (nextLine && !/^[-•○●▪︎◦*]\s*/.test(nextLine)) {
          pairedItems.push({
            title: truncate(titleLine, 28),
            body: truncate(clean(nextLine), 105),
          });
          i += 1;
          continue;
        }
      }
    }

    if (pairedItems.length > 0) {
      return pairedItems;
    }

    let blocks = rawLines.map(clean).filter(Boolean);

    if (blocks.length <= 1) {
      blocks = raw
        .split(/(?<=[.!?。])\s+/)
        .map(clean)
        .filter(Boolean);
    }

    return blocks.slice(0, 3).map((block, index) => {
      const colonMatch = block.match(/^(.{2,30}?)[：:]\s*(.+)$/);
      const dashMatch = block.match(/^(.{2,30}?)\s[-–—]\s(.+)$/);

      if (colonMatch) {
        return {
          title: truncate(colonMatch[1].trim(), 28),
          body: truncate(colonMatch[2].trim(), 105),
        };
      }

      if (dashMatch) {
        return {
          title: truncate(dashMatch[1].trim(), 28),
          body: truncate(dashMatch[2].trim(), 105),
        };
      }

      return {
        title: `리뷰 포인트 ${index + 1}`,
        body: truncate(block, 105),
      };
    });
  }, [reviewAiSummary]);

  /**
   * 상품 문의 서버 페이징 조회
   */
  const loadProductQna = async (page = qnaPage) => {
    if (!productId) return;

    try {
      setQnaLoading(true);
      setQnaError("");

      const params = new URLSearchParams({
        page: String(page),
        size: "10",
      });

      if (sw && memberId > 0) {
        params.set("memberId", String(memberId));
      }

      const response = await fetch(
        `${API_BASE}/product_qna/product/${productId}/page?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("상품 문의를 불러오지 못했습니다.");
      }

      const data: ProductQnaPageResponse = await response.json();

      setQnaList(data.content ?? []);
      setQnaTotalPages(data.totalPages ?? 0);
      setQnaTotalElements(data.totalElements ?? 0);

      if ((data.totalPages ?? 0) > 0 && page >= data.totalPages) {
        changeQnaPage(data.totalPages - 1, true);
      }
    } catch (e) {
      console.error("상품 문의 조회 오류", e);
      setQnaError(
        e instanceof Error
          ? e.message
          : "상품 문의 조회 중 오류가 발생했습니다.",
      );
    } finally {
      setQnaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "qna") {
      loadProductQna(qnaPage);
    }
  }, [activeTab, productId, qnaPage, sw, memberId]);

  const resetQnaForm = () => {
    setQnaTitle("");
    setQnaContent("");
    setQnaSecret(false);
    setEditingQnaId(null);
  };

  const handleOpenQnaForm = () => {
    if (!sw || memberId <= 0) {
      openAlert("로그인 후 상품 문의를 작성할 수 있습니다.");
      navigate("/login");
      return;
    }

    resetQnaForm();
    setQnaFormOpen(true);
  };

  const handleSaveQna = async () => {
    if (!product) return;

    if (!sw || memberId <= 0) {
      openAlert("로그인 후 상품 문의를 작성할 수 있습니다.");
      return;
    }

    if (!qnaTitle.trim()) {
      openAlert("문의 제목을 입력해주세요.");
      return;
    }

    if (!qnaContent.trim()) {
      openAlert("문의 내용을 입력해주세요.");
      return;
    }

    try {
      setQnaSaving(true);

      const isEdit = editingQnaId !== null;
      const response = await fetch(
        isEdit
          ? `${API_BASE}/product_qna/${editingQnaId}`
          : `${API_BASE}/product_qna/save`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEdit
              ? {
                  memberId,
                  title: qnaTitle.trim(),
                  content: qnaContent.trim(),
                  secret: qnaSecret ? "Y" : "N",
                }
              : {
                  productId: product.productId,
                  memberId,
                  title: qnaTitle.trim(),
                  content: qnaContent.trim(),
                  secret: qnaSecret ? "Y" : "N",
                },
          ),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message ||
            (isEdit
              ? "문의 수정에 실패했습니다."
              : "문의 등록에 실패했습니다."),
        );
      }

      openAlert(
        isEdit ? "문의가 수정되었습니다." : "문의가 등록되었습니다.",
      );
      resetQnaForm();
      setQnaFormOpen(false);
      changeQnaPage(0);
      await loadProductQna(0);
    } catch (e) {
      console.error("상품 문의 저장 오류", e);
      openAlert(
        e instanceof Error
          ? e.message
          : "상품 문의 저장 중 오류가 발생했습니다.",
      );
    } finally {
      setQnaSaving(false);
    }
  };

  const handleEditQna = (qna: ProductQna) => {
    if (qna.memberId !== memberId) {
      openAlert("본인이 작성한 문의만 수정할 수 있습니다.");
      return;
    }

    if (qna.status !== "WAITING") {
      openAlert("답변이 등록된 문의는 수정할 수 없습니다.");
      return;
    }

    setEditingQnaId(qna.id);
    setQnaTitle(qna.title);
    setQnaContent(qna.content);
    setQnaSecret(qna.secret === "Y");
    setQnaFormOpen(true);
  };

  const handleDeleteQna = async (qna: ProductQna) => {
    if (qna.memberId !== memberId) {
      openAlert("본인이 작성한 문의만 삭제할 수 있습니다.");
      return;
    }

    if (qna.status !== "WAITING") {
      openAlert("답변이 등록된 문의는 삭제할 수 없습니다.");
      return;
    }

    const confirmed = await openConfirm({
      title: "상품 문의 삭제",
      message: "상품 문의를 삭제할까요?",
      confirmText: "삭제",
      cancelText: "취소",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/product_qna/${qna.id}/member/${memberId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "문의 삭제에 실패했습니다.");
      }

      if (openedQnaId === qna.id) {
        setOpenedQnaId(null);
      }

      const nextPage =
        qnaList.length === 1 && qnaPage > 0 ? qnaPage - 1 : qnaPage;

      changeQnaPage(nextPage, true);

      await loadProductQna(nextPage);
    } catch (e) {
      console.error("상품 문의 삭제 오류", e);
      openAlert(
        e instanceof Error
          ? e.message
          : "상품 문의 삭제 중 오류가 발생했습니다.",
      );
    }
  };

  const formatQnaDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 10);
    }

    return date.toLocaleDateString("ko-KR");
  };

  const canReadQna = (qna: ProductQna) => {
    if (qna.secret !== "Y") {
      return true;
    }

    return sw && memberId > 0 && qna.memberId === memberId;
  };

  const maskNickname = (nickname?: string) => {
    if (!nickname) return "-";
    if (nickname.length === 1) return nickname;
    return nickname[0] + "*".repeat(nickname.length - 1);
  };

  // 로그인 회원의 현재 상품 찜 여부 조회
  useEffect(() => {
    if (!productId || !sw || memberId <= 0) {
      setIsLiked(false);
      return;
    }

    let cancelled = false;

    const loadWishlistStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/wishlist/check?memberId=${memberId}&productId=${productId}`,
        );

        if (!response.ok) {
          throw new Error("찜 여부를 확인하지 못했습니다.");
        }

        const liked: boolean = await response.json();

        if (!cancelled) {
          setIsLiked(liked);
        }
      } catch (e) {
        console.error("찜 여부 조회 오류", e);

        if (!cancelled) {
          setIsLiked(false);
        }
      }
    };

    loadWishlistStatus();

    return () => {
      cancelled = true;
    };
  }, [productId, sw, memberId]);

  const selectedColor = useMemo(
    () =>
      colors.find((color) => color.colorId === selectedColorId) ??
      colors[0] ??
      null,
    [colors, selectedColorId],
  );

  const selectedSize = sizes.find((size) => size.id === selectedSizeId);

  const availableOptions = useMemo(() => {
    if (!selectedColor) return [];

    return options.filter(
      (option) =>
        option.productColorId === selectedColor.productcolorId &&
        option.visible === "Y",
    );
  }, [options, selectedColor]);

  const availableSizes = useMemo(() => {
    const optionMap = new Map(
      availableOptions.map((option) => [option.productSizeId, option]),
    );

    return sizes
      .filter((size) => optionMap.has(size.id))
      .map((size) => ({
        ...size,
        option: optionMap.get(size.id)!,
      }));
  }, [sizes, availableOptions]);

  const isOptionSelected = (optionId: number) =>
    cartSelections.some((item) => item.optionId === optionId);

  const handleSizeSelect = (size: ProductSize, option: ProductOption) => {
    if (!selectedColor || option.stock <= 0) return;

    setSelectedSizeId(size.id);

    setCartSelections((prev) => {
      const exists = prev.some((item) => item.optionId === option.id);

      if (exists) {
        return prev.filter((item) => item.optionId !== option.id);
      }

      return [
        ...prev,
        {
          optionId: option.id,
          colorName: selectedColor.colorName,
          sizeName: size.sizeName,
          addPrice: option.addPrice ?? 0,
          stock: option.stock,
          quantity: 1,
        },
      ];
    });
  };

  const changeSelectionQuantity = (optionId: number, amount: number) => {
    setCartSelections((prev) =>
      prev.map((item) =>
        item.optionId === optionId
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(item.stock, item.quantity + amount),
              ),
            }
          : item,
      ),
    );
  };

  const removeCartSelection = (optionId: number) => {
    setCartSelections((prev) =>
      prev.filter((item) => item.optionId !== optionId),
    );
  };

  /**
   * 상세 상단 전체 갤러리
   *
   * 선택한 색상만 보여주는 것이 아니라 상품에 등록된 모든
   * THUMBNAIL / MAIN 이미지를 색상 순서대로 한 번에 묶는다.
   * 화살표로 다른 색상의 이미지로 넘어가면 해당 색상도 자동 선택된다.
   */
  const galleryItems = useMemo(() => {
    const items = colors.flatMap((color) =>
      productImages
        .filter(
          (image) =>
            image.productcolorId === color.productcolorId &&
            image.imageType !== "DETAIL",
        )
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((image) => ({
          imageId: image.colorimageId,
          imageUrl: getImageUrl(image.filePath),
          colorId: color.colorId,
          productColorId: color.productcolorId,
          colorName: color.colorName,
        })),
    );

    if (items.length > 0) {
      return items;
    }

    return [
      {
        imageId: 0,
        imageUrl: TEMP_IMAGE,
        colorId: selectedColor?.colorId ?? 0,
        productColorId: selectedColor?.productcolorId ?? 0,
        colorName: selectedColor?.colorName ?? "",
      },
    ];
  }, [colors, productImages, selectedColor]);

  /**
   * 최근 본 상품 저장
   * - 로그인/JWT와 무관하게 브라우저 localStorage에 저장
   * - 같은 상품은 중복 제거 후 가장 앞으로 이동
   * - 최대 8개 유지
   */
  useEffect(() => {
    if (!product) return;

    try {
      const storageKey = "goddessRecentProducts";
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const recentProducts = Array.isArray(saved) ? saved : [];

      const recentItem = {
        productId: product.productId,
        productName: product.name,
        brand: product.brand ?? "STAR",
        price: product.price,
        discount: product.discount,
        imageUrl: galleryItems[0]?.imageUrl ?? "",
        viewedAt: new Date().toISOString(),
      };

      const updated = [
        recentItem,
        ...recentProducts.filter(
          (item: { productId?: number }) => item.productId !== product.productId,
        ),
      ].slice(0, 8);

      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error("최근 본 상품 저장 오류:", error);
    }
  }, [product, galleryItems]);

  // 상품 상세 설명 영역 전용 이미지
  const detailImages = useMemo(() => {
    if (!selectedColor) return [];

    return productImages
      .filter(
        (image) =>
          image.productcolorId === selectedColor.productcolorId &&
          image.imageType === "DETAIL",
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => getImageUrl(image.filePath));
  }, [productImages, selectedColor]);

  const currentGalleryItem = galleryItems[activeImageIndex] ?? galleryItems[0];

  const currentImage = currentGalleryItem?.imageUrl ?? TEMP_IMAGE;

  const categoryText = useMemo(() => {
    if (!product) return "PRODUCT";
    if (product.categoryName) return product.categoryName;
    if (!product.category) return "PRODUCT";
    const names = [product.category.parent?.name, product.category.name].filter(Boolean);
    return names.join(" / ");
  }, [product]);

  const discountRate = useMemo(() => {
    if (!product?.discount) return null;
    const number = Number(product.discount);
    return Number.isNaN(number) || number <= 0 ? null : number;
  }, [product]);

  // 할인 적용된 기본 가격
  const discountedPrice = useMemo(() => {
    if (!product) return 0;

    if (!discountRate) {
      return product.price;
    }

    return Math.round(product.price * (1 - discountRate / 100));
  }, [product, discountRate]);

  const handleColorSelect = (colorId: number) => {
    setSelectedColorId(colorId);
    setSelectedSizeId(null);

    // 선택한 색상의 첫 번째 갤러리 이미지로 이동
    const firstImageIndex = galleryItems.findIndex(
      (item) => item.colorId === colorId,
    );

    setActiveImageIndex(firstImageIndex >= 0 ? firstImageIndex : 0);
  };

  /**
   * 화살표 / 썸네일로 이미지 이동
   * 다른 색상의 이미지로 넘어가면 COLOR 선택 상태도 같이 변경한다.
   */
  const moveGalleryImage = (nextIndex: number) => {
    const item = galleryItems[nextIndex];

    if (!item) {
      return;
    }

    if (item.colorId && item.colorId !== selectedColorId) {
      setSelectedColorId(item.colorId);
      setSelectedSizeId(null);
    }

    setActiveImageIndex(nextIndex);
  };

  const handlePreviousImage = () => {
    const nextIndex =
      activeImageIndex === 0 ? galleryItems.length - 1 : activeImageIndex - 1;

    moveGalleryImage(nextIndex);
  };

  const handleNextImage = () => {
    const nextIndex =
      activeImageIndex === galleryItems.length - 1 ? 0 : activeImageIndex + 1;

    moveGalleryImage(nextIndex);
  };

  const handleWishlistToggle = async () => {
    console.log("=== 찜 클릭 ===");
    console.log("sw =", sw);
    console.log("memberId =", memberId);
    console.log("product =", product);
    console.log("isLiked =", isLiked);

    if (!product) {
      console.log("❌ product 없음");
      return;
    }

    if (!sw || memberId <= 0) {
      console.log("❌ 로그인 정보 없음");
      openAlert("로그인 후 찜할 수 있습니다.");
      return;
    }

    // 아래 기존 코드 그대로

    try {
      setWishlistLoading(true);

      if (isLiked) {
        const response = await fetch(
          `${API_BASE}/wishlist/member/${memberId}/product/${product.productId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error("찜 삭제에 실패했습니다.");
        }

        setIsLiked(false);
      } else {
        const response = await fetch(`${API_BASE}/wishlist/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId: memberId,
            productId: product.productId,
          }),
        });

        if (!response.ok) {
          throw new Error("찜 등록에 실패했습니다.");
        }

        setIsLiked(true);
      }
    } catch (e) {
      console.error("찜 처리 오류", e);

      openAlert(
        e instanceof Error ? e.message : "찜 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!sw || !loginId) {
      openAlert("로그인 후 장바구니를 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    if (cartSelections.length === 0) {
      openAlert("색상과 규격을 선택해주세요.");
      return;
    }

    try {
      await Promise.all(
        cartSelections.map((item) =>
          addCartItem({
            productOptionId: item.optionId,
            quantity: item.quantity,
          }),
        ),
      );

      await queryClient.invalidateQueries({
        queryKey: ["cartItems", loginId],
      });

      /*
       * 장바구니 담기 성공 후 상세페이지 선택 상태를 초기화한다.
       * 같은 상세페이지에서 바로 BUY NOW를 눌렀을 때
       * 방금 장바구니에 담은 수량이 그대로 남아있는 혼동을 방지한다.
       */
      setAddedCartSelections(cartSelections);
      setCartSelections([]);
      setSelectedSizeId(null);
      setCartModalOpen(true);
    } catch (error) {
      console.error("장바구니 등록 오류", error);
      openAlert("장바구니 등록에 실패했습니다.");
    }
  };

  const handleBuyNow = () => {
    if (!sw || !loginId) {
      openAlert("로그인 후 구매할 수 있습니다.");
      navigate("/login");
      return;
    }

    if (!product || cartSelections.length === 0) {
      openAlert("색상과 규격을 선택해주세요.");
      return;
    }

    const invalidSelection = cartSelections.find(
      (item) => item.stock <= 0 || item.quantity > item.stock,
    );

    if (invalidSelection) {
      openAlert(
        `${invalidSelection.colorName} / ${invalidSelection.sizeName} 옵션의 재고를 확인해주세요.`,
      );
      return;
    }

    /*
     * BUY NOW는 장바구니와 완전히 분리한다.
     * - addCartItem() 호출 안 함
     * - CART의 기존 상품/수량 조회 안 함
     * - 현재 상세페이지에서 선택한 옵션/수량만 주문 페이지로 전달
     */
    const orderItems = cartSelections.map((item) => {
      const option = options.find(
        (currentOption) => currentOption.id === item.optionId,
      );

      const originalUnitPrice =
        product.price + (item.addPrice || 0);

      const itemDiscountPrice =
        discountedPrice + (item.addPrice || 0);

      return {
        id: item.optionId,
        cartId: undefined,
        productOptionId: item.optionId,
        productId: product.productId,
        brand: product.brand ?? "GODDESS",
        productName: product.name,
        colorName: item.colorName,
        variantName: item.sizeName,
        sizeName: item.sizeName,
        optionName: `${item.colorName} / ${item.sizeName}`,
        price: product.price,
        discount: product.discount ?? 0,
        addPrice: item.addPrice || 0,
        discountPrice: itemDiscountPrice,
        stock: option?.stock ?? item.stock,
        quantity: item.quantity,
        productStatus: product.status,
        optionVisible: option?.visible ?? "Y",
        filePath: currentGalleryItem?.imageUrl ?? null,
        originalUnitPrice,
      };
    });

    const totalOriginal = orderItems.reduce(
      (sum, item) =>
        sum +
        (item.price + (item.addPrice || 0)) *
          item.quantity,
      0,
    );

    const totalProductPrice = orderItems.reduce(
      (sum, item) =>
        sum +
        item.discountPrice * item.quantity,
      0,
    );

    const totalDiscount =
      totalOriginal - totalProductPrice;

    const shippingFee =
      totalProductPrice >= 50000 ? 0 : 3000;

    const finalPrice =
      totalProductPrice + shippingFee;

    navigate("/order", {
      state: {
        buyNow: true,
        buyNowItems: cartSelections.map((item) => ({
          productOptionId: item.optionId,
          quantity: item.quantity,
        })),
        orderItems,
        paymentSummary: {
          totalOriginal,
          totalDiscount,
          shippingFee,
          finalPrice,
        },
      },
    });
  };

  if (loading) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-not-found">
          <h1>상품을 불러오는 중입니다.</h1>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-not-found">
          <h1>{error || "상품을 찾을 수 없습니다."}</h1>
          <button type="button" onClick={() => navigate("/products")}>
            상품 목록으로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <section className="product-detail-main product-detail-main-editorial">
        <aside className="product-detail-information">
          <div className="product-detail-product-topline">
            <div>
              <p className="product-detail-brand-name">
                {product.brand || "GODDESS"} · {categoryText}
              </p>
              <h1>{product.name}</h1>
            </div>

            <button
              type="button"
              className={`product-detail-like ${isLiked ? "active" : ""}`}
              aria-label={isLiked ? "찜 취소" : "찜하기"}
              disabled={wishlistLoading}
              onClick={handleWishlistToggle}
            >
              {isLiked ? "♥" : "♡"}
            </button>
          </div>

          <div className="product-detail-rating">
            <button type="button" onClick={() => changeTab("review")}>
              <span className="product-detail-stars">
                {"★".repeat(
                  Math.max(
                    0,
                    Math.min(5, Math.round(reviewSummary.averageRating || 0)),
                  ),
                )}
                {"☆".repeat(
                  Math.max(
                    0,
                    5 -
                      Math.min(
                        5,
                        Math.round(reviewSummary.averageRating || 0),
                      ),
                  ),
                )}
              </span>
              <span>
                {reviewSummary.reviewCount > 0
                  ? `${reviewSummary.averageRating.toFixed(1)} (${reviewSummary.reviewCount})`
                  : "리뷰 없음"}
              </span>
            </button>

            {product.aiApplyEnabled === "Y" && (
              <span className="product-detail-badge">AI BEAUTY</span>
            )}
          </div>

          {product.description && (
            <p className="product-detail-short-copy">
              {product.description}
            </p>
          )}

          <div className="product-detail-price-block">
            {discountRate ? (
              <div className="product-detail-price-line">
                <strong className="product-detail-sale-price">
                  {discountedPrice.toLocaleString()}원
                </strong>
                <del className="product-detail-original-price">
                  {product.price.toLocaleString()}원
                </del>
                <span className="product-detail-discount">
                  {discountRate}% OFF
                </span>
              </div>
            ) : (
              <strong className="product-detail-sale-price">
                {product.price.toLocaleString()}원
              </strong>
            )}
          </div>

          <div className="product-detail-option product-detail-color-section">
            <div className="product-detail-option-heading">
              <span>SHADE</span>
              <strong>{selectedColor?.colorName || "색상을 선택해주세요"}</strong>
            </div>

            <div className="product-detail-color-options product-detail-color-swatches">
              {colors.length > 0 ? (
                colors.map((color) => (
                  <button
                    key={color.productcolorId}
                    type="button"
                    className={
                      selectedColorId === color.colorId ? "active" : ""
                    }
                    onClick={() => handleColorSelect(color.colorId)}
                    aria-label={color.colorName}
                    title={color.colorName}
                  >
                    <span
                      className="product-detail-color-chip"
                      style={{ backgroundColor: color.colorCode }}
                    />
                  </button>
                ))
              ) : (
                <p>등록된 색상이 없습니다.</p>
              )}
            </div>
          </div>

          <div className="product-detail-option">
            <div className="product-detail-option-heading">
              <span>OPTION</span>
              <strong>
                {selectedSize?.sizeName ||
                  (product.volume ? product.volume : "규격을 선택해주세요")}
              </strong>
            </div>

            <div className="product-detail-size-options">
              {availableSizes.length > 0 ? (
                availableSizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    disabled={size.option.stock <= 0}
                    className={
                      isOptionSelected(size.option.id) ? "active" : ""
                    }
                    onClick={() => handleSizeSelect(size, size.option)}
                  >
                    {size.sizeName}
                    {size.option.stock <= 0 && <small>SOLD OUT</small>}
                  </button>
                ))
              ) : (
                <p>선택 가능한 규격이 없습니다.</p>
              )}
            </div>
          </div>

          {cartSelections.length > 0 && (
            <div className="product-detail-selected-options">
              {cartSelections.map((item) => (
                <div
                  key={item.optionId}
                  className="product-detail-selected-option"
                >
                  <div className="product-detail-selected-option-info">
                    <span>
                      {item.colorName} / {item.sizeName}
                    </span>

                    <div className="product-detail-quantity">
                      <span>QTY</span>
                      <div className="product-detail-quantity-control">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            changeSelectionQuantity(item.optionId, -1)
                          }
                        >
                          −
                        </button>
                        <strong>{item.quantity}</strong>
                        <button
                          type="button"
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            changeSelectionQuantity(item.optionId, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="product-detail-selected-option-right">
                    <strong>
                      {(
                        (discountedPrice + item.addPrice) *
                        item.quantity
                      ).toLocaleString()}
                      원
                    </strong>
                    <button
                      type="button"
                      className="product-detail-selected-option-remove"
                      onClick={() => removeCartSelection(item.optionId)}
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}

              <div className="product-detail-selected-total">
                <span>TOTAL</span>
                <strong>
                  {cartSelections
                    .reduce(
                      (sum, item) =>
                        sum +
                        (discountedPrice + item.addPrice) *
                          item.quantity,
                      0,
                    )
                    .toLocaleString()}
                  원
                </strong>
              </div>
            </div>
          )}

          <div className="product-detail-purchase-buttons">
            <button type="button" className="cart" onClick={handleAddToCart}>
              ADD TO BAG
            </button>

            <button type="button" className="buy" onClick={handleBuyNow}>
              BUY NOW
            </button>
          </div>

          {product.aiApplyEnabled === "Y" && (
            <button
              type="button"
              className="product-detail-beauty-button"
              onClick={() =>
                navigate(
                  `/beauty?productId=${product.productId}${
                    selectedColor ? `&colorId=${selectedColor.colorId}` : ""
                  }`,
                )
              }
            >
              <span className="product-detail-beauty-title">
                AI BEAUTY TRY-ON
              </span>
              <span>선택한 컬러를 내 얼굴에 미리 체험해보세요</span>
            </button>
          )}

          <div className="product-detail-editorial-info">
            <div>
    <span>ABOUT</span>

   
  </div>

            {product.usageInfo && (
              <div>
                <span>HOW TO USE</span>
                <p>{product.usageInfo}</p>
              </div>
            )}

            {(product.skinType || product.personalColor || product.volume) && (
              <div className="product-detail-fit-row">
                {product.skinType && (
                  <p>
                    <span>SKIN TYPE</span>
                    {product.skinType}
                  </p>
                )}
                {product.personalColor && (
                  <p>
                    <span>PERSONAL COLOR</span>
                    {product.personalColor}
                  </p>
                )}
                {product.volume && (
                  <p>
                    <span>VOLUME</span>
                    {product.volume}
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>

        <div className="product-detail-gallery product-detail-gallery-editorial">
          <div className="product-detail-image-grid">
            <button
              type="button"
              className="product-detail-image-panel primary"
              onClick={handleNextImage}
              aria-label="다음 이미지 보기"
            >
              <img src={currentImage} alt={product.name} />
            </button>

            <button
              type="button"
              className="product-detail-image-panel secondary"
              onClick={handleNextImage}
              aria-label="다음 이미지 보기"
            >
              <img
                src={
                  galleryItems.length > 1
                    ? galleryItems[(activeImageIndex + 1) % galleryItems.length]
                        .imageUrl
                    : currentImage
                }
                alt={`${product.name} 추가 이미지`}
              />

              {selectedColor?.colorName && (
                <span className="product-detail-image-caption">
                  {selectedColor.colorName}
                </span>
              )}
            </button>
          </div>

          <div className="product-detail-gallery-footer">
            <div className="product-detail-thumbnail-list">
              {galleryItems.map((item, index) => (
                <button
                  key={`${item.imageId}-${index}`}
                  type="button"
                  className={activeImageIndex === index ? "active" : ""}
                  onClick={() => moveGalleryImage(index)}
                  aria-label={`${item.colorName || "상품"} 이미지 ${index + 1}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={`${product.name} ${item.colorName || ""} 이미지 ${index + 1}`}
                  />
                </button>
              ))}
            </div>

            {galleryItems.length > 1 && (
              <div className="product-detail-gallery-arrows">
                <button
                  type="button"
                  aria-label="이전 이미지"
                  onClick={handlePreviousImage}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="다음 이미지"
                  onClick={handleNextImage}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="product-detail-bottom">
        <nav className="product-detail-tabs">
          <button
            type="button"
            className={activeTab === "info" ? "active" : ""}
            onClick={() => changeTab("info")}
          >
            상품정보
          </button>

          <button
            type="button"
            className={activeTab === "review" ? "active" : ""}
            onClick={() => changeTab("review")}
          >
            리뷰
          </button>

          <button
            type="button"
            className={activeTab === "qna" ? "active" : ""}
            onClick={() => changeTab("qna")}
          >
            상품문의
          </button>

          <button
            type="button"
            className={activeTab === "delivery" ? "active" : ""}
            onClick={() => changeTab("delivery")}
          >
            배송/교환
          </button>
        </nav>

        <div className="product-detail-tab-content">
          {activeTab === "info" && (
            <div>
              <h2>PRODUCT INFORMATION</h2>
              <p>{product.description || "상품 설명이 없습니다."}</p>

              {detailImages.map((image, index) => (
                <img
                  key={`detail-${image}-${index}`}
                  src={image}
                  alt={`${product.name} 상세 이미지 ${index + 1}`}
                />
              ))}
            </div>
          )}

          {activeTab === "review" && (
            <section className="product-review-section">
              <div className="product-review-header">
                <div>
                  <p className="product-review-eyebrow">GODDESS REVIEW</p>

                  <div className="product-review-title-row">
                    <h2>상품리뷰</h2>

                    <strong>{reviewTotalElements}건</strong>
                  </div>

                  <span>직접 사용해본 색감과 발림성, 지속력에 대한 경험을 공유해주세요.</span>
                </div>

              </div>

              <div className="product-review-summary">
                <div className="product-review-summary-head">
                  <div className="product-review-summary-score-block">
                    <span className="product-review-summary-big-star">★</span>

                    <div>
                      <strong>{reviewSummary.averageRating.toFixed(1)}</strong>

                      <small>
                        평균 별점 · 총 리뷰 {reviewSummary.reviewCount.toLocaleString()}개
                      </small>
                    </div>
                  </div>

                  <div className="product-review-summary-title-group">
                    <p>GODDESS AI REVIEW</p>

                    <h3>
                      리뷰 핵심 요약
                      <span>Beta</span>
                    </h3>
                  </div>
                </div>

                {reviewAiLoading ? (
                  <div className="product-review-ai-mail-loading">
                    <div className="product-review-ai-loading-symbol">
                      <span>✦</span>
                    </div>

                    <div className="product-review-ai-loading-copy">
                      <strong>리뷰를 읽고 있어요</strong>

                      <p>
                        GODDESS AI가 구매자 리뷰에서 반복되는 의견을
                        정리하고 있습니다.
                      </p>

                      <div className="product-review-ai-loading-line">
                        <i />
                      </div>

                      <div className="product-review-ai-loading-step">
                        <span className="active">READ</span>
                        <span>ANALYZE</span>
                        <span>SUMMARY</span>
                      </div>
                    </div>
                  </div>
                ) : aiSummaryItems.length > 0 ? (
                  <div className="product-review-ai-result">
                    <div className="product-review-ai-result-title">
                      <span>AI SUMMARY</span>
                      <p>최근 리뷰에서 반복적으로 언급된 핵심 의견이에요.</p>
                    </div>

                    <ol className="product-review-ai-list">
                      {aiSummaryItems.map((item, index) => (
                        <li key={`${item.title}-${index}`}>
                          <div className="product-review-ai-item-head">
                            <span className="product-review-ai-index">
                              0{index + 1}
                            </span>

                            <strong>{item.title}</strong>
                          </div>

                          <p title={item.body}>{item.body}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="product-review-ai-empty">
                    <span>✦</span>

                    <p>
                      {reviewAiSummary || "아직 요약할 리뷰가 없습니다."}
                    </p>
                  </div>
                )}
              </div>


              {reviewLoading ? (
                <div className="product-review-empty">
                  상품 리뷰를 불러오는 중입니다.
                </div>
              ) : reviewError ? (
                <div className="product-review-empty">
                  <p>{reviewError}</p>

                  <button
                    type="button"
                    onClick={() => loadProductReviews(reviewPage)}
                  >
                    다시 불러오기
                  </button>
                </div>
              ) : reviewList.length === 0 ? (
                <div className="product-review-empty">
                  <strong>등록된 상품 리뷰가 없습니다.</strong>

                  <p>구매 후 주문내역에서 작성된 리뷰가 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="product-review-list">
                  {reviewList.map((review) => {
                    return (
                      <article key={review.id} className="product-review-item">
                        <div className="product-review-item-meta">
                          <div>
                            <span className="product-review-stars">
                              {renderStars(review.rating)}
                            </span>

                            <strong>{review.rating}.0</strong>
                          </div>

                          <div>
                            <span>{review.memberNickname}</span>

                            <span>{formatReviewDate(review.createdAt)}</span>
                          </div>
                        </div>

                        <div className="product-review-item-body">
                          <div className="product-review-item-copy">
                            <h3>{review.title}</h3>

                            {(review.colorName || review.variantName) && (
                              <div className="product-review-purchased-option">
                                <span>구매 옵션</span>
                                <strong>
                                  {[review.colorName, review.variantName]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </strong>
                              </div>
                            )}

                            <p>{review.content}</p>

                            {review.updatedAt && (
                              <small>
                                수정됨 · {formatReviewDate(review.updatedAt)}
                              </small>
                            )}
                          </div>

                          {review.beautyImageUrl && (
                            <div className="product-review-beauty-image">
                              <span>AI BEAUTY RESULT</span>

                              <img
                                src={getReviewImageUrl(review.beautyImageUrl)}
                                alt="뷰티 리뷰 이미지"
                              />
                            </div>
                          )}
                        </div>

                      </article>
                    );
                  })}
                </div>
              )}

              {!reviewLoading && !reviewError && reviewTotalPages > 1 && (
                <nav
                  className="product-review-pagination"
                  aria-label="상품 리뷰 페이지"
                >
                  <button
                    type="button"
                    disabled={reviewPage === 0}
                    onClick={() => changeReviewPage(reviewPage - 1)}
                  >
                    ‹
                  </button>

                  {Array.from(
                    {
                      length: reviewTotalPages,
                    },
                    (_, index) => index,
                  )
                    .filter(
                      (page) =>
                        page === 0 ||
                        page === reviewTotalPages - 1 ||
                        Math.abs(page - reviewPage) <= 2,
                    )
                    .map((page, index, pages) => {
                      const previous = pages[index - 1];

                      return (
                        <span key={page}>
                          {previous !== undefined && page - previous > 1 && (
                            <i>…</i>
                          )}

                          <button
                            type="button"
                            className={reviewPage === page ? "active" : ""}
                            onClick={() => changeReviewPage(page)}
                          >
                            {page + 1}
                          </button>
                        </span>
                      );
                    })}

                  <button
                    type="button"
                    disabled={reviewPage === reviewTotalPages - 1}
                    onClick={() => changeReviewPage(reviewPage + 1)}
                  >
                    ›
                  </button>
                </nav>
              )}
            </section>
          )}

          {activeTab === "qna" && (
            <section className="product-qna-section">
              <div className="product-qna-header">
                <div>
                  <p className="product-qna-eyebrow">PRODUCT Q&A</p>
                  <h2>상품문의</h2>
                  <strong className="product-qna-count">
                    {qnaTotalElements}건
                  </strong>
                  <span>
                    상품에 대해 궁금한 점을 남겨주세요. 답변이 등록된 문의는
                    수정·삭제할 수 없습니다.
                  </span>
                </div>

                <button
                  type="button"
                  className="product-qna-write-button"
                  onClick={handleOpenQnaForm}
                >
                  문의 작성
                </button>
              </div>

              {qnaFormOpen && (
                <div className="product-qna-form">
                  <div className="product-qna-form-title">
                    <strong>
                      {editingQnaId !== null ? "문의 수정" : "상품 문의 작성"}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        setQnaFormOpen(false);
                        resetQnaForm();
                      }}
                    >
                      닫기
                    </button>
                  </div>

                  <label>
                    <span>제목</span>
                    <input
                      type="text"
                      maxLength={255}
                      value={qnaTitle}
                      onChange={(event) => setQnaTitle(event.target.value)}
                      placeholder="문의 제목을 입력해주세요."
                    />
                  </label>

                  <label>
                    <span>내용</span>
                    <textarea
                      value={qnaContent}
                      onChange={(event) => setQnaContent(event.target.value)}
                      placeholder="상품에 대해 궁금한 내용을 입력해주세요."
                      rows={7}
                    />
                  </label>

                  <div className="product-qna-form-bottom">
                    <label className="product-qna-secret-check">
                      <input
                        type="checkbox"
                        checked={qnaSecret}
                        onChange={(event) => setQnaSecret(event.target.checked)}
                      />
                      <span>비밀글로 작성</span>
                    </label>

                    <button
                      type="button"
                      className="product-qna-submit-button"
                      disabled={qnaSaving}
                      onClick={handleSaveQna}
                    >
                      {qnaSaving
                        ? "저장 중..."
                        : editingQnaId !== null
                          ? "문의 수정"
                          : "문의 등록"}
                    </button>
                  </div>
                </div>
              )}

              <div className="product-qna-list-head">
                <span>상태</span>
                <span>문의 내용</span>
                <span>작성자</span>
                <span>작성일</span>
              </div>

              {qnaLoading ? (
                <div className="product-qna-empty">
                  상품 문의를 불러오는 중입니다.
                </div>
              ) : qnaError ? (
                <div className="product-qna-empty">
                  <p>{qnaError}</p>
                  <button type="button" onClick={() => loadProductQna(qnaPage)}>
                    다시 불러오기
                  </button>
                </div>
              ) : qnaList.length === 0 ? (
                <div className="product-qna-empty">
                  <strong>등록된 상품 문의가 없습니다.</strong>
                  <p>이 상품에 대해 궁금한 점을 가장 먼저 남겨보세요.</p>
                </div>
              ) : (
                <div className="product-qna-list">
                  {qnaList.map((qna) => {
                    const readable = canReadQna(qna);
                    const opened = openedQnaId === qna.id;
                    const isMine = sw && qna.memberId === memberId;
                    const waiting = qna.status === "WAITING";

                    return (
                      <article
                        key={qna.id}
                        className={`product-qna-item ${opened ? "open" : ""}`}
                      >
                        <button
                          type="button"
                          className="product-qna-row"
                          onClick={() => {
                            if (!readable) {
                              openAlert(
                                "비밀문의는 작성자 본인만 확인할 수 있습니다.",
                              );
                              return;
                            }

                            setOpenedQnaId(opened ? null : qna.id);
                          }}
                        >
                          <span
                            className={`product-qna-status ${
                              qna.status === "ANSWERED" ? "answered" : ""
                            }`}
                          >
                            {qna.status === "ANSWERED"
                              ? "답변완료"
                              : "답변대기"}
                          </span>

                          <span className="product-qna-row-title">
                            {qna.secret === "Y" && (
                              <span className="product-qna-lock">비밀</span>
                            )}
                            {readable ? qna.title : "비밀글입니다."}
                          </span>

                          <span>{maskNickname(qna.memberNickname)}</span>
                          <span>{formatQnaDate(qna.createdAt)}</span>
                        </button>

                        {opened && readable && (
                          <div className="product-qna-detail">
                            <div className="product-qna-question">
                              <span>Q</span>
                              <p>{qna.content}</p>
                            </div>

                            {qna.answer ? (
                              <div className="product-qna-answer">
                                <span>A</span>
                                <div>
                                  <strong>GODDESS</strong>
                                  <p>{qna.answer}</p>
                                  <small>{formatQnaDate(qna.answerDate)}</small>
                                </div>
                              </div>
                            ) : (
                              <div className="product-qna-waiting">
                                아직 답변이 등록되지 않았습니다.
                              </div>
                            )}

                            {isMine && waiting && (
                              <div className="product-qna-actions">
                                <button
                                  type="button"
                                  onClick={() => handleEditQna(qna)}
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQna(qna)}
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {!qnaLoading && !qnaError && qnaTotalPages > 1 && (
                <nav
                  className="product-qna-pagination"
                  aria-label="상품 문의 페이지"
                >
                  <button
                    type="button"
                    disabled={qnaPage === 0}
                    onClick={() => changeQnaPage(qnaPage - 1)}
                  >
                    ‹
                  </button>

                  {Array.from({ length: qnaTotalPages }, (_, index) => index)
                    .filter(
                      (page) =>
                        page === 0 ||
                        page === qnaTotalPages - 1 ||
                        Math.abs(page - qnaPage) <= 2,
                    )
                    .map((page, index, pages) => {
                      const previous = pages[index - 1];

                      return (
                        <span key={page}>
                          {previous !== undefined && page - previous > 1 && (
                            <i>…</i>
                          )}

                          <button
                            type="button"
                            className={qnaPage === page ? "active" : ""}
                            onClick={() => changeQnaPage(page)}
                          >
                            {page + 1}
                          </button>
                        </span>
                      );
                    })}

                  <button
                    type="button"
                    disabled={qnaPage === qnaTotalPages - 1}
                    onClick={() => changeQnaPage(qnaPage + 1)}
                  >
                    ›
                  </button>
                </nav>
              )}
            </section>
          )}

          {activeTab === "delivery" && (
            <div className="product-detail-placeholder">
              무료배송 · 상품 수령 후 7일 이내 교환 및 반품 가능
            </div>
          )}
        </div>
      </section>

      {cartModalOpen && (
        <div
          className="product-cart-modal-overlay"
          onClick={() => setCartModalOpen(false)}
        >
          <div
            className="product-cart-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-cart-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="product-cart-modal-label">SHOPPING BAG</p>

            <h2 id="product-cart-modal-title">장바구니에 상품이 담겼습니다.</h2>

            <span>선택한 상품을 장바구니에서 확인해보세요.</span>

            <div className="product-cart-modal-option">
              <small>SELECTED OPTION</small>

              <strong>
                {addedCartSelections.length === 1
                  ? `${addedCartSelections[0].colorName} / ${addedCartSelections[0].sizeName} · ${addedCartSelections[0].quantity}개`
                  : `선택 옵션 ${addedCartSelections.length}개`}
              </strong>
            </div>

            <div className="product-cart-modal-actions">
              <button
                type="button"
                className="product-cart-modal-close"
                onClick={() => setCartModalOpen(false)}
              >
                계속 쇼핑하기
              </button>

              <button
                type="button"
                className="product-cart-modal-go"
                onClick={() => navigate("/cart")}
              >
                장바구니 바로가기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductDetail;
