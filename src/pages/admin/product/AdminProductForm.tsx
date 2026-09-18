import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { axiosInstance } from "../../../components/ToolBak";
import "../../../styles/admin/AdminProductForm.css";

type ProductForm = {
  brand: string;
  name: string;
  mainCategoryId: string;
  categoryId: string;
  price: string;
  discount: string;
  description: string;
  usageInfo: string;
  productType: string;
  volume: string;
  skinType: string;
  personalColor: string;
  aiApplyEnabled: string;
  status: string;
};

type ProductImageForm = {
  id: number;
  file?: File;
  fileName: string;
  filePath?: string;
  imageType: "THUMBNAIL" | "DETAIL";
  isMain?: string;
  sortOrder?: number;
};

type ProductColorForm = {
  id: number;
  backendId?: number;
  masterColorId?: number;
  colorName: string;
  colorCode: string;
  images: ProductImageForm[];
};

type ProductVariantForm = {
  id: number;
  backendId?: number;
  variantName: string;
  variantDescription: string;
};

type ProductOptionForm = {
  id?: number;
  colorId: number;
  sizeId: number;
  stock: number;
  addPrice: number;
};

type ProductDetailResponse = {
  id?: number;
  productId?: number;
  categoryId?: number;
  parentCategoryId?: number | null;
  category?: {
    id?: number;
    categoryId?: number;
    parentId?: number | null;
    parent?: {
      id?: number;
      categoryId?: number;
    } | null;
  } | null;
  brand?: string;
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
};

type IdResponse = {
  id: number;
};

type ProductColorInfoResponse = {
  id: number;
  colorName: string;
  colorCode: string;
  baseColorGroup?: string;
};

type ColorExtractionState = {
  imageId?: number;
  extractedHex: string;
  nearestMaster?: ProductColorInfoResponse;
  detectedBaseColorGroup: string;
  newColorName: string;
  extracting: boolean;
  saving: boolean;
  message: string;
};

type HoverColorPreview = {
  imageId: number;
  hex: string;
  x: number;
  y: number;
};

