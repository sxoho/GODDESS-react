import {
  Fragment,
  useEffect,
  useRef,
  useState
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  axiosInstance
} from "../../components/ToolBak";

import {
  useGlobalStore
} from "../../store/store";

import MyCustomerQnaSection from "./MyCustomerQnaSection";

import {
  getSubscriptionHistory,
  getSubscriptionStatus
} from "../../api/subscriptionApi";

import type {
  SubscriptionResponse,
  SubscriptionStatusResponse
} from "../../api/subscriptionApi";

import "../../styles/member/MyPage.css";
import "../../styles/member/MyPageOrder.css";


const API_BASE = "http://localhost:9104";


const SKIN_TYPE_OPTIONS = [
  { value: "", label: "선택하기" },
  { value: "DRY", label: "건성" },
  { value: "OILY", label: "지성" },
  { value: "COMBINATION", label: "복합성" },
  { value: "SENSITIVE", label: "민감성" },
  { value: "NORMAL", label: "중성" },
  { value: "DEHYDRATED", label: "수부지" }
];


const PERSONAL_COLOR_OPTIONS = [
  { value: "", label: "선택하기" },
  { value: "SPRING_WARM", label: "봄웜" },
  { value: "SUMMER_COOL", label: "여름쿨" },
  { value: "AUTUMN_WARM", label: "가을웜" },
  { value: "WINTER_COOL", label: "겨울쿨" },
  { value: "NEUTRAL", label: "뉴트럴" }
];


const getSkinTypeLabel = (
  value?: string
) => {

  return SKIN_TYPE_OPTIONS.find(
    (option) =>
      option.value === value
  )?.label || "선택하기";
};


const getPersonalColorLabel = (
  value?: string
) => {

  return PERSONAL_COLOR_OPTIONS.find(
    (option) =>
      option.value === value
  )?.label || "선택하기";
};


type Member = {
  id: number;
  loginId: string;
  name: string;
  nickname: string;
  email: string;
  tel?: string;
  zipcode?: string;
  address1?: string;
  address2?: string;
  skinType?: string;
  personalColor?: string;
  status: string;
  gradeId?: number;
  gradeName?: string;
  createdAt?: string;
  updatedAt?: string;
};


type LoginHistory = {
  id: number;
  memberId: number;
  success: string;
  ip?: string;
  device?: string;
  createdAt?: string;
  logoutDate?: string;
};


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


/**
 * 회원 사진 AI 검사 결과
 *
 * Spring:
 * POST /member_photo/check
 *
 * FastAPI 11501:
 * POST /member_photo_check
 */
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



type WishlistItem = {
  id: number;
  productId: number;
  productName: string;
  price: number;
  discount?: number;
  createdAt?: string;
};


type ProductImage = {
  id: number;
  productColorId: number;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
};


type ProductColor = {
  id: number;
  productId: number;
  colorName: string;
  isMain: string;
  sortOrder: number;
  visible: string;
  images?: ProductImage[];
};


type Product = {
  id?: number;
  productId: number;
  brand?: string;
  name: string;
  price: number;
  discount?: number;
};


type WishlistPreviewItem =
  WishlistItem & {
    brand?: string;
    imageUrl?: string;
  };


type RecentViewedItem = {
  productId: number;
  productName: string;
  brand?: string;
  price: number;
  discount?: number;
  imageUrl?: string;
  viewedAt?: string;
};


type MyPageUpdateForm = {
  loginId: string;
  nickname: string;
  zipcode: string;
  address1: string;
  address2: string;
  skinType: string;
  personalColor: string;
};


type MyOrder = {
  id: number;
  memberId?: number;
  orderName: string;
  productTotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  createdAt?: string;
  cancelDate?: string | null;

  /**
   * 마이페이지 주문 카드 표시용
   * DB에 새로 저장하는 값이 아니라 기존 상품/색상/이미지 API로 조합한다.
   */
  imageUrl?: string;
  productId?: number;
  firstProductName?: string;
  firstColorName?: string | null;
  firstVariantName?: string | null;
};


type MyOrderDetailPreview = {
  id: number;
  productOptionId?: number;
  productName: string;
  colorName?: string | null;
  variantName?: string | null;
  price: number;
  quantity: number;
};


type MyOrderDetailResponse = {
  id: number;
  orderDetails?: MyOrderDetailPreview[];
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


type ProductReview = {
  id: number;
  memberId: number;
  memberNickname: string;
  orderDetailId?: number | null;
  productId: number;
  productName: string;
  colorName?: string | null;
  variantName?: string | null;
  beautySaveId?: number | null;
  beautyImageUrl?: string | null;

  /**
   * 마이페이지 REVIEW에서 사용할 상품 대표 이미지
   */
  imageUrl?: string;

  title: string;
  content: string;
  rating: number;
  visible: string;
  createdAt?: string;
  updatedAt?: string;
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


/**
 * 마이페이지 내가 작성한 리뷰
 */
const MyProductReviewSection = ({
  memberId
}: {
  memberId: number;
}) => {

  const navigate =
    useNavigate();


  /**
   * 상품 이미지 경로를 실제 접근 URL로 변환
   */
  const getReviewImageUrl = (
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


  /**
   * 상품 색상/이미지 목록에서 대표 이미지 선택
   */
  const getReviewThumbnail = (
    colors: ProductColor[]
  ) => {

    const visibleColors =
      colors
        .filter(
          (color) =>
            color.visible !== "N"
        )
        .sort(
          (a, b) => {

            if (
              a.isMain === "Y" &&
              b.isMain !== "Y"
            ) {
              return -1;
            }


            if (
              a.isMain !== "Y" &&
              b.isMain === "Y"
            ) {
              return 1;
            }


            return (
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
            );
          }
        );


    const images =
      visibleColors.flatMap(
        (color) =>
          (color.images ?? []).map(
            (image) => ({
              ...image,
              colorIsMain:
                color.isMain
            })
          )
      );


    const thumbnail =
      images
        .filter(
          (image) =>
            image.imageType ===
            "THUMBNAIL"
        )
        .sort(
          (a, b) => {

            if (
              a.isMain === "Y" &&
              b.isMain !== "Y"
            ) {
              return -1;
            }


            if (
              a.isMain !== "Y" &&
              b.isMain === "Y"
            ) {
              return 1;
            }


            return (
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
            );
          }
        )[0] ??

      images
        .filter(
          (image) =>
            image.isMain === "Y" ||
            image.imageType === "MAIN"
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0)
        )[0] ??

      images[0];


    return thumbnail?.filePath
      ? getReviewImageUrl(
          thumbnail.filePath
        )
      : "";
  };


  const [
    reviews,
    setReviews
  ] = useState<ProductReview[]>([]);


  const [
    reviewPage,
    setReviewPage
  ] = useState(0);


  const [
    totalPages,
    setTotalPages
  ] = useState(0);


  const [
    totalElements,
    setTotalElements
  ] = useState(0);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  const [
    editingReviewId,
    setEditingReviewId
  ] = useState<number | null>(null);


  const [
    editTitle,
    setEditTitle
  ] = useState("");


  const [
    editContent,
    setEditContent
  ] = useState("");


  const [
    editRating,
    setEditRating
  ] = useState(5);


  /**
   * 리뷰 작성일 표시
   */
  const formatReviewDate = (
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


  /**
   * 별점 표시
   */
  const renderStars = (
    rating: number
  ) => {

    const safeRating =
      Math.max(
        0,
        Math.min(
          5,
          rating || 0
        )
      );


    return (
      "★".repeat(safeRating) +
      "☆".repeat(5 - safeRating)
    );
  };


  /**
   * 내가 작성한 리뷰 조회
   */
  const loadReviews = async () => {

    try {

      setLoading(true);
      setError("");


      const response =
        await axiosInstance.get<ProductReviewPageResponse>(
          `/product_review/member/${memberId}/page`,
          {
            params: {
              page: reviewPage,
              size: 5
            }
          }
        );


      const reviewData =
        response.data.content ?? [];


      /**
       * 각 리뷰의 상품 대표 이미지 조회
       *
       * 기존 상품 이미지 API를 사용해
       * 상품 색상/이미지 목록에서 대표 이미지를 찾는다.
       */
      const reviewViewData =
        await Promise.all(

          reviewData.map(
            async (review) => {

              try {

                const colorResponse =
                  await axiosInstance.get<ProductColor[]>(
                    `/product_color/product/${review.productId}`
                  );


                return {
                  ...review,

                  imageUrl:
                    getReviewThumbnail(
                      colorResponse.data ?? []
                    )
                };


              } catch (imageError) {

                console.error(
                  `리뷰 상품 이미지 조회 오류 - productId: ${review.productId}`,
                  imageError
                );


                return {
                  ...review,
                  imageUrl: ""
                };
              }
            }
          )
        );


      setReviews(
        reviewViewData
      );


      setTotalPages(
        response.data.totalPages ?? 0
      );


      setTotalElements(
        response.data.totalElements ?? 0
      );


    } catch (error) {

      console.error(
        "내 리뷰 조회 오류:",
        error
      );


      setReviews([]);
      setTotalPages(0);
      setTotalElements(0);


      setError(
        "리뷰 목록을 불러오는 중 오류가 발생했습니다."
      );


    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {

    if (!memberId) {
      return;
    }


    loadReviews();

  }, [
    memberId,
    reviewPage
  ]);


  /**
   * 리뷰 수정 시작
   */
  const handleEditStart = (
    review: ProductReview
  ) => {

    setEditingReviewId(
      review.id
    );


    setEditTitle(
      review.title
    );


    setEditContent(
      review.content
    );


    setEditRating(
      review.rating
    );
  };


  /**
   * 리뷰 수정 취소
   */
  const handleEditCancel = () => {

    setEditingReviewId(
      null
    );


    setEditTitle("");
    setEditContent("");
    setEditRating(5);
  };


  /**
   * 리뷰 수정
   */
  const handleUpdate = async (
    review: ProductReview
  ) => {

    if (!editTitle.trim()) {

      alert(
        "리뷰 제목을 입력해주세요."
      );

      return;
    }


    if (!editContent.trim()) {

      alert(
        "리뷰 내용을 입력해주세요."
      );

      return;
    }


    try {

      await axiosInstance.put(
        `/product_review/${review.id}`,
        {
          memberId: memberId,
          beautySaveId:
            review.beautySaveId ?? null,
          title:
            editTitle.trim(),
          content:
            editContent.trim(),
          rating:
            editRating
        }
      );


      alert(
        "리뷰가 수정되었습니다."
      );


      handleEditCancel();

      await loadReviews();


    } catch (error) {

      console.error(
        "리뷰 수정 오류:",
        error
      );


      alert(
        "리뷰 수정 중 오류가 발생했습니다."
      );
    }
  };


  /**
   * 리뷰 삭제
   */
  const handleDelete = async (
    reviewId: number
  ) => {

    const confirmDelete =
      window.confirm(
        "작성한 리뷰를 삭제하시겠습니까?"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      await axiosInstance.delete(
        `/product_review/${reviewId}/member/${memberId}`
      );


      alert(
        "리뷰가 삭제되었습니다."
      );


      handleEditCancel();


      if (
        reviews.length === 1 &&
        reviewPage > 0
      ) {

        setReviewPage(
          reviewPage - 1
        );

        return;
      }


      await loadReviews();


    } catch (error) {

      console.error(
        "리뷰 삭제 오류:",
        error
      );


      alert(
        "리뷰 삭제 중 오류가 발생했습니다."
      );
    }
  };


  return (

    <div className="mypage-review">

      <div className="mypage-review-summary">

        총

        <strong>
          {totalElements}
        </strong>

        개의 리뷰를 작성했습니다.

      </div>


      {loading ? (

        <div className="mypage-review-message">
          리뷰를 불러오는 중입니다.
        </div>

      ) : error ? (

        <div className="mypage-review-message">
          {error}
        </div>

      ) : reviews.length === 0 ? (

        <div className="mypage-review-empty">
          아직 작성한 리뷰가 없습니다.
        </div>

      ) : (

        <>

          <div className="mypage-review-list">

            {reviews.map(
              (review) => (

                <article
                  key={review.id}
                  className="mypage-review-item"
                >

                  {/* 상품 대표 이미지 */}
                  <button
                    type="button"
                    className="mypage-review-product-image-button"
                    onClick={
                      () =>
                        navigate(
                          `/products/${review.productId}`
                        )
                    }
                    aria-label={`${review.productName} 상품 상세로 이동`}
                  >

                    {review.imageUrl ? (

                      <img
                        src={review.imageUrl}
                        alt={review.productName}
                        className="mypage-review-product-image"
                      />

                    ) : (

                      <span className="mypage-review-product-no-image">
                        NO IMAGE
                      </span>

                    )}

                  </button>


                  <div className="mypage-review-main">

                    <div className="mypage-review-product">
                      {review.productName}
                    </div>

                    {(review.colorName || review.variantName) && (
                      <div className="mypage-review-purchased-option">
                        구매 옵션 · {[review.colorName, review.variantName]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}


                    <div className="mypage-review-title-row">

                      <strong>
                        {review.title}
                      </strong>


                      <span className="mypage-review-rating">
                        {renderStars(review.rating)}
                      </span>

                    </div>


                    <p className="mypage-review-content">
                      {review.content}
                    </p>


                    <div className="mypage-review-meta">

                      <span>
                        작성일 {formatReviewDate(review.createdAt)}
                      </span>


                      {review.updatedAt && (

                        <span>
                          수정일 {formatReviewDate(review.updatedAt)}
                        </span>

                      )}

                    </div>

                  </div>


                  <div className="mypage-qna-actions">

                    <button
                      type="button"
                      onClick={
                        () =>
                          handleEditStart(
                            review
                          )
                      }
                    >
                      수정
                    </button>


                    <button
                      type="button"
                      className="delete"
                      onClick={
                        () =>
                          handleDelete(
                            review.id
                          )
                      }
                    >
                      삭제
                    </button>

                  </div>


                  {editingReviewId === review.id && (

                    <div className="mypage-review-edit">

                      <div className="mypage-review-edit-row">

                        <label>
                          별점
                        </label>


                        <select
                          value={editRating}
                          onChange={
                            (event) =>
                              setEditRating(
                                Number(
                                  event.target.value
                                )
                              )
                          }
                        >
                          <option value={5}>★★★★★ 5점</option>
                          <option value={4}>★★★★☆ 4점</option>
                          <option value={3}>★★★☆☆ 3점</option>
                          <option value={2}>★★☆☆☆ 2점</option>
                          <option value={1}>★☆☆☆☆ 1점</option>
                        </select>

                      </div>


                      <div className="mypage-review-edit-row">

                        <label>
                          제목
                        </label>


                        <input
                          type="text"
                          value={editTitle}
                          onChange={
                            (event) =>
                              setEditTitle(
                                event.target.value
                              )
                          }
                          maxLength={255}
                        />

                      </div>


                      <div className="mypage-review-edit-row">

                        <label>
                          내용
                        </label>


                        <textarea
                          value={editContent}
                          onChange={
                            (event) =>
                              setEditContent(
                                event.target.value
                              )
                          }
                          rows={5}
                        />

                      </div>


                      <div className="mypage-review-edit-actions">

                        <button
                          type="button"
                          onClick={
                            () =>
                              handleUpdate(
                                review
                              )
                          }
                        >
                          수정 완료
                        </button>


                        <button
                          type="button"
                          className="cancel"
                          onClick={
                            handleEditCancel
                          }
                        >
                          취소
                        </button>

                      </div>

                    </div>

                  )}

                </article>

              )
            )}

          </div>


          {totalPages > 1 && (

            <div className="mypage-review-pagination">

              <button
                type="button"
                disabled={reviewPage === 0}
                onClick={
                  () =>
                    setReviewPage(
                      reviewPage - 1
                    )
                }
              >
                이전
              </button>


              {Array.from(
                {
                  length: totalPages
                },
                (_, index) => (

                  <button
                    type="button"
                    key={index}
                    className={
                      reviewPage === index
                        ? "active"
                        : ""
                    }
                    onClick={
                      () =>
                        setReviewPage(
                          index
                        )
                    }
                  >
                    {index + 1}
                  </button>

                )
              )}


              <button
                type="button"
                disabled={
                  reviewPage >=
                  totalPages - 1
                }
                onClick={
                  () =>
                    setReviewPage(
                      reviewPage + 1
                    )
                }
              >
                다음
              </button>

            </div>

          )}

        </>

      )}

    </div>
  );
};


/**
 * 마이페이지 상품 문의
 *
 * 상품 문의 기능만 별도 처리한다.
 */
const MyProductQnaSection = ({
  memberId,
  navigate
}: {
  memberId: number;
  navigate: ReturnType<typeof useNavigate>;
}) => {

  const [
    qnaItems,
    setQnaItems
  ] = useState<ProductQna[]>([]);

  const [
    productNames,
    setProductNames
  ] = useState<Record<number, string>>({});

  const [
    qnaPage,
    setQnaPage
  ] = useState(0);

  const [
    qnaTotalPages,
    setQnaTotalPages
  ] = useState(0);

  const [
    qnaTotalElements,
    setQnaTotalElements
  ] = useState(0);

  const [
    openedQnaId,
    setOpenedQnaId
  ] = useState<number | null>(null);

  const [
    qnaLoading,
    setQnaLoading
  ] = useState(true);

  const [
    qnaError,
    setQnaError
  ] = useState("");


  const [
    editingQnaId,
    setEditingQnaId
  ] = useState<number | null>(null);

  const [
    editQnaTitle,
    setEditQnaTitle
  ] = useState("");

  const [
    editQnaContent,
    setEditQnaContent
  ] = useState("");

  const [
    editQnaSecret,
    setEditQnaSecret
  ] = useState("N");


  const loadMyProductQna =
    async () => {

      try {

        setQnaLoading(true);
        setQnaError("");


        const response =
          await axiosInstance.get<ProductQnaPageResponse>(
            `/product_qna/member/${memberId}/page`,
            {
              params: {
                page: qnaPage,
                size: 5
              }
            }
          );


        const pageData =
          response.data;


        const qnas =
          pageData.content ?? [];


        setQnaItems(
          qnas
        );


        setQnaTotalPages(
          pageData.totalPages ?? 0
        );


        setQnaTotalElements(
          pageData.totalElements ?? 0
        );


        const uniqueProductIds =
          [
            ...new Set(
              qnas.map(
                (qna) =>
                  qna.productId
              )
            )
          ];


        const productEntries =
          await Promise.all(

            uniqueProductIds.map(
              async (productId) => {

                try {

                  const productResponse =
                    await axiosInstance.get<Product>(
                      `/product/${productId}`
                    );


                  return [
                    productId,
                    productResponse.data.name
                  ] as const;

                } catch {

                  return [
                    productId,
                    `상품 #${productId}`
                  ] as const;
                }
              }
            )
          );


        setProductNames(
          Object.fromEntries(
            productEntries
          )
        );


      } catch (error) {

        console.error(
          "마이페이지 상품 문의 조회 오류:",
          error
        );


        setQnaError(
          "상품 문의 내역을 불러오는 중 오류가 발생했습니다."
        );


      } finally {

        setQnaLoading(false);
      }
    };


  useEffect(() => {

    loadMyProductQna();

  }, [
    memberId,
    qnaPage
  ]);


  const getQnaDate = (
    date?: string | null
  ) => {

    if (!date) {
      return "-";
    }


    return date.substring(
      0,
      10
    );
  };


  const getAnswerLabel = (
    status: string
  ) => {

    return status === "ANSWERED" ||
      status === "CLOSED"
      ? "YES"
      : "NO";
  };


  /**
   * 상품 문의 수정 시작
   */
  const handleQnaEditStart = (
    qna: ProductQna
  ) => {

    setEditingQnaId(
      qna.id
    );

    setEditQnaTitle(
      qna.title
    );

    setEditQnaContent(
      qna.content
    );

    setEditQnaSecret(
      qna.secret
    );
  };


  /**
   * 상품 문의 수정 취소
   */
  const handleQnaEditCancel = () => {

    setEditingQnaId(
      null
    );

    setEditQnaTitle("");
    setEditQnaContent("");
    setEditQnaSecret("N");
  };


  /**
   * 상품 문의 수정
   */
  const handleQnaUpdate = async (
    qna: ProductQna
  ) => {

    if (!editQnaTitle.trim()) {

      alert(
        "문의 제목을 입력해주세요."
      );

      return;
    }


    if (!editQnaContent.trim()) {

      alert(
        "문의 내용을 입력해주세요."
      );

      return;
    }


    try {

      await axiosInstance.put(
        `/product_qna/${qna.id}`,
        {
          memberId: memberId,
          title: editQnaTitle.trim(),
          content: editQnaContent.trim(),
          secret: editQnaSecret
        }
      );


      alert(
        "상품 문의가 수정되었습니다."
      );


      handleQnaEditCancel();

      await loadMyProductQna();


    } catch (error) {

      console.error(
        "상품 문의 수정 오류:",
        error
      );


      alert(
        "상품 문의 수정 중 오류가 발생했습니다."
      );
    }
  };


  /**
   * 상품 문의 삭제
   */
  const handleQnaDelete = async (
    qna: ProductQna
  ) => {

    const confirmDelete =
      window.confirm(
        "상품 문의를 삭제하시겠습니까?"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      await axiosInstance.delete(
        `/product_qna/${qna.id}/member/${memberId}`
      );


      alert(
        "상품 문의가 삭제되었습니다."
      );


      setOpenedQnaId(
        null
      );

      handleQnaEditCancel();


      if (
        qnaItems.length === 1 &&
        qnaPage > 0
      ) {

        setQnaPage(
          qnaPage - 1
        );

        return;
      }


      await loadMyProductQna();


    } catch (error) {

      console.error(
        "상품 문의 삭제 오류:",
        error
      );


      alert(
        "상품 문의 삭제 중 오류가 발생했습니다."
      );
    }
  };


  const changeQnaPage = (
    page: number
  ) => {

    if (
      page < 0 ||
      page >= qnaTotalPages ||
      page === qnaPage
    ) {
      return;
    }


    setQnaPage(
      page
    );
  };


  if (
    qnaLoading
  ) {

    return (

      <div className="mypage-menu-ready">
        상품 문의 내역을 불러오는 중입니다.
      </div>

    );
  }


  if (
    qnaError
  ) {

    return (

      <div className="mypage-menu-ready">
        {qnaError}
      </div>

    );
  }


  if (
    qnaItems.length === 0
  ) {

    return (

      <div className="mypage-menu-ready">
        작성한 상품 문의가 없습니다.
      </div>

    );
  }


  return (

    <div className="mypage-qna-wrap">

        {/* =========================
          상품 문의 안내 영역
      ========================= */}
      <div className="mypage-qna-title-row">

        <span>
          총 {qnaTotalElements}건의 상품 문의가 있습니다.
        </span>

        <p>
          상품 문의는 문의하고 싶은 상품의 상품문의를 클릭하여 작성해주세요.
        </p>

      </div>


      <div className="mypage-qna-table-wrap">

        <table className="mypage-qna-table">

          <thead>

            <tr>

              <th className="mypage-qna-product-col">
                상품정보
              </th>

              <th className="mypage-qna-content-col">
                문의내용
              </th>

              <th className="mypage-qna-date-col">
                작성일
              </th>

              <th className="mypage-qna-answer-col">
                답변유무
              </th>

            </tr>

          </thead>


          <tbody>

            {qnaItems.map(
              (qna) => {

                const isOpened =
                  openedQnaId === qna.id;


                return (

                  <Fragment
                    key={
                      qna.id
                    }
                  >

                    <tr
                      className={
                        isOpened
                          ? "mypage-qna-row open"
                          : "mypage-qna-row"
                      }
                      onClick={
                        () =>
                          setOpenedQnaId(
                            isOpened
                              ? null
                              : qna.id
                          )
                      }
                    >

                      <td>

                        <button
                          type="button"
                          className="mypage-qna-product-button"
                          onClick={
                            (event) => {

                              event.stopPropagation();


                              navigate(
                                `/products/${qna.productId}`
                              );
                            }
                          }
                        >
                          {
                            productNames[
                              qna.productId
                            ] ??
                            `상품 #${qna.productId}`
                          }
                        </button>

                      </td>


                      <td className="mypage-qna-title-cell">

                        {qna.secret === "Y" && (
                          <span className="mypage-qna-lock">
                            🔒
                          </span>
                        )}

                        {qna.title}

                      </td>


                      <td className="mypage-qna-center">
                        {
                          getQnaDate(
                            qna.createdAt
                          )
                        }
                      </td>


                      <td className="mypage-qna-center">

                        <strong
                          className={
                            getAnswerLabel(
                              qna.status
                            ) === "YES"
                              ? "mypage-qna-answer-yes"
                              : "mypage-qna-answer-no"
                          }
                        >
                          {
                            getAnswerLabel(
                              qna.status
                            )
                          }
                        </strong>

                      </td>

                    </tr>


                    {isOpened && (

                      <tr className="mypage-qna-detail-row">

                        <td colSpan={4}>

                          <div className="mypage-qna-detail">

                            <div className="mypage-qna-detail-block">

                              <strong className="mypage-qna-mark">
                                Q.
                              </strong>


                              <div className="mypage-qna-detail-content">

                                {editingQnaId === qna.id ? (

                                  <div className="mypage-review-edit">

                                    <div className="mypage-review-edit-row">

                                      <label>
                                        제목
                                      </label>

                                      <input
                                        type="text"
                                        value={editQnaTitle}
                                        onChange={
                                          (event) =>
                                            setEditQnaTitle(
                                              event.target.value
                                            )
                                        }
                                        maxLength={255}
                                      />

                                    </div>


                                    <div className="mypage-review-edit-row">

                                      <label>
                                        내용
                                      </label>

                                      <textarea
                                        value={editQnaContent}
                                        onChange={
                                          (event) =>
                                            setEditQnaContent(
                                              event.target.value
                                            )
                                        }
                                        rows={5}
                                      />

                                    </div>


                                    <div className="mypage-review-edit-row">

                                      <label>
                                        비밀글
                                      </label>

                                      <select
                                        value={editQnaSecret}
                                        onChange={
                                          (event) =>
                                            setEditQnaSecret(
                                              event.target.value
                                            )
                                        }
                                      >
                                        <option value="N">공개</option>
                                        <option value="Y">비밀글</option>
                                      </select>

                                    </div>


                                    <div className="mypage-review-edit-actions">

                                      <button
                                        type="button"
                                        onClick={
                                          () =>
                                            handleQnaUpdate(
                                              qna
                                            )
                                        }
                                      >
                                        수정 완료
                                      </button>


                                      <button
                                        type="button"
                                        className="cancel"
                                        onClick={
                                          handleQnaEditCancel
                                        }
                                      >
                                        취소
                                      </button>

                                    </div>

                                  </div>

                                ) : (

                                  <>

                                    <strong className="mypage-qna-detail-title">
                                      {qna.secret === "Y" ? "🔒 " : ""}
                                      {qna.title}
                                    </strong>


                                    <p>
                                      {qna.content}
                                    </p>


                                    <div className="mypage-qna-actions">

                                      <button
                                        type="button"
                                        onClick={
                                          () =>
                                            handleQnaEditStart(
                                              qna
                                            )
                                        }
                                      >
                                        수정
                                      </button>


                                      <button
                                        type="button"
                                        className="delete"
                                        onClick={
                                          () =>
                                            handleQnaDelete(
                                              qna
                                            )
                                        }
                                      >
                                        삭제
                                      </button>

                                    </div>

                                  </>

                                )}

                              </div>

                            </div>


                            <div className="mypage-qna-detail-block">

                              <strong className="mypage-qna-mark">
                                A.
                              </strong>


                              <div className="mypage-qna-detail-content">

                                {qna.answer ? (

                                  <>

                                    <p>
                                      {qna.answer}
                                    </p>


                                    {qna.answerDate && (

                                      <span className="mypage-qna-answer-date">
                                        {
                                          getQnaDate(
                                            qna.answerDate
                                          )
                                        }
                                      </span>

                                    )}

                                  </>

                                ) : (

                                  <p className="mypage-qna-no-answer">
                                    아직 등록된 답변이 없습니다.
                                  </p>

                                )}

                              </div>

                            </div>

                          </div>

                        </td>

                      </tr>

                    )}

                  </Fragment>

                );
              }
            )}

          </tbody>

        </table>

      </div>


      {qnaTotalPages > 1 && (

        <div className="mypage-qna-pagination">

          <button
            type="button"
            disabled={
              qnaPage === 0
            }
            onClick={
              () =>
                changeQnaPage(
                  qnaPage - 1
                )
            }
          >
            ‹
          </button>


          {Array.from(
            {
              length:
                qnaTotalPages
            },
            (_, index) => (

              <button
                key={
                  index
                }
                type="button"
                className={
                  qnaPage === index
                    ? "active"
                    : ""
                }
                onClick={
                  () =>
                    changeQnaPage(
                      index
                    )
                }
              >
                {index + 1}
              </button>

            )
          )}


          <button
            type="button"
            disabled={
              qnaPage >=
              qnaTotalPages - 1
            }
            onClick={
              () =>
                changeQnaPage(
                  qnaPage + 1
                )
            }
          >
            ›
          </button>

        </div>

      )}

    </div>

  );
};


const MyPage = () => {

  const navigate =
    useNavigate();


  const location =
    useLocation();


  const {
    sw,
    memberId
  } = useGlobalStore();


  /**
   * 비로그인 안내 alert 중복 표시 방지
   */
  const loginAlertShown =
    useRef(false);


  /**
   * 회원 사진 선택 input
   * - galleryPhotoInputRef : PC/모바일 갤러리에서 사진 선택
   * - cameraPhotoInputRef  : 모바일 전면 카메라 촬영
   */
  const galleryPhotoInputRef =
    useRef<HTMLInputElement | null>(null);


  const cameraPhotoInputRef =
    useRef<HTMLInputElement | null>(null);


  /**
   * 사진 AI 검사 요청 번호
   *
   * 사용자가 사진을 빠르게 연속 선택했을 때
   * 이전 검사 응답이 최신 사진 결과를 덮어쓰지 않도록 한다.
   */
  const photoCheckRequestId =
    useRef(0);


  /**
   * 회원 정보
   */
  const [
    member,
    setMember
  ] = useState<Member | null>(
    null
  );


  /**
   * Premium 구독 상태
   */
  const [
    subscriptionStatus,
    setSubscriptionStatus
  ] = useState<SubscriptionStatusResponse | null>(
    null
  );


  /**
   * Premium 구독 / 결제 내역
   */
  const [
    subscriptionHistory,
    setSubscriptionHistory
  ] = useState<SubscriptionResponse[]>(
    []
  );


  const [
    subscriptionLoading,
    setSubscriptionLoading
  ] = useState(false);


  const [
    subscriptionError,
    setSubscriptionError
  ] = useState("");


  /**
   * 로그인 내역
   */
  const [
    loginHistories,
    setLoginHistories
  ] = useState<LoginHistory[]>([]);


  /**
   * 회원 대표 사진
   */
  const [
    memberPhoto,
    setMemberPhoto
  ] = useState<MemberPhoto | null>(
    null
  );


  /**
   * 새로 선택한 사진 파일
   */
  const [
    selectedPhoto,
    setSelectedPhoto
  ] = useState<File | null>(
    null
  );


  /**
   * 선택한 사진 미리보기
   */
  const [
    photoPreview,
    setPhotoPreview
  ] = useState("");


  /**
   * 사진 저장 중 여부
   */
  const [
    photoSaving,
    setPhotoSaving
  ] = useState(false);


  /**
   * 회원 사진 AI 검사 중 여부
   */
  const [
    photoChecking,
    setPhotoChecking
  ] = useState(false);


  /**
   * 회원 사진 AI 검사 결과
   */
  const [
    photoAiResult,
    setPhotoAiResult
  ] = useState<PhotoAiCheckResult | null>(
    null
  );


  /**
   * 회원 사진 AI 검사 오류 안내
   */
  const [
    photoAiError,
    setPhotoAiError
  ] = useState("");





  /**
   * 마이페이지 선택 메뉴
   */
  const [
    activeMenu,
    setActiveMenu
  ] = useState<
    "info" |
    "order" |
    "subscription" |
    "wishlist" |
    "beauty" |
    "review" |
    "qna"
  >(
    location.state?.activeMenu === "subscription"
      ? "subscription"
      : location.state?.activeMenu === "qna"
        ? "qna"
        : "info"
  );


  /**
   * MY PAGE 첫 화면 / 회원정보 상세 화면
   *
   * false : 마이페이지 대시보드
   * true  : 기존 회원정보 상세 화면
   */
  const [
    infoDetailOpen,
    setInfoDetailOpen
  ] = useState(false);


  /**
   * Q&A 내부 선택 메뉴
   *
   * product  : 상품 문의
   * customer : 고객 문의
   */
  const [
    qnaSubMenu,
    setQnaSubMenu
  ] = useState<
    "product" |
    "customer"
  >(
    location.state?.qnaSubMenu === "customer"
      ? "customer"
      : "product"
  );


  /**
   * 최근 찜 상품
   */
  const [
    wishlistItems,
    setWishlistItems
  ] = useState<
    WishlistPreviewItem[]
  >([]);


  const [
    wishlistLoading,
    setWishlistLoading
  ] = useState(false);


  /**
   * 최근 본 상품 - 브라우저 localStorage 기반
   */
  const [
    recentViewedItems,
    setRecentViewedItems
  ] = useState<RecentViewedItem[]>([]);


  const [
    dashboardCounts,
    setDashboardCounts
  ] = useState({
    order: 0,
    wishlist: 0,
    beauty: 0,
    review: 0
  });


  /**
   * 주문 내역
   */
  const [
    orderItems,
    setOrderItems
  ] = useState<MyOrder[]>([]);


  const [
    orderLoading,
    setOrderLoading
  ] = useState(false);


  const [
    orderError,
    setOrderError
  ] = useState("");


  /**
   * 수정 모드
   */
  const [
    isEditing,
    setIsEditing
  ] = useState(false);


  /**
   * 수정 폼
   */
  const [
    editForm,
    setEditForm
  ] = useState<MyPageUpdateForm>({
    loginId: "",
    nickname: "",
    zipcode: "",
    address1: "",
    address2: "",
    skinType: "",
    personalColor: ""
  });


  /**
   * 아이디 중복 확인 여부
   */
  const [
    loginIdChecked,
    setLoginIdChecked
  ] = useState(true);


  /**
   * 닉네임 중복 확인 여부
   */
  const [
    nicknameChecked,
    setNicknameChecked
  ] = useState(true);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    saving,
    setSaving
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  /**
   * 이미지 URL
   */
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


  /**
   * 마이페이지 정보 불러오기
   */
  useEffect(() => {

    if (
      sw !== true ||
      !memberId
    ) {

      if (
        !loginAlertShown.current
      ) {

        loginAlertShown.current =
          true;


        alert(
          "로그인이 필요한 페이지입니다."
        );
      }


      navigate(
        "/login",
        {
          replace: true
        }
      );


      return;
    }


    const loadMyPage =
      async () => {

        try {

          setLoading(true);
          setError("");


          /**
           * 회원 정보
           */
          const memberResponse =
            await axiosInstance.get<Member>(
              `/mypage/${memberId}`
            );


          /**
           * 로그인 내역
           */
          const loginHistoryResponse =
            await axiosInstance.get<
              LoginHistory[]
            >(
              `/login-history/member/${memberId}`
            );


          setMember(
            memberResponse.data
          );


          setLoginHistories(
            loginHistoryResponse.data
          );


          /**
           * Premium 구독 상태 / 내역
           *
           * 구독 API 오류가 나더라도
           * 기존 마이페이지 전체 조회는 유지한다.
           */
          try {

            const [
              statusData,
              historyData
            ] =
              await Promise.all([
                getSubscriptionStatus(
                  memberId
                ),
                getSubscriptionHistory(
                  memberId
                )
              ]);


            setSubscriptionStatus(
              statusData
            );


            setSubscriptionHistory(
              historyData
            );


          } catch (subscriptionLoadError) {

            console.log(
              "Premium 구독 정보 없음 또는 조회 실패:",
              subscriptionLoadError
            );


            setSubscriptionStatus(
              null
            );


            setSubscriptionHistory(
              []
            );
          }


          /**
           * 회원 대표 사진
           *
           * 사진이 없으면
           * Spring에서 204 No Content 반환
           */
          try {

            const photoResponse =
              await axiosInstance.get<
                MemberPhoto
              >(
                `/member_photo/member/${memberId}/main`
              );


            if (
              photoResponse.status === 200 &&
              photoResponse.data &&
              photoResponse.data.id
            ) {

              setMemberPhoto(
                photoResponse.data
              );

            } else {

              setMemberPhoto(
                null
              );
            }


          } catch (photoError) {

            console.log(
              "등록된 회원 사진 없음:",
              photoError
            );


            setMemberPhoto(
              null
            );
          }


        } catch (error) {

          console.error(
            "My Page 조회 오류:",
            error
          );


          setError(
            "회원 정보를 불러오는 중 오류가 발생했습니다."
          );


        } finally {

          setLoading(false);
        }
      };


    loadMyPage();

  }, [
    sw,
    memberId,
    navigate
  ]);


  /**
   * 미리보기 URL 정리
   */
  useEffect(() => {

    return () => {

      if (
        photoPreview
      ) {

        URL.revokeObjectURL(
          photoPreview
        );
      }
    };

  }, [
    photoPreview
  ]);


  /**
   * 날짜 표시
   */
  /**
   * Premium 플랜 한글 표시
   */
  const getSubscriptionPlanLabel = (
    planType?: string | null
  ) => {

    if (planType === "YEARLY") {
      return "연간 Premium";
    }

    if (planType === "MONTHLY") {
      return "월간 Premium";
    }

    return "Premium";
  };


  /**
   * 구독 상태 한글 표시
   */
  const getSubscriptionStatusLabel = (
    status?: string | null
  ) => {

    if (status === "ACTIVE") {
      return "이용 중";
    }

    if (status === "CANCELLED") {
      return "해지";
    }

    if (status === "EXPIRED") {
      return "만료";
    }

    return "-";
  };


  /**
   * 구독 / 결제 내역 다시 불러오기
   */
  const loadSubscriptionSection =
    async () => {

      if (
        !memberId ||
        sw !== true
      ) {
        return;
      }


      try {

        setSubscriptionLoading(
          true
        );

        setSubscriptionError(
          ""
        );


        const [
          statusData,
          historyData
        ] =
          await Promise.all([
            getSubscriptionStatus(
              memberId
            ),
            getSubscriptionHistory(
              memberId
            )
          ]);


        setSubscriptionStatus(
          statusData
        );


        setSubscriptionHistory(
          historyData
        );


      } catch (subscriptionLoadError) {

        console.error(
          "구독 내역 조회 오류:",
          subscriptionLoadError
        );


        setSubscriptionError(
          "구독 · 결제 내역을 불러오는 중 오류가 발생했습니다."
        );

      } finally {

        setSubscriptionLoading(
          false
        );
      }
    };


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


  /**
   * 날짜 + 시간 표시
   */
  const formatDateTime = (
    date?: string
  ) => {

    if (!date) {
      return "-";
    }


    return date
      .replace(
        "T",
        " "
      )
      .substring(
        0,
        19
      );
  };


  /**
   * 상품 대표 이미지
   */
  const getThumbnail = (
    colors: ProductColor[]
  ) => {

    const visibleColors =
      colors
        .filter(
          (color) =>
            color.visible !== "N"
        )
        .sort(
          (a, b) => {

            if (
              a.isMain === "Y" &&
              b.isMain !== "Y"
            ) {
              return -1;
            }


            if (
              a.isMain !== "Y" &&
              b.isMain === "Y"
            ) {
              return 1;
            }


            return (
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
            );
          }
        );


    const images =
      visibleColors.flatMap(
        (color) =>
          (color.images ?? []).map(
            (image) => ({
              ...image,
              colorIsMain:
                color.isMain
            })
          )
      );


    const thumbnail =
      images
        .filter(
          (image) =>
            image.imageType ===
            "THUMBNAIL"
        )
        .sort(
          (a, b) => {

            if (
              a.isMain === "Y" &&
              b.isMain !== "Y"
            ) {
              return -1;
            }


            if (
              a.isMain !== "Y" &&
              b.isMain === "Y"
            ) {
              return 1;
            }


            return (
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
            );
          }
        )[0] ??

      images
        .filter(
          (image) =>
            image.isMain === "Y" ||
            image.imageType === "MAIN"
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0)
        )[0] ??

      images[0];


    return thumbnail?.filePath
      ? getImageUrl(
          thumbnail.filePath
        )
      : "";
  };


  /**
   * 최근 찜 상품 불러오기
   */
  const loadWishlistPreview =
    async () => {

      if (
        !memberId ||
        sw !== true
      ) {
        return;
      }


      try {

        setWishlistLoading(
          true
        );


        const response =
          await fetch(
            `${API_BASE}/wishlist/member/${memberId}`
          );


        if (!response.ok) {

          throw new Error(
            "찜 목록을 불러오지 못했습니다."
          );
        }


        const wishlistData:
          WishlistItem[] =
          await response.json();


        const recentWishlist =
          wishlistData.slice(
            0,
            6
          );


        const viewData =
          await Promise.all(

            recentWishlist.map(
              async (item) => {

                try {

                  const [
                    productResponse,
                    colorResponse
                  ] =
                    await Promise.all([

                      fetch(
                        `${API_BASE}/product/${item.productId}`
                      ),

                      fetch(
                        `${API_BASE}/product_color/product/${item.productId}`
                      )

                    ]);


                  const product:
                    Product | null =
                    productResponse.ok
                      ? await productResponse.json()
                      : null;


                  const colors:
                    ProductColor[] =
                    colorResponse.ok
                      ? await colorResponse.json()
                      : [];


                  return {

                    ...item,

                    brand:
                      product?.brand ??
                      "",

                    productName:
                      product?.name ??
                      item.productName,

                    price:
                      product?.price ??
                      item.price,

                    discount:
                      product?.discount ??
                      item.discount,

                    imageUrl:
                      getThumbnail(
                        colors
                      )
                  };


                } catch {

                  return item;
                }
              }
            )
          );


        setWishlistItems(
          viewData
        );


      } catch (error) {

        console.error(
          "마이페이지 찜 목록 조회 오류:",
          error
        );


        setWishlistItems(
          []
        );


      } finally {

        setWishlistLoading(
          false
        );
      }
    };


    /** MY PAGE 카드 개수 */
  const loadDashboardCounts = async () => {
    if (!memberId || sw !== true) return;

    const next = { order: 0, wishlist: 0, beauty: 0, review: 0 };

    try {
      const r = await fetch(`${API_BASE}/wishlist/member/${memberId}/count`);
      if (r.ok) next.wishlist = Number(await r.json()) || 0;
    } catch {}

    try {
      const r = await fetch(`${API_BASE}/product_review/member/${memberId}/page?page=0&size=1`);
      if (r.ok) {
        const data = await r.json();
        next.review = Number(data?.totalElements) || 0;
      }
    } catch {}

    try {
      const response =
        await axiosInstance.get<{
          success: boolean;
          data: MyOrder[];
          message?: string;
        }>(
          "/api/commerce/orders/my"
        );

      next.order =
        Array.isArray(response.data?.data)
          ? response.data.data.length
          : 0;
    } catch (error) {
      console.error(
        "마이페이지 주문 개수 조회 오류:",
        error
      );

      next.order = 0;
    }

    // 현재 Spring에는 BEAUTY_SAVE 조회 Controller가 아직 없어 AI BEAUTY 카운트는 0으로 둡니다.

    setDashboardCounts(next);
  };


  /**
   * 주문 상태 한글 표시
   */
  const getOrderStatusLabel = (
    status?: string
  ) => {

    switch (status) {
      case "PAYMENT_WAITING":
        return "결제대기";

      case "ORDERED":
        return "주문완료";

      case "PAID":
        return "결제완료";

      case "PREPARING":
        return "상품준비중";

      case "SHIPPED":
        return "배송시작";

      case "CANCEL_REQUESTED":
        return "취소요청";

      case "SHIPPING":
        return "배송중";

      case "DELIVERED":
        return "배송완료";

      case "CANCELLED":
        return "주문취소";

      default:
        return status || "-";
    }
  };


  /**
   * 주문 내역 조회
   */
  const getOrderProductImageUrl = (
    filePath?: string
  ) => {

    if (!filePath) {
      return "";
    }


    if (
      filePath.startsWith("http://") ||
      filePath.startsWith("https://")
    ) {
      return filePath;
    }


    return `${API_BASE}${
      filePath.startsWith("/")
        ? filePath
        : `/${filePath}`
    }`;
  };


  /**
   * 주문 내역 + 실제 상품 대표 이미지 조회
   *
   * 주문 상세의 첫 상품명/색상명을 기준으로
   * PRODUCT → PRODUCT_COLOR → PRODUCT_COLOR_IMAGE를 연결한다.
   */
  const loadMyOrders = async () => {

    if (
      !memberId ||
      sw !== true
    ) {
      return;
    }


    try {

      setOrderLoading(
        true
      );

      setOrderError(
        ""
      );


      const [
        orderResponse,
        productResponse,
        colorResponse,
        imageResponse
      ] = await Promise.all([

        axiosInstance.get<{
          success: boolean;
          data: MyOrder[];
          message?: string;
        }>(
          "/api/commerce/orders/my"
        ),

        axiosInstance.get<Product[]>(
          "/product/find_all"
        ),

        axiosInstance.get<ProductColor[]>(
          "/product_color/find_all"
        ),

        axiosInstance.get<ProductImage[]>(
          "/product_color_image/find_all"
        )

      ]);


      const orders =
        Array.isArray(
          orderResponse.data?.data
        )
          ? orderResponse.data.data
          : [];


      const products =
        productResponse.data ?? [];


      const colors =
        (colorResponse.data ?? [])
          .map(
            (color) => ({
              ...color,
              id:
                color.id ??
                0
            })
          );


      const images =
        (imageResponse.data ?? [])
          .map(
            (image) => ({
              ...image,
              productColorId:
                image.productColorId ??
                0
            })
          );


      /**
       * 각 주문의 첫 상품 정보를 주문 상세 API에서 조회한다.
       * 여러 상품 주문은 대표 첫 상품 이미지만 카드에 표시한다.
       */
      const orderViewItems =
        await Promise.all(

          orders.map(
            async (order) => {

              try {

                const detailResponse =
                  await axiosInstance.get<{
                    success: boolean;
                    data: MyOrderDetailResponse;
                    message?: string;
                  }>(
                    `/api/commerce/orders/${order.id}`
                  );


                const firstDetail =
                  detailResponse.data?.data
                    ?.orderDetails?.[0];


                if (!firstDetail) {
                  return order;
                }


                const product =
                  products.find(
                    (item) =>
                      item.name ===
                      firstDetail.productName
                  );


                if (!product) {

                  return {
                    ...order,

                    firstProductName:
                      firstDetail.productName,

                    firstColorName:
                      firstDetail.colorName,

                    firstVariantName:
                      firstDetail.variantName
                  };
                }


                const productId =
                  product.productId ??
                  product.id ??
                  0;


                const productColors =
                  colors
                    .filter(
                      (color) =>
                        color.productId ===
                          productId &&
                        color.visible !== "N"
                    )
                    .sort(
                      (a, b) =>
                        (a.sortOrder ?? 0) -
                        (b.sortOrder ?? 0)
                    );


                /**
                 * 실제 주문 색상이 있으면 같은 색상을 우선 사용.
                 * 찾지 못하면 상품의 대표 색상을 사용한다.
                 */
                const targetColor =
                  productColors.find(
                    (color) =>
                      firstDetail.colorName &&
                      color.colorName ===
                        firstDetail.colorName
                  ) ??
                  productColors.find(
                    (color) =>
                      color.isMain === "Y"
                  ) ??
                  productColors[0];


                const targetColorId =
                  targetColor?.id ??
                  0;


                const productImages =
                  images
                    .filter(
                      (image) =>
                        image.productColorId ===
                          targetColorId
                    )
                    .sort(
                      (a, b) => {

                        const aMain =
                          a.isMain === "Y"
                            ? 0
                            : a.imageType ===
                                "THUMBNAIL"
                              ? 1
                              : a.imageType ===
                                  "MAIN"
                                ? 2
                                : 3;

                        const bMain =
                          b.isMain === "Y"
                            ? 0
                            : b.imageType ===
                                "THUMBNAIL"
                              ? 1
                              : b.imageType ===
                                  "MAIN"
                                ? 2
                                : 3;


                        if (
                          aMain !== bMain
                        ) {
                          return aMain - bMain;
                        }


                        return (
                          (a.sortOrder ?? 0) -
                          (b.sortOrder ?? 0)
                        );
                      }
                    );


                const imageUrl =
                  getOrderProductImageUrl(
                    productImages[0]?.filePath
                  );


                return {
                  ...order,

                  imageUrl,

                  productId,

                  firstProductName:
                    firstDetail.productName,

                  firstColorName:
                    firstDetail.colorName,

                  firstVariantName:
                    firstDetail.variantName
                };


              } catch (detailError) {

                console.error(
                  `주문 ${order.id} 상품 이미지 조회 오류:`,
                  detailError
                );


                /**
                 * 이미지 조회 실패가 전체 주문내역 조회 실패로 이어지지 않도록
                 * 주문 기본정보는 그대로 표시한다.
                 */
                return order;
              }
            }
          )
        );


      setOrderItems(
        orderViewItems
      );


    } catch (error) {

      console.error(
        "마이페이지 주문 내역 조회 오류:",
        error
      );


      setOrderItems(
        []
      );


      setOrderError(
        "주문 내역을 불러오는 중 오류가 발생했습니다."
      );


    } finally {

      setOrderLoading(
        false
      );
    }
  };


  useEffect(() => {

    if (
      activeMenu !== "order" ||
      !memberId ||
      sw !== true
    ) {
      return;
    }


    void loadMyOrders();

  }, [
    activeMenu,
    memberId,
    sw
  ]);


/**
 * MY PAGE 첫 화면에서 최근 본 상품 불러오기
 */
useEffect(() => {

  if (
    activeMenu !== "info" ||
    infoDetailOpen === true
  ) {
    return;
  }

  try {

    const storageKey =
      sw && memberId > 0
        ? `goddessRecentProducts_${memberId}`
        : "goddessRecentProducts_guest";

    const saved =
      JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      ) as RecentViewedItem[];

    setRecentViewedItems(
      Array.isArray(saved)
        ? saved.slice(0, 20)
        : []
    );

  } catch (error) {

    console.error(
      "최근 본 상품 조회 오류:",
      error
    );

    setRecentViewedItems([]);
  }

}, [
  activeMenu,
  infoDetailOpen,
  sw,
  memberId
]);


  /**
   * 할인율 숫자 변환
   */
  const getDiscountRate = (
    discount?: string | number
  ) => {

    if (!discount) {
      return 0;
    }


    const value =
      typeof discount === "number"
        ? discount
        : Number(discount.replace(/[^0-9]/g, ""));


    return Number.isNaN(
      value
    )
      ? 0
      : value;
  };


  /**
   * 수정 모드 시작
   */
  const handleEditStart = () => {

    if (!member) {
      return;
    }


    setEditForm({

      loginId:
        member.loginId || "",

      nickname:
        member.nickname || "",

      zipcode:
        member.zipcode || "",

      address1:
        member.address1 || "",

      address2:
        member.address2 || "",

      skinType:
        member.skinType || "",

      personalColor:
        member.personalColor || ""

    });


    setLoginIdChecked(
      true
    );


    setNicknameChecked(
      true
    );


    /**
     * 수정 모드 진입 시 이전 사진 검사 상태 초기화
     */
    photoCheckRequestId.current += 1;

    setPhotoAiResult(
      null
    );

    setPhotoAiError(
      ""
    );

    setPhotoChecking(
      false
    );


    setIsEditing(
      true
    );
  };


  /**
   * 수정 취소
   */
  const handleEditCancel = () => {

    if (member) {

      setEditForm({

        loginId:
          member.loginId || "",

        nickname:
          member.nickname || "",

        zipcode:
          member.zipcode || "",

        address1:
          member.address1 || "",

        address2:
          member.address2 || "",

        skinType:
          member.skinType || "",

        personalColor:
          member.personalColor || ""

      });
    }


    /**
     * 새로 고른 사진도 취소
     */
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


    photoCheckRequestId.current += 1;

    setPhotoAiResult(
      null
    );

    setPhotoAiError(
      ""
    );

    setPhotoChecking(
      false
    );



    setLoginIdChecked(
      true
    );


    setNicknameChecked(
      true
    );


    setIsEditing(
      false
    );
  };


  /**
   * 회원정보 입력값 변경
   */
  const handleChange = (
    event:
      React.ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement
      >
  ) => {

    const {
      name,
      value
    } =
      event.target;


    setEditForm(
      (prev) => ({
        ...prev,
        [name]: value
      })
    );


    if (
      name === "loginId"
    ) {

      setLoginIdChecked(
        value.trim() ===
          member?.loginId
      );
    }


    if (
      name === "nickname"
    ) {

      setNicknameChecked(
        value.trim() ===
          member?.nickname
      );
    }
  };


  /**
   * 회원 사진 선택 / 카메라 촬영 공통 처리
   *
   * 처리 순서:
   *
   * 1. 이미지 형식 검사
   * 2. 10MB 용량 검사
   * 3. 미리보기 표시
   * 4. Spring /member_photo/check 호출
   * 5. H200 FastAPI 11501 AI 검사
   * 6. 검사 결과를 화면에 표시
   *
   * AI 검사 통과(valid=true)한 사진만
   * 실제 사진 등록 / 변경 버튼을 활성화한다.
   */
  const handlePhotoChange =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        event.target.files?.[0];


      /**
       * 같은 파일을 다시 선택해도
       * onChange가 발생하도록 input 값은 즉시 초기화한다.
       *
       * File 객체 자체는 아래 file 변수에 보관되어 있다.
       */
      event.target.value =
        "";


      if (!file) {
        return;
      }


      /**
       * 이미지 타입 검사
       */
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

        return;
      }


      /**
       * 10MB 제한
       */
      const maxSize =
        10 * 1024 * 1024;


      if (
        file.size >
        maxSize
      ) {

        alert(
          "사진은 10MB 이하만 등록할 수 있습니다."
        );

        return;
      }


      /**
       * 새로운 검사 요청 번호 생성
       *
       * 사진을 연속 선택할 경우 이전 응답은 무시한다.
       */
      const requestId =
        photoCheckRequestId.current + 1;

      photoCheckRequestId.current =
        requestId;


      /**
       * 이전 AI 검사 결과 초기화
       */
      setPhotoAiResult(
        null
      );

      setPhotoAiError(
        ""
      );


      /**
       * 기존 미리보기 URL 제거
       */
      if (
        photoPreview
      ) {

        URL.revokeObjectURL(
          photoPreview
        );
      }


      /**
       * 선택한 사진 저장
       */
      setSelectedPhoto(
        file
      );


      /**
       * 브라우저 미리보기
       */
      const preview =
        URL.createObjectURL(
          file
        );


      setPhotoPreview(
        preview
      );


      /**
       * AI 검사 요청 데이터
       */
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


        /**
         * React
         * → Spring /member_photo/check
         * → H200 FastAPI 11501
         */
        const response =
          await axiosInstance.post<
            PhotoAiCheckResult
          >(
            "/member_photo/check",
            formData
          );


        /**
         * 이미 다른 사진을 선택했다면
         * 이전 요청의 결과는 반영하지 않는다.
         */
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

        if (
          requestId !==
          photoCheckRequestId.current
        ) {
          return;
        }


        console.error(
          "회원 사진 AI 검사 오류:",
          error
        );


        /**
         * Axios 응답에 서버 메시지가 있으면 우선 사용한다.
         */
        const errorData =
          (
            error as {
              response?: {
                data?: {
                  message?: string;
                  error?: string;
                } | string;
              };
            }
          )?.response?.data;


        let errorMessage =
          "사진 AI 검사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";


        if (
          typeof errorData === "string" &&
          errorData.trim()
        ) {

          errorMessage =
            errorData;

        } else if (
          errorData &&
          typeof errorData === "object"
        ) {

          errorMessage =
            errorData.message ||
            errorData.error ||
            errorMessage;
        }


        setPhotoAiResult(
          null
        );


        setPhotoAiError(
          errorMessage
        );


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


  /**
   * 회원 사진 등록 / 변경
   */
  const handlePhotoUpload =
    async () => {

      if (!memberId) {

        alert(
          "회원 정보를 확인할 수 없습니다."
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


        /**
         * Content-Type은 직접 지정하지 않음.
         *
         * Axios가 FormData에 필요한
         * multipart/form-data와 boundary를
         * 자동 생성한다.
         */
        const response =
          await axiosInstance.post<
            MemberPhoto
          >(
            `/member_photo/member/${memberId}`,
            formData
          );


        setMemberPhoto(
          response.data
        );


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


        photoCheckRequestId.current += 1;

        setPhotoAiResult(
          null
        );

        setPhotoAiError(
          ""
        );

        setPhotoChecking(
          false
        );



        alert(
          memberPhoto
            ? "회원 사진이 변경되었습니다."
            : "회원 사진이 등록되었습니다."
        );


      } catch (error) {

        console.error(
          "회원 사진 등록 오류:",
          error
        );


        alert(
          "회원 사진 등록 중 오류가 발생했습니다."
        );


      } finally {

        setPhotoSaving(
          false
        );
      }
    };


  /**
   * 아이디 중복 확인
   */
  const handleCheckLoginId =
    async () => {

      const loginId =
        editForm.loginId.trim();


      if (!loginId) {

        alert(
          "아이디를 입력해주세요."
        );

        return;
      }


      if (
        loginId ===
        member?.loginId
      ) {

        setLoginIdChecked(
          true
        );


        alert(
          "현재 사용 중인 아이디입니다."
        );


        return;
      }


      try {

        const response =
          await axiosInstance.get<boolean>(
            "/mypage/check_id",
            {
              params: {

                memberId:
                  memberId,

                loginId:
                  loginId

              }
            }
          );


        if (
          response.data
        ) {

          setLoginIdChecked(
            false
          );


          alert(
            "이미 사용 중인 아이디입니다."
          );


        } else {

          setLoginIdChecked(
            true
          );


          alert(
            "사용 가능한 아이디입니다."
          );
        }


      } catch (error) {

        console.error(
          "아이디 중복 확인 오류:",
          error
        );


        setLoginIdChecked(
          false
        );


        alert(
          "아이디 중복 확인 중 오류가 발생했습니다."
        );
      }
    };


  /**
   * 닉네임 중복 확인
   */
  const handleCheckNickname =
    async () => {

      const nickname =
        editForm.nickname.trim();


      if (!nickname) {

        alert(
          "닉네임을 입력해주세요."
        );

        return;
      }


      if (
        nickname ===
        member?.nickname
      ) {

        setNicknameChecked(
          true
        );


        alert(
          "현재 사용 중인 닉네임입니다."
        );


        return;
      }


      try {

        const response =
          await axiosInstance.get<boolean>(
            "/mypage/check_nickname",
            {
              params: {

                memberId:
                  memberId,

                nickname:
                  nickname

              }
            }
          );


        if (
          response.data
        ) {

          setNicknameChecked(
            false
          );


          alert(
            "이미 사용 중인 닉네임입니다."
          );


        } else {

          setNicknameChecked(
            true
          );


          alert(
            "사용 가능한 닉네임입니다."
          );
        }


      } catch (error) {

        console.error(
          "닉네임 중복 확인 오류:",
          error
        );


        setNicknameChecked(
          false
        );


        alert(
          "닉네임 중복 확인 중 오류가 발생했습니다."
        );
      }
    };


  /**
   * 내 정보 수정 완료
   */
  const handleUpdate =
    async () => {

      if (!memberId) {

        alert(
          "회원 정보를 확인할 수 없습니다."
        );

        return;
      }


      if (
        !editForm.loginId.trim()
      ) {

        alert(
          "아이디를 입력해주세요."
        );

        return;
      }


      if (
        !editForm.nickname.trim()
      ) {

        alert(
          "닉네임을 입력해주세요."
        );

        return;
      }


      if (
        !loginIdChecked
      ) {

        alert(
          "아이디 중복 확인을 해주세요."
        );

        return;
      }


      if (
        !nicknameChecked
      ) {

        alert(
          "닉네임 중복 확인을 해주세요."
        );

        return;
      }


      const confirmUpdate =
        window.confirm(
          "회원 정보를 수정하시겠습니까?"
        );


      if (!confirmUpdate) {
        return;
      }


      try {

        setSaving(
          true
        );


        const response =
          await axiosInstance.put<Member>(
            `/mypage/${memberId}`,
            {

              loginId:
                editForm.loginId.trim(),

              nickname:
                editForm.nickname.trim(),

              zipcode:
                editForm.zipcode.trim(),

              address1:
                editForm.address1.trim(),

              address2:
                editForm.address2.trim(),

              skinType:
                editForm.skinType || null,

              personalColor:
                editForm.personalColor || null

            }
          );


        setMember(
          response.data
        );


        setEditForm({

          loginId:
            response.data.loginId || "",

          nickname:
            response.data.nickname || "",

          zipcode:
            response.data.zipcode || "",

          address1:
            response.data.address1 || "",

          address2:
            response.data.address2 || "",

          skinType:
            response.data.skinType || "",

          personalColor:
            response.data.personalColor || ""

        });


        setLoginIdChecked(
          true
        );


        setNicknameChecked(
          true
        );


        setIsEditing(
          false
        );


        alert(
          "회원 정보가 수정되었습니다."
        );


      } catch (error) {

        console.error(
          "My Page 수정 오류:",
          error
        );


        alert(
          "회원 정보 수정 중 오류가 발생했습니다.\n아이디 또는 닉네임 중복 여부를 확인해주세요."
        );


      } finally {

        setSaving(
          false
        );
      }
    };


  useEffect(() => {
    if (member && memberId && sw === true) {
      void loadDashboardCounts();
    }
  }, [member, memberId, sw]);


  if (
    loading
  ) {

    return (

      <main className="mypage">

        <div className="mypage-message">
          회원 정보를 불러오는 중입니다.
        </div>

      </main>
    );
  }


  if (
    error ||
    !member
  ) {

    return (

      <main className="mypage">

        <div className="mypage-message">

          {
            error ||
            "회원 정보를 찾을 수 없습니다."
          }

        </div>

      </main>
    );
  }


  return (

    <main className="mypage">


      {/* =========================
          마이페이지 2단 레이아웃
          - 왼쪽: 프로필 + 마이페이지 메뉴
          - 오른쪽: 선택된 내용
      ========================= */}
      <div className="mypage-layout">

        <aside className="mypage-sidebar">

          <div className="mypage-sidebar-profile">
            <p className="mypage-sidebar-label">
              MY ACCOUNT
            </p>

            <h2>
              {member.nickname}님
            </h2>

            <div className="mypage-sidebar-membership-line">

              <span className="mypage-sidebar-grade">
                {member.gradeName || member.status || "일반회원"}
              </span>


              {subscriptionStatus?.premium && (

                <span
                  className="mypage-sidebar-premium-mark"
                  title={`${getSubscriptionPlanLabel(
                    subscriptionStatus.planType
                  )} 이용 중`}
                  aria-label={`${getSubscriptionPlanLabel(
                    subscriptionStatus.planType
                  )} 이용 중`}
                >
                  P
                </span>

              )}

            </div>

            <button
              type="button"
              className="mypage-sidebar-manage"
              onClick={() => {
                setActiveMenu("info");
                setInfoDetailOpen(true);
              }}
            >
              회원정보 관리 →
            </button>
          </div>


          <nav
            className="mypage-sidebar-navigation"
            aria-label="마이페이지 메뉴"
          >
            <button
              type="button"
              className={
                activeMenu === "info" && !infoDetailOpen
                  ? "active"
                  : ""
              }
              onClick={() => {
                setActiveMenu("info");
                setInfoDetailOpen(false);
              }}
            >
              <span>MY PAGE</span>
              <small>나의 쇼핑</small>
            </button>

            <button
              type="button"
              className={activeMenu === "order" ? "active" : ""}
              onClick={() => setActiveMenu("order")}
            >
              <span>ORDER</span>
              <small>주문 내역</small>
            </button>

            <button
              type="button"
              className={activeMenu === "subscription" ? "active" : ""}
              onClick={async () => {

                setActiveMenu(
                  "subscription"
                );


                /*
                 * 이용권 관리 화면으로 이동했다가
                 * 브라우저 뒤로가기를 눌러도
                 * SUBSCRIPTION 메뉴를 유지하기 위해
                 * 현재 마이페이지 history state에 저장한다.
                 */
                navigate(
                  `${location.pathname}${location.search}`,
                  {
                    replace: true,
                    state: {
                      ...location.state,
                      activeMenu:
                        "subscription"
                    }
                  }
                );


                await loadSubscriptionSection();
              }}
            >
              <span>SUBSCRIPTION</span>
              <small>구독 · 결제 내역</small>
            </button>

            <button
              type="button"
              className={activeMenu === "wishlist" ? "active" : ""}
              onClick={async () => {
                setActiveMenu("wishlist");
                await loadWishlistPreview();
              }}
            >
              <span>WISHLIST</span>
              <small>찜한 상품</small>
            </button>

            <button
              type="button"
              className={activeMenu === "beauty" ? "active" : ""}
              onClick={() => setActiveMenu("beauty")}
            >
              <span>BEAUTY</span>
              <small>나의 뷰티 체험</small>
            </button>

            <button
              type="button"
              className={activeMenu === "review" ? "active" : ""}
              onClick={() => setActiveMenu("review")}
            >
              <span>REVIEW</span>
              <small>작성 리뷰</small>
            </button>

            <button
              type="button"
              className={activeMenu === "qna" ? "active" : ""}
              onClick={() => setActiveMenu("qna")}
            >
              <span>Q&A</span>
              <small>문의 내역</small>
            </button>
          </nav>

        </aside>


        <div className="mypage-content">

      {activeMenu === "info" && (

        <>

          {!infoDetailOpen && (

            <>

              <section className="mypage-dashboard">

                <div className="mypage-dashboard-heading">
                  <p>MY SHOPPING</p>
                  <h2>나의 쇼핑</h2>
                  <span>주문, 찜, 뷰티 체험, 리뷰 활동을 한눈에 확인해보세요.</span>
                </div>


                <div className="mypage-dashboard-menu">

                  <button
                    type="button"
                    onClick={() => setActiveMenu("order")}
                  >
                    <span>01</span>
                    <strong>ORDER</strong>
                    <b className="mypage-dashboard-menu-count">{dashboardCounts.order}</b>
                    <small>주문 내역</small>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setActiveMenu("wishlist");
                      await loadWishlistPreview();
                    }}
                  >
                    <span>02</span>
                    <strong>WISHLIST</strong>
                    <b className="mypage-dashboard-menu-count">{dashboardCounts.wishlist}</b>
                    <small>찜한 상품</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenu("beauty")}
                  >
                    <span>03</span>
                    <strong>BEAUTY</strong>
                    <b className="mypage-dashboard-menu-count">{dashboardCounts.beauty}</b>
                    <small>나의 뷰티 체험</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenu("review")}
                  >
                    <span>04</span>
                    <strong>REVIEW</strong>
                    <b className="mypage-dashboard-menu-count">{dashboardCounts.review}</b>
                    <small>작성 리뷰</small>
                  </button>

                </div>

              </section>


              <section className="mypage-dashboard-section">

                <div className="mypage-dashboard-section-title">
                  <div>
                    <span>RECENTLY VIEWED</span>
                    <h3>최근 본 상품</h3>
                  </div>

                  {recentViewedItems.length > 4 && (
                    <span className="mypage-dashboard-section-count">
                      최근 {recentViewedItems.length}개
                    </span>
                  )}
                </div>


                {recentViewedItems.length === 0 ? (

                  <div className="mypage-dashboard-empty">
                    <p>아직 최근 본 상품이 없습니다.</p>
                    <button
                      type="button"
                      onClick={() => navigate("/products")}
                    >
                      상품 둘러보기
                    </button>
                  </div>

                ) : (

                  <div className="mypage-dashboard-products">

                    {recentViewedItems.slice(0, 4).map((item) => {

                      const discountRate =
                        getDiscountRate(item.discount);

                      const salePrice =
                        discountRate > 0
                          ? Math.round(
                              item.price *
                              (1 - discountRate / 100)
                            )
                          : item.price;


                      return (

                        <button
                          type="button"
                          key={item.productId}
                          className="mypage-dashboard-product"
                          onClick={() =>
                            navigate(
                              `/products/${item.productId}`
                            )
                          }
                        >

                          <div className="mypage-dashboard-product-image">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                              />
                            ) : (
                              <span>NO IMAGE</span>
                            )}
                          </div>

                          <div className="mypage-dashboard-product-info">
                            <span>
                              {item.brand || "STAR"}
                            </span>
                            <strong>
                              {item.productName}
                            </strong>
                            <p>
                              {discountRate > 0 && (
                                <b>{discountRate}%</b>
                              )}
                              {salePrice.toLocaleString()}원
                            </p>
                          </div>

                        </button>
                      );
                    })}

                  </div>

                )}

              </section>




            </>

          )}


          {infoDetailOpen && (

            <>

              <div className="mypage-info-back-wrap">
                <button
                  type="button"
                  className="mypage-info-back-button"
                  onClick={() => {
                    setInfoDetailOpen(false);
                    setIsEditing(false);
                  }}
                >
                  ← 나의 쇼핑
                </button>
              </div>



          {/* =========================
              회원 사진 미등록 안내
          ========================= */}

          {!memberPhoto &&
            !isEditing && (

            <div className="mypage-photo-banner">

              <div>

                <strong>
                  AI BEAUTY를 준비해보세요
                </strong>


                <p>
                  아직 등록된 회원 사진이 없습니다.
                  회원 사진을 등록하면
                  AI 뷰티 체험 기능에서 사용할 수 있습니다.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleEditStart
                }
              >
                사진 등록하기
              </button>

            </div>

          )}


          {/* =========================
              01 내 정보
          ========================= */}

          <section className="mypage-section">

            <div className="mypage-section-heading">

              <span>
                01
              </span>


              <div>

                <p>
                  MY INFORMATION
                </p>


                <h2>
                  내 정보
                </h2>

              </div>

            </div>


            <div className="mypage-info">


              {/* 아이디 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  아이디
                </span>


                {isEditing ? (

                  <div className="mypage-edit-check-wrap">

                    <input
                      type="text"
                      name="loginId"
                      className="mypage-edit-input"
                      value={
                        editForm.loginId
                      }
                      onChange={
                        handleChange
                      }
                    />


                    <button
                      type="button"
                      className="mypage-check-button"
                      onClick={
                        handleCheckLoginId
                      }
                    >
                      중복 확인
                    </button>

                  </div>

                ) : (

                  <strong>
                    {member.loginId}
                  </strong>

                )}

              </div>


              {/* 비밀번호 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  비밀번호
                </span>


                <div className="mypage-password-display">

                  <span>
                    ********
                  </span>


                  {isEditing && (

                    <button
                      type="button"
                      className="mypage-password-change-button"
                      onClick={
                        () =>
                          navigate(
                            "/mypage/password"
                          )
                      }
                    >
                      비밀번호 변경
                    </button>

                  )}

                </div>

              </div>


              {/* 이름 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  이름
                </span>


                <span>
                  {member.name}
                </span>

              </div>


              {/* 닉네임 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  닉네임
                </span>


                {isEditing ? (

                  <div className="mypage-edit-check-wrap">

                    <input
                      type="text"
                      name="nickname"
                      className="mypage-edit-input"
                      value={
                        editForm.nickname
                      }
                      onChange={
                        handleChange
                      }
                    />


                    <button
                      type="button"
                      className="mypage-check-button"
                      onClick={
                        handleCheckNickname
                      }
                    >
                      중복 확인
                    </button>

                  </div>

                ) : (

                  <span>
                    {member.nickname}
                  </span>

                )}

              </div>


              {/* 이메일 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  이메일
                </span>


                <span>
                  {member.email}
                </span>

              </div>


              {/* 전화번호 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  전화번호
                </span>


                <span>
                  {member.tel || "-"}
                </span>

              </div>


              {/* 회원 등급 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  회원 등급
                </span>


                <span>
                  {member.gradeName || "-"}
                </span>

              </div>


              {/* Premium 이용권 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  Premium 이용권
                </span>


                <div className="mypage-premium-info-value">

                  <strong
                    className={
                      subscriptionStatus?.premium
                        ? "mypage-premium-status active"
                        : "mypage-premium-status"
                    }
                  >
                    {
                      subscriptionStatus?.premium
                        ? `${getSubscriptionPlanLabel(
                            subscriptionStatus.planType
                          )} 이용 중`
                        : "미이용"
                    }
                  </strong>


                  {
                    subscriptionStatus?.premium &&
                    subscriptionStatus.endDate && (

                      <small>
                        이용기간&nbsp;
                        {
                          formatDate(
                            subscriptionStatus.startDate || undefined
                          )
                        }
                        &nbsp;~&nbsp;
                        {
                          formatDate(
                            subscriptionStatus.endDate
                          )
                        }
                      </small>

                    )
                  }

                </div>

              </div>


              {/* 피부 타입 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  피부 타입
                </span>


                {isEditing ? (

                  <select
                    name="skinType"
                    className="mypage-edit-input"
                    value={
                      editForm.skinType
                    }
                    onChange={
                      handleChange
                    }
                  >

                    {SKIN_TYPE_OPTIONS.map(
                      (option) => (

                        <option
                          key={
                            option.value ||
                            "skin-empty"
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>

                      )
                    )}

                  </select>

                ) : (

                  <span>
                    {
                      getSkinTypeLabel(
                        member.skinType
                      )
                    }
                  </span>

                )}

              </div>


              {/* 퍼스널 컬러 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  퍼스널 컬러
                </span>


                {isEditing ? (

                  <select
                    name="personalColor"
                    className="mypage-edit-input"
                    value={
                      editForm.personalColor
                    }
                    onChange={
                      handleChange
                    }
                  >

                    {PERSONAL_COLOR_OPTIONS.map(
                      (option) => (

                        <option
                          key={
                            option.value ||
                            "personal-color-empty"
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>

                      )
                    )}

                  </select>

                ) : (

                  <span>
                    {
                      getPersonalColorLabel(
                        member.personalColor
                      )
                    }
                  </span>

                )}

              </div>


              {/* =========================
                  회원 사진
              ========================= */}

              <div className="mypage-info-row mypage-photo-row">

                <span className="mypage-info-label">
                  회원 사진
                </span>


                <div className="mypage-photo-area">


                  {/* 선택한 사진 미리보기 */}

                  {photoPreview ? (

                    <img
                      src={
                        photoPreview
                      }
                      alt="선택한 회원 사진 미리보기"
                      className="mypage-member-photo"
                    />

                  ) : memberPhoto ? (

                    /* 현재 저장된 사진 */

                    <img
                      src={
                        getImageUrl(
                          memberPhoto.filePath
                        )
                      }
                      alt="회원 사진"
                      className="mypage-member-photo"
                    />

                  ) : (

                    /* 사진 없음 */

                    <div className="mypage-photo-empty">

                      등록된 사진이 없습니다.

                    </div>

                  )}


                  {isEditing && (

                    <div className="mypage-photo-edit">


                      <p className="mypage-photo-guide">
                        AI 뷰티 체험에 사용할 회원 사진을 등록해주세요.

                        <br />

                        정면을 바라보고 얼굴 전체가 잘 보이는 사진을 권장합니다.

                        <br />

                        조명이 너무 밝거나 어둡지 않은 사진을 사용해주세요.

                        <br />

                        과도한 필터나 보정이 적용된 사진은
                        실제 AI 뷰티 결과와 차이가 발생할 수 있습니다.

                        <br />

                        JPG, JPEG, PNG / 최대 10MB
                      </p>


                      <div className="mypage-photo-source-actions">

                        {/* 갤러리 / 파일 선택 */}
                        <input
                          ref={
                            galleryPhotoInputRef
                          }
                          type="file"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          onChange={
                            handlePhotoChange
                          }
                          className="mypage-photo-file-input"
                          style={{
                            display: "none"
                          }}
                        />


                        {/* 모바일 전면 카메라 촬영 */}
                        <input
                          ref={
                            cameraPhotoInputRef
                          }
                          type="file"
                          accept="image/jpeg,image/png"
                          capture="user"
                          onChange={
                            handlePhotoChange
                          }
                          className="mypage-photo-file-input"
                          style={{
                            display: "none"
                          }}
                        />


                        <button
                          type="button"
                          className="mypage-check-button"
                          onClick={
                            () =>
                              galleryPhotoInputRef.current?.click()
                          }
                          disabled={
                            photoSaving ||
                            photoChecking
                          }
                        >
                          사진 선택
                        </button>


                        <button
                          type="button"
                          className="mypage-check-button"
                          onClick={
                            () =>
                              cameraPhotoInputRef.current?.click()
                          }
                          disabled={
                            photoSaving ||
                            photoChecking
                          }
                        >
                          카메라로 촬영
                        </button>

                      </div>


                      {selectedPhoto && (

                        <div className="mypage-photo-selected-name">

                          선택한 파일:{" "}

                          {
                            selectedPhoto.name
                          }

                        </div>

                      )}


                      {photoChecking && (

                        <div className="mypage-photo-ai-result checking">

                          <strong>
                            AI 사진 검사 중...
                          </strong>

                          <p>
                            얼굴 방향, 밝기, 선명도를 확인하고 있습니다.
                          </p>

                        </div>

                      )}


                      {!photoChecking &&
                        photoAiResult && (

                        <div
                          className={
                            photoAiResult.valid
                              ? "mypage-photo-ai-result success"
                              : "mypage-photo-ai-result fail"
                          }
                        >

                          <div className="mypage-photo-ai-result-title">

                            <strong>
                              AI 사진 검사 결과
                            </strong>

                          </div>


                          <p className="mypage-photo-ai-message">
                            {
                              photoAiResult.message
                            }
                          </p>


                          {!photoAiResult.valid && (

                            <div className="mypage-photo-ai-result-inline">

                              <span>
                                얼굴 검출{" "}
                                <strong>
                                  {
                                    photoAiResult.faceDetected
                                      ? "정상"
                                      : "확인 필요"
                                  }
                                </strong>
                              </span>


                              <span>
                                정면 여부{" "}
                                <strong>
                                  {
                                    photoAiResult.isFront
                                      ? "정상"
                                      : "확인 필요"
                                  }
                                </strong>
                              </span>


                              <span>
                                밝기{" "}
                                <strong>
                                  {
                                    photoAiResult.isTooDark
                                      ? "너무 어두움"
                                      : photoAiResult.isTooBright
                                        ? "너무 밝음"
                                        : "정상"
                                  }
                                </strong>
                              </span>


                              <span>
                                선명도{" "}
                                <strong>
                                  {
                                    photoAiResult.isBlurred
                                      ? "흐림"
                                      : "정상"
                                  }
                                </strong>
                              </span>

                            </div>

                          )}

                        </div>

                      )}


                      {!photoChecking &&
                        photoAiError && (

                        <div className="mypage-photo-ai-result fail">

                          <strong>
                            AI 사진 검사를 완료하지 못했습니다.
                          </strong>

                          <p className="mypage-photo-ai-message">
                            {photoAiError}
                          </p>

                        </div>

                      )}


                      <button
                        type="button"
                        className="mypage-photo-upload-button"
                        onClick={
                          handlePhotoUpload
                        }
                        disabled={
                          !selectedPhoto ||
                          photoSaving ||
                          photoChecking ||
                          !photoAiResult?.valid
                        }
                      >

                        {
                          photoChecking

                            ? "AI 검사 중..."

                            : photoSaving

                              ? "사진 저장 중..."

                              : memberPhoto

                                ? "사진 변경하기"

                                : "사진 등록하기"
                        }

                      </button>

                    </div>

                  )}

                </div>

              </div>


              {/* 우편번호 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  우편번호
                </span>


                {isEditing ? (

                  <input
                    type="text"
                    name="zipcode"
                    className="mypage-edit-input mypage-edit-zipcode"
                    value={
                      editForm.zipcode
                    }
                    onChange={
                      handleChange
                    }
                  />

                ) : (

                  <span>
                    {member.zipcode || "-"}
                  </span>

                )}

              </div>


              {/* 기본 주소 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  기본 주소
                </span>


                {isEditing ? (

                  <input
                    type="text"
                    name="address1"
                    className="mypage-edit-input"
                    value={
                      editForm.address1
                    }
                    onChange={
                      handleChange
                    }
                  />

                ) : (

                  <span>
                    {member.address1 || "-"}
                  </span>

                )}

              </div>


              {/* 상세 주소 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  상세 주소
                </span>


                {isEditing ? (

                  <input
                    type="text"
                    name="address2"
                    className="mypage-edit-input"
                    value={
                      editForm.address2
                    }
                    onChange={
                      handleChange
                    }
                  />

                ) : (

                  <span>
                    {member.address2 || "-"}
                  </span>

                )}

              </div>


              {/* 가입일 */}

              <div className="mypage-info-row">

                <span className="mypage-info-label">
                  가입일
                </span>


                <span>

                  {
                    formatDate(
                      member.createdAt
                    )
                  }

                </span>

              </div>

            </div>


            {/* 수정 버튼 */}

            <div className="mypage-info-actions">


              {!isEditing ? (

                <button
                  type="button"
                  className="mypage-update-button"
                  onClick={
                    handleEditStart
                  }
                >
                  내 정보 수정
                </button>

              ) : (

                <>

                  <button
                    type="button"
                    className="mypage-cancel-button"
                    onClick={
                      handleEditCancel
                    }
                    disabled={
                      saving ||
                      photoSaving ||
                      photoChecking
                    }
                  >
                    취소
                  </button>


                  <button
                    type="button"
                    className="mypage-update-button"
                    onClick={
                      handleUpdate
                    }
                    disabled={
                      saving ||
                      photoSaving ||
                      photoChecking
                    }
                  >

                    {
                      saving
                        ? "수정 중..."
                        : "수정 완료"
                    }

                  </button>

                </>

              )}

            </div>

          </section>


          {/* =========================
              02 로그인 내역
          ========================= */}

          <section className="mypage-section">

            <div className="mypage-section-heading">

              <span>
                02
              </span>


              <div>

                <p>
                  LOGIN HISTORY
                </p>


                <h2>
                  로그인 내역
                </h2>

              </div>

            </div>


            <div className="mypage-login-history-wrap">

              <table className="mypage-login-history-table">

                <thead>

                  <tr>

                    <th>
                      기기 / 브라우저
                    </th>

                    <th>
                      접속 IP
                    </th>

                    <th>
                      로그인 일시
                    </th>

                    <th>
                      로그아웃 일시
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {
                    loginHistories.length === 0

                      ? (

                        <tr>

                          <td
                            colSpan={4}
                            className="mypage-login-history-empty"
                          >
                            로그인 내역이 없습니다.
                          </td>

                        </tr>

                      )

                      : (

                        loginHistories.map(
                          (history) => (

                            <tr
                              key={
                                history.id
                              }
                            >

                              <td>
                                {
                                  history.device ||
                                  "-"
                                }
                              </td>


                              <td>
                                {
                                  history.ip ||
                                  "-"
                                }
                              </td>


                              <td>
                                {
                                  formatDateTime(
                                    history.createdAt
                                  )
                                }
                              </td>


                              <td>
                                {
                                  formatDateTime(
                                    history.logoutDate
                                  )
                                }
                              </td>

                            </tr>

                          )
                        )

                      )
                  }

                </tbody>

              </table>

            </div>

          </section>


            </>

          )}
        </>

      )}


      {/* =========================
          SUBSCRIPTION
          Premium 구독 · 결제 내역
      ========================= */}

      {activeMenu === "subscription" && (

        <section className="mypage-section">

          <div className="mypage-section-heading">

            <span>
              01
            </span>


            <div>

              <p>
                MY SUBSCRIPTION
              </p>


              <h2>
                구독 · 결제 내역
              </h2>

            </div>

          </div>


          {subscriptionLoading ? (

            <div className="mypage-subscription-message">
              구독 정보를 불러오는 중입니다.
            </div>

          ) : subscriptionError ? (

            <div className="mypage-subscription-message error">
              {subscriptionError}
            </div>

          ) : (

            <>

              <div className="mypage-subscription-current">

                <div className="mypage-subscription-current-copy">

                  <span>
                    CURRENT PLAN
                  </span>


                  <h3>
                    {
                      subscriptionStatus?.premium
                        ? getSubscriptionPlanLabel(
                            subscriptionStatus.planType
                          )
                        : "FREE"
                    }
                  </h3>


                  <p>
                    {
                      subscriptionStatus?.premium
                        ? "현재 Premium 이용권을 이용하고 있습니다."
                        : "현재 이용 중인 Premium 이용권이 없습니다."
                    }
                  </p>

                </div>


                <div className="mypage-subscription-current-meta">

                  <div>

                    <small>
                      STATUS
                    </small>

                    <strong
                      className={
                        subscriptionStatus?.premium
                          ? "active"
                          : ""
                      }
                    >
                      {
                        subscriptionStatus?.premium
                          ? "이용 중"
                          : "무료"
                      }
                    </strong>

                  </div>


                  <div>

                    <small>
                      이용 기간
                    </small>

                    <strong className="mypage-subscription-current-period">
                      {
                        subscriptionStatus?.premium ? (

                          <>
                            <span>
                              {
                                formatDate(
                                  subscriptionStatus.startDate || undefined
                                )
                              }
                            </span>

                            <span>
                              ~ {
                                formatDate(
                                  subscriptionStatus.endDate || undefined
                                )
                              }
                            </span>
                          </>

                        ) : (
                          "-"
                        )
                      }
                    </strong>

                  </div>

                </div>


                <button
                  type="button"
                  className="mypage-subscription-manage-button"
                  onClick={() =>
                    navigate(
                      "/beauty?view=membership"
                    )
                  }
                >
                  {
                    subscriptionStatus?.premium
                      ? "이용권 관리"
                      : "Premium 이용권 보기"
                  }
                  <span>→</span>
                </button>

              </div>


              <div className="mypage-subscription-history-head">

                <div>

                  <span>
                    PAYMENT HISTORY
                  </span>

                  <h3>
                    Premium 결제 내역
                  </h3>

                </div>


                <small>
                  총 {subscriptionHistory.length}건
                </small>

              </div>


              <div className="mypage-subscription-history-wrap">

                {subscriptionHistory.length === 0 ? (

                  <div className="mypage-subscription-empty">

                    <strong>
                      결제 내역이 없습니다.
                    </strong>

                    <p>
                      Premium 이용권을 결제하면 이곳에서 이용 내역을 확인할 수 있습니다.
                    </p>

                  </div>

                ) : (

                  <table className="mypage-subscription-table">

                    <thead>

                      <tr>
                        <th>결제번호</th>
                        <th>이용권</th>
                        <th>결제금액</th>
                        <th>결제일</th>
                        <th>이용기간</th>
                        <th>상태</th>
                      </tr>

                    </thead>


                    <tbody>

                      {subscriptionHistory.map(
                        (item) => (

                          <tr
                            key={
                              item.subscriptionId
                            }
                          >

                            <td>
                              #{item.subscriptionId}
                            </td>

                            <td>
                              {
                                getSubscriptionPlanLabel(
                                  item.planType
                                )
                              }
                            </td>

                            <td className="price">
                              {
                                Number(
                                  item.price || 0
                                ).toLocaleString()
                              }
                              원
                            </td>

                            <td>
                              {
                                formatDateTime(
                                  item.createdAt ||
                                  item.startDate
                                )
                              }
                            </td>

                            <td>
                              {
                                formatDate(
                                  item.startDate
                                )
                              }
                              <br />
                              <span className="mypage-subscription-period-arrow">
                                ~
                              </span>
                              {
                                formatDate(
                                  item.endDate
                                )
                              }
                            </td>

                            <td>

                              <span
                                className={
                                  `mypage-subscription-history-status ${
                                    item.status === "ACTIVE"
                                      ? "active"
                                      : item.status === "CANCELLED"
                                        ? "cancelled"
                                        : "expired"
                                  }`
                                }
                              >
                                {
                                  getSubscriptionStatusLabel(
                                    item.status
                                  )
                                }
                              </span>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                )}

              </div>

            </>

          )}

        </section>

      )}


      {/* =========================
          WISHLIST
      ========================= */}

      {activeMenu === "wishlist" && (

        <section className="mypage-section">

          <div className="mypage-section-heading">

            <span>
              01
            </span>


            <div>

              <p>
                MY WISHLIST
              </p>


              <h2>
                최근 찜한 상품
              </h2>

            </div>

          </div>


          {wishlistLoading ? (

            <div className="mypage-wishlist-message">

              찜한 상품을 불러오는 중입니다.

            </div>

          ) : wishlistItems.length === 0 ? (

            <div className="mypage-wishlist-empty">

              <p>
                아직 찜한 상품이 없습니다.
              </p>


              <button
                type="button"
                onClick={
                  () =>
                    navigate(
                      "/products"
                    )
                }
              >
                상품 둘러보기
              </button>

            </div>

          ) : (

            <>

              <div className="mypage-wishlist-grid">

                {wishlistItems.map(
                  (item) => {

                    const discountRate =
                      getDiscountRate(
                        item.discount
                      );


                    const salePrice =
                      discountRate > 0

                        ? Math.round(
                            item.price *
                            (
                              1 -
                              discountRate / 100
                            )
                          )

                        : item.price;


                    return (

                      <article
                        key={
                          item.id
                        }
                        className="mypage-wishlist-card"
                      >

                        <button
                          type="button"
                          className="mypage-wishlist-image"
                          onClick={
                            () =>
                              navigate(
                                `/products/${item.productId}`
                              )
                          }
                        >

                          {item.imageUrl ? (

                            <img
                              src={
                                item.imageUrl
                              }
                              alt={
                                item.productName
                              }
                            />

                          ) : (

                            <span className="mypage-wishlist-no-image">
                              NO IMAGE
                            </span>

                          )}

                        </button>


                        <div className="mypage-wishlist-info">

                          <span className="mypage-wishlist-brand">

                            {
                              item.brand ||
                              "STAR"
                            }

                          </span>


                          <button
                            type="button"
                            className="mypage-wishlist-name"
                            onClick={
                              () =>
                                navigate(
                                  `/products/${item.productId}`
                                )
                            }
                          >
                            {item.productName}
                          </button>


                          <div className="mypage-wishlist-price">

                            {discountRate > 0 ? (

                              <>

                                <strong className="mypage-wishlist-discount">
                                  {discountRate}%
                                </strong>


                                <strong>
                                  {
                                    salePrice
                                      .toLocaleString()
                                  }원
                                </strong>

                              </>

                            ) : (

                              <strong>

                                {
                                  item.price
                                    .toLocaleString()
                                }원

                              </strong>

                            )}

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>


              <div className="mypage-wishlist-more-wrap">

                <button
                  type="button"
                  className="mypage-wishlist-more-button"
                  onClick={
                    () =>
                      navigate(
                        "/wishlist"
                      )
                  }
                >
                  자세히 보기
                </button>

              </div>

            </>

          )}

        </section>
      )}


      {/* =========================
          ORDER
      ========================= */}

      {activeMenu === "order" && (

        <section className="mypage-section">

          <div className="mypage-section-heading">

            <span>
              01
            </span>


            <div>

              <p>
                MY ORDER
              </p>


              <h2>
                주문 내역
              </h2>

            </div>

          </div>


          {orderLoading ? (

            <div className="mypage-menu-ready">
              주문 내역을 불러오는 중입니다.
            </div>

          ) : orderError ? (

            <div className="mypage-menu-ready">
              {orderError}
            </div>

          ) : orderItems.length === 0 ? (

            <div className="mypage-order-empty">

              <p>
                아직 주문 내역이 없습니다.
              </p>

              <button
                type="button"
                onClick={() => navigate("/products")}
              >
                SHOP NOW
              </button>

            </div>

          ) : (

            <div className="mypage-order-list">

              <div className="mypage-order-summary-line">
                <span>
                  총 {orderItems.length}건의 주문이 있습니다.
                </span>
              </div>


              {orderItems.map(
                (order) => (

                  <article
                    key={order.id}
                    className="mypage-order-card"
                  >

                    <div className="mypage-order-card-head">

                      <div className="mypage-order-date-wrap">

                        <strong className="mypage-order-date">
                          {formatDate(order.createdAt)}
                        </strong>

                        <span className="mypage-order-number">
                          ORDER #{order.id}
                        </span>

                      </div>


                      <button
                        type="button"
                        className="mypage-order-detail-link"
                        onClick={() => {
                          if (order.status === "PAYMENT_WAITING") {
                            navigate(`/payment/${order.id}`);
                            return;
                          }

                          navigate(`/mypage/orders/${order.id}`);
                        }}
                      >
                        {order.status === "PAYMENT_WAITING"
                          ? "결제하기"
                          : "주문상세"}
                        <span aria-hidden="true">→</span>
                      </button>

                    </div>


                    <div className="mypage-order-card-body">

                      <div className="mypage-order-status-area">

                        <span className="mypage-order-status-kicker">
                          STATUS
                        </span>

                        <strong
                          className={
                            `mypage-order-status mypage-order-status-${order.status.toLowerCase()}`
                          }
                        >
                          {getOrderStatusLabel(order.status)}
                        </strong>

                      </div>


                      <div className="mypage-order-product-area">

                        <button
                          type="button"
                          className="mypage-order-product-image"
                          onClick={
                            () => {

                              if (
                                order.productId
                              ) {
                                navigate(
                                  `/products/${order.productId}`
                                );
                              }
                            }
                          }
                          disabled={
                            !order.productId
                          }
                          aria-label="주문 상품 상세로 이동"
                        >

                          {order.imageUrl ? (

                            <img
                              src={order.imageUrl}
                              alt={
                                order.firstProductName ||
                                order.orderName
                              }
                            />

                          ) : (

                            <span>
                              NO IMAGE
                            </span>

                          )}

                        </button>


                        <div className="mypage-order-product-copy">

                          <span className="mypage-order-brand">
                            GODDESS BEAUTY
                          </span>

                          <strong className="mypage-order-product-name">
                            {order.orderName}
                          </strong>


                          {(order.firstColorName ||
                            order.firstVariantName) && (

                            <p className="mypage-order-option">
                              {
                                [
                                  order.firstColorName,
                                  order.firstVariantName
                                ]
                                  .filter(Boolean)
                                  .join(" · ")
                              }
                            </p>

                          )}


                          <div className="mypage-order-price-meta">
                            <span>상품금액 {order.productTotal.toLocaleString()}원</span>
                            <span>배송비 {order.deliveryFee === 0 ? "무료" : `${order.deliveryFee.toLocaleString()}원`}</span>
                            {order.discount > 0 && (
                              <span>할인 -{order.discount.toLocaleString()}원</span>
                            )}
                          </div>

                        </div>

                      </div>


                      <div className="mypage-order-total-area">

                        <span>PAYMENT TOTAL</span>

                        <strong>
                          {order.total.toLocaleString()}원
                        </strong>

                      </div>

                    </div>


                    <div className="mypage-order-card-foot">

                      <p>
                        {order.status === "PAYMENT_WAITING"
                          ? "결제가 완료되지 않은 주문입니다. 결제를 이어서 진행해주세요."
                          : "주문 및 배송 상세 정보는 주문상세에서 확인할 수 있습니다."}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          if (order.status === "PAYMENT_WAITING") {
                            navigate(`/payment/${order.id}`);
                            return;
                          }

                          navigate(`/mypage/orders/${order.id}`);
                        }}
                      >
                        {order.status === "PAYMENT_WAITING"
                          ? "PAY NOW"
                          : "VIEW DETAIL"}
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>
      )}


      {/* =========================
          BEAUTY
      ========================= */}

      {activeMenu === "beauty" && (

        <section className="mypage-section">

          <div className="mypage-section-heading">

            <span>
              01
            </span>


            <div>

              <p>
                MY BEAUTY
              </p>


              <h2>
                뷰티 체험 내역
              </h2>

            </div>

          </div>


          <div className="mypage-menu-ready">

            뷰티 체험 내역 기능은 준비 중입니다.

          </div>

        </section>
      )}


      {/* =========================
          REVIEW
      ========================= */}

      {activeMenu === "review" && (

        <section className="mypage-section">

          <div className="mypage-section-heading">

            <span>
              01
            </span>


            <div>

              <p>
                MY REVIEW
              </p>


              <h2>
                내가 작성한 리뷰
              </h2>

            </div>

          </div>


          <MyProductReviewSection
            memberId={memberId}
          />

        </section>
      )}


      {/* =========================
          Q&A
      ========================= */}

      {activeMenu === "qna" && (

        <section className="mypage-section">

          <div className="mypage-section-heading">

            <span>
              01
            </span>


            <div>

              <p>
                MY Q&A
              </p>


              <h2>
                문의 내역
              </h2>

            </div>

          </div>


          {/* =========================
              Q&A 서브 메뉴
          ========================= */}
          <div className="mypage-qna-submenu">

            <button
              type="button"
              className={
                qnaSubMenu === "product"
                  ? "active"
                  : ""
              }
              onClick={
                () =>
                  setQnaSubMenu(
                    "product"
                  )
              }
            >
              상품 문의
            </button>


            <button
              type="button"
              className={
                qnaSubMenu === "customer"
                  ? "active"
                  : ""
              }
              onClick={
                () =>
                  setQnaSubMenu(
                    "customer"
                  )
              }
            >
              고객 문의
            </button>

          </div>


          {qnaSubMenu === "product" ? (

            <MyProductQnaSection
              memberId={memberId}
              navigate={navigate}
            />

          ) : (

            <MyCustomerQnaSection
              memberId={memberId}
            />

          )}

        </section>
      )}

        </div>

      </div>

    </main>
  );
};


export default MyPage;