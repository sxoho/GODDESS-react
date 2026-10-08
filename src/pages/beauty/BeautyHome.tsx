import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useSearchParams
} from "react-router-dom";

import "../../styles/beauty/BeautyHome.css";

import BeautyMembership from "./BeautyMembership";

import {
  BRAND
} from "../../config/brand";

import {
  axiosInstance
} from "../../components/ToolBak";

import {
  useGlobalStore
} from "../../store/store";

import {
  addCartItem
} from "../../api/cartApi";


const API_BASE =
  "http://localhost:9104";




/* =========================================
   회원 대표 사진
========================================= */

type MemberPhoto = {
  id: number;
  memberId: number;
  photoType: string;
  fileOrigin: string;
  fileSaved: string;
  filePath: string;
  fileSize?: number;
  isMain: string;
  visible: string;
  createdAt?: string;
  updatedAt?: string;
};


/* =========================================
   AI BEAUTY 상품 체험
========================================= */

type TryonMainMode =
  | "makeup"
  | "hair";

type TryonCategoryId =
  | "base"
  | "lip"
  | "blush"
  | "eye";

type HairCategoryId =
  | "hair-style"
  | "hair-color";

type BeautyCategory = {
  id?: number;
  categoryId?: number;
  parentId?: number | null;
  name: string;
  description?: string;
  sortOrder?: number;
  visible?: string;
};

type BeautyProduct = {
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
  status: string;
};

type BeautyProductColor = {
  id: number;
  productId: number;
  colorId: number;
  colorName: string;
  colorCode?: string;
  isMain: string;
  sortOrder: number;
  aiApplyEnabled: string;
  visible: string;
};

type BeautyProductImage = {
  id: number;
  productColorId?: number;
  productcolorId?: number;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
};

type BeautyProductPage = {
  content: BeautyProduct[];
  totalPages: number;
  totalElements: number;
};

type BeautySelection = {
  product: BeautyProduct;
  color: BeautyProductColor;
};

type HairSelection = {
  categoryId: HairCategoryId;
  label: string;
};


type BeautyApplyResponse = {
  success: boolean;
  route: string;
  status: string;
  resultImageBase64: string;
  resultContentType: string;
  resultFileName: string;

  beautyTryonId: number;
  beautyResultId: number;
};


type AiUsageStatus = {
  memberId: number;
  premium: boolean;
  unlimited: boolean;
  monthlyLimit: number;
  usedCount: number;
  remainingCount: number | null;
};


type BeautySaveResponse = {
  success: boolean;
  message: string;
  beautySaveId: number;
  beautyResultId: number;
  saveName: string;
};


type BeautyHistoryItem = {
  itemType: string;
  styleValue?: string | null;
  productId?: number | null;
  productName?: string | null;
  brand?: string | null;
  productColorId?: number | null;
  colorName?: string | null;
  colorCode?: string | null;
  price?: number | null;
};

type BeautyProductOption = {
  id: number;
  productId: number;
  productColorId?: number | null;
  colorName?: string | null;
  productVariantId?: number | null;
  variantName?: string | null;
  addPrice?: number | null;
  stock: number;
  visible: string;
};


type BeautyHistory = {
  beautySaveId: number;
  beautyResultId: number;
  beautyTryonId: number;
  saveName: string;
  memo?: string | null;
  createdAt: string;
  beautyType: string;
  tryonStatus: string;
  resultFilePath: string;
  beforeFilePath: string;
  items: BeautyHistoryItem[];
};


/* =========================================
   AI BEAUTY 선택값 임시 보관
   - 상품 상세페이지로 이동했다가 뒤로 와도 유지
   - 브라우저 탭이 열려있는 동안 유지
========================================= */

const getTryonSelectionStorageKey = (
  memberId?: number | null
) =>
  `goddess-ai-beauty-selection-${memberId ?? "guest"}`;

const loadTryonSelectionStorage = (
  memberId?: number | null
): {
  selections: Partial<Record<TryonCategoryId, BeautySelection>>;
  hairSelections: Partial<Record<HairCategoryId, HairSelection>>;
} => {
  try {
    const saved = sessionStorage.getItem(
      getTryonSelectionStorageKey(memberId)
    );

    if (!saved) {
      return {
        selections: {},
        hairSelections: {}
      };
    }

    const parsed = JSON.parse(saved);

    return {
      selections: parsed?.selections ?? {},
      hairSelections: parsed?.hairSelections ?? {}
    };
  } catch {
    return {
      selections: {},
      hairSelections: {}
    };
  }
};

const TRYON_CATEGORIES: Array<{
  id: TryonCategoryId;
  label: string;
  categoryName: string;
  overline: string;
}> = [
  {
    id: "base",
    label: "베이스",
    categoryName: "페이스",
    overline: "BASE"
  },
  {
    id: "lip",
    label: "립",
    categoryName: "립",
    overline: "LIP"
  },
  {
    id: "blush",
    label: "치크",
    categoryName: "치크",
    overline: "BLUSH"
  },
  {
    id: "eye",
    label: "아이",
    categoryName: "아이",
    overline: "EYE"
  }
];


const HAIR_CATEGORIES: Array<{
  id: HairCategoryId;
  label: string;
  overline: string;
}> = [
  {
    id: "hair-style",
    label: "헤어스타일",
    overline: "HAIR STYLE"
  },
  {
    id: "hair-color",
    label: "헤어컬러",
    overline: "HAIR COLOR"
  }
];

const HAIR_STYLE_OPTIONS = [
  {
    label: "C컬 롱헤어",
    description: "긴 머리 끝에 C자 컬을 넣어 차분하고 부드럽게 떨어지는 스타일"
  },
  {
    label: "레이어드컷",
    description: "얼굴선을 따라 층을 내어 가볍고 자연스러운 움직임을 주는 스타일"
  },
  {
    label: "단발",
    description: "턱선부터 목선 사이에서 깔끔하게 떨어지는 클래식 단발 스타일"
  },
  {
    label: "내추럴 웨이브",
    description: "과하지 않은 굵은 웨이브로 부드럽고 자연스럽게 연출하는 스타일"
  },
  {
    label: "히피펌",
    description: "잔잔하고 풍성한 컬을 전체적으로 넣어 발랄하고 자유로운 스타일"
  },
  {
    label: "스트레이트",
    description: "모발을 곧고 매끈하게 정돈해 깔끔하고 세련된 느낌의 스타일"
  },
  {
    label: "시스루뱅",
    description: "얇고 가벼운 앞머리로 이마가 은은하게 비치는 내추럴 스타일"
  },
  {
    label: "노뱅 레이어드",
    description: "앞머리 없이 얼굴 옆선을 따라 층을 내어 성숙하게 연출하는 스타일"
  },
  {
    label: "허쉬컷",
    description: "가벼운 층과 텍스처를 살려 시크하고 자연스러운 볼륨을 주는 스타일"
  },
  {
    label: "빌드펌",
    description: "C컬과 S컬을 섞어 얼굴선을 감싸고 풍성한 볼륨을 만드는 스타일"
  },
  {
    label: "S컬 롱펌",
    description: "긴 머리에 부드러운 S자 웨이브를 넣어 우아하게 연출하는 스타일"
  },
  {
    label: "태슬컷",
    description: "끝선을 가볍고 또렷하게 정리해 세련되고 도시적인 느낌의 스타일"
  },
  {
    label: "중단발 레이어드",
    description: "어깨선 길이에 층을 더해 자연스러운 볼륨을 살리는 스타일"
  },
  {
    label: "사이드뱅 웨이브",
    description: "옆으로 흐르는 앞머리와 웨이브로 얼굴선을 부드럽게 감싸는 스타일"
  },
  {
    label: "볼륨매직 C컬",
    description: "뿌리와 중간은 매끈하게 정돈하고 끝에는 C컬을 넣은 단정한 스타일"
  }
];

const HAIR_COLOR_OPTIONS = [
  {
    label: "내추럴 블랙",
    colorCode: "#1B1B1B"
  },
  {
    label: "다크 브라운",
    colorCode: "#3B2A24"
  },
  {
    label: "초코 브라운",
    colorCode: "#5A382B"
  },
  {
    label: "애쉬 브라운",
    colorCode: "#6B625B"
  },
  {
    label: "레드 브라운",
    colorCode: "#6A332C"
  },
  {
    label: "블론드",
    colorCode: "#D7B77A"
  },
  {
    label: "소프트 애쉬 브라운",
    colorCode: "#7A7068"
  },
  {
    label: "샌드 베이지",
    colorCode: "#B69A7A"
  },
  {
    label: "밀크티 베이지",
    colorCode: "#B6A38F"
  },
  {
    label: "허니 카라멜",
    colorCode: "#A56A3C"
  },
  {
    label: "로즈 골드",
    colorCode: "#B87878"
  },
  {
    label: "브라운 핑크",
    colorCode: "#8F5F63"
  },
  {
    label: "딥 퍼플",
    colorCode: "#4B2D4E"
  },
  {
    label: "애쉬 그레이",
    colorCode: "#77777B"
  },
  {
    label: "미드나잇 블루",
    colorCode: "#222D48"
  }
];



const BEAUTY_LOADING_PROMOTIONS = [
  {
    overline: "FREE BEAUTY",
    title: "매월 3회, AI BEAUTY를 무료로 체험해보세요.",
    description:
      "메이크업과 헤어 변화를 부담 없이 먼저 경험해보세요.",
    accent: "FREE · MONTHLY 3"
  },
  {
    overline: "PERSONAL COLOR",
    title: "나에게 어울리는 퍼스널컬러를 진단해보세요.",
    description:
      "진단 결과를 바탕으로 어울리는 컬러와 뷰티 상품을 찾아볼 수 있어요.",
    accent: "MY COLOR"
  },
  {
    overline: "SKIN DIAGNOSIS",
    title: "피부 타입 진단으로 나에게 맞는 뷰티 루틴을 시작해보세요.",
    description:
      "피부 타입과 진단 결과를 기반으로 맞춤 상품 추천을 준비하고 있어요.",
    accent: "MY SKIN"
  }
] as const;


/* =========================================
   회원 사진 AI 검사 결과
========================================= */

type PhotoAiCheckResult = {
  faceDetected: boolean;
  isFront: boolean;
  faceCenterOffset?: number | null;
  brightness?: number | null;
  isTooDark: boolean;
  isTooBright: boolean;
  blurScore?: number | null;
  isBlurred: boolean;
  valid: boolean;
  message: string;
};


export default function BeautyHome() {

  const [
    params,
    setParams
  ] = useSearchParams();


  const navigate =
    useNavigate();


  const {
    sw,
    memberId
  } = useGlobalStore();


  /* =========================================
     현재 화면
  ========================================= */

  const view =
    params.get("view") ?? "start";


  const heroStages = [
    {
      id: "base",
      label: "기본 얼굴",
      title: "내 사진 기반 기본 얼굴",
      desc: "정면 사진을 바탕으로 얼굴을 자연스럽게 인식해요.",
    },
    {
      id: "makeup",
      label: "메이크업 효과",
      title: "메이크업이 자연스럽게 적용돼요",
      desc: "립, 치크, 아이 포인트가 얼굴에 부드럽게 더해져요.",
    },
    {
      id: "hair",
      label: "헤어스타일 적용",
      title: "헤어스타일까지 완성된 모습을 확인해요",
      desc: "메이크업 위에 어울리는 헤어스타일을 함께 입혀 새로운 분위기를 미리 볼 수 있어요.",
    },
  ] as const;

  const [
    activeHeroStage,
    setActiveHeroStage
  ] = useState(0);

  const [
    heroTool,
    setHeroTool
  ] = useState<"makeup" | "hair" | null>(null);

  const heroToolTimerRef =
    useRef<number | null>(null);

  const heroAutoTimerRef =
    useRef<number | null>(null);

  const heroAutoNextRef =
    useRef<"makeup" | "hair">("makeup");



  /* =========================================
     사진 input
  ========================================= */

  const galleryPhotoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const cameraPhotoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const photoCheckRequestId =
    useRef(0);


  /* =========================================
     회원사진 상태
  ========================================= */

  const [
    memberPhoto,
    setMemberPhoto
  ] =
    useState<MemberPhoto | null>(
      null
    );


  const [
    photoLoaded,
    setPhotoLoaded
  ] =
    useState(false);


  const [
    photoLoading,
    setPhotoLoading
  ] =
    useState(false);


  const [
    photoEditing,
    setPhotoEditing
  ] =
    useState(false);


  const [
    selectedPhoto,
    setSelectedPhoto
  ] =
    useState<File | null>(
      null
    );


  const [
    photoPreview,
    setPhotoPreview
  ] =
    useState("");


  const [
    photoSaving,
    setPhotoSaving
  ] =
    useState(false);


  /* =========================================
     AI 검사
  ========================================= */

  const [
    photoChecking,
    setPhotoChecking
  ] =
    useState(false);


  const [
    photoAiResult,
    setPhotoAiResult
  ] =
    useState<PhotoAiCheckResult | null>(
      null
    );


  const [
    photoAiError,
    setPhotoAiError
  ] =
    useState("");


  const playHeroEffect =
    (type: "makeup" | "hair") => {
      if (heroToolTimerRef.current !== null) {
        window.clearTimeout(heroToolTimerRef.current);
      }

      setActiveHeroStage(0);
      setHeroTool(type);

      heroToolTimerRef.current =
        window.setTimeout(
          () => {
            setActiveHeroStage(
              type === "makeup" ? 1 : 2
            );
            setHeroTool(null);
            heroToolTimerRef.current = null;
          },
          1050
        );
    };


  useEffect(
    () => {
      if (view !== "start") {
        return;
      }

      heroAutoNextRef.current = "makeup";

      const runAutoEffect = () => {
        const nextType = heroAutoNextRef.current;
        playHeroEffect(nextType);
        heroAutoNextRef.current =
          nextType === "makeup" ? "hair" : "makeup";
      };

      heroAutoTimerRef.current = window.setInterval(
        runAutoEffect,
        3000
      );

      return () => {
        if (heroAutoTimerRef.current !== null) {
          window.clearInterval(heroAutoTimerRef.current);
          heroAutoTimerRef.current = null;
        }

        if (heroToolTimerRef.current !== null) {
          window.clearTimeout(heroToolTimerRef.current);
          heroToolTimerRef.current = null;
        }
      };
    },
    [view]
  );

  /* =========================================
     AI BEAUTY 체험 상품 상태
  ========================================= */

  const [
    tryonCategories,
    setTryonCategories
  ] = useState<BeautyCategory[]>([]);

  const [
    tryonProducts,
    setTryonProducts
  ] = useState<BeautyProduct[]>([]);

  const [
    tryonColors,
    setTryonColors
  ] = useState<BeautyProductColor[]>([]);

  const [
    tryonImages,
    setTryonImages
  ] = useState<BeautyProductImage[]>([]);

  const [
    activeTryonMode,
    setActiveTryonMode
  ] = useState<TryonMainMode>("makeup");

  const [
    activeTryonCategory,
    setActiveTryonCategory
  ] = useState<TryonCategoryId>("base");

  const [
    activeHairCategory,
    setActiveHairCategory
  ] = useState<HairCategoryId>("hair-style");

  const [
    tryonKeyword,
    setTryonKeyword
  ] = useState("");

  const [
    appliedTryonKeyword,
    setAppliedTryonKeyword
  ] = useState("");

  const [
    tryonLoading,
    setTryonLoading
  ] = useState(false);

  const [
    tryonError,
    setTryonError
  ] = useState("");

  const [
    shadeProduct,
    setShadeProduct
  ] = useState<BeautyProduct | null>(null);

  const [
    selections,
    setSelections
  ] = useState<Partial<Record<TryonCategoryId, BeautySelection>>>(
    () =>
      loadTryonSelectionStorage(memberId).selections
  );

  const [
    hairSelections,
    setHairSelections
  ] = useState<Partial<Record<HairCategoryId, HairSelection>>>(
    () =>
      loadTryonSelectionStorage(memberId).hairSelections
  );


  const [
    tryonApplying,
    setTryonApplying
  ] = useState(false);

  const [
    tryonApplyError,
    setTryonApplyError
  ] = useState("");


  const [
    hairLimitReached,
    setHairLimitReached
  ] = useState(false);


  const [
    hairUsageStatus,
    setHairUsageStatus
  ] = useState<AiUsageStatus | null>(
    null
  );

  const [
    tryonResult,
    setTryonResult
  ] = useState<BeautyApplyResponse | null>(
    null
  );

  const [
  beautySaving,
  setBeautySaving
] = useState(false);


const [
  beautySaved,
  setBeautySaved
] = useState(false);


  const [
    loadingPromotionIndex,
    setLoadingPromotionIndex
  ] = useState(0);

  const [
    cartSelectedProductIds,
    setCartSelectedProductIds
  ] = useState<number[]>([]);


  const [
    cartAdding,
    setCartAdding
  ] = useState(false);


  const [
    historyCartSelectedProductIds,
    setHistoryCartSelectedProductIds
  ] = useState<number[]>([]);


  const [
    beautyHistory,
    setBeautyHistory
  ] = useState<BeautyHistory[]>([]);

  const [
    beautyHistoryLoading,
    setBeautyHistoryLoading
  ] = useState(false);

  const [
    beautyHistoryError,
    setBeautyHistoryError
  ] = useState("");


  const [
    selectedHistoryId,
    setSelectedHistoryId
  ] = useState<number | null>(null);


  const [
    historyImagePreview,
    setHistoryImagePreview
  ] = useState<string | null>(null);


  const [
    historyDeleting,
    setHistoryDeleting
  ] = useState(false);


  useEffect(() => {
    if (!memberId) {
      return;
    }

    sessionStorage.setItem(
      getTryonSelectionStorageKey(memberId),
      JSON.stringify({
        selections,
        hairSelections
      })
    );
  }, [memberId, selections, hairSelections]);


  useEffect(
    () => {

      if (!tryonApplying) {
        setLoadingPromotionIndex(0);
        return;
      }

      const timer =
        window.setInterval(
          () => {

            setLoadingPromotionIndex(
              (previous) =>
                (
                  previous + 1
                ) %
                BEAUTY_LOADING_PROMOTIONS.length
            );

          },
          3000
        );

      return () =>
        window.clearInterval(
          timer
        );

    },
    [tryonApplying]
  );


  /* =========================================
     이미지 URL
  ========================================= */

  const getImageUrl = (
    path?: string
  ) => {

    if (!path) {
      return "";
    }


    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      return path;
    }


    return `${API_BASE}${path}`;
  };


  /* =========================================
     MY HISTORY 상세 URL 동기화
     - 목록: ?view=saved
     - 상세: ?view=saved&historyId=123
     브라우저 뒤로가기를 누르면 이전 목록 URL이 복원된다.
  ========================================= */

  useEffect(
    () => {
      if (view !== "saved") {
        return;
      }

      const historyIdParam =
        params.get("historyId");

      const parsedHistoryId =
        historyIdParam
          ? Number(historyIdParam)
          : null;

      setSelectedHistoryId(
        parsedHistoryId && Number.isFinite(parsedHistoryId)
          ? parsedHistoryId
          : null
      );

      if (!parsedHistoryId) {
        setHistoryCartSelectedProductIds([]);
      }
    },
    [
      view,
      params
    ]
  );


  /* =========================================
     MY HISTORY 조회
  ========================================= */

  const loadBeautyHistory =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        setBeautyHistory([]);
        return;
      }

      try {

        setBeautyHistoryLoading(true);
        setBeautyHistoryError("");

        const response =
          await axiosInstance.get<BeautyHistory[]>(
            `/beauty/save/member/${memberId}`
          );

        setBeautyHistory(
          response.data ?? []
        );

      } catch (error) {

        console.error(
          "AI BEAUTY 저장 내역 조회 오류:",
          error
        );

        setBeautyHistory([]);
        setBeautyHistoryError(
          "저장한 AI BEAUTY 결과를 불러오지 못했습니다."
        );

      } finally {

        setBeautyHistoryLoading(false);
      }
    };


  useEffect(
    () => {

      if (
        view !== "saved"
      ) {
        return;
      }

      loadBeautyHistory();

    },
    [
      view,
      sw,
      memberId
    ]
  );


  /*
   * MY HISTORY 상세 화면 상태는
   * 다른 메뉴로 이동하는 순간 초기화한다.
   *
   * 따라서 MY PHOTO / MEMBERSHIP / START에 갔다가
   * 다시 MY HISTORY를 누르면 항상 목록 화면부터 시작한다.
   */
  useEffect(
    () => {

      if (
        view === "saved"
      ) {
        return;
      }


      setHistoryImagePreview(
        null
      );

      setSelectedHistoryId(
        null
      );

    },
    [
      view
    ]
  );


  /* =========================================
     MY HISTORY 상세 → 목록
  ========================================= */

  const handleBackToHistoryList =
    () => {

      /*
       * 상세 → 목록
       * URL은 이미 view=saved 상태이므로
       * 선택된 상세 ID만 초기화하면 즉시 목록이 렌더링된다.
       */
      setHistoryImagePreview(
        null
      );

      setSelectedHistoryId(
        null
      );

      setHistoryCartSelectedProductIds(
        []
      );

      setParams({
        view: "saved"
      });
    };


  /* =========================================
     결과 이미지 크게 보기
  ========================================= */

  const handleOpenHistoryImage =
    (
      filePath: string
    ) => {

      setHistoryImagePreview(
        getImageUrl(
          filePath
        )
      );
    };


  const handleCloseHistoryImage =
    () => {

      setHistoryImagePreview(
        null
      );
    };


  /* =========================================
     결과 사진 저장
  ========================================= */

  const handleDownloadHistoryImage =
    async (
      history: BeautyHistory
    ) => {

      const imageUrl =
        getImageUrl(
          history.resultFilePath
        );


      if (!imageUrl) {

        alert(
          "저장할 결과 이미지를 찾을 수 없습니다."
        );

        return;
      }


      try {

        const response =
          await fetch(
            imageUrl
          );


        if (!response.ok) {

          throw new Error(
            "이미지 다운로드에 실패했습니다."
          );
        }


        const blob =
          await response.blob();


        const objectUrl =
          window.URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          objectUrl;

        link.download =
          `goddess_ai_beauty_${history.beautySaveId}.png`;


        document.body.appendChild(
          link
        );

        link.click();

        link.remove();


        window.URL.revokeObjectURL(
          objectUrl
        );


      } catch (error) {

        console.error(
          "AI BEAUTY 결과 이미지 저장 오류:",
          error
        );

        alert(
          "결과 사진을 저장하지 못했습니다."
        );
      }
    };


  /* =========================================
     저장 이용 내역 삭제
  ========================================= */

  const handleDeleteBeautyHistory =
    async (
      history: BeautyHistory
    ) => {

      if (
        !memberId ||
        historyDeleting
      ) {

        return;
      }


      const confirmed =
        window.confirm(
          "이 AI BEAUTY 이용 내역을 삭제할까요?\n삭제한 저장 내역은 MY HISTORY에서 더 이상 보이지 않습니다."
        );


      if (!confirmed) {

        return;
      }


      try {

        setHistoryDeleting(
          true
        );


        await axiosInstance.delete(
          `/beauty/save/${history.beautySaveId}/member/${memberId}`
        );


        setHistoryImagePreview(
          null
        );

        setSelectedHistoryId(
          null
        );

        setHistoryCartSelectedProductIds(
          []
        );

        setParams({
          view: "saved"
        });


        await loadBeautyHistory();


        alert(
          "이용 내역이 삭제되었습니다."
        );


      } catch (error) {

        console.error(
          "AI BEAUTY 이용 내역 삭제 오류:",
          error
        );


        const responseData =
          (
            error as {
              response?: {
                data?:
                  | {
                      message?: string;
                      error?: string;
                    }
                  | string;
              };
            }
          )
            ?.response
            ?.data;


        let message =
          "이용 내역을 삭제하지 못했습니다.";


        if (
          typeof responseData ===
            "string" &&
          responseData.trim()
        ) {

          message =
            responseData;

        } else if (
          responseData &&
          typeof responseData ===
            "object"
        ) {

          message =
            responseData.message
            ||
            responseData.error
            ||
            message;
        }


        alert(
          message
        );


      } finally {

        setHistoryDeleting(
          false
        );
      }
    };


  /* =========================================
     대표사진 조회
  ========================================= */

  const loadMemberPhoto =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        setMemberPhoto(
          null
        );

        setPhotoLoaded(
          true
        );

        return;
      }


      try {

        setPhotoLoading(
          true
        );


        const response =
          await axiosInstance.get<MemberPhoto>(
            `/member_photo/member/${memberId}/main`
          );


        if (
          response.status === 200 &&
          response.data &&
          response.data.id
        ) {

          setMemberPhoto(
            response.data
          );

        } else {

          setMemberPhoto(
            null
          );
        }


      } catch (error) {

        console.log(
          "등록된 회원 사진 없음:",
          error
        );


        setMemberPhoto(
          null
        );


      } finally {

        setPhotoLoading(
          false
        );

        setPhotoLoaded(
          true
        );
      }
    };


  useEffect(
    () => {

      loadMemberPhoto();

    },
    [
      sw,
      memberId
    ]
  );


  /* =========================================
     미리보기 URL 정리
  ========================================= */

  useEffect(
    () => {

      return () => {

        if (
          photoPreview
        ) {

          URL.revokeObjectURL(
            photoPreview
          );
        }
      };

    },
    [
      photoPreview
    ]
  );


  /* =========================================
     날짜
  ========================================= */

  const formatDate = (
    date?: string
  ) => {

    if (!date) {
      return "-";
    }


    return date.substring(
      0,
      10
    );
  };


  /* =========================================
     선택 상태 초기화
  ========================================= */

  const resetPhotoSelection =
    () => {

      photoCheckRequestId.current += 1;


      if (
        photoPreview
      ) {

        URL.revokeObjectURL(
          photoPreview
        );
      }


      setSelectedPhoto(
        null
      );

      setPhotoPreview(
        ""
      );

      setPhotoAiResult(
        null
      );

      setPhotoAiError(
        ""
      );

      setPhotoChecking(
        false
      );


      if (
        galleryPhotoInputRef.current
      ) {

        galleryPhotoInputRef.current.value =
          "";
      }


      if (
        cameraPhotoInputRef.current
      ) {

        cameraPhotoInputRef.current.value =
          "";
      }
    };


  /* =========================================
     사진 선택 + AI 사전검사
  ========================================= */

  const handlePhotoChange =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      /* 이미지 형식 */

      const allowedTypes = [
        "image/jpeg",
        "image/png"
      ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        alert(
          "JPG, JPEG, PNG 이미지 파일만 등록할 수 있습니다."
        );


        event.target.value =
          "";


        return;
      }


      /* 10MB 제한 */

      const maxSize =
        10 *
        1024 *
        1024;


      if (
        file.size >
        maxSize
      ) {

        alert(
          "사진은 10MB 이하만 등록할 수 있습니다."
        );


        event.target.value =
          "";


        return;
      }


      /* 기존 미리보기 제거 */

      if (
        photoPreview
      ) {

        URL.revokeObjectURL(
          photoPreview
        );
      }


      const preview =
        URL.createObjectURL(
          file
        );


      setSelectedPhoto(
        file
      );


      setPhotoPreview(
        preview
      );


      setPhotoAiResult(
        null
      );


      setPhotoAiError(
        ""
      );


      const requestId =
        photoCheckRequestId.current + 1;


      photoCheckRequestId.current =
        requestId;


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      try {

        setPhotoChecking(
          true
        );


        const response =
          await axiosInstance.post<PhotoAiCheckResult>(
            "/member_photo/check",
            formData,
            {
              timeout: 30000
            }
          );


        if (
          requestId !==
          photoCheckRequestId.current
        ) {

          return;
        }


        setPhotoAiResult(
          response.data
        );


      } catch (error) {

        console.error(
          "회원 사진 AI 검사 오류:",
          error
        );


        const errorData =
          (
            error as {
              response?: {
                data?:
                  | {
                      message?: string;
                      error?: string;
                    }
                  | string;
              };
            }
          )?.response?.data;


        let errorMessage =
          "사진 AI 검사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";


        if (
          typeof errorData ===
            "string" &&
          errorData.trim()
        ) {

          errorMessage =
            errorData;

        } else if (
          errorData &&
          typeof errorData ===
            "object"
        ) {

          errorMessage =
            errorData.message ||
            errorData.error ||
            errorMessage;
        }


        if (
          requestId ===
          photoCheckRequestId.current
        ) {

          setPhotoAiResult(
            null
          );


          setPhotoAiError(
            errorMessage
          );
        }


      } finally {

        if (
          requestId ===
          photoCheckRequestId.current
        ) {

          setPhotoChecking(
            false
          );
        }
      }
    };


  /* =========================================
     회원사진 등록 / 변경
  ========================================= */

  const handlePhotoUpload =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        alert(
          "로그인이 필요한 기능입니다."
        );


        navigate(
          "/login"
        );


        return;
      }


      if (
        !selectedPhoto
      ) {

        alert(
          "등록할 사진을 선택해주세요."
        );


        return;
      }


      if (
        photoChecking
      ) {

        alert(
          "사진 AI 검사가 진행 중입니다."
        );


        return;
      }


      if (
        !photoAiResult ||
        !photoAiResult.valid
      ) {

        alert(
          photoAiResult?.message ||
          photoAiError ||
          "AI 사진 검사를 통과한 사진만 등록할 수 있습니다."
        );


        return;
      }


      const existedPhoto =
        Boolean(
          memberPhoto
        );


      const formData =
        new FormData();


      formData.append(
        "file",
        selectedPhoto
      );


      try {

        setPhotoSaving(
          true
        );


        await axiosInstance.post<MemberPhoto>(
          `/member_photo/member/${memberId}`,
          formData
        );


        /*
         * 저장 직후 대표사진을 다시 조회한다.
         *
         * 사진 등록/변경 POST 응답만 바로 상태에 넣으면
         * createdAt이 화면에 즉시 반영되지 않아 등록일이
         * "-"로 보일 수 있으므로, 저장이 완료된 뒤 DB의
         * 최신 대표사진을 다시 가져와 화면 상태를 갱신한다.
         */
        const mainPhotoResponse =
          await axiosInstance.get<MemberPhoto>(
            `/member_photo/member/${memberId}/main`
          );


        setMemberPhoto(
          mainPhotoResponse.data
        );


        resetPhotoSelection();


        setPhotoEditing(
          false
        );


        alert(
          existedPhoto
            ? "AI BEAUTY 사진이 변경되었습니다."
            : "AI BEAUTY 사진이 등록되었습니다."
        );


      } catch (error) {

        console.error(
          "회원 사진 등록 오류:",
          error
        );


        alert(
          "회원 사진 저장 중 오류가 발생했습니다."
        );


      } finally {

        setPhotoSaving(
          false
        );
      }
    };


  /* =========================================
     사진 변경 취소
  ========================================= */

  const handlePhotoEditCancel =
    () => {

      resetPhotoSelection();


      setPhotoEditing(
        false
      );
    };


  /* =========================================
     AI BEAUTY 체험 상품
  ========================================= */

  const getTryonCategory = (
    id: TryonCategoryId
  ) =>
    TRYON_CATEGORIES.find(
      (item) => item.id === id
    ) ?? TRYON_CATEGORIES[0];


  const getProductThumbnail = (
    productId: number
  ) => {

    const productColors =
      tryonColors
        .filter(
          (color) =>
            color.productId === productId &&
            color.visible !== "N"
        )
        .sort(
          (a, b) =>
            Number(b.isMain === "Y") -
              Number(a.isMain === "Y") ||
            (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
        );


    const colorIds =
      new Set(
        productColors.map(
          (color) => color.id
        )
      );


    const productImages =
      tryonImages
        .filter(
          (image) =>
            colorIds.has(
              Number(
                image.productcolorId ??
                image.productColorId
              )
            )
        )
        .sort(
          (a, b) =>
            Number(
              b.imageType === "THUMBNAIL"
            ) -
              Number(
                a.imageType === "THUMBNAIL"
              ) ||
            Number(b.isMain === "Y") -
              Number(a.isMain === "Y") ||
            (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
        );


    return productImages[0]?.filePath
      ? getImageUrl(
          productImages[0].filePath
        )
      : "/images/goddess/beauty-editorial.webp";
  };


  const loadTryonMeta =
    async () => {

      try {

        const [
          categoryResponse,
          colorResponse,
          imageResponse
        ] = await Promise.all([
          axiosInstance.get<BeautyCategory[]>(
            "/category/find_all"
          ),
          axiosInstance.get<BeautyProductColor[]>(
            "/product_color/find_all"
          ),
          axiosInstance.get<BeautyProductImage[]>(
            "/product_color_image/find_all"
          )
        ]);


        setTryonCategories(
          categoryResponse.data ?? []
        );

        setTryonColors(
          colorResponse.data ?? []
        );

        setTryonImages(
          imageResponse.data ?? []
        );

      } catch (error) {

        console.error(
          "AI BEAUTY 상품 메타데이터 조회 오류:",
          error
        );

        setTryonError(
          "상품 정보를 불러오는 중 오류가 발생했습니다."
        );
      }
    };


  const loadTryonProducts =
    async (
      categoryId: TryonCategoryId =
        activeTryonCategory,
      keyword: string =
        appliedTryonKeyword
    ) => {

      const config =
        getTryonCategory(
          categoryId
        );


      const category =
        tryonCategories.find(
          (item) =>
            item.name ===
              config.categoryName &&
            item.visible !== "N"
        );


      if (!category) {
        setTryonProducts([]);
        return;
      }


      const realCategoryId =
        category.id ??
        category.categoryId;


      if (!realCategoryId) {
        setTryonProducts([]);
        return;
      }


      try {

        setTryonLoading(true);
        setTryonError("");


        const response =
          await axiosInstance.get<BeautyProductPage>(
            "/product/page",
            {
              params: {
                page: 0,
                size: 24,
                sort: "recommended",
                categoryId:
                  realCategoryId,
                aiApplyEnabled: "Y",
                keyword:
                  keyword.trim() ||
                  undefined
              }
            }
          );


        setTryonProducts(
          response.data.content ?? []
        );

      } catch (error) {

        console.error(
          "AI BEAUTY 상품 조회 오류:",
          error
        );

        setTryonProducts([]);

        setTryonError(
          "AI 적용 가능 상품을 불러오지 못했습니다."
        );

      } finally {

        setTryonLoading(false);
      }
    };


  useEffect(
    () => {

      if (view !== "tryon") {
        return;
      }


      loadTryonMeta();

    },
    [view]
  );


  useEffect(
    () => {

      if (
        view !== "tryon" ||
        tryonCategories.length === 0
      ) {
        return;
      }


      loadTryonProducts(
        activeTryonCategory,
        appliedTryonKeyword
      );

    },
    [
      view,
      tryonCategories,
      activeTryonCategory,
      appliedTryonKeyword
    ]
  );

  const handleTryonCategoryChange = (
    categoryId: TryonCategoryId
  ) => {

    setActiveTryonCategory(
      categoryId
    );

    setTryonKeyword("");
    setAppliedTryonKeyword("");
    setShadeProduct(null);
  };


  const handleTryonSearch = () => {
    setAppliedTryonKeyword(
      tryonKeyword.trim()
    );
  };


  const selectTryonColor = (
    color: BeautyProductColor
  ) => {

    if (!shadeProduct) {
      return;
    }


    setSelections(
      (previous) => ({
        ...previous,
        [activeTryonCategory]: {
          product: shadeProduct,
          color
        }
      })
    );
  };


  const removeTryonSelection = (
    categoryId: TryonCategoryId
  ) => {

    setSelections(
      (previous) => {

        const next = {
          ...previous
        };

        delete next[categoryId];

        return next;
      }
    );
  };


  const handleTryonModeChange = (
    modeId: TryonMainMode
  ) => {
    setActiveTryonMode(modeId);
    setTryonKeyword("");
    setAppliedTryonKeyword("");
    setShadeProduct(null);
  };


  const handleHairCategoryChange = (
    categoryId: HairCategoryId
  ) => {
    setActiveHairCategory(categoryId);
  };


  const selectHairOption = (
    label: string
  ) => {
    setHairSelections(
      (previous) => ({
        ...previous,
        [activeHairCategory]: {
          categoryId: activeHairCategory,
          label
        }
      })
    );
  };


  const removeHairSelection = (
    categoryId: HairCategoryId
  ) => {
    setHairSelections(
      (previous) => {
        const next = {
          ...previous
        };
        delete next[categoryId];
        return next;
      }
    );
  };


  const toBeautyApplyProduct = (
    selection?: BeautySelection
  ) => {

    if (!selection) {
      return null;
    }

    return {
      productId:
        selection.product.id,

      productName:
        selection.product.name,

      brand:
        selection.product.brand || "",

      colorId:
        selection.color.id,

      colorName:
        selection.color.colorName,

      colorCode:
        selection.color.colorCode || ""
    };
  };


  const handleApplyBeauty =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        alert(
          "로그인이 필요한 기능입니다."
        );

        navigate(
          "/login"
        );

        return;
      }


      const selectedCount =
        Object.keys(
          selections
        ).length +
        Object.keys(
          hairSelections
        ).length;


      if (
        selectedCount === 0
      ) {

        alert(
          "적용할 항목을 하나 이상 선택해주세요."
        );

        return;
      }


      const hasHairSelection =
        Boolean(
          hairSelections[
            "hair-style"
          ]?.label
        )
        ||
        Boolean(
          hairSelections[
            "hair-color"
          ]?.label
        );


      /*
       * 헤어가 포함된 경우 AI 생성 전에
       * 무료 사용 가능 여부를 먼저 확인한다.
       *
       * 무료 3회를 모두 사용한 일반 회원이면
       * AI 로딩 화면으로 넘어가지 않고
       * 바로 Premium 이용권 안내를 보여준다.
       */
      if (hasHairSelection) {

        try {

          const usageResponse =
            await axiosInstance.get<AiUsageStatus>(
              `/beauty/ai-usage/member/${memberId}/status`
            );


          setHairUsageStatus(
            usageResponse.data
          );


          if (
            !usageResponse.data.premium
            &&
            Number(
              usageResponse.data.remainingCount ?? 0
            ) <= 0
          ) {

            setHairLimitReached(
              true
            );

            setTryonApplyError(
              ""
            );

            setTryonResult(
              null
            );

            return;
          }


          setHairLimitReached(
            false
          );

        } catch (usageError) {

          /*
           * 횟수 상태 조회 자체가 실패해도
           * 기존 /beauty/tryon 서버 검증은 그대로 동작하게 둔다.
           */
          console.warn(
            "AI 헤어 사용 횟수 사전 조회 실패:",
            usageError
          );
        }

      } else {

        setHairLimitReached(
          false
        );
      }


      try {

        setTryonApplying(
          true
        );

        setTryonApplyError(
          ""
        );

        setBeautySaved(
          false
        );


        const requestBody = {

          memberId,

          base:
            toBeautyApplyProduct(
              selections.base
            ),

          lip:
            toBeautyApplyProduct(
              selections.lip
            ),

          cheek:
            toBeautyApplyProduct(
              selections.blush
            ),

          eye:
            toBeautyApplyProduct(
              selections.eye
            ),

          hairStyle:
            hairSelections[
              "hair-style"
            ]?.label ?? null,

          hairColor:
            hairSelections[
              "hair-color"
            ]?.label ?? null
        };


        const response =
          await axiosInstance.post<BeautyApplyResponse>(
            "/beauty/tryon",
            requestBody,
            {
              timeout:
                180000
            }
          );


        if (
          !response.data?.success ||
          !response.data
            ?.resultImageBase64
        ) {

          throw new Error(
            "AI BEAUTY 결과 이미지를 받지 못했습니다."
          );
        }


        setTryonResult(
          response.data
        );


        window.setTimeout(
          () => {

            document
              .getElementById(
                "gd-beauty-result"
              )
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

          },
          100
        );


      } catch (error) {

        console.error(
          "AI BEAUTY 적용 오류:",
          error
        );


        const errorData =
          (
            error as {
              response?: {
                data?:
                  | {
                      message?: string;
                      error?: string;
                    }
                  | string;
              };
              message?: string;
            }
          );


        const responseData =
          errorData
            ?.response
            ?.data;


        let message =
          "AI BEAUTY 적용 중 오류가 발생했습니다.";


        if (
          typeof responseData ===
            "string" &&
          responseData.trim()
        ) {

          message =
            responseData;

        } else if (
          responseData &&
          typeof responseData ===
            "object"
        ) {

          message =
            responseData.message
            ||
            responseData.error
            ||
            message;

        } else if (
          errorData?.message
        ) {

          message =
            errorData.message;
        }


        if (
          message.includes(
            "무료 헤어 AI 체험 3회"
          )
          ||
          message.includes(
            "무료 헤어 AI"
          )
        ) {

          setHairLimitReached(
            true
          );

          setTryonApplyError(
            ""
          );

          return;
        }


        setTryonApplyError(
          message
        );


      } finally {

        setTryonApplying(
          false
        );
      }
    };


  /* =========================================
     AI BEAUTY 결과 저장
  ========================================= */

  const handleSaveBeautyResult =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        alert(
          "로그인이 필요한 기능입니다."
        );

        navigate(
          "/login"
        );

        return;
      }


      if (
        !tryonResult?.beautyResultId
      ) {

        alert(
          "저장할 AI BEAUTY 결과가 없습니다."
        );

        return;
      }


      if (beautySaved) {

        alert(
          "이미 저장한 결과입니다."
        );

        return;
      }


      try {

        setBeautySaving(
          true
        );


        const response =
          await axiosInstance.post<BeautySaveResponse>(
            "/beauty/save",
            {
              memberId,
              beautyResultId:
                tryonResult.beautyResultId,
              saveName:
                "AI BEAUTY 결과",
              memo:
                null
            }
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            "AI BEAUTY 결과 저장에 실패했습니다."
          );
        }


        setBeautySaved(
          true
        );

        await loadBeautyHistory();


        alert(
          response.data.message ||
          "AI BEAUTY 결과가 저장되었습니다."
        );


      } catch (error) {

        console.error(
          "AI BEAUTY 결과 저장 오류:",
          error
        );


        const errorData =
          error as {
            response?: {
              data?:
                | {
                    message?: string;
                    error?: string;
                  }
                | string;
            };
            message?: string;
          };


        const responseData =
          errorData
            ?.response
            ?.data;


        let message =
          "AI BEAUTY 결과를 저장하지 못했습니다.";


        if (
          typeof responseData ===
            "string" &&
          responseData.trim()
        ) {

          message =
            responseData;

        } else if (
          responseData &&
          typeof responseData ===
            "object"
        ) {

          message =
            responseData.message ||
            responseData.error ||
            message;

        } else if (
          errorData?.message
        ) {

          message =
            errorData.message;
        }


        alert(
          message
        );


      } finally {

        setBeautySaving(
          false
        );
      }
    };


  const toggleCartProductSelection = (
    productId: number
  ) => {

    setCartSelectedProductIds(
      (previous) =>
        previous.includes(
          productId
        )
          ? previous.filter(
              (id) =>
                id !== productId
            )
          : [
              ...previous,
              productId
            ]
    );
  };


  const findBeautyCartOption =
    async (
      productId: number,
      productColorId?: number | null
    ) => {

      const response =
        await axiosInstance.get<BeautyProductOption[]>(
          `/product_option/product/${productId}/available`
        );

      const availableOptions =
        (response.data ?? [])
          .filter(
            (option) =>
              option.visible === "Y" &&
              Number(option.stock ?? 0) > 0
          );

      const colorMatched =
        productColorId
          ? availableOptions.filter(
              (option) =>
                Number(option.productColorId) ===
                Number(productColorId)
            )
          : availableOptions;

      const target =
        colorMatched[0];

      if (!target) {
        throw new Error(
          "선택한 색상으로 구매 가능한 상품 옵션이 없습니다."
        );
      }

      return target;
    };


  const addBeautyProductToCart =
    async (
      productId: number,
      productColorId?: number | null
    ) => {

      const option =
        await findBeautyCartOption(
          productId,
          productColorId
        );

      await addCartItem({
        productOptionId: option.id,
        quantity: 1
      });
    };


  const handleBeautyCartItem =
    async (
      productId: number,
      productColorId?: number | null
    ) => {

      if (
        sw !== true ||
        !memberId
      ) {
        alert("로그인 후 장바구니를 이용할 수 있습니다.");
        navigate("/login");
        return;
      }

      if (cartAdding) {
        return;
      }

      try {
        setCartAdding(true);

        await addBeautyProductToCart(
          productId,
          productColorId
        );

        alert("선택한 화장품을 장바구니에 담았습니다.");
      } catch (error) {
        console.error("AI BEAUTY 장바구니 담기 오류:", error);

        alert(
          error instanceof Error
            ? error.message
            : "장바구니에 담지 못했습니다."
        );
      } finally {
        setCartAdding(false);
      }
    };


  const handleBeautyCartProducts =
    async (
      products: Array<{
        productId: number;
        productColorId?: number | null;
      }>
    ) => {

      if (
        sw !== true ||
        !memberId
      ) {
        alert("로그인 후 장바구니를 이용할 수 있습니다.");
        navigate("/login");
        return;
      }

      if (products.length === 0) {
        alert("장바구니에 담을 화장품을 선택해주세요.");
        return;
      }

      if (cartAdding) {
        return;
      }

      try {
        setCartAdding(true);

        for (const product of products) {
          await addBeautyProductToCart(
            product.productId,
            product.productColorId
          );
        }

        alert(`${products.length}개 화장품을 장바구니에 담았습니다.`);
      } catch (error) {
        console.error("AI BEAUTY 장바구니 일괄 담기 오류:", error);

        alert(
          error instanceof Error
            ? error.message
            : "선택한 화장품을 장바구니에 담지 못했습니다."
        );
      } finally {
        setCartAdding(false);
      }
    };


  const handleBeautyCartSelected =
    async (
      appliedProducts: Array<{
        selection: BeautySelection;
      }>
    ) => {

      const targets =
        appliedProducts
          .filter(
            ({ selection }) =>
              cartSelectedProductIds.includes(
                selection.product.id
              )
          )
          .map(
            ({ selection }) => ({
              productId: selection.product.id,
              productColorId: selection.color.id
            })
          );

      await handleBeautyCartProducts(
        targets
      );
    };


  const handleBeautyCartAll =
    async (
      appliedProducts: Array<{
        selection: BeautySelection;
      }>
    ) => {

      await handleBeautyCartProducts(
        appliedProducts.map(
          ({ selection }) => ({
            productId: selection.product.id,
            productColorId: selection.color.id
          })
        )
      );
    };


  const toggleHistoryCartProductSelection =
    (productId: number) => {

      setHistoryCartSelectedProductIds(
        (previous) =>
          previous.includes(productId)
            ? previous.filter(
                (id) => id !== productId
              )
            : [
                ...previous,
                productId
              ]
      );
    };


const goTryon = () => {

  if (
    sw !== true ||
    !memberId
  ) {

    alert(
      "로그인이 필요한 기능입니다."
    );

    navigate(
      "/login"
    );

    return;
  }


  if (!memberPhoto) {

    alert(
      "AI BEAUTY에 사용할 사진을 먼저 등록해주세요."
    );

    goPhoto();

    return;
  }


  /* =========================================
     새로운 AI BEAUTY 체험 시작
     기존 선택값 전체 초기화
  ========================================= */

  setSelections(
    {}
  );

  setHairSelections(
    {}
  );

  setShadeProduct(
    null
  );

  setTryonKeyword(
    ""
  );

  setAppliedTryonKeyword(
    ""
  );

  setActiveTryonMode(
    "makeup"
  );

  setActiveTryonCategory(
    "base"
  );

  setActiveHairCategory(
    "hair-style"
  );

  setTryonResult(
    null
  );

  setTryonApplyError(
    ""
  );

  setHairLimitReached(
    false
  );

  setHairUsageStatus(
    null
  );

  setBeautySaved(
    false
  );

  setCartSelectedProductIds(
    []
  );


  /*
   * sessionStorage에 남아있는
   * 이전 AI BEAUTY 선택값도 제거
   */
  sessionStorage.removeItem(
    getTryonSelectionStorageKey(
      memberId
    )
  );


  navigate(
    "/beauty?view=tryon"
  );
};


  /* =========================================
     사이드바 이동
  ========================================= */

  const goStart =
    () => {

      navigate(
        "/beauty"
      );
    };


  const goPhoto =
    () => {

      navigate(
        "/beauty?view=photo"
      );
    };


  const goHistory =
    () => {

      /*
       * 다른 메뉴에서 MY HISTORY로 다시 들어올 때는
       * 이전 상세 선택 상태를 남기지 않고
       * 항상 이용 내역 목록부터 보여준다.
       */
      setHistoryImagePreview(
        null
      );

      setSelectedHistoryId(
        null
      );


      navigate(
        "/beauty?view=saved"
      );
    };


  const goMembership =
    () => {

      navigate(
        "/beauty?view=membership"
      );
    };


  /* =========================================
     내 사진 화면
  ========================================= */

  const renderPhotoView =
    () => {

      /* 로그인하지 않은 경우 */

      if (
        sw !== true ||
        !memberId
      ) {

        return (

          <section className="gd-photo-page">

            <div className="gd-photo-page-head">

              <span>
                MY PHOTO
              </span>

              <h2>
                AI BEAUTY에 사용할 내 사진
              </h2>

              <p>
                AI BEAUTY의 메이크업과 헤어 체험을 이용하려면
                먼저 회원 사진을 등록해주세요.
              </p>

            </div>


            <div className="gd-photo-login">

              <div className="gd-photo-login-icon">
                ♡
              </div>

              <strong>
                로그인이 필요합니다.
              </strong>

              <p>
                로그인 후 AI BEAUTY에 사용할
                회원 사진을 등록할 수 있어요.
              </p>

              <button
                type="button"
                onClick={
                  () =>
                    navigate(
                      "/login"
                    )
                }
              >
                로그인하기
              </button>

            </div>

          </section>
        );
      }


      /* 조회 중 */

      if (
        photoLoading ||
        !photoLoaded
      ) {

        return (

          <section className="gd-photo-page">

            <div className="gd-photo-loading">
              회원 사진을 불러오는 중입니다.
            </div>

          </section>
        );
      }


      /* =====================================
         사진이 없거나 수정 중
      ===================================== */

      if (
        !memberPhoto ||
        photoEditing
      ) {

        return (

          <section className="gd-photo-page">

            <div className="gd-photo-page-head">

              <span>
                MY PHOTO
              </span>

              <h2>
                {
                  memberPhoto
                    ? "새로운 사진으로 변경하기"
                    : "AI BEAUTY에 사용할 내 사진"
                }
              </h2>

              <p>
                {
                  memberPhoto
                    ? "새로운 사진을 선택하면 기존 회원 대표사진도 함께 변경됩니다."
                    : "등록한 사진을 기준으로 메이크업과 헤어 체험을 진행해요."
                }
              </p>

            </div>


            <div className="gd-photo-editor">

              {/* 사진 영역 */}

              <div className="gd-photo-editor-preview">

                {photoPreview ? (

                  <img
                    src={
                      photoPreview
                    }
                    alt="선택한 회원 사진 미리보기"
                  />

                ) : memberPhoto ? (

                  <img
                    src={
                      getImageUrl(
                        memberPhoto.filePath
                      )
                    }
                    alt="현재 회원 대표사진"
                  />

                ) : (

                  <div className="gd-photo-empty-visual">

                    <span>
                      ♡
                    </span>

                    <strong>
                      NO PHOTO
                    </strong>

                    <small>
                      아직 등록된 사진이 없어요.
                    </small>

                  </div>

                )}

              </div>


              {/* 오른쪽 */}

              <div className="gd-photo-editor-info">

                {!memberPhoto && (

                  <div className="gd-photo-empty-title">

                    <strong>
                      아직 등록된 사진이 없어요.
                    </strong>

                    <p>
                      AI BEAUTY를 이용하려면
                      정면 얼굴사진을 먼저 등록해주세요.
                    </p>

                  </div>

                )}


                <div className="gd-photo-guide">

                  <span>
                    PHOTO GUIDE
                  </span>

                  <h3>
                    AI 체험에 적합한 사진
                  </h3>

                  <ul>

                    <li>
                      정면을 바라본 얼굴 사진
                    </li>

                    <li>
                      얼굴이 선명하게 보이는 사진
                    </li>

                    <li>
                      너무 어둡거나 밝지 않은 사진
                    </li>

                    <li>
                      과도한 필터나 보정이 없는 사진
                    </li>

                  </ul>

                </div>


                {/* 숨김 input */}

                <input
                  ref={
                    galleryPhotoInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={
                    handlePhotoChange
                  }
                  className="gd-photo-hidden-input"
                />


                <input
                  ref={
                    cameraPhotoInputRef
                  }
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={
                    handlePhotoChange
                  }
                  className="gd-photo-hidden-input"
                />


                <div className="gd-photo-source-actions">

                  <button
                    type="button"
                    className="gd-photo-source-button"
                    onClick={
                      () =>
                        galleryPhotoInputRef.current?.click()
                    }
                  >
                    사진 선택하기
                  </button>


                  <button
                    type="button"
                    className="gd-photo-source-button camera"
                    onClick={
                      () =>
                        cameraPhotoInputRef.current?.click()
                    }
                  >
                    카메라로 촬영
                  </button>

                </div>


                {selectedPhoto && (

                  <div className="gd-photo-selected-file">

                    <span>
                      SELECTED
                    </span>

                    <strong>
                      {
                        selectedPhoto.name
                      }
                    </strong>

                  </div>

                )}


                {/* AI 검사 */}

                {photoChecking && (

                  <div className="gd-photo-ai-check checking">

                    <span>
                      AI PHOTO CHECK
                    </span>

                    <strong>
                      사진을 확인하고 있어요.
                    </strong>

                    <p>
                      얼굴 방향, 밝기와 선명도를 확인하는 중입니다.
                    </p>

                  </div>

                )}


                {!photoChecking &&
                  photoAiResult && (

                  <div
                    className={
                      photoAiResult.valid
                        ? "gd-photo-ai-check success"
                        : "gd-photo-ai-check fail"
                    }
                  >

                    <span>
                      AI PHOTO CHECK
                    </span>

                    <strong>
                      {
                        photoAiResult.valid
                          ? "AI BEAUTY 사용 가능"
                          : "사진을 다시 확인해주세요."
                      }
                    </strong>

                    <p>
                      {
                        photoAiResult.message
                      }
                    </p>


                    {!photoAiResult.valid && (

                      <div className="gd-photo-ai-detail">

                        <span>
                          얼굴 검출{" "}
                          <b>
                            {
                              photoAiResult.faceDetected
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                        <span>
                          정면 여부{" "}
                          <b>
                            {
                              photoAiResult.isFront
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                        <span>
                          밝기{" "}
                          <b>
                            {
                              !photoAiResult.isTooDark &&
                              !photoAiResult.isTooBright
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                        <span>
                          선명도{" "}
                          <b>
                            {
                              !photoAiResult.isBlurred
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                      </div>

                    )}

                  </div>

                )}


                {photoAiError && (

                  <div className="gd-photo-ai-check fail">

                    <span>
                      AI PHOTO CHECK
                    </span>

                    <strong>
                      사진 검사에 실패했습니다.
                    </strong>

                    <p>
                      {
                        photoAiError
                      }
                    </p>

                  </div>

                )}


                <div className="gd-photo-editor-actions">

                  {memberPhoto && (

                    <button
                      type="button"
                      className="gd-photo-cancel-button"
                      onClick={
                        handlePhotoEditCancel
                      }
                    >
                      취소
                    </button>

                  )}


                  <button
                    type="button"
                    className="gd-photo-save-button"
                    disabled={
                      !selectedPhoto ||
                      photoChecking ||
                      photoSaving ||
                      !photoAiResult?.valid
                    }
                    onClick={
                      handlePhotoUpload
                    }
                  >
                    {
                      photoSaving
                        ? "저장 중..."
                        : memberPhoto
                          ? "변경사항 저장"
                          : "사진 저장하기"
                    }
                  </button>

                </div>

              </div>

            </div>

          </section>
        );
      }


      /* =====================================
         사진 등록 완료 상태
      ===================================== */

      return (

        <section className="gd-photo-page">

          <div className="gd-photo-page-head">

            <span>
              MY PHOTO
            </span>

            <h2>
              AI BEAUTY에 사용하는 내 사진
            </h2>

            <p>
              현재 등록된 회원 대표사진을
              AI BEAUTY 체험에 사용하고 있어요.
            </p>

          </div>


          <div className="gd-photo-current">

            <div className="gd-photo-current-image">

              <img
                src={
                  getImageUrl(
                    memberPhoto.filePath
                  )
                }
                alt={`${BRAND.name} 회원 대표사진`}
              />

            </div>


            <div className="gd-photo-current-info">

              <span className="gd-photo-current-overline">
                CURRENT PHOTO
              </span>


              <h3>
                AI BEAUTY 사용 사진
              </h3>


              <div className="gd-photo-available">

                <span />

                AI BEAUTY 사용 가능

              </div>


              <p className="gd-photo-current-description">
                이 사진을 기준으로 메이크업,
                헤어컬러 및 헤어스타일 체험을
                진행하게 됩니다.
              </p>


              <dl className="gd-photo-meta">

                <div>

                  <dt>
                    등록일
                  </dt>

                  <dd>
                    {
                      formatDate(
                        memberPhoto.createdAt
                      )
                    }
                  </dd>

                </div>

              </dl>


              <div className="gd-photo-current-actions">

                <button
                  type="button"
                  className="gd-photo-edit-button"
                  onClick={
                    () => {

                      resetPhotoSelection();

                      setPhotoEditing(
                        true
                      );
                    }
                  }
                >
                  사진 변경하기
                </button>


                <button
                  type="button"
                  className="gd-photo-start-button"
                  onClick={
                    goTryon
                  }
                >
                  이 사진으로 시작하기
                  <span>
                    →
                  </span>
                </button>

              </div>

            </div>

          </div>

        </section>
      );
    };


  /* =========================================
     AI BEAUTY 실제 체험 화면
  ========================================= */

  const renderTryonView =
    () => {

      if (
        sw !== true ||
        !memberId
      ) {

        return (
          <section className="gd-tryon-empty">
            <strong>
              로그인이 필요합니다.
            </strong>
            <p>
              로그인 후 등록한 얼굴사진으로
              AI BEAUTY를 체험할 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              로그인하기
            </button>
          </section>
        );
      }


      if (
        photoLoading ||
        !photoLoaded
      ) {

        return (
          <section className="gd-tryon-empty">
            회원 사진을 불러오는 중입니다.
          </section>
        );
      }


      if (!memberPhoto) {

        return (
          <section className="gd-tryon-empty">
            <strong>
              AI BEAUTY에 사용할 사진이 없어요.
            </strong>
            <p>
              먼저 정면 얼굴사진을 등록해주세요.
            </p>
            <button
              type="button"
              onClick={goPhoto}
            >
              사진 등록하기
            </button>
          </section>
        );
      }


      if (tryonApplying) {

        const promotion =
          BEAUTY_LOADING_PROMOTIONS[
            loadingPromotionIndex
          ];

        return (
          <section className="gd-beauty-processing">

            <div className="gd-beauty-processing-head">

              <span>
                AI BEAUTY PROCESSING
              </span>

              <h2>
                AI BEAUTY를 적용하고 있어요.
              </h2>

              <p>
                선택한 메이크업과 헤어를 자연스럽게 적용하는 중입니다.
                잠시만 기다려주세요.
              </p>

            </div>

            <div className="gd-beauty-processing-loader">

              <div
                className="gd-beauty-ai-loader"
                aria-hidden="true"
              >
                <div className="gd-beauty-ai-loader-orbit">
                  <span className="gd-beauty-ai-loader-dot gd-beauty-ai-loader-dot--1" />
                  <span className="gd-beauty-ai-loader-dot gd-beauty-ai-loader-dot--2" />
                  <span className="gd-beauty-ai-loader-dot gd-beauty-ai-loader-dot--3" />
                </div>

                <div className="gd-beauty-ai-loader-center">
                  ✦
                </div>
              </div>

              <strong>
                AI BEAUTY 적용 중
              </strong>

              <span>
                결과 이미지를 생성하고 있습니다.
              </span>

            </div>


            <div
              className={`gd-beauty-promotion gd-beauty-promotion--${loadingPromotionIndex}`}
              key={
                loadingPromotionIndex
              }
            >

              <div className="gd-beauty-promotion-copy">

                <div className="gd-beauty-promotion-number">
                  0{loadingPromotionIndex + 1}
                </div>

                <span>
                  {promotion.overline}
                </span>

                <h3>
                  {promotion.title}
                </h3>

                <p>
                  {promotion.description}
                </p>

                <div className="gd-beauty-promotion-line" />

              </div>


              <div className="gd-beauty-promotion-visual">

                <div className="gd-beauty-promotion-glow" />


                {loadingPromotionIndex === 0 && (

                  <div className="gd-beauty-promo-art gd-beauty-promo-art--beauty">

                    <span className="gd-beauty-promo-sparkle gd-beauty-promo-sparkle--1">
                      ✦
                    </span>

                    <span className="gd-beauty-promo-sparkle gd-beauty-promo-sparkle--2">
                      ✦
                    </span>

                    <div className="gd-beauty-promo-makeup-person">

                      <div className="gd-beauty-promo-makeup-hair" />

                      <div className="gd-beauty-promo-makeup-face">

                        <span className="gd-beauty-promo-makeup-eye left" />
                        <span className="gd-beauty-promo-makeup-eye right" />

                        <span className="gd-beauty-promo-makeup-cheek" />

                        <span className="gd-beauty-promo-makeup-mouth" />

                      </div>

                      <div className="gd-beauty-promo-makeup-neck" />

                      <div className="gd-beauty-promo-makeup-body" />

                      <div className="gd-beauty-promo-makeup-hand">
                        <span />
                      </div>

                      <div className="gd-beauty-promo-makeup-brush">
                        <span />
                        <b />
                      </div>

                      <div className="gd-beauty-promo-makeup-compact" />

                    </div>

                  </div>

                )}


                {loadingPromotionIndex === 1 && (

                  <div className="gd-beauty-promo-art gd-beauty-promo-art--color">

                    <div className="gd-beauty-promo-color-circle">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="gd-beauty-promo-face">

                      <div className="gd-beauty-promo-face-hair" />

                      <div className="gd-beauty-promo-face-bangs">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>

                      <span className="gd-beauty-promo-face-eye left" />

                      <span className="gd-beauty-promo-face-eye right" />

                      <span className="gd-beauty-promo-face-mouth" />

                    </div>

                  </div>

                )}


                {loadingPromotionIndex === 2 && (

                  <div className="gd-beauty-promo-art gd-beauty-promo-art--skin">

                    <span className="gd-beauty-promo-skin-ring" />

                    <span className="gd-beauty-promo-skin-drop gd-beauty-promo-skin-drop--1">
                      ●
                    </span>

                    <span className="gd-beauty-promo-skin-drop gd-beauty-promo-skin-drop--2">
                      ●
                    </span>

                    <span className="gd-beauty-promo-skin-spark">
                      ✦
                    </span>

                  </div>

                )}


                <div className="gd-beauty-promotion-label">

                  <span>
                    GODDESS
                  </span>

                  <strong>
                    {promotion.accent}
                  </strong>

                </div>

              </div>

            </div>


            <div className="gd-beauty-promotion-dots">

              {BEAUTY_LOADING_PROMOTIONS.map(
                (
                  _,
                  index
                ) => (

                  <span
                    key={index}
                    className={
                      index ===
                      loadingPromotionIndex
                        ? "active"
                        : ""
                    }
                  />

                )
              )}

            </div>

          </section>
        );
      }


      if (tryonResult) {

        const appliedProducts =
          TRYON_CATEGORIES
            .map(
              (item) => ({
                item,
                selection:
                  selections[
                    item.id
                  ]
              })
            )
            .filter(
              (
                entry
              ): entry is {
                item: typeof TRYON_CATEGORIES[number];
                selection: BeautySelection;
              } =>
                Boolean(
                  entry.selection
                )
            );

        const appliedHair =
          HAIR_CATEGORIES
            .map(
              (item) => ({
                item,
                selection:
                  hairSelections[
                    item.id
                  ]
              })
            )
            .filter(
              (
                entry
              ): entry is {
                item: typeof HAIR_CATEGORIES[number];
                selection: HairSelection;
              } =>
                Boolean(
                  entry.selection
                )
            );

        return (
          <section className="gd-beauty-result-page">

            <div className="gd-beauty-result-page-head">

              <div>

                <span>
                  AI BEAUTY RESULT
                </span>

                <h2>
                  적용 결과
                </h2>

                <p>
                  {tryonResult.status}
                </p>

              </div>


              <button
                type="button"
                onClick={() => {
                  setTryonResult(
                    null
                  );
                  setTryonApplyError(
                    ""
                  );
                  setBeautySaved(
                    false
                  );
                }}
              >
                다시 선택하기
              </button>

            </div>


            <div className="gd-beauty-result-layout">

              <div className="gd-beauty-result-photos">

                <div className="gd-beauty-result-photo-card">

                  <div className="gd-beauty-result-photo-title">
                    <span>BEFORE</span>
                    <strong>기존 사진</strong>
                  </div>

                  <div className="gd-beauty-result-photo-frame">
                    <img
                      src={
                        getImageUrl(
                          memberPhoto.filePath
                        )
                      }
                      alt="AI BEAUTY 적용 전"
                    />

                    <button
                      type="button"
                      className="gd-beauty-result-image-zoom"
                      onClick={() =>
                        setHistoryImagePreview(
                          getImageUrl(
                            memberPhoto.filePath
                          )
                        )
                      }
                      aria-label="BEFORE 사진 크게 보기"
                      title="BEFORE 사진 크게 보기"
                    >
                      ⛶
                    </button>
                  </div>

                </div>


                <div className="gd-beauty-result-photo-card after">

                  <div className="gd-beauty-result-photo-title">
                    <span>AFTER</span>
                    <strong>AI BEAUTY</strong>
                  </div>

                  <div className="gd-beauty-result-photo-frame">
                    <img
                      src={
                        `data:${
                          tryonResult
                            .resultContentType ||
                          "image/png"
                        };base64,${
                          tryonResult
                            .resultImageBase64
                        }`
                      }
                      alt="AI BEAUTY 적용 결과"
                    />

                    <button
                      type="button"
                      className="gd-beauty-result-image-zoom"
                      onClick={() =>
                        setHistoryImagePreview(
                          `data:${
                            tryonResult
                              .resultContentType ||
                            "image/png"
                          };base64,${
                            tryonResult
                              .resultImageBase64
                          }`
                        )
                      }
                      aria-label="AFTER 사진 크게 보기"
                      title="AFTER 사진 크게 보기"
                    >
                      ⛶
                    </button>
                  </div>

                </div>

              </div>


              <aside className="gd-beauty-result-products">

                <div className="gd-beauty-result-products-head">

                  <span>
                    APPLIED ITEMS
                  </span>

                  <h3>
                    적용한 상품
                  </h3>

                  <p>
                    원하는 상품만 선택해 장바구니로 이어갈 수 있어요.
                  </p>

                </div>


                <div className="gd-beauty-result-product-list">

                  {appliedProducts.length > 0 && (
                    <div className="gd-beauty-result-section-title">
                      <span>MAKEUP PRODUCTS</span>
                      <strong>사용한 화장품</strong>
                    </div>
                  )}

                  {appliedProducts.map(
                    ({
                      item,
                      selection
                    }) => {

                      const checked =
                        cartSelectedProductIds.includes(
                          selection.product.id
                        );

                      return (
                        <article
                          className="gd-beauty-result-product"
                          key={
                            item.id
                          }
                        >

                          <label className="gd-beauty-result-check">

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleCartProductSelection(
                                  selection.product.id
                                )
                              }
                            />

                            <span />

                          </label>


                          <button
                            type="button"
                            className="gd-beauty-result-product-image"
                            onClick={() =>
                              navigate(
                                `/products/${selection.product.id}`
                              )
                            }
                          >
                            <img
                              src={
                                getProductThumbnail(
                                  selection.product.id
                                )
                              }
                              alt={
                                selection.product.name
                              }
                            />
                          </button>


                          <div className="gd-beauty-result-product-info">

                            <small>
                              {item.label}
                            </small>

                            <strong>
                              {
                                selection.product.brand ||
                                "GODDESS"
                              }
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/products/${selection.product.id}`
                                )
                              }
                            >
                              {
                                selection.product.name
                              }
                            </button>

                            <span>
                              {
                                selection.color.colorName
                              }
                            </span>

                            <b>
                              {
                                Number(
                                  selection.product.price || 0
                                ).toLocaleString(
                                  "ko-KR"
                                )
                              }
                              원
                            </b>

                          </div>


                          <button
                            type="button"
                            className="gd-beauty-result-item-cart"
                            onClick={() =>
                              handleBeautyCartItem(
                                selection.product.id,
                                selection.color.id
                              )
                            }
                          >
                            장바구니
                          </button>

                        </article>
                      );
                    }
                  )}


                  {appliedHair.length > 0 && (
                    <div className="gd-beauty-result-section-title hair">
                      <span>HAIR</span>
                      <strong>적용한 헤어</strong>
                    </div>
                  )}

                  {appliedHair.map(
                    ({
                      item,
                      selection
                    }) => (

                      <article
                        className="gd-beauty-result-hair"
                        key={
                          item.id
                        }
                      >

                        <span>
                          {item.overline}
                        </span>

                        <strong>
                          {selection.label}
                        </strong>

                        <small>
                          PREMIUM AI
                        </small>

                      </article>

                    )
                  )}

                </div>


                {appliedProducts.length > 0 && (

                  <div className="gd-beauty-result-cart-actions">

                    <button
                      type="button"
                      className="gd-beauty-result-cart-selected"
                      disabled={cartAdding}
                      onClick={() =>
                        handleBeautyCartSelected(
                          appliedProducts
                        )
                      }
                    >
                      {cartAdding ? "담는 중..." : "선택 상품 장바구니 담기"}
                      <span>
                        {
                          cartSelectedProductIds.length
                        }
                        개 선택
                      </span>
                    </button>

                    <button
                      type="button"
                      className="gd-beauty-result-cart-all"
                      disabled={cartAdding}
                      onClick={() =>
                        handleBeautyCartAll(
                          appliedProducts
                        )
                      }
                    >
                      모두 장바구니 담기
                    </button>

                    <button
                      type="button"
                      className="gd-beauty-result-go-cart"
                      onClick={() =>
                        navigate(
                          "/cart"
                        )
                      }
                    >
                      장바구니 보기
                    </button>

                  </div>

                )}

              </aside>

            </div>


            <div className="gd-beauty-result-bottom">

              <button
                type="button"
                onClick={() => {
                  setTryonResult(
                    null
                  );
                  setTryonApplyError(
                    ""
                  );
                  setBeautySaved(
                    false
                  );
                }}
              >
                다른 조합 체험하기
              </button>

              <button
                type="button"
                className="primary"
                onClick={
                  handleSaveBeautyResult
                }
                disabled={
                  beautySaving ||
                  beautySaved
                }
              >
                {
                  beautySaving
                    ? "저장 중..."
                    : beautySaved
                      ? "저장 완료"
                      : "결과 저장"
                }
              </button>

            </div>


            {historyImagePreview && (

              <div
                className="gd-history-image-modal"
                role="dialog"
                aria-modal="true"
                aria-label="AI BEAUTY 결과 사진 크게 보기"
                onClick={
                  handleCloseHistoryImage
                }
              >

                <div
                  className="gd-history-image-modal-inner"
                  onClick={
                    (
                      event
                    ) =>
                      event.stopPropagation()
                  }
                >

                  <button
                    type="button"
                    className="gd-history-image-modal-close"
                    onClick={
                      handleCloseHistoryImage
                    }
                    aria-label="큰 이미지 닫기"
                  >
                    ×
                  </button>

                  <img
                    src={
                      historyImagePreview
                    }
                    alt="AI BEAUTY 결과 크게 보기"
                  />

                </div>

              </div>
            )}

          </section>
        );
      }


      const activeConfig =
        getTryonCategory(
          activeTryonCategory
        );


      const shadeColors =
        shadeProduct
          ? tryonColors
              .filter(
                (color) =>
                  color.productId ===
                    shadeProduct.id &&
                  color.visible !== "N" &&
                  color.aiApplyEnabled !== "N"
              )
              .sort(
                (a, b) =>
                  Number(b.isMain === "Y") -
                    Number(a.isMain === "Y") ||
                  (a.sortOrder ?? 0) -
                    (b.sortOrder ?? 0)
              )
          : [];


      const makeupSelectedCount =
        Object.keys(
          selections
        ).length;

      const hairSelectedCount =
        Object.keys(
          hairSelections
        ).length;

      const selectedCount =
        makeupSelectedCount +
        hairSelectedCount;

      const hairOptions =
        activeHairCategory === "hair-style"
          ? HAIR_STYLE_OPTIONS
          : HAIR_COLOR_OPTIONS;


      return (
        <section className="gd-tryon-page">

          <div className="gd-tryon-head">
            <span>
              AI BEAUTY EXPERIENCE
            </span>
            <h2>
              메이크업과 헤어를 한 번에 체험해보세요.
            </h2>
            <p>
              원하는 항목만 선택해주세요
              메이크업과 헤어 선택은 서로 유지됩니다.
            </p>
          </div>


          <div className="gd-tryon-mode-tabs">
            <button
              type="button"
              className={
                activeTryonMode === "makeup"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleTryonModeChange("makeup")
              }
            >
              <span>MAKEUP</span>
              메이크업
            </button>

            <button
              type="button"
              className={
                activeTryonMode === "hair"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleTryonModeChange("hair")
              }
            >
              <span>HAIR</span>
              헤어
              <em>PREMIUM</em>
            </button>
          </div>


          <div className="gd-tryon-stage">

            <div className="gd-tryon-face gd-tryon-face-large">
              <span>MY PHOTO</span>
              <div className="gd-tryon-face-image">
                <img
                  src={
                    getImageUrl(
                      memberPhoto.filePath
                    )
                  }
                  alt="AI BEAUTY 회원 대표사진"
                />
              </div>
              <button
                type="button"
                onClick={goPhoto}
              >
                사진 변경
              </button>
            </div>


            <div className="gd-tryon-workspace gd-tryon-workspace-right">

              {activeTryonMode === "makeup" ? (
                <>
                  <div className="gd-tryon-category-panel">
                    <span>MAKEUP CATEGORY</span>
                    <h3>
                      어떤 메이크업을 적용할까요?
                    </h3>
                    <p>
                      카테고리를 선택하면 해당 상품을 바로 찾아볼 수 있어요.
                    </p>

                    <div className="gd-tryon-category-tabs">
                      {TRYON_CATEGORIES.map(
                        (item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={
                              activeTryonCategory ===
                              item.id
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              handleTryonCategoryChange(
                                item.id
                              )
                            }
                          >
                            <span>
                              {item.overline}
                            </span>
                            {item.label}
                          </button>
                        )
                      )}
                    </div>
                  </div>


                  <div className="gd-tryon-shop">
                    <div className="gd-tryon-shop-head">
                      <div>
                        <span>
                          {activeConfig.overline}
                        </span>
                        <h3>
                          {activeConfig.label} 상품
                        </h3>
                      </div>

                      <div className="gd-tryon-search">
                        <input
                          type="search"
                          value={tryonKeyword}
                          placeholder="상품명 또는 브랜드 검색"
                          onChange={(event) =>
                            setTryonKeyword(
                              event.target.value
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              handleTryonSearch();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleTryonSearch}
                        >
                          검색
                        </button>
                      </div>
                    </div>

                    {tryonError && (
                      <div className="gd-tryon-message error">
                        {tryonError}
                      </div>
                    )}

                    {tryonLoading ? (
                      <div className="gd-tryon-message">
                        AI 적용 가능 상품을 불러오는 중입니다.
                      </div>
                    ) : tryonProducts.length === 0 ? (
                      <div className="gd-tryon-message">
                        조건에 맞는 AI 적용 가능 상품이 없어요.
                      </div>
                    ) : (
                      <div className="gd-tryon-product-scroll">
                        <div className="gd-tryon-product-grid">
                          {tryonProducts.map(
                            (product) => (
                              <article
                                className={
                                  shadeProduct?.id ===
                                  product.id
                                    ? "gd-tryon-product-card active"
                                    : "gd-tryon-product-card"
                                }
                                key={product.id}
                              >
                                <button
                                  type="button"
                                  className="gd-tryon-product-image"
                                  onClick={() =>
                                    setShadeProduct(
                                      product
                                    )
                                  }
                                  aria-label={`${product.name} 색상 선택`}
                                >
                                  <img
                                    src={
                                      getProductThumbnail(
                                        product.id
                                      )
                                    }
                                    alt={product.name}
                                  />
                                </button>

                                <div className="gd-tryon-product-info">
                                  <span>
                                    {product.brand ||
                                      "GODDESS"}
                                  </span>

                                  <button
                                    type="button"
                                    className="gd-tryon-product-name"
                                    onClick={() =>
                                      navigate(
                                        `/products/${product.id}`
                                      )
                                    }
                                  >
                                    {product.name}
                                  </button>

                                  <button
                                    type="button"
                                    className="gd-tryon-product-select"
                                    onClick={() =>
                                      setShadeProduct(
                                        product
                                      )
                                    }
                                  >
                                    색상 선택
                                  </button>
                                </div>
                              </article>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {shadeProduct && (
                      <div className="gd-tryon-shades gd-tryon-shades-compact">
                        <div className="gd-tryon-shades-title">
                          <span>SELECT SHADE</span>
                          <strong>
                            {shadeProduct.brand &&
                              `${shadeProduct.brand} · `}
                            {shadeProduct.name}
                          </strong>
                        </div>

                        {shadeColors.length === 0 ? (
                          <div className="gd-tryon-message">
                            AI 적용 가능한 색상이 등록되어 있지 않아요.
                          </div>
                        ) : (
                          <div className="gd-tryon-shade-list">
                            {shadeColors.map(
                              (color) => {

                                const selected =
                                  selections[
                                    activeTryonCategory
                                  ]?.color.id ===
                                  color.id;

                                return (
                                  <button
                                    type="button"
                                    key={color.id}
                                    className={
                                      selected
                                        ? "active"
                                        : ""
                                    }
                                    onClick={() =>
                                      selectTryonColor(
                                        color
                                      )
                                    }
                                  >
                                    <span
                                      className="gd-tryon-color-dot"
                                      style={
                                        color.colorCode
                                          ? {
                                              backgroundColor:
                                                color.colorCode
                                            }
                                          : undefined
                                      }
                                    />
                                    <strong>
                                      {color.colorName}
                                    </strong>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="gd-tryon-category-panel">
                    <span>HAIR CATEGORY</span>
                    <h3>
                      어떤 헤어를 적용할까요?
                    </h3>
                    <p>
                      일반 회원은 매월 3회 무료로 이용할 수 있고,
                      Premium 회원은 횟수 제한 없이 이용할 수 있습니다.
                    </p>

                    <div className="gd-tryon-category-tabs gd-tryon-hair-tabs">
                      {HAIR_CATEGORIES.map(
                        (item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={
                              activeHairCategory ===
                              item.id
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              handleHairCategoryChange(
                                item.id
                              )
                            }
                          >
                            <span>
                              {item.overline}
                            </span>
                            {item.label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="gd-tryon-shop gd-tryon-hair-shop">
                    <div className="gd-tryon-shop-head">
                      <div>
                        <span>
                          {activeHairCategory === "hair-style"
                            ? "HAIR STYLE"
                            : "HAIR COLOR"}
                        </span>
                        <h3>
                          {activeHairCategory === "hair-style"
                            ? "헤어스타일 선택"
                            : "헤어컬러 선택"}
                        </h3>
                      </div>
                    </div>

                    <div className="gd-tryon-hair-options">
                      {hairOptions.map(
                        (option) => {

                          const selected =
                            hairSelections[
                              activeHairCategory
                            ]?.label === option.label;

                          const isHairColor =
                            activeHairCategory === "hair-color";

                          const colorCode =
                            "colorCode" in option
                              ? option.colorCode
                              : undefined;

                          const description =
                            "description" in option
                              ? option.description
                              : undefined;

                          return (
                            <button
                              type="button"
                              key={option.label}
                              className={
                                selected
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                selectHairOption(
                                  option.label
                                )
                              }
                            >
                              <div className="gd-tryon-hair-option-top">

                                <span>
                                  {isHairColor
                                    ? "COLOR"
                                    : "STYLE"}
                                </span>

                                {isHairColor &&
                                  colorCode && (

                                  <i
                                    className="gd-tryon-hair-color-chip"
                                    style={{
                                      backgroundColor:
                                        colorCode
                                    }}
                                    aria-hidden="true"
                                  />

                                )}

                              </div>

                              <strong>
                                {option.label}
                              </strong>

                              {description && (

                                <small>
                                  {description}
                                </small>

                              )}

                              {isHairColor &&
                                colorCode && (

                                <em>
                                  {colorCode}
                                </em>

                              )}

                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="gd-tryon-premium-note">
                      <strong>PREMIUM</strong>
                      <p>
                        헤어스타일 또는 헤어컬러가 포함된 결과 생성 1회당 1회 차감됩니다.
                        헤어스타일과 헤어컬러를 동시에 적용해도 1회로 계산됩니다.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>


          <div className="gd-tryon-selection gd-tryon-selection-compact">
            <div className="gd-tryon-selection-topline">
              <div>
                <span>YOUR SELECTION</span>
                <h3>현재 선택</h3>
              </div>

              {selectedCount > 0 && (
                <button
                  type="button"
                  className="gd-tryon-clear-all"
                  onClick={() => {
                    setSelections({});
                    setHairSelections({});
                    setShadeProduct(null);
                  }}
                >
                  전체 초기화
                </button>
              )}
            </div>

            {selectedCount === 0 ? (
              <p className="gd-tryon-selection-empty-text">
                아직 선택한 항목이 없어요.
              </p>
            ) : (
              <div className="gd-tryon-selection-chips">
                {TRYON_CATEGORIES.map(
                  (item) => {
                    const selection =
                      selections[item.id];

                    if (!selection) {
                      return null;
                    }

                    return (
                      <div
                        className="gd-tryon-selection-chip"
                        key={item.id}
                      >
                        <button
                          type="button"
                          className="gd-tryon-selection-product"
                          onClick={() =>
                            navigate(
                              `/products/${selection.product.id}`
                            )
                          }
                        >
                          <b>{item.overline}</b>
                          <span>
                            {selection.product.brand || "GODDESS"}
                            {" · "}
                            {selection.product.name}
                            {" · "}
                            {selection.color.colorName}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="gd-tryon-chip-remove"
                          onClick={() =>
                            removeTryonSelection(
                              item.id
                            )
                          }
                          aria-label={`${item.label} 선택 해제`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  }
                )}

                {HAIR_CATEGORIES.map(
                  (item) => {
                    const selection =
                      hairSelections[item.id];

                    if (!selection) {
                      return null;
                    }

                    return (
                      <div
                        className="gd-tryon-selection-chip"
                        key={item.id}
                      >
                        <div className="gd-tryon-selection-product static">
                          <b>{item.overline}</b>
                          <span>{selection.label}</span>
                        </div>
                        <button
                          type="button"
                          className="gd-tryon-chip-remove"
                          onClick={() =>
                            removeHairSelection(
                              item.id
                            )
                          }
                          aria-label={`${item.label} 선택 해제`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            <button
              type="button"
              className="gd-tryon-apply"
              disabled={
                selectedCount === 0 ||
                tryonApplying
              }
              onClick={
                handleApplyBeauty
              }
            >
              <strong>
                {
                  tryonApplying
                    ? "AI BEAUTY 적용 중..."
                    : "AI BEAUTY 적용하기"
                }
              </strong>

              <span>
                {
                  tryonApplying
                    ? "잠시만 기다려주세요"
                    : selectedCount > 0
                      ? `${selectedCount}개 선택`
                      : "항목을 선택해주세요"
                }
              </span>
            </button>

            {tryonApplyError && (

              <div className="gd-tryon-apply-error">

                <strong>
                  AI BEAUTY 적용에 실패했습니다.
                </strong>

                <p>
                  {tryonApplyError}
                </p>

              </div>

            )}
          </div>


          {hairLimitReached && (

            <div
              className="gd-hair-limit-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gd-hair-limit-title"
              onClick={() =>
                setHairLimitReached(
                  false
                )
              }
            >

              <div
                className="gd-hair-limit-modal-inner"
                onClick={
                  (event) =>
                    event.stopPropagation()
                }
              >

                <button
                  type="button"
                  className="gd-hair-limit-modal-close"
                  aria-label="무료 헤어 AI 안내 닫기"
                  onClick={() =>
                    setHairLimitReached(
                      false
                    )
                  }
                >
                  ×
                </button>


                <div className="gd-hair-limit-top">

                  <div>

                    <span>
                      PREMIUM
                    </span>

                    <h3 id="gd-hair-limit-title">
                      이번 달 무료 헤어 AI 3회를 모두 사용했어요.
                    </h3>

                    <p>
                      메이크업 AI는 계속 무료로 이용할 수 있습니다.
                      헤어스타일과 헤어컬러를 더 체험하고 싶다면
                      Premium 이용권으로 횟수 제한 없이 이용해보세요.
                    </p>

                  </div>


                  <div className="gd-hair-limit-count">

                    <small>
                      THIS MONTH
                    </small>

                    <strong>
                      {
                        hairUsageStatus?.usedCount ??
                        3
                      }
                      /
                      {
                        hairUsageStatus?.monthlyLimit ??
                        3
                      }
                    </strong>

                    <span>
                      무료 이용 완료
                    </span>

                  </div>

                </div>


                <div className="gd-hair-limit-plans">

                  <div>

                    <span>
                      MONTHLY
                    </span>

                    <strong>
                      5,000원
                    </strong>

                    <small>
                      / 월
                    </small>

                    <p>
                      한 달 동안 헤어 AI 무제한
                    </p>

                  </div>


                  <div className="recommended">

                    <span>
                      YEARLY · BEST
                    </span>

                    <div>

                      <del>
                        60,000원
                      </del>

                      <strong>
                        40,000원
                      </strong>

                      <small>
                        / 년
                      </small>

                    </div>

                    <p>
                      약 33% 할인 · 1년 동안 헤어 AI 무제한
                    </p>

                  </div>

                </div>


                <div className="gd-hair-limit-actions">

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {

                      setHairSelections(
                        {}
                      );

                      setHairLimitReached(
                        false
                      );

                      setActiveTryonMode(
                        "makeup"
                      );
                    }}
                  >
                    메이크업만 계속하기
                  </button>


                  <button
                    type="button"
                    className="primary"
                    onClick={() => {

                      setHairLimitReached(
                        false
                      );

                      navigate(
                        "/beauty?view=membership"
                      );
                    }}
                  >
                    Premium 이용권 보러가기
                    <span>
                      →
                    </span>
                  </button>

                </div>


                <p className="gd-hair-limit-note">
                  무료 헤어 AI 이용 횟수는 매월 다시 제공됩니다.
                </p>

              </div>

            </div>

          )}


        </section>
      );
    };


  /* =========================================
     저장 내역
  ========================================= */

  const renderSavedView =
    () => {

      if (
        sw !== true ||
        !memberId
      ) {

        return (
          <section className="gd-history-login-page">

            <div className="gd-history-login-head">
              <span>MY HISTORY</span>

              <h2>
                AI BEAUTY
              </h2>

              <p>
                저장한 AI BEAUTY 결과와 내가 체험한 스타일을
                한 곳에서 다시 확인해보세요.
              </p>
            </div>


            <div className="gd-history-login-card">


              <h3>
                로그인해야 이용내역을 볼 수 있어요
              </h3>

              <p>
                메이크업과 헤어 AI 체험 결과를 저장하고,
                언제든 다시 확인할 수 있습니다.
              </p>


              <div className="gd-history-login-features">

                <div>
                  <strong>BEFORE · AFTER</strong>
                  <span>AI 적용 결과 다시보기</span>
                </div>

                <div>
                  <strong>MY STYLE</strong>
                  <span>적용한 메이크업 · 헤어 확인</span>
                </div>

                <div>
                  <strong>SHOPPING</strong>
                  <span>사용한 상품 다시 확인</span>
                </div>

              </div>


              <button
                type="button"
                className="gd-history-login-button"
                onClick={() =>
                  navigate("/login")
                }
              >
                로그인하기
                <span>→</span>
              </button>

            </div>

          </section>
        );
      }


      if (beautyHistoryLoading) {

        return (
          <section className="gd-beauty-placeholder">
            <span>MY HISTORY</span>
            <h2>나의 이용 내역</h2>

            <div className="gd-beauty-placeholder-box">
              <strong>
                저장한 AI BEAUTY 결과를 불러오는 중입니다.
              </strong>
            </div>
          </section>
        );
      }


      const selectedHistory =
        selectedHistoryId
          ? beautyHistory.find(
              (history) =>
                history.beautySaveId ===
                selectedHistoryId
            )
          : null;


      /*
       * 상세보기
       * 목록에서 한 건을 클릭하면
       * BEFORE / AFTER와 전체 적용 항목을 표시한다.
       */
      if (selectedHistory) {

        const historyMakeupItems =
          selectedHistory.items.filter(
            (item) =>
              Boolean(item.productId)
          );

        const historyHairItems =
          selectedHistory.items.filter(
            (item) =>
              item.itemType === "HAIR_STYLE" ||
              item.itemType === "HAIR_COLOR"
          );

        const selectedHistoryCartItems =
          historyMakeupItems.filter(
            (item) =>
              item.productId &&
              historyCartSelectedProductIds.includes(
                item.productId
              )
          );

        return (
          <section className="gd-history-page">

            <div className="gd-history-detail-head">

              <button
                type="button"
                className="gd-history-back"
                onClick={
                  handleBackToHistoryList
                }
              >
                ← 이용 내역 목록
              </button>

              <div>
                <span>
                  AI BEAUTY HISTORY
                </span>

                <h2>
                  {selectedHistory.saveName || "AI BEAUTY 결과"}
                </h2>

                <p>
                  {formatDate(selectedHistory.createdAt)}
                </p>
              </div>

            </div>


            <article className="gd-history-detail-card">

              <div className="gd-history-detail-images">

                <div>
                  <span>BEFORE</span>

                  <img
                    src={
                      getImageUrl(
                        selectedHistory.beforeFilePath
                      )
                    }
                    alt="AI BEAUTY 적용 전"
                  />
                </div>


                <div className="gd-history-after-image">
                  <span>AFTER</span>

                  <div className="gd-history-image-wrap">

                    <img
                      src={
                        getImageUrl(
                          selectedHistory.resultFilePath
                        )
                      }
                      alt="저장한 AI BEAUTY 결과"
                    />

                    <button
                      type="button"
                      className="gd-history-image-zoom"
                      onClick={() =>
                        handleOpenHistoryImage(
                          selectedHistory.resultFilePath
                        )
                      }
                      aria-label="결과 사진 크게 보기"
                      title="결과 사진 크게 보기"
                    >
                      ⛶
                    </button>

                  </div>

                </div>

              </div>


              <div className="gd-history-detail-info">

                <span className="gd-history-detail-overline">
                  APPLIED ITEMS
                </span>

                <h3>
                  적용한 항목
                </h3>


                {historyMakeupItems.length > 0 && (
                  <div className="gd-history-item-section">
                    <div className="gd-history-item-section-head">
                      <div>
                        <span>MAKEUP PRODUCTS</span>
                        <strong>사용한 화장품</strong>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setHistoryCartSelectedProductIds(
                            historyMakeupItems
                              .map((item) => item.productId)
                              .filter(
                                (productId): productId is number =>
                                  Boolean(productId)
                              )
                          )
                        }
                      >
                        모두 선택
                      </button>
                    </div>

                    <div className="gd-history-detail-items">
                      {historyMakeupItems.map(
                        (item, index) => {
                          const productId = item.productId as number;
                          const checked =
                            historyCartSelectedProductIds.includes(productId);

                          return (
                            <div
                              className="gd-history-detail-item product"
                              key={`${selectedHistory.beautySaveId}-${item.itemType}-${index}`}
                            >
                              <label className="gd-history-cart-check">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleHistoryCartProductSelection(productId)
                                  }
                                />
                                <span />
                              </label>

                              <strong>
                                {item.itemType === "BASE"
                                  ? "베이스"
                                  : item.itemType === "LIP"
                                    ? "립"
                                    : item.itemType === "CHEEK"
                                      ? "치크"
                                      : item.itemType === "EYE"
                                        ? "아이"
                                        : item.itemType}
                              </strong>

                              <button
                                type="button"
                                className="gd-history-product-link"
                                onClick={() =>
                                  navigate(`/products/${productId}`)
                                }
                              >
                                <span>
                                  {item.brand || "GODDESS"}
                                  {" · "}
                                  {item.productName}
                                </span>

                                {item.colorName && (
                                  <small>{item.colorName}</small>
                                )}
                              </button>

                              <button
                                type="button"
                                className="gd-history-item-cart-button"
                                disabled={cartAdding}
                                onClick={() =>
                                  handleBeautyCartItem(
                                    productId,
                                    item.productColorId
                                  )
                                }
                              >
                                장바구니
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div className="gd-history-cart-actions">
                      <button
                        type="button"
                        className="primary"
                        disabled={
                          cartAdding ||
                          selectedHistoryCartItems.length === 0
                        }
                        onClick={() =>
                          handleBeautyCartProducts(
                            selectedHistoryCartItems.map(
                              (item) => ({
                                productId: item.productId as number,
                                productColorId: item.productColorId
                              })
                            )
                          )
                        }
                      >
                        {cartAdding
                          ? "담는 중..."
                          : `선택 상품 담기 (${selectedHistoryCartItems.length})`}
                      </button>

                      <button
                        type="button"
                        disabled={cartAdding}
                        onClick={() =>
                          handleBeautyCartProducts(
                            historyMakeupItems.map(
                              (item) => ({
                                productId: item.productId as number,
                                productColorId: item.productColorId
                              })
                            )
                          )
                        }
                      >
                        모두 장바구니 담기
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate("/cart")}
                      >
                        장바구니 보기
                      </button>
                    </div>
                  </div>
                )}

                {historyHairItems.length > 0 && (
                  <div className="gd-history-item-section hair">
                    <div className="gd-history-item-section-head">
                      <div>
                        <span>HAIR</span>
                        <strong>적용한 헤어</strong>
                      </div>
                    </div>

                    <div className="gd-history-detail-items">
                      {historyHairItems.map(
                        (item, index) => (
                          <div
                            className="gd-history-detail-item hair"
                            key={`${selectedHistory.beautySaveId}-${item.itemType}-${index}`}
                          >
                            <strong>
                              {item.itemType === "HAIR_STYLE"
                                ? "헤어스타일"
                                : "헤어 컬러"}
                            </strong>

                            <span>{item.styleValue || "-"}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedHistory.memo && (
                  <p className="gd-history-memo">
                    {selectedHistory.memo}
                  </p>
                )}

              </div>

            </article>

            <div className="gd-history-page-actions">
              <button
                type="button"
                className="gd-history-download-button"
                onClick={() =>
                  handleDownloadHistoryImage(
                    selectedHistory
                  )
                }
              >
                결과 사진 저장하기
              </button>

              <button
                type="button"
                className="gd-history-delete-button"
                disabled={historyDeleting}
                onClick={() =>
                  handleDeleteBeautyHistory(
                    selectedHistory
                  )
                }
              >
                {
                  historyDeleting
                    ? "삭제 중..."
                    : "이용 내역 삭제"
                }
              </button>
            </div>


            {historyImagePreview && (

              <div
                className="gd-history-image-modal"
                role="dialog"
                aria-modal="true"
                aria-label="AI BEAUTY 결과 사진 크게 보기"
                onClick={
                  handleCloseHistoryImage
                }
              >

                <div
                  className="gd-history-image-modal-inner"
                  onClick={
                    (
                      event
                    ) =>
                      event.stopPropagation()
                  }
                >

                  <button
                    type="button"
                    className="gd-history-image-modal-close"
                    onClick={
                      handleCloseHistoryImage
                    }
                    aria-label="큰 이미지 닫기"
                  >
                    ×
                  </button>

                  <img
                    src={
                      historyImagePreview
                    }
                    alt="AI BEAUTY 결과 크게 보기"
                  />

                </div>

              </div>
            )}

          </section>
        );
      }


      /*
       * 목록
       * 사진 없이 가로형 카드로 표시한다.
       * 저장일 기준 최신 내역이 항상 위로 오도록 정렬한다.
       */
      const sortedBeautyHistory = [
        ...beautyHistory
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime()
          -
          new Date(a.createdAt).getTime()
      );


      return (
        <section className="gd-history-page">

          <div className="gd-history-head">

            <div>
              <span>MY HISTORY</span>

              <h2>
                나의 이용 내역
              </h2>

              <p>
                저장한 AI BEAUTY 체험을 최신순으로 확인하고,
                원하는 내역을 눌러 상세 결과를 다시 볼 수 있어요.
              </p>
            </div>


            <button
              type="button"
              onClick={goTryon}
            >
              새 AI BEAUTY 체험
            </button>

          </div>


          {beautyHistoryError && (
            <div className="gd-history-message error">
              {beautyHistoryError}
            </div>
          )}


          {!beautyHistoryError &&
            beautyHistory.length === 0 && (

            <div className="gd-beauty-placeholder-box">

              <strong>
                아직 저장된 이용 내역이 없어요.
              </strong>

              <p>
                AI BEAUTY 체험 후 마음에 드는 결과를
                저장하면 이곳에서 다시 확인할 수 있어요.
              </p>

              <button
                type="button"
                className="gd-history-empty-start-button"
                onClick={goTryon}
              >
                <span>
                  AI BEAUTY 시작하기
                </span>

                <b>
                  →
                </b>
              </button>

            </div>
          )}


          <div className="gd-history-compact-list">

            {sortedBeautyHistory.map(
              (history) => {

                const summaryItems =
                  history.items
                    .map(
                      (item) => {

                        const label =
                          item.itemType === "HAIR_STYLE"
                            ? "헤어스타일"
                            : item.itemType === "HAIR_COLOR"
                              ? "헤어 컬러"
                              : item.itemType === "BASE"
                                ? "베이스"
                                : item.itemType === "LIP"
                                  ? "립"
                                  : item.itemType === "CHEEK"
                                    ? "치크"
                                    : item.itemType === "EYE"
                                      ? "아이"
                                      : item.itemType;

                        const value =
                          item.styleValue
                          ||
                          (
                            item.productName
                              ? `${item.productName}${
                                  item.colorName
                                    ? ` · ${item.colorName}`
                                    : ""
                                }`
                              : "-"
                          );

                        return {
                          label,
                          value
                        };
                      }
                    );


                return (
                  <button
                    type="button"
                    className="gd-history-compact-row"
                    key={history.beautySaveId}
                    onClick={() => {
                      setSelectedHistoryId(
                        history.beautySaveId
                      );
                      setHistoryCartSelectedProductIds([]);
                      setParams({
                        view: "saved",
                        historyId: String(history.beautySaveId)
                      });
                    }}
                  >

                    <div className="gd-history-row-type">

                      <span>
                        {
                          history.beautyType === "MAKEUP"
                            ? "MAKEUP"
                            : history.beautyType === "HAIR_STYLE" ||
                              history.beautyType === "HAIR_COLOR"
                              ? "HAIR"
                              : "AI BEAUTY"
                        }
                      </span>

                      <strong>
                        {history.saveName || "AI BEAUTY 결과"}
                      </strong>

                    </div>


                    <div className="gd-history-compact-summary">

                      {summaryItems.map(
                        (item, index) => (

                          <div
                            className="gd-history-compact-item"
                            key={`${history.beautySaveId}-${index}`}
                          >

                            <small>
                              {item.label}
                            </small>

                            <strong>
                              {item.value}
                            </strong>

                          </div>

                        )
                      )}

                    </div>


                    <div className="gd-history-compact-date">

                      <span>
                        {formatDate(history.createdAt)}
                      </span>

                      <b>
                        →
                      </b>

                    </div>

                  </button>
                );
              }
            )}

          </div>

        </section>
      );
    };


  /* =========================================
     이용권 · 구독 - 현재 화면 준비
  ========================================= */

  const renderMembershipView =
  () => (

    <BeautyMembership />

  );


  /* =========================================
     START 기본 화면
  ========================================= */

  const renderStartView = () => {
    const startSteps = [
      {
        no: "01",
        title: "사진 선택",
        desc: "나의 정면 사진을 업로드해요.",
      },
      {
        no: "02",
        title: "스타일 선택",
        desc: "메이크업, 헤어스타일, 헤어컬러 중 원하는 스타일을 선택해요.",
      },
      {
        no: "03",
        title: "결과 및 저장",
        desc: "AI가 적용한 스타일을 확인하고 마음에 드는 결과를 저장해요.",
      },
    ];

    const photoGuide = [
      {
        title: "정면 사진",
        desc: "얼굴이 정면으로 나온 사진이 가장 좋아요.",
      },
      {
        title: "밝은 조명",
        desc: "어두운 곳보다 밝은 곳에서 촬영한 사진을 추천해요.",
      },
      {
        title: "필터 없는 사진",
        desc: "필터나 보정이 없는 자연스러운 사진이 좋아요.",
      },
      {
        title: "얼굴이 잘 보이는 사진",
        desc: "머리카락으로 얼굴이 가려지지 않은 사진을 올려주세요.",
      },
    ];

    const startStepVisual = (type: "photo" | "style" | "result") => (
      <div className={`gd-start-cute gd-start-cute--${type}`} aria-hidden="true">
        <div className="gd-cute-head">
          <span className="gd-cute-hair" />
          <span className="gd-cute-eye gd-cute-eye--left" />
          <span className="gd-cute-eye gd-cute-eye--right" />
          <span className="gd-cute-cheek gd-cute-cheek--left" />
          <span className="gd-cute-cheek gd-cute-cheek--right" />
          <span className="gd-cute-mouth" />
        </div>
        {type === "photo" && <span className="gd-cute-photo-frame" />}
        {type === "style" && (
          <div className="gd-cute-palette">
            <span /><span /><span /><span />
          </div>
        )}
        {type === "result" && <span className="gd-cute-sparkle">✦</span>}
      </div>
    );

    const beautyStyleCards = [
      { id: "makeup", label: "메이크업", desc: "립, 치크, 베이스, 아이라이너로 다양한 메이크업을 체험해보세요." },
      { id: "hair-style", label: "헤어스타일", desc: "단발, 웨이브, 레이어드 등 눈에 띄는 스타일 변화를 미리 만나보세요." },
      { id: "hair-color", label: "헤어컬러", desc: "브라운, 애쉬, 레드 등 다양한 컬러로 염색한 모습을 확인해보세요." },
    ] as const;

    const beautyBenefits = [
      {
        no: "01",
        title: "내 사진 기반 체험",
        desc: "등록한 회원 사진을 기준으로 나에게 어울리는 스타일을 직접 확인할 수 있어요.",
      },
      {
        no: "02",
        title: "실제 상품 연결",
        desc: "베이스, 립, 치크, 아이에 실제 쇼핑 상품을 선택해 AI BEAUTY로 체험할 수 있어요.",
      },
      {
        no: "03",
        title: "결과 저장 및 재확인",
        desc: "마음에 드는 AI BEAUTY 결과를 저장하고 MY HISTORY에서 다시 확인할 수 있어요.",
      },
      {
        no: "04",
        title: "장바구니 바로 연결",
        desc: "적용한 화장품을 결과 화면에서 선택해 장바구니로 바로 이어갈 수 있어요.",
      },
    ];

    return (
      <>
        {/* 사진 미등록 안내 - 기존 기능 유지 */}
        {sw === true && photoLoaded && !memberPhoto && (
          <div className="gd-beauty-photo-alert">
            <div>
              <span>PHOTO REQUIRED</span>
              <strong>
                아직 AI BEAUTY에 사용할 사진을 등록하지 않으셨네요.
              </strong>
              <p>
                AI 메이크업과 헤어 체험을 시작하려면 먼저 정면 얼굴사진을
                등록해주세요.
              </p>
            </div>

            <button type="button" onClick={goPhoto}>
              사진 등록하기
              <span>→</span>
            </button>
          </div>
        )}

        {/* START 화면만 새 랜딩 디자인으로 변경 */}
        <section className="gd-start-home">
          {/* HERO */}
          <div className="gd-start-hero gd-start-hero--focus">
            <div className="gd-start-hero-head">
              <span className="gd-start-kicker">AI BEAUTY</span>
              <p className="gd-start-hero-subcopy">
                얼굴 위에 메이크업과 헤어스타일이 차례로 적용되는 모습을 확인해보세요.
              </p>
            </div>

            <div
              className={`gd-start-hero-visual gd-start-hero-visual--animated gd-hero-stage--${heroStages[activeHeroStage].id}`}
            >
              <div className="gd-hero-glow gd-hero-glow--left" aria-hidden="true" />
              <div className="gd-hero-glow gd-hero-glow--right" aria-hidden="true" />

              <button
                type="button"
                className={`gd-hero-floating-action gd-hero-floating-action--makeup ${heroTool === "makeup" ? "is-playing" : ""}`}
                onClick={() => playHeroEffect("makeup")}
              >
                <span className="gd-hero-floating-icon gd-hero-floating-icon--makeup" aria-hidden="true">
                  <i className="gd-mini-brush-handle" />
                  <i className="gd-mini-brush-head" />
                </span>
                <span>메이크업</span>
                <small>브러쉬로 슥슥</small>
              </button>

              <button
                type="button"
                className={`gd-hero-floating-action gd-hero-floating-action--hair ${heroTool === "hair" ? "is-playing" : ""}`}
                onClick={() => playHeroEffect("hair")}
              >
                <span className="gd-hero-floating-icon gd-hero-floating-icon--hair" aria-hidden="true">
                  <i className="gd-mini-curl gd-mini-curl--1" />
                  <i className="gd-mini-curl gd-mini-curl--2" />
                  <i className="gd-mini-curl gd-mini-curl--3" />
                  <i className="gd-mini-curl gd-mini-curl--4" />
                  <i className="gd-mini-face" />
                </span>
                <span>헤어스타일</span>
                <small>고데기로 슥슥</small>
              </button>

              <div className="gd-hero-face-wrap" aria-live="polite">
                <div className="gd-hero-stage-ring" aria-hidden="true" />
                <div className="gd-hero-stage-ring gd-hero-stage-ring--inner" aria-hidden="true" />

                <div className="gd-hero-face-card">
                  <div className="gd-hero-face-canvas" aria-hidden="true">
                    <span className="gd-hero-face-shadow" />
                    <span className="gd-hero-portrait-shoulder" />
                    <span className="gd-hero-portrait-neck" />

                    {heroTool === "makeup" && (
                      <span className="gd-hero-tool gd-hero-tool--brush" aria-hidden="true">
                        <i className="gd-hero-tool-brush-head" />
                        <i className="gd-hero-tool-brush-handle" />
                      </span>
                    )}

                    {heroTool === "hair" && (
                      <span className="gd-hero-tool gd-hero-tool--iron" aria-hidden="true">
                        <i className="gd-hero-tool-iron-arm gd-hero-tool-iron-arm--top" />
                        <i className="gd-hero-tool-iron-arm gd-hero-tool-iron-arm--bottom" />
                        <i className="gd-hero-tool-iron-hinge" />
                      </span>
                    )}

                    <div className="gd-hero-character">
                      <div className="gd-hero-curl-layer">
                        <span className="gd-hero-curl gd-hero-curl--1" />
                        <span className="gd-hero-curl gd-hero-curl--2" />
                        <span className="gd-hero-curl gd-hero-curl--3" />
                        <span className="gd-hero-curl gd-hero-curl--4" />
                        <span className="gd-hero-curl gd-hero-curl--5" />
                        <span className="gd-hero-curl gd-hero-curl--6" />
                        <span className="gd-hero-curl gd-hero-curl--7" />
                        <span className="gd-hero-curl gd-hero-curl--8" />
                        <span className="gd-hero-curl gd-hero-curl--9" />
                        <span className="gd-hero-curl gd-hero-curl--10" />
                      </div>

                      <span className="gd-hero-basic-hair" />

                      <div className="gd-hero-character-face">
                        <span className="gd-hero-character-bang" />
                        <span className="gd-hero-character-eye gd-hero-character-eye--left" />
                        <span className="gd-hero-character-eye gd-hero-character-eye--right" />
                        <span className="gd-hero-character-blush gd-hero-character-blush--left" />
                        <span className="gd-hero-character-blush gd-hero-character-blush--right" />
                        <span className="gd-hero-character-lip" />
                      </div>
                    </div>

                    <span className="gd-hero-spark gd-hero-spark--1">✦</span>
                    <span className="gd-hero-spark gd-hero-spark--2">✦</span>
                    <span className="gd-hero-spark gd-hero-spark--3">✦</span>
                  </div>

                  <div className="gd-hero-stage-copy">
                    <strong>
                      {heroTool === "makeup"
                        ? "메이크업을 적용하고 있어요"
                        : heroTool === "hair"
                          ? "헤어스타일을 바꾸고 있어요"
                          : heroStages[activeHeroStage].title}
                    </strong>
                    <p>
                      {heroTool === "makeup"
                        ? "브러쉬가 얼굴을 지나간 뒤 메이크업이 완성돼요."
                        : heroTool === "hair"
                          ? "고데기가 머리를 지나간 뒤 히피펌 스타일로 변해요."
                          : heroStages[activeHeroStage].desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="gd-start-hero-actions">
              <button
                type="button"
                className="gd-start-primary gd-start-primary--hero"
                onClick={goTryon}
              >
                <span className="gd-start-primary-sparkle" aria-hidden="true">✦</span>
                <span className="gd-start-primary-copy">
                  <small>TRY AI BEAUTY</small>
                  <strong>AI BEAUTY 시작하기</strong>
                </span>
                <span className="gd-start-primary-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="gd-start-flow">
            <div className="gd-start-flow-intro">
              <h3>이렇게 진행돼요</h3>
              <p>
                사진을 업로드하고, 원하는 스타일을 선택하면 AI가 선택한 뷰티
                스타일을 적용해드려요.
              </p>
            </div>

            <div className="gd-start-flow-steps">
              {startSteps.map((step, index) => (
                <div key={step.no} className="gd-start-step">
                  <div className="gd-start-step-no">{step.no}</div>
                  <strong>{step.title}</strong>
                  <p>{step.desc}</p>
                  {startStepVisual((["photo", "style", "result"] as const)[index])}
                </div>
              ))}
            </div>
          </div>

          {/* BEAUTY STYLE */}
          <div className="gd-start-section-head">
            <h3>AI로 체험하는 뷰티 스타일</h3>

            <button
              type="button"
              className="gd-start-more"
              onClick={goTryon}
            >
              다양한 스타일 체험하기
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="gd-start-card-grid">
            {beautyStyleCards.map((item) => (
              <article
                key={item.id}
                className={`gd-start-style-card gd-start-style-card--${item.id}`}
              >
                <div className="gd-start-style-card-text">
                  <span className="gd-start-style-kicker">AI BEAUTY</span>
                  <strong>{item.label}</strong>
                  <p>{item.desc}</p>
                </div>

<div
                  className={`gd-style-girl gd-style-girl--${item.id}`}
                  aria-hidden="true"
                >
                  {/* 메이크업 */}
                  {item.id === "makeup" && (
                    <>
                      <div className="gd-style-face gd-style-face--makeup">
                        <div className="gd-style-makeup-hair">
                          <span className="gd-style-makeup-bang gd-style-makeup-bang--1" />
                          <span className="gd-style-makeup-bang gd-style-makeup-bang--2" />
                          <span className="gd-style-makeup-bang gd-style-makeup-bang--3" />
                        </div>

                        <span className="gd-style-eye gd-style-eye--left" />
                        <span className="gd-style-eye gd-style-eye--right" />

                        <span className="gd-style-blush gd-style-blush--left" />
                        <span className="gd-style-blush gd-style-blush--right" />

                        <span className="gd-style-lip" />
                      </div>

                      <div className="gd-style-lipstick">
                        <span />
                      </div>
                    </>
                  )}

                  {/* 헤어스타일 */}
                  {item.id === "hair-style" && (
                    <div className="gd-style-curly-wrap">
                      <span className="gd-style-curl gd-style-curl--1" />
                      <span className="gd-style-curl gd-style-curl--2" />
                      <span className="gd-style-curl gd-style-curl--3" />
                      <span className="gd-style-curl gd-style-curl--4" />
                      <span className="gd-style-curl gd-style-curl--5" />
                      <span className="gd-style-curl gd-style-curl--6" />
                      <span className="gd-style-curl gd-style-curl--7" />
                      <span className="gd-style-curl gd-style-curl--8" />

                      <div className="gd-style-face gd-style-face--curly">
                        <span className="gd-style-curly-bang" />

                        <span className="gd-style-eye gd-style-eye--left" />
                        <span className="gd-style-eye gd-style-eye--right" />

                        <span className="gd-style-blush gd-style-blush--left" />
                        <span className="gd-style-blush gd-style-blush--right" />

                        <span className="gd-style-smile" />
                      </div>
                    </div>
                  )}

                  {/* 헤어컬러 */}
                  {item.id === "hair-color" && (
                    <div className="gd-style-color-wrap">
                      <span className="gd-style-color-backhair" />
                      <span className="gd-style-color-side gd-style-color-side--left" />
                      <span className="gd-style-color-side gd-style-color-side--right" />

                      <div className="gd-style-face gd-style-face--color">
                        <span className="gd-style-color-top" />

                        <span className="gd-style-eye gd-style-eye--left" />
                        <span className="gd-style-eye gd-style-eye--right" />

                        <span className="gd-style-blush gd-style-blush--left" />
                        <span className="gd-style-blush gd-style-blush--right" />

                        <span className="gd-style-smile" />
                      </div>

                      <div className="gd-style-color-chips">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* WHY GODDESS */}
          <section className="gd-start-benefit-section">
            <div className="gd-start-benefit-head">
              <div>
                <h3>AI로 체험한 결과를 저장하고 
                  연결한 제품들을 결제까지 
                </h3>
              </div>
            </div>

            <div className="gd-start-benefit-grid">
              {beautyBenefits.map((item) => (
                <article key={item.no} className="gd-start-benefit-card">
                  <span>{item.no}</span>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </article>
              ))}
            </div>
          </section>

          {/* PHOTO GUIDE */}
          <section className="gd-start-guide-section">
            <div className="gd-start-guide-copy">
              <span>PHOTO GUIDE</span>
              <h3>더 자연스러운 결과를 위한 사진 가이드</h3>
              <p>
                AI BEAUTY가 얼굴과 스타일을 더 안정적으로 적용할 수 있도록
                아래 조건에 가까운 사진을 사용해주세요.
              </p>
            </div>

            <div className="gd-start-guide-list">
              {photoGuide.map((item, index) => (
                <div key={item.title} className="gd-start-guide-item">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="gd-start-guide-action">
              <div>
                <strong>준비가 되셨나요?</strong>
                <p>등록한 나의 사진으로 AI BEAUTY를 바로 체험해보세요.</p>
              </div>

              <button
                type="button"
                className="gd-start-guide-button"
                onClick={goTryon}
              >
                AI BEAUTY 시작하기
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        </section>
      </>
    );
  };

  return (

    <div className="gd-beauty">

      <header className="gd-beauty-heading">

        <h1>
          AI BEAUTY
        </h1>

        <span>
          메이크업부터 헤어까지,
          나에게 어울리는 변화를 찾아보세요.
        </span>

      </header>


      <div className="gd-beauty-page-layout">


        {/* =================================
            왼쪽 사이드바
        ================================= */}

        <aside className="gd-beauty-sidebar">

          <div className="gd-beauty-sidebar-title">

            <span>
              AI BEAUTY
            </span>

            <strong>
              나의 AI 뷰티
            </strong>

          </div>


          <nav className="gd-beauty-sidebar-menu">


            <button
              type="button"
              className={
                view === "start" ||
                view === "tryon"
                  ? "active"
                  : ""
              }
              onClick={
                goStart
              }
            >
              <span>
                START
              </span>

              <small>
                AI 뷰티 체험
              </small>
            </button>


            <button
              type="button"
              className={
                view === "photo"
                  ? "active"
                  : ""
              }
              onClick={
                goPhoto
              }
            >
              <span>
                MY PHOTO
              </span>

              <small>
                내 사진
              </small>
            </button>


            <button
              type="button"
              className={
                view === "saved"
                  ? "active"
                  : ""
              }
              onClick={
                goHistory
              }
            >
              <span>
                MY HISTORY
              </span>

              <small>
                나의 이용 내역
              </small>
            </button>


            <button
              type="button"
              className={
                view === "membership"
                  ? "active"
                  : ""
              }
              onClick={
                goMembership
              }
            >
              <span>
                MEMBERSHIP
              </span>

              <small>
                이용권 · 구독
              </small>
            </button>

          </nav>

        </aside>


        {/* =================================
            오른쪽 내용
        ================================= */}

        <div className="gd-beauty-main">

          {
            view === "photo"
              ? renderPhotoView()
              : view === "tryon"
                ? renderTryonView()
                : view === "saved"
                  ? renderSavedView()
                  : view === "membership"
                    ? renderMembershipView()
                    : renderStartView()
          }

        </div>

      </div>

    </div>
  );
}

