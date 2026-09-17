import React, { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useNavigate, useParams } from "react-router-dom";

import {
  cancelOrder,
  getMyOrderDetail,
  type OrderDetailItem,
} from "../../api/orderHistoryApi";
import {
  getMyReturnRequests,
  type ReturnResponse,
} from "../../api/returnApi";

import { axiosInstance } from "../../components/ToolBak";
import ReturnRequestModal from "../../components/order/ReturnRequestModal";

import "../../styles/order/OrderDetail.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:9104";

type Product = {
  id?: number;
  productId?: number;
  name: string;
  brand?: string;
};

type ProductColor = {
  id?: number;
  productcolorId?: number;
  productId: number;
  colorName: string;
  isMain: string;
  sortOrder: number;
  visible: string;
};

type ProductImage = {
  id?: number;
  colorimageId?: number;
  productcolorId?: number;
  productColorId?: number;
  filePath: string;
  isMain: string;
  imageType?: string;
  sortOrder?: number;
};

type OrderItemView = OrderDetailItem & {
  productId?: number;
  imageUrl?: string;
  brand?: string;
};

type ReviewTarget = OrderItemView;
type ReturnTarget = OrderItemView;

const returnStatusLabel = (status?: string) => {
  switch (status) {
    case "PENDING":
      return "반품 요청중";
    case "APPROVED":
      return "반품 승인";
    case "REJECTED":
      return "반품 거절";
    case "COMPLETED":
      return "반품 완료";
    default:
      return status || "-";
  }
};

const statusLabel = (status?: string) => {
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
      return "취소";

    default:
      return status || "-";
  }
};

const paymentMethodLabel = (method?: string) => {
  switch (method) {
    case "CARD":
      return "신용 / 체크카드";

    case "TRANSFER":
      return "실시간 계좌이체";

    case "KAKAOPAY":
      return "카카오페이";

    case "TOSSPAY":
      return "토스페이";

    case "NAVERPAY":
      return "네이버페이";

    default:
      return method || "-";
  }
};

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getImageUrl = (filePath?: string) => {
  if (!filePath) {
    return "";
  }

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  return `${API_BASE}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
};

const maskName = (name?: string) => {
  if (!name) {
    return "-";
  }

  const trimmed = name.trim();

  if (trimmed.length <= 1) {
    return trimmed;
  }

  if (trimmed.length === 2) {
    return `${trimmed[0]}*`;
  }

  return `${trimmed[0]}${"*".repeat(
    Math.max(1, trimmed.length - 2),
  )}${trimmed[trimmed.length - 1]}`;
};

const maskPhone = (phone?: string) => {
  if (!phone) {
    return "-";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(-4)}`;
  }

  if (digits.length > 4) {
    return `${digits.slice(0, 2)}${"*".repeat(
      Math.max(3, digits.length - 6),
    )}${digits.slice(-4)}`;
  }

  return "*".repeat(digits.length);
};

const maskAddress = (address1?: string | null, address2?: string | null) => {
  const base = (address1 || "").trim();

  if (!base) {
    return "-";
  }

  const parts = base.split(/\s+/);

  let maskedBase = base;

  if (parts.length >= 3) {
    maskedBase = `${parts.slice(0, 2).join(" ")} ${"*".repeat(
      Math.max(4, parts.slice(2).join(" ").length),
    )}`;
  } else if (base.length > 4) {
    maskedBase = `${base.slice(0, 4)}${"*".repeat(
      Math.max(4, base.length - 4),
    )}`;
  }

  const detail = (address2 || "").trim();

  return detail
    ? `${maskedBase} ${"*".repeat(Math.max(4, detail.length))}`
    : maskedBase;
};

const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { orderId } = useParams<{
    orderId: string;
  }>();

  const parsedOrderId = Number(orderId);

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myOrderDetail", parsedOrderId],

    queryFn: () => getMyOrderDetail(parsedOrderId),

    enabled: Number.isFinite(parsedOrderId) && parsedOrderId > 0,
  });

  const [orderItemViews, setOrderItemViews] = useState<OrderItemView[]>([]);

  const [imageLoading, setImageLoading] = useState(false);

  const [reviewedOrderDetails, setReviewedOrderDetails] = useState<
    Record<number, boolean>
  >({});
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [returnTarget, setReturnTarget] = useState<ReturnTarget | null>(null);

  const {
    data: returnRequests = [],
    refetch: refetchReturnRequests,
  } = useQuery<ReturnResponse[]>({
    queryKey: ["myReturnRequests"],
    queryFn: getMyReturnRequests,
  });

  const returnByOrderDetail = useMemo(
    () =>
      Object.fromEntries(
        returnRequests.map((item) => [item.orderDetailId, item]),
      ) as Record<number, ReturnResponse>,
    [returnRequests],
  );

  /**
   * 주문 상품의 실제 상품/색상/이미지 연결
   *
   * ORDER_DETAIL의 상품명 + 색상명을 기준으로
   * PRODUCT → PRODUCT_COLOR → PRODUCT_COLOR_IMAGE를 찾는다.
   */
  useEffect(() => {
    if (!order || !order.orderDetails?.length) {
      setOrderItemViews([]);

      return;
    }

    const loadOrderItemImages = async () => {
      try {
        setImageLoading(true);

        const [productResponse, colorResponse, imageResponse] =
          await Promise.all([
            axiosInstance.get<Product[]>("/product/find_all"),

            axiosInstance.get<ProductColor[]>("/product_color/find_all"),

            axiosInstance.get<ProductImage[]>("/product_color_image/find_all"),
          ]);

        const products = productResponse.data ?? [];

        const colors = (colorResponse.data ?? []).map((color) => ({
          ...color,
          id: color.id ?? color.productcolorId ?? 0,
        }));

        const images = (imageResponse.data ?? []).map((image) => ({
          ...image,
          productColorId: image.productColorId ?? image.productcolorId ?? 0,
        }));

        const views = order.orderDetails.map((item) => {
          const product = products.find(
            (productItem) => productItem.name === item.productName,
          );

          if (!product) {
            return {
              ...item,
              imageUrl: "",
              productId: undefined,
              brand: "GODDESS",
            };
          }

          const productId = product.productId ?? product.id ?? 0;

          const productColors = colors
            .filter(
              (color) => color.productId === productId && color.visible !== "N",
            )
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

          const targetColor =
            productColors.find(
              (color) => item.colorName && color.colorName === item.colorName,
            ) ??
            productColors.find((color) => color.isMain === "Y") ??
            productColors[0];

          const targetColorId = targetColor?.id ?? 0;

          const targetImages = images
            .filter((image) => image.productColorId === targetColorId)
            .sort((a, b) => {
              const getPriority = (image: ProductImage) => {
                if (image.isMain === "Y") {
                  return 0;
                }

                if (image.imageType === "THUMBNAIL") {
                  return 1;
                }

                if (image.imageType === "MAIN") {
                  return 2;
                }

                return 3;
              };

              const priorityDiff = getPriority(a) - getPriority(b);

              if (priorityDiff !== 0) {
                return priorityDiff;
              }

              return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            });

          return {
            ...item,

            productId,

            brand: product.brand || "GODDESS",

            imageUrl: getImageUrl(targetImages[0]?.filePath),
          };
        });

        setOrderItemViews(views);
      } catch (error) {
        console.error("주문상세 상품 이미지 조회 오류:", error);

        setOrderItemViews(
          order.orderDetails.map((item) => ({
            ...item,
            imageUrl: "",
            brand: "GODDESS",
          })),
        );
      } finally {
        setImageLoading(false);
      }
    };

    void loadOrderItemImages();
  }, [order]);

  /**
   * 각 주문상품의 리뷰 작성 여부 확인
   */
  useEffect(() => {
    if (!order?.orderDetails?.length) {
      setReviewedOrderDetails({});
      return;
    }

    const loadReviewStatus = async () => {
      const entries = await Promise.all(
        order.orderDetails.map(async (item) => {
          try {
            const response = await axiosInstance.get<boolean>(
              `/product_review/order-detail/${item.id}/exists`,
            );

            return [item.id, Boolean(response.data)] as const;
          } catch (error) {
            console.error(
              `리뷰 작성 여부 조회 오류 - orderDetailId: ${item.id}`,
              error,
            );

            return [item.id, false] as const;
          }
        }),
      );

      setReviewedOrderDetails(Object.fromEntries(entries));
    };

    void loadReviewStatus();
  }, [order]);

  const resetReviewForm = () => {
    setReviewTarget(null);
    setReviewTitle("");
    setReviewContent("");
    setReviewRating(5);
  };

  const handleSaveReview = async () => {
    if (!order || !reviewTarget) {
      return;
    }

    if (!reviewTitle.trim()) {
      alert("리뷰 제목을 입력해주세요.");
      return;
    }

    if (!reviewContent.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      setReviewSaving(true);

      await axiosInstance.post("/product_review/save", {
        memberId: order.memberId,
        orderDetailId: reviewTarget.id,
        beautySaveId: null,
        title: reviewTitle.trim(),
        content: reviewContent.trim(),
        rating: reviewRating,
      });

      setReviewedOrderDetails((current) => ({
        ...current,
        [reviewTarget.id]: true,
      }));

      alert("리뷰가 등록되었습니다.");
      resetReviewForm();
    } catch (error) {
      console.error("리뷰 등록 오류:", error);
      alert("리뷰 등록 중 오류가 발생했습니다.");
    } finally {
      setReviewSaving(false);
    }
  };

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(parsedOrderId),
    onSuccess: async (nextStatus) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["myOrderDetail", parsedOrderId],
        }),
        queryClient.invalidateQueries({ queryKey: ["myOrders"] }),
        queryClient.invalidateQueries({
          queryKey: ["payment-order", parsedOrderId],
        }),
      ]);

      alert(
        nextStatus === "CANCEL_REQUESTED"
          ? "취소 요청이 접수되었습니다. 관리자 확인 후 처리됩니다."
          : "주문이 취소되었습니다.",
      );
    },
    onError: (error) => {
      console.error("주문 취소 오류:", error);
      alert("현재 주문 상태에서는 취소할 수 없습니다.");
    },
  });

  const handleCancelOrder = () => {
    if (!order) return;

    const message =
      order.status === "PAYMENT_WAITING"
        ? "결제대기 주문을 취소하시겠습니까?"
        : order.status === "PAID"
          ? "결제를 취소하시겠습니까? 결제 취소 후 재고가 복구됩니다."
          : order.status === "PREPARING"
            ? "상품준비중 주문의 취소를 요청하시겠습니까? 관리자 확인 후 처리됩니다."
            : "";

    if (!message || !window.confirm(message)) return;
    cancelMutation.mutate();
  };

  const deliveryStep = (() => {
    switch (order?.status) {
      case "PAID":
        return 1;
      case "PREPARING":
      case "CANCEL_REQUESTED":
        return 2;
      case "SHIPPED":
        return 3;
      case "SHIPPING":
        return 4;
      case "DELIVERED":
        return 5;
      default:
        return 0;
    }
  })();

  const displayItems = useMemo(
    () =>
      orderItemViews.length > 0 ? orderItemViews : (order?.orderDetails ?? []),
    [orderItemViews, order],
  );

  if (isLoading) {
    return (
      <main className="order-detail-state">
        주문 상세를 불러오는 중입니다...
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="order-detail-state">주문 정보를 찾을 수 없습니다.</main>
    );
  }

  return (
    <main className="order-detail-page">
      <section className="order-detail-shell">
        <button
          type="button"
          className="order-detail-back"
          onClick={() =>
            navigate("/mypage", {
              state: {
                activeMenu: "order",
              },
            })
          }
        >
          ← ORDER HISTORY
        </button>

        <header className="order-detail-header">
          <div>
            <span>ORDER #{order.id}</span>

            <h1>ORDER DETAIL</h1>
          </div>

          <div className="order-detail-status-block">
            <small>ORDER STATUS</small>

            <strong>{statusLabel(order.status)}</strong>
          </div>
        </header>

        {order.status !== "CANCELLED" && order.status !== "PAYMENT_WAITING" && (
          <section className="order-detail-progress">
            {[
              [1, "결제완료"],
              [2, "상품준비중"],
              [3, "배송시작"],
              [4, "배송중"],
              [5, "배송완료"],
            ].map(([step, label]) => (
              <div
                key={String(step)}
                className={`order-detail-progress-step ${
                  deliveryStep >= Number(step) ? "active" : ""
                }`}
              >
                <span>0{step}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </section>
        )}

        {order.status === "CANCELLED" && (
          <div className="order-detail-cancelled-notice">
            취소된 주문입니다.
          </div>
        )}

        <section className="order-detail-section">
          <div className="order-detail-section-heading">
            <span>01</span>

            <h2>Order items</h2>
          </div>

          <div className="order-detail-items">
            {displayItems.map((item) => {
              const viewItem = item as OrderItemView;
              const isReviewed = Boolean(reviewedOrderDetails[item.id]);
              const canWriteReview = order.status === "DELIVERED";
              const returnRequest = returnByOrderDetail[item.id];
              const canRequestReturn =
                order.status === "DELIVERED" && !returnRequest;

              return (
                <article key={item.id} className="order-detail-item">
                  <button
                    type="button"
                    className="order-detail-item-image"
                    disabled={!viewItem.productId}
                    onClick={() => {
                      if (viewItem.productId) {
                        navigate(`/products/${viewItem.productId}`);
                      }
                    }}
                    aria-label={`${item.productName} 상품 상세로 이동`}
                  >
                    {viewItem.imageUrl ? (
                      <img src={viewItem.imageUrl} alt={item.productName} />
                    ) : (
                      <span>{imageLoading ? "LOADING" : "NO IMAGE"}</span>
                    )}
                  </button>

                  <div className="order-detail-item-main">
                    <span className="order-detail-item-kicker">
                      {viewItem.brand || "GODDESS BEAUTY"}
                    </span>

                    <strong>{item.productName}</strong>

                    <p>
                      {item.colorName || "COLOR -"}

                      {" · "}

                      {item.variantName || "OPTION -"}
                    </p>
                  </div>

                  <div>
                    <small>QUANTITY</small>

                    <strong>{item.quantity}</strong>
                  </div>

                  <div className="order-detail-item-price">
                    <small>PRICE</small>

                    <strong>
                      {(item.price * item.quantity).toLocaleString()}원
                    </strong>
                  </div>

                  <div className="order-detail-review-action">
                    {canWriteReview ? (
                      <>
                        <button
                          type="button"
                          className={isReviewed ? "completed" : ""}
                          disabled={isReviewed}
                          onClick={() => {
                            setReviewTarget(viewItem);
                            setReviewTitle("");
                            setReviewContent("");
                            setReviewRating(5);
                          }}
                        >
                          {isReviewed ? "리뷰 작성 완료" : "리뷰 작성"}
                        </button>

                        {returnRequest ? (
                          <span className={`order-detail-return-status status-${returnRequest.status.toLowerCase()}`}>
                            {returnStatusLabel(returnRequest.status)}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="return-button"
                            disabled={!canRequestReturn}
                            onClick={() => setReturnTarget(viewItem)}
                          >
                            반품 요청
                          </button>
                        )}
                      </>
                    ) : (
                      <span>배송완료 후 리뷰/반품 가능</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {reviewTarget && (
            <div className="order-detail-review-form">
              <div className="order-detail-review-form-head">
                <div>
                  <span>WRITE REVIEW</span>
                  <strong>{reviewTarget.productName}</strong>
                  <p>
                    {[reviewTarget.colorName, reviewTarget.variantName]
                      .filter(Boolean)
                      .join(" · ") || "구매 옵션 없음"}
                  </p>
                </div>

                <button type="button" onClick={resetReviewForm}>
                  닫기
                </button>
              </div>

              <div className="order-detail-review-rating">
                <span>별점</span>

                <div>
                  {Array.from({ length: 5 }, (_, index) => index + 1).map(
                    (score) => (
                      <button
                        key={score}
                        type="button"
                        className={score <= reviewRating ? "active" : ""}
                        onClick={() => setReviewRating(score)}
                        aria-label={`${score}점`}
                      >
                        ★
                      </button>
                    ),
                  )}

                  <strong>{reviewRating}.0</strong>
                </div>
              </div>

              <label>
                <span>제목</span>
                <input
                  type="text"
                  maxLength={200}
                  value={reviewTitle}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder="리뷰 제목을 입력해주세요."
                />
              </label>

              <label>
                <span>내용</span>
                <textarea
                  rows={6}
                  value={reviewContent}
                  onChange={(event) => setReviewContent(event.target.value)}
                  placeholder="색상, 발림성, 지속력 등 실제 사용 후기를 남겨주세요."
                />
              </label>

              <div className="order-detail-review-form-bottom">
                <p>구매한 상품과 색상·옵션 정보가 리뷰에 자동으로 연결됩니다.</p>

                <button
                  type="button"
                  disabled={reviewSaving}
                  onClick={() => void handleSaveReview()}
                >
                  {reviewSaving ? "등록 중..." : "리뷰 등록"}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="order-detail-info-grid">
          <section className="order-detail-info-card">
            <div className="order-detail-section-heading">
              <span>02</span>

              <h2>Payment</h2>
            </div>

            {order.payment ? (
              <dl>
                <div>
                  <dt>결제수단</dt>

                  <dd>{paymentMethodLabel(order.payment.paymentMethod)}</dd>
                </div>

                <div>
                  <dt>결제상태</dt>

                  <dd>{statusLabel(order.payment.status)}</dd>
                </div>

                <div>
                  <dt>결제금액</dt>

                  <dd>{order.payment.amount.toLocaleString()}원</dd>
                </div>

                <div>
                  <dt>승인번호</dt>

                  <dd>{order.payment.approvalNo || "-"}</dd>
                </div>
              </dl>
            ) : (
              <p className="order-detail-muted">결제 정보가 없습니다.</p>
            )}
          </section>

          <section className="order-detail-info-card">
            <div className="order-detail-section-heading">
              <span>03</span>

              <h2>Delivery</h2>
            </div>

            <p className="order-detail-privacy-note">
              개인정보 보호를 위해 일부 정보가 마스킹되어 표시됩니다.
            </p>

            {order.delivery ? (
              <dl>
                <div>
                  <dt>수령인</dt>

                  <dd>{maskName(order.delivery.recipient)}</dd>
                </div>

                <div>
                  <dt>연락처</dt>

                  <dd>{maskPhone(order.delivery.tel)}</dd>
                </div>

                <div>
                  <dt>주소</dt>

                  <dd>
                    ({order.delivery.zipcode}){" "}
                    {maskAddress(
                      order.delivery.address1,
                      order.delivery.address2,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>배송상태</dt>

                  <dd>{statusLabel(order.delivery.status)}</dd>
                </div>

                {(order.delivery.company || order.delivery.trackingNo) && (
                  <div>
                    <dt>배송정보</dt>
                    <dd>
                      {order.delivery.company || "-"} / {order.delivery.trackingNo || "-"}
                    </dd>
                  </div>
                )}

                {order.delivery.shippingDate && (
                  <div>
                    <dt>배송시작일</dt>
                    <dd>{formatDate(order.delivery.shippingDate)}</dd>
                  </div>
                )}

                {order.delivery.completeDate && (
                  <div>
                    <dt>배송완료일</dt>
                    <dd>{formatDate(order.delivery.completeDate)}</dd>
                  </div>
                )}

                <div>
                  <dt>배송요청</dt>

                  <dd>{order.delivery.request || "-"}</dd>
                </div>
              </dl>
            ) : (
              <p className="order-detail-muted">배송 정보가 없습니다.</p>
            )}
          </section>
        </div>

        {["PAYMENT_WAITING", "PAID", "PREPARING"].includes(order.status) && (
          <section className="order-detail-cancel-area">
            <div>
              <strong>
                {order.status === "PAYMENT_WAITING"
                  ? "결제 전 주문입니다."
                  : order.status === "PAID"
                    ? "결제완료 후 상품 준비 전 단계입니다."
                    : "상품 준비가 시작된 주문입니다."}
              </strong>
              <p>
                {order.status === "PREPARING"
                  ? "취소 요청은 관리자 확인 후 처리됩니다."
                  : "지금 취소하면 바로 취소 처리됩니다."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? "처리 중..."
                : order.status === "PREPARING"
                  ? "취소 요청"
                  : order.status === "PAID"
                    ? "결제 취소"
                    : "주문 취소"}
            </button>
          </section>
        )}

        {order.status === "CANCEL_REQUESTED" && (
          <section className="order-detail-cancel-area order-detail-cancel-requested">
            <div>
              <strong>취소 요청이 접수되었습니다.</strong>
              <p>관리자 확인 후 승인 또는 거절됩니다.</p>
            </div>
            <span>처리 대기중</span>
          </section>
        )}

        {returnTarget && (
          <ReturnRequestModal
            orderDetailId={returnTarget.id}
            productName={returnTarget.productName}
            optionText={
              [returnTarget.colorName, returnTarget.variantName]
                .filter(Boolean)
                .join(" · ") || undefined
            }
            isOpen={Boolean(returnTarget)}
            onClose={() => setReturnTarget(null)}
            onSubmitted={() => {
              void refetchReturnRequests();
            }}
          />
        )}

        <section className="order-detail-summary">
          <div>
            <span>주문일자</span>

            <strong>{formatDate(order.createdAt)}</strong>
          </div>

          <div>
            <span>상품금액</span>

            <strong>{order.productTotal.toLocaleString()}원</strong>
          </div>

          <div>
            <span>할인</span>

            <strong>-{order.discount.toLocaleString()}원</strong>
          </div>

          <div>
            <span>배송비</span>

            <strong>
              {order.deliveryFee === 0
                ? "무료"
                : `${order.deliveryFee.toLocaleString()}원`}
            </strong>
          </div>

          <div className="order-detail-summary-total">
            <span>TOTAL</span>

            <strong>{order.total.toLocaleString()}원</strong>
          </div>
        </section>
      </section>
    </main>
  );
};

export default OrderDetail;
