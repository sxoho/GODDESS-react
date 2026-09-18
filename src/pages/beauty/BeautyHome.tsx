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

import {
  BRAND
} from "../../config/brand";

import {
  axiosInstance
} from "../../components/ToolBak";

import {
  useGlobalStore
} from "../../store/store";


const API_BASE =
  "http://localhost:9104";


const MODES = [

  {
    id: "makeup",
    label: "메이크업",
    title: "나에게 어울리는 메이크업",
    description:
      "립, 아이섀도, 치크. 나에게 어울리는 메이크업을 찾는 새로운 방법을 준비하고 있어요.",
    options: [
      "립 메이크업",
      "아이 메이크업",
      "치크",
      "베이스 메이크업"
    ]
  },

  {
    id: "hair-style",
    label: "헤어스타일",
    title: "새로운 헤어스타일",
    description:
      "단발부터 긴 웨이브까지. 머리를 자르기 전에 새로운 분위기를 만나볼 수 있도록 준비하고 있어요.",
    options: [
      "단발",
      "레이어드",
      "웨이브",
      "스트레이트"
    ]
  },

  {
    id: "hair-color",
    label: "헤어컬러",
    title: "분위기를 바꾸는 헤어컬러",
    description:
      "차분한 브라운부터 밝은 블론드까지. 나에게 어울리는 헤어컬러를 미리 살펴보는 경험을 준비하고 있어요.",
    options: [
      "블랙",
      "브라운",
      "애쉬 브라운",
      "블론드"
    ]
  }

] as const;


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


  const mode =
    MODES.find(
      (item) =>
        item.id ===
        params.get("mode")
    ) ??
    MODES[0];


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
    tryonResult,
    setTryonResult
  ] = useState<BeautyApplyResponse | null>(
    null
  );


  const [
    loadingPromotionIndex,
    setLoadingPromotionIndex
  ] = useState(0);

  const [
    cartSelectedProductIds,
    setCartSelectedProductIds
  ] = useState<number[]>([]);


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


      try {

        setTryonApplying(
          true
        );

        setTryonApplyError(
          ""
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
                data?: {
                  message?: string;
                };
              };
              message?: string;
            }
          );


        const message =
          errorData
            ?.response
            ?.data
            ?.message
          ||
          errorData
            ?.message
          ||
          "AI BEAUTY 적용 중 오류가 발생했습니다.";


        setTryonApplyError(
          message
        );


      } finally {

        setTryonApplying(
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


  const handleBeautyCartItem = (
    productId: number
  ) => {

    alert(
      "AI BEAUTY에서 선택한 색상은 유지됩니다. 실제 장바구니 저장은 상품 판매 옵션(PRODUCT_OPTION)과 Cart API를 연결한 뒤 바로 담기 방식으로 완성할 예정입니다."
    );

    navigate(
      `/products/${productId}`
    );
  };


  const handleBeautyCartSelected = () => {

    if (
      cartSelectedProductIds.length === 0
    ) {

      alert(
        "장바구니에 담을 상품을 선택해주세요."
      );

      return;
    }

    alert(
      `${cartSelectedProductIds.length}개 상품을 선택했습니다. 실제 장바구니 일괄 저장은 PRODUCT_OPTION / Cart API 연결 후 완성할 예정입니다.`
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

              <div className="gd-beauty-processing-ring" />

              <strong>
                AI BEAUTY 적용 중
              </strong>

              <span>
                결과 이미지를 생성하고 있습니다.
              </span>

            </div>


            <div
              className="gd-beauty-promotion"
              key={
                loadingPromotionIndex
              }
            >

              <div className="gd-beauty-promotion-copy">

                <span>
                  {promotion.overline}
                </span>

                <h3>
                  {promotion.title}
                </h3>

                <p>
                  {promotion.description}
                </p>

              </div>


              <div className="gd-beauty-promotion-visual">

                <span>
                  GODDESS
                </span>

                <strong>
                  {promotion.accent}
                </strong>

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
                                selection.product.id
                              )
                            }
                          >
                            장바구니
                          </button>

                        </article>
                      );
                    }
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
                      onClick={
                        handleBeautyCartSelected
                      }
                    >
                      선택 상품 장바구니 담기
                      <span>
                        {
                          cartSelectedProductIds.length
                        }
                        개 선택
                      </span>
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
                }}
              >
                다른 조합 체험하기
              </button>

              <button
                type="button"
                className="primary"
                onClick={() =>
                  alert(
                    "결과 저장 기능은 다음 단계에서 BEAUTY_SAVE와 연결합니다."
                  )
                }
              >
                결과 저장
              </button>

            </div>

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
              원하는 항목만 선택해도 괜찮아요.
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
                      헤어 기능은 Premium 이용권 전용으로 연결할 예정입니다.
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
                        현재는 화면 선택 구조만 먼저 연결했습니다.
                        다음 단계에서 구독권 확인과 실제 헤어 AI API를 연결합니다.
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


        </section>
      );
    };


  /* =========================================
     저장 내역 - 현재 화면 준비
  ========================================= */

  const renderSavedView =
    () => (

      <section className="gd-beauty-placeholder">

        <span>
          MY HISTORY
        </span>

        <h2>
          나의 이용 내역
        </h2>

        <p>
          AI BEAUTY에서 저장한 메이크업과
          헤어 체험 결과가 이곳에 표시될 예정입니다.
        </p>

        <div className="gd-beauty-placeholder-box">

          <strong>
            아직 저장된 이용 내역이 없어요.
          </strong>

          <p>
            AI BEAUTY 체험 후 마음에 드는 결과를
            저장하면 이곳에서 다시 확인할 수 있어요.
          </p>

        </div>

      </section>
    );


  /* =========================================
     이용권 · 구독 - 현재 화면 준비
  ========================================= */

  const renderMembershipView =
    () => (

      <section className="gd-beauty-placeholder">

        <span>
          MEMBERSHIP
        </span>

        <h2>
          이용권 · 구독
        </h2>

        <p>
          현재 이용권과 AI BEAUTY 이용 횟수를
          확인할 수 있는 화면입니다.
        </p>

        <div className="gd-beauty-placeholder-box">

          <strong>
            FREE
          </strong>

          <p>
            매월 3회 무료 이용 · Premium 구독 기능은
            추후 연결할 예정입니다.
          </p>

        </div>

      </section>
    );


  /* =========================================
     START 기본 화면
  ========================================= */

  const renderStartView =
    () => (

      <>

        {/* 사진 미등록 안내 */}

        {
          sw === true &&
          photoLoaded &&
          !memberPhoto && (

            <div className="gd-beauty-photo-alert">

              <div>

                <span>
                  PHOTO REQUIRED
                </span>

                <strong>
                  아직 AI BEAUTY에 사용할 사진을 등록하지 않으셨네요.
                </strong>

                <p>
                  AI 메이크업과 헤어 체험을 시작하려면
                  먼저 정면 얼굴사진을 등록해주세요.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  goPhoto
                }
              >
                사진 등록하기
                <span>
                  →
                </span>
              </button>

            </div>

          )
        }


        <div className="gd-beauty-layout">

          <div className="gd-beauty-image">

            <img
              src="/images/goddess/beauty-editorial.webp"
              alt={`${BRAND.name} 메이크업 컨셉 화보`}
              width="1254"
              height="1254"
            />

          </div>


          <section
            className="gd-beauty-panel"
            aria-labelledby="beauty-mode-title"
          >

            <div
              className="gd-beauty-tabs"
              aria-label="AI 뷰티 서비스 선택"
            >

              {
                MODES.map(
                  (item) => (

                    <button
                      key={
                        item.id
                      }
                      aria-pressed={
                        mode.id ===
                        item.id
                      }
                      onClick={
                        () =>
                          setParams({
                            mode:
                              item.id
                          })
                      }
                    >

                      {
                        item.label
                      }

                    </button>

                  )
                )
              }

            </div>


            <div
              className="gd-beauty-panel-body"
              aria-live="polite"
            >

              <h2
                id="beauty-mode-title"
              >
                {
                  mode.title
                }
              </h2>


              <p className="gd-beauty-description">
                {
                  mode.description
                }
              </p>


              <ul className="gd-beauty-options">

                {
                  mode.options.map(
                    (option) => (

                      <li
                        key={
                          option
                        }
                      >
                        {
                          option
                        }
                      </li>

                    )
                  )
                }

              </ul>


              <div className="gd-beauty-status">

                <strong>
                  실제 상품으로 시작해보세요.
                </strong>

                <p>
                  등록한 회원 사진을 기준으로
                  베이스, 립, 치크, 아이 상품을 골라 체험할 수 있어요.
                </p>

              </div>


              <button
                className="gd-beauty-shop"
                onClick={
                  goTryon
                }
              >
                AI BEAUTY 시작하기

                <span
                  aria-hidden="true"
                >
                  →
                </span>
              </button>

            </div>

          </section>

        </div>

      </>
    );


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