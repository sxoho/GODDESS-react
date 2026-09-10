import React, { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useNavigate, useParams } from "react-router-dom";

import {
  getMyOrderDetail,
  type OrderDetailItem,
} from "../../api/orderHistoryApi";

import { axiosInstance } from "../../components/ToolBak";

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

const statusLabel = (status?: string) => {
  switch (status) {
    case "ORDERED":
      return "주문완료";

    case "PAID":
      return "결제완료";

    case "PREPARING":
      return "상품준비중";

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

        <section className="order-detail-section">
          <div className="order-detail-section-heading">
            <span>01</span>

            <h2>Order items</h2>
          </div>

          <div className="order-detail-items">
            {displayItems.map((item) => {
              const viewItem = item as OrderItemView;

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
                </article>
              );
            })}
          </div>
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