type CategoryResponse = {
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

type ProductColorImageResponse = {
  id: number;
  fileSaved: string;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
};

type ProductColorResponse = {
  id: number;
  colorId: number;
  colorName: string;
  colorCode: string;
  isMain: string;
  sortOrder: number;
  aiApplyEnabled: string;
  visible: string;
  images: ProductColorImageResponse[];
};

type ProductVariantResponse = {
  id: number;
  variantName: string;
  variantDescription?: string;
  visible: string;
  sortOrder: number;
};

type ProductOptionResponse = {
  id: number;
  productColorId: number;
  productVariantId: number;
  stock: number;
  addPrice: number;
  visible: string;
};

const SKIN_TYPE_OPTIONS = [
  "건성",
  "지성",
  "복합성",
  "중성",
  "민감성",
] as const;

const PERSONAL_COLOR_OPTIONS = [
  "봄웜",
  "여름쿨",
  "가을웜",
  "겨울쿨",
] as const;

const SKIN_TYPE_PRODUCT_TYPES = [
  "BASE",
  "SKINCARE",
];

const PERSONAL_COLOR_PRODUCT_TYPES = [
  "BASE",
  "LIP",
  "EYE",
  "BLUSH",
  "BROW",
];

const BASE_COLOR_GROUP_OPTIONS = [
  "RED",
  "PINK",
  "ROSE",
  "CORAL",
  "BERRY",
  "MAUVE",
  "BRICK",
  "NUDE",
  "BROWN",
  "ORANGE",
  "PURPLE",
  "BLACK",
  "WHITE",
  "BEIGE",
  "CLEAR",
] as const;

const BASE_COLOR_GROUP_ANCHORS: Record<
  Exclude<(typeof BASE_COLOR_GROUP_OPTIONS)[number], "CLEAR">,
  string
> = {
  RED: "#C83A3A",
  PINK: "#E58AA2",
  ROSE: "#B85F72",
  CORAL: "#E97D68",
  BERRY: "#8F3F59",
  MAUVE: "#9D7286",
  BRICK: "#A65443",
  NUDE: "#C79A81",
  BROWN: "#765346",
  ORANGE: "#D9793D",
  PURPLE: "#76507F",
  BLACK: "#1D1A19",
  WHITE: "#F2EEE9",
  BEIGE: "#D7B391",
};

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();

  const isEdit = Boolean(productId);

  // 관리자 목록에서 전달된 검색/카테고리/page 조건을 그대로 유지한다.
  const returnQueryString = searchParams.toString();
  const productListUrl = returnQueryString
    ? `/admin/products?${returnQueryString}`
    : "/admin/products";

  const [product, setProduct] = useState<ProductForm>({
    brand: "",
    name: "",
    mainCategoryId: "",
    categoryId: "",
    price: "",
    discount: "0",
    description: "",
    usageInfo: "",
    productType: "",
    volume: "",
    skinType: "",
    personalColor: "",
    aiApplyEnabled: "Y",
    status: "ON_SALE",
  });

  const [masterColors, setMasterColors] = useState<ProductColorInfoResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // CATEGORY 테이블에서 대분류/하위분류를 동적으로 계산
  const mainCategories = useMemo(
    () =>
      categories
        .filter((category) => {
          const parentId =
            category.parentId ??
            category.parent?.categoryId ??
            category.parent?.id ??
            null;

          return parentId == null && category.visible !== "N";
        })
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const subCategories = useMemo(() => {
    if (!product.mainCategoryId) {
      return [];
    }

    const selectedMainId = Number(product.mainCategoryId);

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
  }, [categories, product.mainCategoryId]);

  const selectedMainCategory = useMemo(() => {
    if (!product.mainCategoryId) {
      return null;
    }

    const selectedMainId = Number(product.mainCategoryId);

    return (
      mainCategories.find(
        (category) =>
          (category.categoryId ?? category.id ?? 0) === selectedMainId
      ) ?? null
    );
  }, [mainCategories, product.mainCategoryId]);

  const hasSubCategories = subCategories.length > 0;

  // 상품 유형에 따라 필요한 추천 필터만 노출한다.
  // BASE(쿠션/파운데이션 등): 피부 타입 + 퍼스널컬러
  // SKINCARE: 피부 타입
  // LIP/EYE/BLUSH/BROW: 퍼스널컬러
  // 그 외: 둘 다 사용하지 않음
  const needsSkinType = SKIN_TYPE_PRODUCT_TYPES.includes(
    product.productType
  );

  const needsPersonalColor = PERSONAL_COLOR_PRODUCT_TYPES.includes(
    product.productType
  );

  const selectedSkinTypes = useMemo(
    () =>
      product.skinType
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [product.skinType]
  );

  const selectedPersonalColors = useMemo(
    () =>
      product.personalColor
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [product.personalColor]
  );

  const [colors, setColors] = useState<ProductColorForm[]>([
    {
      id: Date.now(),
      colorName: "",
      colorCode: "",
      images: [],
    },
  ]);

  const [sizes, setSizes] = useState<ProductVariantForm[]>([
    {
      id: Date.now() + 1,
      variantName: "기본",
      variantDescription: "",
    },
  ]);

  const [options, setOptions] = useState<ProductOptionForm[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 수정 화면에서 삭제한 기존 DB 데이터는 "수정 저장"할 때 실제 반영한다.
  const [deletedSizeIds, setDeletedSizeIds] = useState<number[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [deletedColors, setDeletedColors] = useState<ProductColorForm[]>([]);

  // 색상별 이미지 클릭 추출 결과.
  // DB 저장 전까지는 화면 상태로만 유지하고, 관리자가 직접 선택/등록을 확정한다.
  const [colorExtractions, setColorExtractions] = useState<
    Record<number, ColorExtractionState>
  >({});

  // 썸네일 위에서 마우스를 움직일 때 현재 픽셀 색상을 실시간 미리보기한다.
  // 클릭 시에는 기존 9x9 평균 색상 추출 로직이 그대로 실행된다.
  const [hoverColor, setHoverColor] = useState<HoverColorPreview | null>(null);

  // 기존 서버 이미지도 hover 색상 추출이 가능하도록 이미지를 한 번만 Blob으로 로드해 캐시한다.
  const hoverImageCacheRef = useRef<Map<number, Promise<HTMLImageElement>>>(
    new Map()
  );
  const hoverObjectUrlCacheRef = useRef<Map<number, string>>(new Map());
  const hoverRequestRef = useRef(0);

  useEffect(() => {
    return () => {
      hoverObjectUrlCacheRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      hoverObjectUrlCacheRef.current.clear();
      hoverImageCacheRef.current.clear();
    };
  }, []);

  /**
   * 상품 기본정보 변경
   */
  const handleProductChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setProduct((prev) => {
      const next: ProductForm = {
        ...prev,
        [name]: value,

        // 대분류가 바뀌면 이전 하위 카테고리 선택값은 초기화.
        ...(name === "mainCategoryId"
          ? { categoryId: "" }
          : {}),
      };

      // 상품 유형을 변경했을 때 더 이상 사용하지 않는 추천값은
      // 화면에서만 숨기지 않고 실제 state에서도 비운다.
      // 저장 시 빈 문자열은 null로 전송된다.
      if (name === "productType") {
        if (!SKIN_TYPE_PRODUCT_TYPES.includes(value)) {
          next.skinType = "";
        }

        if (!PERSONAL_COLOR_PRODUCT_TYPES.includes(value)) {
          next.personalColor = "";
        }
      }

      return next;
    });
  };


  /**
   * 추천 피부 타입 / 퍼스널컬러 복수 선택
   *
   * DB 구조는 그대로 유지하고
   * "건성,복합성", "봄웜,여름쿨" 형태의 문자열로 저장한다.
   */
  const toggleCommaValue = (
    field: "skinType" | "personalColor",
    value: string
  ) => {
    setProduct((prev) => {
      const currentValues = (prev[field] ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [field]: nextValues.join(","),
      };
    });
  };

  const normalizeHex = (value: string) => value.trim().toUpperCase();

  const hexToRgb = (hex: string) => {
    const normalized = normalizeHex(hex).replace("#", "");

    if (!/^[0-9A-F]{6}$/.test(normalized)) {
      return null;
    }

    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b]
      .map((value) =>
        Math.max(0, Math.min(255, Math.round(value)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
      .toUpperCase()}`;

  const detectBaseColorGroup = (hex: string) => {
    const target = hexToRgb(hex);

    if (!target) {
      return "";
    }

    let nearestGroup = "";
    let nearestDistance = Number.POSITIVE_INFINITY;

    Object.entries(BASE_COLOR_GROUP_ANCHORS).forEach(([group, anchorHex]) => {
      const anchor = hexToRgb(anchorHex);
      if (!anchor) return;

      const distance = Math.sqrt(
        (target.r - anchor.r) ** 2 +
        (target.g - anchor.g) ** 2 +
        (target.b - anchor.b) ** 2
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestGroup = group;
      }
    });

    return nearestGroup;
  };

  const findNearestMasterColor = (hex: string) => {
    const target = hexToRgb(hex);

    if (!target || masterColors.length === 0) {
      return undefined;
    }

    let nearest: ProductColorInfoResponse | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    masterColors.forEach((masterColor) => {
      const rgb = hexToRgb(masterColor.colorCode);
      if (!rgb) return;

      const distance = Math.sqrt(
        (target.r - rgb.r) ** 2 +
        (target.g - rgb.g) ** 2 +
        (target.b - rgb.b) ** 2
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = masterColor;
      }
    });

    return nearest;
  };

  const setExtractionState = (
    colorId: number,
    patch: Partial<ColorExtractionState>
  ) => {
    setColorExtractions((prev) => ({
      ...prev,
      [colorId]: {
        ...(prev[colorId] ?? {
          extractedHex: "",
          detectedBaseColorGroup: "",
          newColorName: "",
          extracting: false,
          saving: false,
          message: "",
        }),
        ...patch,
      },
    }));
  };

  /**
   * hover 색상 미리보기에 사용할 원본 이미지를 준비한다.
   * - 새로 업로드한 파일: object URL 사용
   * - 기존 서버 이미지: axios로 Blob을 받아 object URL 사용
   * - 같은 이미지는 한 번만 로드하고 캐시한다.
   */
  const getHoverSourceImage = (
    image: ProductImageForm
  ): Promise<HTMLImageElement> => {
    const cached = hoverImageCacheRef.current.get(image.id);

    if (cached) {
      return cached;
    }

    const promise = (async () => {
      let objectUrl = "";

      try {
        if (image.file) {
          objectUrl = URL.createObjectURL(image.file);
        } else if (image.filePath) {
          const response = await axiosInstance.get<Blob>(image.filePath, {
            responseType: "blob",
          });

          objectUrl = URL.createObjectURL(response.data);
        } else {
          throw new Error("색상을 확인할 이미지 파일을 찾을 수 없습니다.");
        }

        const sourceImage = await new Promise<HTMLImageElement>(
          (resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = () =>
              reject(new Error("이미지를 불러오지 못했습니다."));
            img.src = objectUrl;
          }
        );

        hoverObjectUrlCacheRef.current.set(image.id, objectUrl);

        return sourceImage;
      } catch (error) {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }

        hoverImageCacheRef.current.delete(image.id);
        throw error;
      }
    })();

    hoverImageCacheRef.current.set(image.id, promise);

    return promise;
  };

  /**
   * 썸네일 위의 현재 마우스 위치 색상을 실시간으로 보여준다.
   * object-fit: cover로 잘린 영역까지 고려하여 화면 좌표를 원본 이미지 좌표로 환산한다.
   */
  const handleColorHover = async (
    image: ProductImageForm,
    event: React.MouseEvent<HTMLImageElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const hoverX = event.clientX - rect.left;
    const hoverY = event.clientY - rect.top;
    const tooltipX = event.clientX + 16;
    const tooltipY = event.clientY + 16;

    const requestId = ++hoverRequestRef.current;

    try {
      const sourceImage = await getHoverSourceImage(image);

      if (requestId !== hoverRequestRef.current) {
        return;
      }

      const naturalWidth = sourceImage.naturalWidth;
      const naturalHeight = sourceImage.naturalHeight;

      if (!naturalWidth || !naturalHeight) {
        return;
      }

      const scale = Math.max(
        rect.width / naturalWidth,
        rect.height / naturalHeight
      );
      const renderedWidth = naturalWidth * scale;
      const renderedHeight = naturalHeight * scale;
      const cropX = (renderedWidth - rect.width) / 2;
      const cropY = (renderedHeight - rect.height) / 2;

      const sourceX = Math.max(
        0,
        Math.min(
          naturalWidth - 1,
          Math.round((hoverX + cropX) / scale)
        )
      );
      const sourceY = Math.max(
        0,
        Math.min(
          naturalHeight - 1,
          Math.round((hoverY + cropY) / scale)
        )
      );

      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        1,
        1,
        0,
        0,
        1,
        1
      );

      const pixel = context.getImageData(0, 0, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

      setHoverColor({
        imageId: image.id,
        hex,
        x: tooltipX,
        y: tooltipY,
      });
    } catch (error) {
      console.error("색상 hover 미리보기 오류:", error);

      if (requestId === hoverRequestRef.current) {
        setHoverColor(null);
      }
    }
  };

  const clearColorHover = () => {
    hoverRequestRef.current += 1;
    setHoverColor(null);
  };

  /**
   * 상품 이미지 클릭 지점 주변(9x9)의 평균 색상을 HEX로 추출한다.
   * - 새로 선택한 로컬 파일과 기존 서버 이미지 모두 지원
   * - 클릭 즉시 DB에 저장하지 않고, 화면에 결과만 보여준다.
   */
  const extractColorFromImage = async (
    colorId: number,
    image: ProductImageForm,
    event: React.MouseEvent<HTMLImageElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    setExtractionState(colorId, {
      imageId: image.id,
      extracting: true,
      message: "색상을 추출하는 중입니다...",
    });

    let objectUrl = "";

    try {
      if (image.file) {
        objectUrl = URL.createObjectURL(image.file);
      } else if (image.filePath) {
        const response = await axiosInstance.get<Blob>(image.filePath, {
          responseType: "blob",
        });
        objectUrl = URL.createObjectURL(response.data);
      } else {
        throw new Error("색상을 추출할 이미지 파일을 찾을 수 없습니다.");
      }

      const sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
        img.src = objectUrl;
      });

      const naturalWidth = sourceImage.naturalWidth;
      const naturalHeight = sourceImage.naturalHeight;

      if (!naturalWidth || !naturalHeight || !rect.width || !rect.height) {
        throw new Error("이미지 크기 정보를 확인할 수 없습니다.");
      }

      // 미리보기는 object-fit: cover이므로 화면에서 잘린 영역까지 고려해
      // 클릭 위치를 원본 이미지 좌표로 환산한다.
      const scale = Math.max(
        rect.width / naturalWidth,
        rect.height / naturalHeight
      );
      const renderedWidth = naturalWidth * scale;
      const renderedHeight = naturalHeight * scale;
      const cropX = (renderedWidth - rect.width) / 2;
      const cropY = (renderedHeight - rect.height) / 2;

      const sourceX = Math.max(
        0,
        Math.min(
          naturalWidth - 1,
          Math.round((clickX + cropX) / scale)
        )
      );
      const sourceY = Math.max(
        0,
        Math.min(
          naturalHeight - 1,
          Math.round((clickY + cropY) / scale)
        )
      );

      const canvas = document.createElement("canvas");
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("색상 추출용 Canvas를 생성하지 못했습니다.");
      }

      context.drawImage(sourceImage, 0, 0, naturalWidth, naturalHeight);

      const radius = 4;
      const startX = Math.max(0, sourceX - radius);
      const startY = Math.max(0, sourceY - radius);
      const sampleWidth = Math.min(naturalWidth - startX, radius * 2 + 1);
      const sampleHeight = Math.min(naturalHeight - startY, radius * 2 + 1);
      const pixels = context.getImageData(
        startX,
        startY,
        sampleWidth,
        sampleHeight
      ).data;

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 32) continue;
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count += 1;
      }

      if (count === 0) {
        throw new Error("선택한 지점에서 유효한 색상을 찾지 못했습니다.");
      }

      const extractedHex = rgbToHex(r / count, g / count, b / count);
      const detectedBaseColorGroup = detectBaseColorGroup(extractedHex);
      const nearestMaster = findNearestMasterColor(extractedHex);
      const exactMaster = masterColors.find(
        (masterColor) =>
          normalizeHex(masterColor.colorCode) === normalizeHex(extractedHex)
      );

      setExtractionState(colorId, {
        imageId: image.id,
        extractedHex,
        nearestMaster: exactMaster ?? nearestMaster,
        detectedBaseColorGroup,
        extracting: false,
        saving: false,
        message: exactMaster
          ? `같은 HEX를 쓰는 '${exactMaster.colorName}'이 있습니다. 공식 색상명이 다르면 새 색상으로 등록할 수 있습니다.`
          : "추출 완료. 공식 색상명을 입력하고 베이스 계열을 확인한 뒤 등록하세요.",
      });
    } catch (error) {
      console.error("상품 이미지 색상 추출 오류", error);
      setExtractionState(colorId, {
        extracting: false,
        message:
          error instanceof Error
            ? error.message
            : "이미지에서 색상을 추출하지 못했습니다.",
      });
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  /**
   * 추출된 색상과 가장 가까운 기존 PRODUCT_COLOR_MASTER를 사용한다.
   */
  const applyNearestMasterColor = (colorId: number) => {
    const extraction = colorExtractions[colorId];
    const nearestMaster = extraction?.nearestMaster;

    if (!nearestMaster) {
      alert("사용할 기존 마스터 색상이 없습니다.");
      return;
    }

    changeColor(colorId, nearestMaster.id);
    setExtractionState(colorId, {
      message: `기존 마스터 색상 '${nearestMaster.colorName}'을 선택했습니다.`,
    });
  };

  /**
   * 추출된 HEX를 PRODUCT_COLOR_MASTER에 새 색상으로 저장한다.
   * 동일 HEX가 이미 있으면 중복 INSERT하지 않고 기존 색상을 사용한다.
   */
  const saveExtractedMasterColor = async (colorId: number) => {
    const extraction = colorExtractions[colorId];

    if (!extraction?.extractedHex) {
      alert("먼저 상품 이미지에서 색상을 추출해주세요.");
      return;
    }

    const colorName = extraction.newColorName.trim();
    if (!colorName) {
      alert("새 색상명을 입력해주세요.");
      return;
    }

    const sameMaster = masterColors.find(
      (masterColor) =>
        masterColor.colorName.trim().toLowerCase() === colorName.toLowerCase() &&
        normalizeHex(masterColor.colorCode) ===
          normalizeHex(extraction.extractedHex)
    );

    if (sameMaster) {
      changeColor(colorId, sameMaster.id);
      setExtractionState(colorId, {
        saving: false,
        message: `같은 색상명과 HEX가 이미 있어 '${sameMaster.colorName}'을 사용했습니다.`,
      });
      return;
    }

    try {
      setExtractionState(colorId, { saving: true, message: "새 색상을 등록하는 중입니다..." });

      const response = await axiosInstance.post<ProductColorInfoResponse>(
        "/product_color_master/save",
        {
          colorName,
          colorCode: extraction.extractedHex,
          baseColorGroup: extraction.detectedBaseColorGroup || null,
        }
      );

      const saved = response.data;

      if (!saved?.id) {
        throw new Error("새 색상 등록 후 색상번호를 받지 못했습니다.");
      }

      setMasterColors((prev) => [...prev, saved]);

      setColors((prev) =>
        prev.map((color) =>
          color.id === colorId
            ? {
                ...color,
                masterColorId: saved.id,
                colorName: saved.colorName,
                colorCode: saved.colorCode,
              }
            : color
        )
      );

      setExtractionState(colorId, {
        nearestMaster: saved,
        detectedBaseColorGroup:
          saved.baseColorGroup ?? extraction.detectedBaseColorGroup,
        saving: false,
        message: `새 마스터 색상 '${saved.colorName}'을 등록하고 선택했습니다.`,
      });
    } catch (error) {
      console.error("새 마스터 색상 등록 오류", error);
      setExtractionState(colorId, {
        saving: false,
        message:
          error instanceof Error
            ? error.message
            : "새 마스터 색상을 등록하지 못했습니다.",
      });
    }
  };

  /**
   * 색상 추가
   */
  const addColor = () => {
    setColors((prev) => [
      ...prev,
      {
        id: Date.now(),
        colorName: "",
        colorCode: "",
        images: [],
      },
    ]);
  };

  /**
   * COLOR 테이블에서 색상 선택
   */
  const changeColor = (id: number, masterColorId: number) => {
    const selected = masterColors.find((color) => color.id === masterColorId);

    setColors((prev) =>
      prev.map((color) =>
        color.id === id
          ? {
              ...color,
              masterColorId: selected?.id,
              colorName: selected?.colorName ?? "",
              colorCode: selected?.colorCode ?? "",
            }
          : color
      )
    );
  };

  /**
   * 색상 삭제
   */
  const removeColor = (id: number) => {
    const targetColor = colors.find((color) => color.id === id);

    if (targetColor?.backendId) {
      setDeletedColors((prev) =>
        prev.some((color) => color.backendId === targetColor.backendId)
          ? prev
          : [...prev, targetColor]
      );

      const existingImageIds = targetColor.images
        .filter((image) => !image.file && image.id)
        .map((image) => image.id);

      setDeletedImageIds((prev) =>
        Array.from(new Set([...prev, ...existingImageIds]))
      );
    }

    setColors((prev) =>
      prev.filter((color) => color.id !== id)
    );

    setOptions((prev) =>
      prev.filter((option) => option.colorId !== id)
    );

    setColorExtractions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  /**
   * 이미지 선택
   * THUMBNAIL = 상품 목록/상세 상단 갤러리
   * DETAIL = 상품 상세 설명 영역
   */
  const changeImages = (
    id: number,
    imageType: "THUMBNAIL" | "DETAIL",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    const imageForms: ProductImageForm[] = files.map((file, index) => {
      const dotIndex = file.name.lastIndexOf(".");
      const originalName =
        dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;

      return {
        id: Date.now() + index,
        file,
        fileName: originalName,
        imageType,
      };
    });

    setColors((prev) =>
      prev.map((color) =>
        color.id === id
          ? {
              ...color,
              images: [...color.images, ...imageForms],
            }
          : color
      )
    );

    event.target.value = "";
  };

  const removeImage = (colorId: number, imageId: number) => {
    const targetColor = colors.find((color) => color.id === colorId);
    const targetImage = targetColor?.images.find((image) => image.id === imageId);

    // 새로 선택한 로컬 파일은 화면에서만 제거.
    // 기존 DB 이미지는 수정 저장 시 DELETE API를 호출한다.
    if (targetImage && !targetImage.file && targetImage.filePath) {
      setDeletedImageIds((prev) =>
        prev.includes(imageId) ? prev : [...prev, imageId]
      );
    }

    setColors((prev) =>
      prev.map((color) =>
        color.id === colorId
          ? {
              ...color,
              images: color.images.filter((image) => image.id !== imageId),
            }
          : color
      )
    );
  };

  /**
   * 이미지 저장 이름 변경
   */
  const changeImageFileName = (
    colorId: number,
    imageId: number,
    fileName: string
  ) => {
    setColors((prev) =>
      prev.map((color) =>
        color.id === colorId
          ? {
              ...color,
              images: color.images.map((image) =>
                image.id === imageId
                  ? {
                      ...image,
                      fileName,
                    }
                  : image
              ),
            }
          : color
      )
    );
  };

  /**
   * 옵션 추가
   */
  const addSize = () => {
    setSizes((prev) => [
      ...prev,
      {
        id: Date.now(),
        variantName: "",
        variantDescription: "",
      },
    ]);
  };

  /**
   * 옵션 변경
   */
  const changeSize = (
    id: number,
    field: "variantName" | "variantDescription",
    value: string
  ) => {
    setSizes((prev) =>
      prev.map((size) =>
        size.id === id
          ? {
              ...size,
              [field]: value,
            }
          : size
      )
    );
  };

  /**
   * 옵션 삭제
   */
  const removeSize = (id: number) => {
    const targetSize = sizes.find((size) => size.id === id);

    // 기존 DB 옵션는 바로 삭제하지 않고 "수정 저장"할 때 삭제한다.
    if (targetSize?.backendId) {
      setDeletedSizeIds((prev) =>
        prev.includes(targetSize.backendId!)
          ? prev
          : [...prev, targetSize.backendId!]
      );
    }

    setSizes((prev) =>
      prev.filter((size) => size.id !== id)
    );

    setOptions((prev) =>
      prev.filter((option) => option.sizeId !== id)
    );
  };

  /**
   * 색상 × 판매 옵션 생성
   */
  const generateOptions = () => {
    const generated: ProductOptionForm[] = [];

    colors.forEach((color) => {
      sizes.forEach((size) => {
        const oldOption = options.find(
          (option) =>
            option.colorId === color.id &&
            option.sizeId === size.id
        );

        generated.push(
          oldOption ?? {
            colorId: color.id,
            sizeId: size.id,
            stock: 30,
            addPrice: 0,
          }
        );
      });
    });

    setOptions(generated);
  };

  /**
   * 옵션 변경
   */
  const changeOption = (
    colorId: number,
    sizeId: number,
    field: "stock" | "addPrice",
    value: number
  ) => {
    setOptions((prev) =>
      prev.map((option) =>
        option.colorId === colorId &&
        option.sizeId === sizeId
          ? {
              ...option,
              [field]: value,
            }
          : option
      )
    );
  };

  const findColorName = (id: number) => {
    return (
      colors.find((color) => color.id === id)?.colorName ||
      "색상 미입력"
    );
  };

  const findSizeName = (id: number) => {
    return (
      sizes.find((size) => size.id === id)?.variantName ||
      "규격 미입력"
    );
  };

  /**
   * COLOR 마스터 목록 조회
   */
  useEffect(() => {
    const loadFormMetadata = async () => {
      try {
        const [categoryResponse, colorResponse] = await Promise.all([
          axiosInstance.get<CategoryResponse[]>("/category/find_all"),
          axiosInstance.get<ProductColorInfoResponse[]>(
            "/product_color_master/find_all"
          ),
        ]);

        setCategories(
          categoryResponse.data.map((category) => ({
            ...category,
            categoryId: category.categoryId ?? category.id ?? 0,
            parentId:
              category.parentId ??
              category.parent?.categoryId ??
              category.parent?.id ??
              null,
          }))
        );

        setMasterColors(colorResponse.data);
      } catch (error) {
        console.error("상품 등록 메타데이터 조회 오류", error);
      }
    };

    loadFormMetadata();
  }, []);

  /**
   * 수정 화면 기존 상품 전체정보 조회
   */
  useEffect(() => {
    if (!isEdit || !productId) {
      return;
    }

    const loadEditProduct = async () => {
      try {
        const [productResponse, colorResponse, sizeResponse, optionResponse] =
          await Promise.all([
            axiosInstance.get<ProductDetailResponse>(`/product/${productId}`),
            axiosInstance.get<ProductColorResponse[]>(`/product_color/product/${productId}`),
            axiosInstance.get<ProductVariantResponse[]>(`/product_variant/product/${productId}`),
            axiosInstance.get<ProductOptionResponse[]>(`/product_option/product/${productId}`),
          ]);

        const data = productResponse.data;

        setProduct({
          brand: data.brand ?? "",
          name: data.name ?? "",
          mainCategoryId: String(
            data.parentCategoryId ??
            data.category?.parentId ??
            data.category?.parent?.categoryId ??
            data.category?.parent?.id ??
            data.categoryId ??
            data.category?.categoryId ??
            data.category?.id ??
            ""
          ),
          categoryId:
            data.parentCategoryId ??
            data.category?.parentId ??
            data.category?.parent?.categoryId ??
            data.category?.parent?.id
              ? String(
                  data.categoryId ??
                  data.category?.categoryId ??
                  data.category?.id ??
                  ""
                )
              : "",
          price: String(data.price ?? ""),
          discount: String(data.discount ?? "0"),
          description: data.description ?? "",
          usageInfo: data.usageInfo ?? "",
          productType: data.productType ?? "",
          volume: data.volume ?? "",
          skinType: data.skinType ?? "",
          personalColor: data.personalColor ?? "",
          aiApplyEnabled: data.aiApplyEnabled ?? "Y",
          status: data.status ?? "ON_SALE",
        });

        const loadedColors: ProductColorForm[] =
          colorResponse.data.map((color) => ({
            id: color.id,
            backendId: color.id,
            masterColorId: color.colorId,
            colorName: color.colorName,
            colorCode: color.colorCode,
            images: (color.images ?? []).map((image) => ({
              id: image.id,
              fileName: image.fileSaved.replace(/\.[^/.]+$/, ""),
              filePath: image.filePath,
              imageType:
                image.imageType === "DETAIL" ? "DETAIL" : "THUMBNAIL",
              isMain: image.isMain,
              sortOrder: image.sortOrder,
            })),
          }));

        setColors(loadedColors);

        // 기존 상품에 등록된 옵션가 하나도 없으면
        // 수정 화면에서 기본 규격을 기본으로 생성한다.
        const loadedSizes: ProductVariantForm[] =
          sizeResponse.data.length > 0
            ? sizeResponse.data.map((size) => ({
                id: size.id,
                backendId: size.id,
                variantName: size.variantName,
                variantDescription: size.variantDescription ?? "",
              }))
            : [
                {
                  id: Date.now() + 101,
                  variantName: "기본",
                  variantDescription: "",
                },
              ];

        setSizes(loadedSizes);

        const loadedOptions: ProductOptionForm[] =
          optionResponse.data.map((option) => ({
            id: option.id,
            colorId: option.productColorId,
            sizeId: option.productVariantId,
            stock: option.stock ?? 0,
            addPrice: option.addPrice ?? 0,
          }));

        // 기존 옵션/옵션이 전혀 없는 예전 상품은
        // 현재 등록된 색상 × 기본 규격 조합을 자동 생성하고 재고를 30으로 시작한다.
        if (
          sizeResponse.data.length === 0 &&
          optionResponse.data.length === 0
        ) {
          const defaultOptions: ProductOptionForm[] = [];

          loadedColors.forEach((color) => {
            loadedSizes.forEach((size) => {
              defaultOptions.push({
                colorId: color.id,
                sizeId: size.id,
                stock: 30,
                addPrice: 0,
              });
            });
          });

          setOptions(defaultOptions);
        } else {
          setOptions(loadedOptions);
        }

        setDeletedSizeIds([]);
        setDeletedImageIds([]);
        setDeletedColors([]);

      } catch (error) {
        console.error("상품 수정 데이터 조회 오류", error);
        alert("기존 상품 정보를 불러오지 못했습니다.");
        navigate(productListUrl);
      }
    };

    loadEditProduct();
  }, [isEdit, productId, navigate]);

  const getImagePreviewUrl = (image: ProductImageForm) => {
    if (image.file) {
      return URL.createObjectURL(image.file);
    }

    if (image.filePath) {
      return `http://localhost:9104${image.filePath}`;
    }

    return "";
  };

  /**
   * 상품 전체 등록
   *
   * 저장 순서
   * 1. PRODUCT
   * 2. PRODUCT_COLOR
   * 3. PRODUCT_COLOR_IMAGE
   * 4. PRODUCT_VARIANT
   * 5. PRODUCT_OPTION
   */
  const submitProduct = async () => {
    if (!product.name.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }

    if (!product.brand.trim()) {
      alert("브랜드를 입력해주세요.");
      return;
    }

    if (!product.mainCategoryId) {
      alert("대분류를 선택해주세요.");
      return;
    }

    if (hasSubCategories && !product.categoryId) {
      alert("하위 카테고리를 선택해주세요.");
      return;
    }

    if (!product.price) {
      alert("가격을 입력해주세요.");
      return;
    }

    // 등록/수정 공통 유효성 검사
    if (!isEdit) {
      if (colors.some((color) => !color.masterColorId)) {
        alert("색상을 모두 선택해주세요.");
        return;
      }

      if (sizes.some((size) => !size.variantName.trim())) {
        alert("규격명을 모두 입력해주세요.");
        return;
      }

      if (
        colors.some((color) =>
          color.images.some((image) => image.file && !image.fileName.trim())
        )
      ) {
        alert("이미지 저장 이름을 모두 입력해주세요.");
        return;
      }

      if (options.length === 0) {
        alert("판매 옵션 생성 버튼을 눌러주세요.");
        return;
      }
    }

    try {
      setSubmitting(true);

      const effectiveCategoryId = hasSubCategories
        ? Number(product.categoryId)
        : Number(product.mainCategoryId);

      const productData = {
        categoryId: effectiveCategoryId,
        brand: product.brand.trim(),
        name: product.name.trim(),
        description: (product.description ?? "").trim(),
        price: Number(product.price),
        discount: product.discount || "0",
        usageInfo: (product.usageInfo ?? "").trim(),
        productType: (product.productType ?? "").trim() || null,
        volume: (product.volume ?? "").trim() || null,
        skinType: (product.skinType ?? "").trim() || null,
        personalColor: (product.personalColor ?? "").trim() || null,
        aiApplyEnabled: product.aiApplyEnabled,
        status: product.status,
      };

      // 수정 모드: 상품 + 색상 + 이미지 + 옵션 + 옵션/재고 수정
      if (isEdit && productId) {
        // 수정 화면에서도 색상 선택/옵션명을 반드시 확인한다.
        if (colors.some((color) => !color.masterColorId)) {
          throw new Error("선택되지 않은 색상이 있습니다.");
        }

        if (sizes.some((size) => !size.variantName.trim())) {
          throw new Error("규격명을 모두 입력해주세요.");
        }

        if (
          colors.some((color) =>
            color.images.some((image) => image.file && !image.fileName.trim())
          )
        ) {
          throw new Error("이미지 저장 이름을 모두 입력해주세요.");
        }

        // 1. 상품 기본정보 수정
        await axiosInstance.put(`/product/${productId}`, productData);

        // -------------------------------------------------
        // 삭제 처리
        // -------------------------------------------------

        // 삭제한 기존 이미지는 서버 파일 + DB에서 삭제
        for (const deletedImageId of deletedImageIds) {
          await axiosInstance.delete(`/product_color_image/${deletedImageId}`);
        }

        // 삭제한 기존 옵션는 DB에서 삭제
        // 백엔드 ProductVariantService가 연결된 PRODUCT_OPTION을 먼저 정리한다.
        for (const deletedSizeId of deletedSizeIds) {
          await axiosInstance.delete(`/product_variant/${deletedSizeId}`);
        }

        // 삭제한 기존 색상은 물리 삭제 대신 visible=N 처리한다.
        // 이미지/옵션 FK 충돌 없이 상품 화면에서는 더 이상 노출되지 않는다.
        for (const deletedColor of deletedColors) {
          if (!deletedColor.backendId || !deletedColor.masterColorId) {
            continue;
          }

          await axiosInstance.put(
            `/product_color/${deletedColor.backendId}`,
            {
              colorId: deletedColor.masterColorId,
              isMain: "N",
              sortOrder: 9999,
              aiApplyEnabled: product.aiApplyEnabled,
              visible: "N",
            }
          );
        }

        // -------------------------------------------------
        // 2. 상품 색상 수정 / 신규 추가
        // 화면 color.id -> 실제 PRODUCT_COLOR ID 매핑
        // -------------------------------------------------
        const savedEditColorIdMap = new Map<number, number>();

        for (let index = 0; index < colors.length; index += 1) {
          const color = colors[index];

          if (!color.masterColorId) {
            throw new Error(`색상을 선택해주세요: COLOR ${index + 1}`);
          }

          let actualProductColorId: number;

          // 기존 색상은 PUT
          if (color.backendId) {
            const colorResponse = await axiosInstance.put<ProductColorResponse>(
              `/product_color/${color.backendId}`,
              {
                colorId: color.masterColorId,
                isMain: index === 0 ? "Y" : "N",
                sortOrder: index + 1,
                aiApplyEnabled: product.aiApplyEnabled,
                visible: "Y",
              }
            );

            actualProductColorId = colorResponse.data.id ?? color.backendId;
          } else {
            // 수정 화면에서 새로 추가한 색상은 POST
            const colorResponse = await axiosInstance.post<ProductColorResponse>(
              `/product_color/product/${productId}/save`,
              {
                colorId: color.masterColorId,
                isMain: index === 0 ? "Y" : "N",
                sortOrder: index + 1,
                aiApplyEnabled: product.aiApplyEnabled,
                visible: "Y",
              }
            );

            actualProductColorId = colorResponse.data.id;
          }

          if (!actualProductColorId) {
            throw new Error(`${color.colorName} 색상 저장 후 색상번호를 받지 못했습니다.`);
          }

          savedEditColorIdMap.set(color.id, actualProductColorId);

          // -------------------------------------------------
          // 3. 수정 화면에서 새로 추가한 이미지 업로드
          // 기존 이미지는 그대로 유지하고 새 파일만 추가한다.
          // -------------------------------------------------
          const newImages = color.images.filter((image) => image.file);

          const existingThumbnailCount = color.images.filter(
            (image) => !image.file && image.imageType === "THUMBNAIL"
          ).length;
          const existingDetailCount = color.images.filter(
            (image) => !image.file && image.imageType === "DETAIL"
          ).length;

          let newThumbnailIndex = 0;
          let newDetailIndex = 0;

          for (const image of newImages) {
            if (!image.file) continue;

            const isThumbnail = image.imageType === "THUMBNAIL";
            const typeIndex = isThumbnail ? newThumbnailIndex++ : newDetailIndex++;
            const existingCount = isThumbnail
              ? existingThumbnailCount
              : existingDetailCount;

            const formData = new FormData();
            formData.append("file", image.file);
            formData.append("fileName", image.fileName.trim());
            formData.append(
              "isMain",
              isThumbnail && existingThumbnailCount === 0 && typeIndex === 0
                ? "Y"
                : "N"
            );
            formData.append("imageType", image.imageType);
            formData.append("sortOrder", String(existingCount + typeIndex + 1));

            await axiosInstance.post(
              `/product_color_image/product_color/${actualProductColorId}/save`,
              formData
            );
          }
        }

        // -------------------------------------------------
        // 4. 옵션 수정 / 신규 추가
        // 화면 size.id -> 실제 PRODUCT_VARIANT ID 매핑
        // -------------------------------------------------
        const savedEditSizeIdMap = new Map<number, number>();

        for (let index = 0; index < sizes.length; index += 1) {
          const size = sizes[index];

          let actualProductVariantId: number;

          if (size.backendId) {
            const sizeResponse = await axiosInstance.put<ProductVariantResponse>(
              `/product_variant/${size.backendId}`,
              {
                variantName: size.variantName.trim(),
                variantDescription: size.variantDescription.trim(),
                visible: "Y",
                sortOrder: index + 1,
              }
            );

            actualProductVariantId = sizeResponse.data.id ?? size.backendId;
          } else {
            const sizeResponse = await axiosInstance.post<ProductVariantResponse>(
              `/product_variant/product/${productId}/save`,
              {
                variantName: size.variantName.trim(),
                variantDescription: size.variantDescription.trim(),
                visible: "Y",
                sortOrder: index + 1,
              }
            );

            actualProductVariantId = sizeResponse.data.id;
          }

          if (!actualProductVariantId) {
            throw new Error(`${size.variantName} 규격 저장 후 규격번호를 받지 못했습니다.`);
          }

          savedEditSizeIdMap.set(size.id, actualProductVariantId);
        }

        // -------------------------------------------------
        // 5. 옵션 수정 / 신규 추가
        // 임시 color/size ID를 실제 DB ID로 치환한다.
        // -------------------------------------------------
        for (const option of options) {
          const actualProductColorId =
            savedEditColorIdMap.get(option.colorId) ?? option.colorId;
          const actualProductVariantId =
            savedEditSizeIdMap.get(option.sizeId) ?? option.sizeId;

          if (option.id) {
            await axiosInstance.put(
              `/product_option/${option.id}`,
              {
                productColorId: actualProductColorId,
                productVariantId: actualProductVariantId,
                addPrice: option.addPrice,
                stock: option.stock,
                visible: "Y",
              }
            );
          } else {
            await axiosInstance.post(
              `/product_option/product/${productId}/save`,
              {
                productColorId: actualProductColorId,
                productVariantId: actualProductVariantId,
                addPrice: option.addPrice,
                stock: option.stock,
                visible: "Y",
              }
            );
          }
        }

        // -------------------------------------------------
        // 6. 저장 후 서버에서 다시 조회해서 실제 반영 여부 확인
        // 조회까지 성공해야 '수정 완료'를 표시한다.
        // -------------------------------------------------
        const [verifyProduct, verifyColors, verifySizes, verifyOptions] =
          await Promise.all([
            axiosInstance.get<ProductDetailResponse>(`/product/${productId}`),
            axiosInstance.get<ProductColorResponse[]>(`/product_color/product/${productId}`),
            axiosInstance.get<ProductVariantResponse[]>(`/product_variant/product/${productId}`),
            axiosInstance.get<ProductOptionResponse[]>(`/product_option/product/${productId}`),
          ]);

        if (
          verifyProduct.data.name !== product.name.trim() ||
          verifyProduct.data.brand !== product.brand.trim()
        ) {
          throw new Error("상품 기본정보가 서버에 반영되지 않았습니다.");
        }

        const verifiedVisibleColors = verifyColors.data.filter(
          (color) => color.visible === "Y"
        );

        if (verifiedVisibleColors.length !== colors.length) {
          throw new Error("상품 색상 추가/삭제가 서버에 정확히 반영되지 않았습니다.");
        }

        const verifiedVisibleSizes = verifySizes.data.filter(
          (size) => size.visible === "Y"
        );

        const expectedSizeNames = sizes
          .map((size) => size.variantName.trim())
          .sort()
          .join("|");

        const verifiedSizeNames = verifiedVisibleSizes
          .map((size) => size.variantName.trim())
          .sort()
          .join("|");

        if (expectedSizeNames !== verifiedSizeNames) {
          throw new Error("상품 옵션 추가/수정/삭제가 서버에 정확히 반영되지 않았습니다.");
        }

        if (options.length > 0 && verifyOptions.data.length < options.length) {
          throw new Error("상품 옵션/재고 정보가 서버에 모두 반영되지 않았습니다.");
        }

        alert("상품 수정이 완료되었습니다.");
        navigate(productListUrl);
        return;
      }

      // -------------------------------------------------
      // 0. 선택한 COLOR 마스터 확인
      // -------------------------------------------------
      for (const color of colors) {
        if (!color.masterColorId) {
          throw new Error("선택되지 않은 색상이 있습니다.");
        }
      }

      // -------------------------------------------------
      // 1. 상품 기본정보 저장
      // ProductResponseDto의 PK 필드명은 id
      // -------------------------------------------------
      const productResponse = await axiosInstance.post<IdResponse>(
        "/product/save",
        productData
      );

      const savedProductId = productResponse.data.id;

      if (!savedProductId) {
        throw new Error("상품 등록 후 상품번호를 받지 못했습니다.");
      }

      // 화면에서 사용하는 임시 ID -> DB에 저장된 실제 ID
      const savedColorIdMap = new Map<number, number>();
      const savedSizeIdMap = new Map<number, number>();

      // -------------------------------------------------
      // 2. 상품 색상 저장
      // -------------------------------------------------
      for (let colorIndex = 0; colorIndex < colors.length; colorIndex += 1) {
        const color = colors[colorIndex];

        if (!color.masterColorId) {
          throw new Error(`색상을 선택해주세요: COLOR ${colorIndex + 1}`);
        }

        const colorResponse = await axiosInstance.post<IdResponse>(
          `/product_color/product/${savedProductId}/save`,
          {
            colorId: color.masterColorId,
            isMain: colorIndex === 0 ? "Y" : "N",
            sortOrder: colorIndex + 1,
            aiApplyEnabled: product.aiApplyEnabled,
            visible: "Y",
          }
        );

        const savedProductColorId = colorResponse.data.id;

        if (!savedProductColorId) {
          throw new Error(
            `${color.colorName} 색상 등록 후 색상번호를 받지 못했습니다.`
          );
        }

        savedColorIdMap.set(color.id, savedProductColorId);

        // -------------------------------------------------
        // 3. 색상별 이미지 저장
        // THUMBNAIL: 상품 목록 + 상세 상단 갤러리
        // DETAIL: 상품 상세 설명 영역
        // -------------------------------------------------
        const thumbnailImages = color.images.filter(
          (image) => image.imageType === "THUMBNAIL"
        );
        const detailImages = color.images.filter(
          (image) => image.imageType === "DETAIL"
        );

        const uploadImages = async (
          images: ProductImageForm[],
          imageType: "THUMBNAIL" | "DETAIL"
        ) => {
          for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
            const image = images[imageIndex];
            if (!image.file) continue;

            const formData = new FormData();
            formData.append("file", image.file);
            formData.append("fileName", image.fileName.trim());
            formData.append(
              "isMain",
              imageType === "THUMBNAIL" && imageIndex === 0 ? "Y" : "N"
            );
            formData.append("imageType", imageType);
            formData.append("sortOrder", String(imageIndex + 1));

            await axiosInstance.post(
              `/product_color_image/product_color/${savedProductColorId}/save`,
              formData
            );
          }
        };

        await uploadImages(thumbnailImages, "THUMBNAIL");
        await uploadImages(detailImages, "DETAIL");
      }

      // -------------------------------------------------
      // 4. 상품 옵션 저장
      // -------------------------------------------------
      for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
        const size = sizes[sizeIndex];

        const sizeResponse = await axiosInstance.post<IdResponse>(
          `/product_variant/product/${savedProductId}/save`,
          {
            variantName: size.variantName.trim(),
            variantDescription: size.variantDescription.trim(),
            visible: "Y",
            sortOrder: sizeIndex + 1,
          }
        );

        const savedProductVariantId = sizeResponse.data.id;

        if (!savedProductVariantId) {
          throw new Error(
            `${size.variantName} 규격 등록 후 규격번호를 받지 못했습니다.`
          );
        }

        savedSizeIdMap.set(size.id, savedProductVariantId);
      }

      // -------------------------------------------------
      // 5. 옵션 / 재고 저장
      // -------------------------------------------------
      for (const option of options) {
        const savedProductColorId = savedColorIdMap.get(option.colorId);
        const savedProductVariantId = savedSizeIdMap.get(option.sizeId);

        if (!savedProductColorId || !savedProductVariantId) {
          throw new Error("옵션 저장에 필요한 색상/옵션 번호가 없습니다.");
        }

        await axiosInstance.post(
          `/product_option/product/${savedProductId}/save`,
          {
            productColorId: savedProductColorId,
            productVariantId: savedProductVariantId,
            addPrice: option.addPrice,
            stock: option.stock,
            visible: "Y",
          }
        );
      }

      alert(`상품 등록이 완료되었습니다. 상품번호: ${savedProductId}`);
      navigate(productListUrl);
    } catch (error) {
      console.error("상품 등록 오류", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        console.error("Spring 응답 오류", (error as any).response?.data);
      }

      alert(
        error instanceof Error
          ? error.message
          : "상품 등록 중 오류가 발생했습니다. 콘솔과 Spring 로그를 확인해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalStock = options.reduce((sum, option) => sum + Number(option.stock || 0), 0);
  const salePrice = product.price
    ? Math.round(
        Number(product.price) * (1 - Number(product.discount || 0) / 100)
      )
    : 0;

  return (
    <main className="admin-product-editor-page">
      {hoverColor && (
        <div
          className="admin-color-hover-tooltip"
          style={{
            left: hoverColor.x,
            top: hoverColor.y,
          }}
        >
          <span
            className="admin-color-hover-swatch"
            style={{
              backgroundColor: hoverColor.hex,
            }}
          />
          <strong>{hoverColor.hex}</strong>
        </div>
      )}

      <header className="product-editor-head">
        <div>
          <span className="product-editor-kicker">CATALOG EDITOR</span>
          <h1>{isEdit ? "상품 정보 수정" : "새 상품 만들기"}</h1>
          <p>고객에게 보여질 상품 정보와 판매 구성을 한 번에 설정합니다.</p>
        </div>

        <button
          type="button"
          className="product-editor-back"
          onClick={() => navigate(productListUrl)}
        >
          ← 상품 목록
        </button>
      </header>

      <div className="product-editor-workspace">
        <div className="product-editor-main">
          <section className="editor-block editor-block-identity">
            <div className="editor-block-heading">
              <div>
                <span>01 · IDENTITY</span>
                <h2>상품 기본 정보</h2>
              </div>
              <p>상품을 구분하는 핵심 정보를 입력합니다.</p>
            </div>

            <div className="editor-form-grid">
              <div className="admin-form-field editor-span-2">
                <label>상품명 *</label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleProductChange}
                  placeholder="상품명을 입력해주세요."
                />
              </div>

              <div className="admin-form-field editor-span-2">
                <label>브랜드 *</label>
                <input
                  type="text"
                  name="brand"
                  value={product.brand}
                  onChange={handleProductChange}
                  placeholder="예: GODDESS"
                />
              </div>

              <div className="admin-form-field">
                <label>대분류 *</label>
                <select
                  name="mainCategoryId"
                  value={product.mainCategoryId}
                  onChange={handleProductChange}
                >
                  <option value="">대분류 선택</option>
                  {mainCategories.map((category) => {
                    const categoryId = category.categoryId ?? category.id ?? 0;
                    return (
                      <option
                        key={`main-category-${categoryId}`}
                        value={String(categoryId)}
                      >
                        {category.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {hasSubCategories ? (
                <div className="admin-form-field">
                  <label>하위 카테고리 *</label>
                  <select
                    name="categoryId"
                    value={product.categoryId}
                    onChange={handleProductChange}
                    disabled={!product.mainCategoryId}
                  >
                    <option value="">
                      {product.mainCategoryId
                        ? "카테고리 선택"
                        : "대분류를 먼저 선택해주세요"}
                    </option>
                    {subCategories.map((category) => {
                      const categoryId = category.categoryId ?? category.id ?? 0;
                      return (
                        <option
                          key={`sub-category-${categoryId}`}
                          value={String(categoryId)}
                        >
                          {category.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : product.mainCategoryId ? (
                <div className="admin-form-field">
                  <label>카테고리</label>
                  <input
                    type="text"
                    value={selectedMainCategory?.name ?? ""}
                    readOnly
                  />
                  <p>하위 카테고리가 없어 대분류 자체로 등록됩니다.</p>
                </div>
              ) : (
                <div className="admin-form-field">
                  <label>하위 카테고리</label>
                  <input
                    type="text"
                    value=""
                    placeholder="대분류를 먼저 선택해주세요"
                    readOnly
                  />
                </div>
              )}

              <div className="admin-form-field">
                <label>상품 유형</label>
                <select
                  name="productType"
                  value={product.productType}
                  onChange={handleProductChange}
                >
                  <option value="">선택 안 함</option>
                  <option value="BASE">베이스 / 파운데이션</option>
                  <option value="LIP">립</option>
                  <option value="EYE">아이</option>
                  <option value="BLUSH">치크 / 블러셔</option>
                  <option value="BROW">브로우</option>
                  <option value="SKINCARE">스킨케어</option>
                  <option value="HAIR">헤어</option>
                  <option value="FRAGRANCE">향수</option>
                  <option value="TOOL">뷰티소품</option>
                </select>
              </div>

              <div className="admin-form-field">
                <label>용량 / 중량</label>
                <input
                  type="text"
                  name="volume"
                  value={product.volume}
                  onChange={handleProductChange}
                  placeholder="예: 4.5g, 30ml"
                />
              </div>
            </div>
          </section>

          <section className="editor-block">
            <div className="editor-block-heading">
              <div>
                <span>02 · MERCHANDISING</span>
                <h2>가격과 추천 정보</h2>
              </div>
              <p>판매 가격과 고객 필터에 사용될 추천 정보를 설정합니다.</p>
            </div>

            <div className="editor-price-row">
              <div className="admin-form-field">
                <label>판매 가격 *</label>
                <div className="admin-input-unit">
                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={product.price}
                    onChange={handleProductChange}
                    placeholder="0"
                  />
                  <span>원</span>
                </div>
              </div>

              <div className="admin-form-field">
                <label>할인율</label>
                <div className="admin-input-unit">
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    max="100"
                    step="1"
                    value={product.discount}
                    onChange={handleProductChange}
                    placeholder="0"
                  />
                  <span>%</span>
                </div>
              </div>

              <div className="editor-sale-preview">
                <span>예상 판매가</span>
                <strong>{salePrice.toLocaleString()}원</strong>
              </div>
            </div>

            {(needsSkinType || needsPersonalColor) && (
              <div className="editor-recommend-zone">
                {needsSkinType && (
                  <div className="admin-form-field">
                    <label>추천 피부 타입</label>
                    <div className="admin-recommend-check-list">
                      {SKIN_TYPE_OPTIONS.map((skinType) => (
                        <label className="admin-recommend-check" key={skinType}>
                          <input
                            type="checkbox"
                            checked={selectedSkinTypes.includes(skinType)}
                            onChange={() => toggleCommaValue("skinType", skinType)}
                          />
                          <span>{skinType}</span>
                        </label>
                      ))}
                    </div>
                    <p>해당 상품에 맞는 피부 타입을 복수 선택할 수 있습니다.</p>
                  </div>
                )}

                {needsPersonalColor && (
                  <div className="admin-form-field">
                    <label>추천 퍼스널컬러</label>
                    <div className="admin-recommend-check-list">
                      {PERSONAL_COLOR_OPTIONS.map((personalColor) => (
                        <label
                          className="admin-recommend-check"
                          key={personalColor}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPersonalColors.includes(personalColor)}
                            onChange={() =>
                              toggleCommaValue("personalColor", personalColor)
                            }
                          />
                          <span>{personalColor}</span>
                        </label>
                      ))}
                    </div>
                    <p>해당 상품에 맞는 퍼스널컬러를 복수 선택할 수 있습니다.</p>
                  </div>
                )}
              </div>
            )}

            <div className="editor-copy-grid">
              <div className="admin-form-field">
                <label>상품 설명</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleProductChange}
                  placeholder="상품의 특징과 핵심 설명을 입력해주세요."
                  rows={7}
                />
              </div>

              <div className="admin-form-field">
                <label>사용 방법</label>
                <textarea
                  name="usageInfo"
                  value={product.usageInfo}
                  onChange={handleProductChange}
                  placeholder="사용 순서나 권장 사용법을 입력해주세요."
                  rows={7}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="product-publish-panel">
          <div className="publish-panel-head">
            <span>LIVE SUMMARY</span>
            <strong>{product.name.trim() || "상품명 미입력"}</strong>
            <p>{product.brand.trim() || "브랜드 미입력"}</p>
          </div>

          <div className="publish-panel-price">
            <small>판매 예정가</small>
            <strong>{salePrice.toLocaleString()}원</strong>
            {Number(product.discount) > 0 && (
              <span>{product.discount}% 할인 적용</span>
            )}
          </div>

          <div className="publish-panel-stats">
            <div>
              <span>색상</span>
              <strong>{colors.length}</strong>
            </div>
            <div>
              <span>규격</span>
              <strong>{sizes.length}</strong>
            </div>
            <div>
              <span>총 재고</span>
              <strong>{totalStock}</strong>
            </div>
          </div>

          <div className="publish-panel-controls">
            <div className="admin-form-field">
              <label>판매 상태</label>
              <select
                name="status"
                value={product.status}
                onChange={handleProductChange}
              >
                <option value="ON_SALE">판매중</option>
                <option value="SOLD_OUT">품절</option>
                <option value="STOPPED">판매중지</option>
                <option value="HIDDEN">숨김</option>
              </select>
            </div>

            <div className="admin-form-field">
              <label>AI BEAUTY 적용</label>
              <select
                name="aiApplyEnabled"
                value={product.aiApplyEnabled}
                onChange={handleProductChange}
              >
                <option value="Y">사용</option>
                <option value="N">사용 안 함</option>
              </select>
            </div>
          </div>

          <div className="publish-panel-note">
            <span className="publish-note-dot" />
            <p>
              저장 전 상품명, 카테고리, 가격, 색상과 판매 옵션을 확인해주세요.
            </p>
          </div>

          <div className="publish-panel-actions">
            <button
              type="button"
              className="product-editor-cancel"
              onClick={() => navigate(productListUrl)}
            >
              취소
            </button>
            <button
              type="button"
              className="product-editor-submit"
              onClick={submitProduct}
              disabled={submitting}
            >
              {submitting
                ? "저장 중..."
                : isEdit
                  ? "변경사항 저장"
                  : "상품 등록"}
            </button>
          </div>
        </aside>
      </div>

      <section className="editor-studio editor-media-studio">
        <div className="studio-heading">
          <div>
            <span>03 · VISUAL STUDIO</span>
            <h2>색상과 이미지 구성</h2>
            <p>색상별 대표 이미지와 상세 이미지를 한 카드 안에서 관리합니다.</p>
          </div>
          <button
            type="button"
            className="admin-outline-button"
            onClick={addColor}
          >
            + 색상 추가
          </button>
        </div>

        <div className="editor-color-grid">
          {colors.map((color, index) => {
            const thumbnailImages = color.images.filter(
              (image) => image.imageType === "THUMBNAIL"
            );
            const detailImages = color.images.filter(
              (image) => image.imageType === "DETAIL"
            );

            return (
              <article className="editor-color-card" key={color.id}>
                <div className="editor-color-card-head">
                  <div>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{color.colorName || "색상을 선택해주세요"}</strong>
                  </div>
                  {colors.length > 1 && (
                    <button type="button" onClick={() => removeColor(color.id)}>
                      삭제
                    </button>
                  )}
                </div>

                <div className="editor-color-selector">
                  <div
                    className="editor-color-swatch"
                    style={{ backgroundColor: color.colorCode || "#f0f0f0" }}
                  />
                  <select
                    value={color.masterColorId ?? ""}
                    onChange={(event) =>
                      changeColor(color.id, Number(event.target.value))
                    }
                  >
                    <option value="">COLOR 테이블에서 선택</option>
                    {masterColors.map((masterColor) => (
                      <option key={masterColor.id} value={masterColor.id}>
                        {masterColor.colorName} ({masterColor.colorCode})
                        {masterColor.baseColorGroup
                          ? ` · ${masterColor.baseColorGroup}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="editor-color-picker-guide">
                  THUMBNAIL 미리보기에서 실제 제품 색상을 클릭하면 색상코드를 자동 추출합니다.
                </div>

                {colorExtractions[color.id] && (
                  <div className="editor-color-extraction">
                    <div className="editor-color-extraction-result">
                      <div
                        className="editor-color-extraction-swatch"
                        style={{
                          backgroundColor:
                            colorExtractions[color.id].extractedHex || "#f3f3f3",
                        }}
                      />
                      <div>
                        <span>추출 색상</span>
                        <strong>
                          {colorExtractions[color.id].extracting
                            ? "분석 중..."
                            : colorExtractions[color.id].extractedHex || "-"}
                        </strong>
                      </div>
                    </div>

                    {colorExtractions[color.id].nearestMaster && (
                      <div className="editor-color-nearest">
                        <span>가장 가까운 기존 색상</span>
                        <div>
                          <i
                            style={{
                              backgroundColor:
                                colorExtractions[color.id].nearestMaster?.colorCode,
                            }}
                          />
                          <strong>
                            {colorExtractions[color.id].nearestMaster?.colorName}
                          </strong>
                          <small>
                            {colorExtractions[color.id].nearestMaster?.colorCode}
                          </small>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyNearestMasterColor(color.id)}
                          disabled={colorExtractions[color.id].extracting}
                        >
                          기존 색상 사용
                        </button>
                      </div>
                    )}

                    {colorExtractions[color.id].extractedHex && (
                      <div className="editor-color-new-master">
                        <div className="editor-color-new-master-fields">
                          <input
                            type="text"
                            value={colorExtractions[color.id].newColorName}
                            onChange={(event) =>
                              setExtractionState(color.id, {
                                newColorName: event.target.value,
                              })
                            }
                            placeholder="공식 색상명 (예: 실버 펄 로즈)"
                            maxLength={50}
                          />

                          <label className="editor-base-color-field">
                            <span>베이스 색상 계열</span>
                            <select
                              value={
                                colorExtractions[color.id].detectedBaseColorGroup
                              }
                              onChange={(event) =>
                                setExtractionState(color.id, {
                                  detectedBaseColorGroup: event.target.value,
                                })
                              }
                            >
                              <option value="">선택 안 함</option>
                              {BASE_COLOR_GROUP_OPTIONS.map((group) => (
                                <option key={group} value={group}>
                                  {group}
                                </option>
                              ))}
                            </select>
                            <small>
                              HEX 기준 자동 분류값입니다. 필요하면 직접 변경할 수 있습니다.
                            </small>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => saveExtractedMasterColor(color.id)}
                          disabled={
                            colorExtractions[color.id].extracting ||
                            colorExtractions[color.id].saving
                          }
                        >
                          {colorExtractions[color.id].saving
                            ? "등록 중..."
                            : "새 색상 등록"}
                        </button>
                      </div>
                    )}

                    {colorExtractions[color.id].message && (
                      <p className="editor-color-extraction-message">
                        {colorExtractions[color.id].message}
                      </p>
                    )}
                  </div>
                )}

                <div className="editor-upload-columns">
                  <div className="editor-upload-zone">
                    <div>
                      <strong>THUMBNAIL</strong>
                      <span>목록 / 상세 상단</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        changeImages(color.id, "THUMBNAIL", event)
                      }
                    />
                    <p>첫 번째 이미지는 대표 이미지입니다. 미리보기의 제품 색상을 클릭하면 HEX를 추출할 수 있습니다.</p>

                    {thumbnailImages.length > 0 && (
                      <div className="admin-image-preview-list">
                        {thumbnailImages.map((image, imageIndex) => (
                          <div className="admin-image-preview" key={image.id}>
                            <img
                              src={getImagePreviewUrl(image)}
                              alt={`${color.colorName || "상품"} 색상 추출용 이미지`}
                              className="admin-image-color-picker"
          
                              onMouseMove={(event) =>
                                handleColorHover(image, event)
                              }
                              onMouseLeave={clearColorHover}
                              onClick={(event) =>
                                extractColorFromImage(color.id, image, event)
                              }
                            />
                            {imageIndex === 0 && <span>대표</span>}
                            <input
                              type="text"
                              value={image.fileName}
                              onChange={(event) =>
                                changeImageFileName(
                                  color.id,
                                  image.id,
                                  event.target.value
                                )
                              }
                              placeholder="저장 파일명"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(color.id, image.id)}
                            >
                              {image.file ? "제거" : "삭제"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="editor-upload-zone">
                    <div>
                      <strong>DETAIL</strong>
                      <span>상품 정보 영역</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        changeImages(color.id, "DETAIL", event)
                      }
                    />
                    <p>상세 설명에 필요한 이미지를 순서대로 등록합니다.</p>

                    {detailImages.length > 0 && (
                      <div className="admin-image-preview-list">
                        {detailImages.map((image) => (
                          <div className="admin-image-preview" key={image.id}>
                            <img src={getImagePreviewUrl(image)} alt="" />
                            <input
                              type="text"
                              value={image.fileName}
                              onChange={(event) =>
                                changeImageFileName(
                                  color.id,
                                  image.id,
                                  event.target.value
                                )
                              }
                              placeholder="저장 파일명"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(color.id, image.id)}
                            >
                              {image.file ? "제거" : "삭제"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="editor-inventory-layout">
        <div className="editor-studio inventory-variant-panel">
          <div className="studio-heading compact">
            <div>
              <span>04 · VARIANTS</span>
              <h2>상품 규격</h2>
              <p>용량, 호수, 구성 등 판매 단위를 설정합니다.</p>
            </div>
            <button
              type="button"
              className="admin-outline-button"
              onClick={addSize}
            >
              + 규격 추가
            </button>
          </div>

          <div className="admin-size-list">
            {sizes.map((size, index) => (
              <div className="admin-size-row" key={size.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <input
                  type="text"
                  value={size.variantName}
                  onChange={(event) =>
                    changeSize(size.id, "variantName", event.target.value)
                  }
                  placeholder="예: 기본, 30ml, 21호"
                />
                <input
                  type="text"
                  value={size.variantDescription}
                  onChange={(event) =>
                    changeSize(size.id, "variantDescription", event.target.value)
                  }
                  placeholder="규격 설명 (선택)"
                />
                <button type="button" onClick={() => removeSize(size.id)}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="editor-studio inventory-stock-panel">
          <div className="studio-heading compact">
            <div>
              <span>05 · STOCK MATRIX</span>
              <h2>판매 옵션 / 재고</h2>
              <p>색상 × 규격 조합별 재고와 추가 금액을 입력합니다.</p>
            </div>
            <button
              type="button"
              className="admin-outline-button"
              onClick={generateOptions}
            >
              옵션 생성
            </button>
          </div>

          {options.length === 0 ? (
            <div className="admin-option-empty">
              색상과 규격을 입력한 후 <strong>옵션 생성</strong>을 눌러주세요.
            </div>
          ) : (
            <div className="admin-option-table-wrap">
              <table className="admin-option-table">
                <thead>
                  <tr>
                    <th>색상</th>
                    <th>규격</th>
                    <th>재고</th>
                    <th>추가 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((option) => (
                    <tr key={`${option.colorId}-${option.sizeId}`}>
                      <td>{findColorName(option.colorId)}</td>
                      <td>{findSizeName(option.sizeId)}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={option.stock}
                          onChange={(event) =>
                            changeOption(
                              option.colorId,
                              option.sizeId,
                              "stock",
                              Number(event.target.value)
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={option.addPrice}
                          onChange={(event) =>
                            changeOption(
                              option.colorId,
                              option.sizeId,
                              "addPrice",
                              Number(event.target.value)
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <div className="product-editor-bottom-actions">
        <div>
          <span>READY TO SAVE</span>
          <p>입력한 상품 정보와 재고 구성을 마지막으로 확인해주세요.</p>
        </div>
        <div>
          <button
            type="button"
            className="product-editor-cancel"
            onClick={() => navigate(productListUrl)}
          >
            취소
          </button>
          <button
            type="button"
            className="product-editor-submit"
            onClick={submitProduct}
            disabled={submitting}
          >
            {submitting
              ? "저장 중..."
              : isEdit
                ? "변경사항 저장"
                : "상품 등록"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminProductForm;