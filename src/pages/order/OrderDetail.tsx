import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getMyOrderDetail,
  type OrderDetailItem,
} from "../../api/orderHistoryApi";
import "../../styles/order/OrderDetail.css";

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
  if (!value) return "-";

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

const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

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

  if (isLoading) {
    return (
      <main className="order-detail-state">
        주문 상세를 불러오는 중입니다...
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="order-detail-state">
        주문 정보를 찾을 수 없습니다.
      </main>
    );
  }

  return (
    <main className="order-detail-page">
      <section className="order-detail-shell">
        <button
          type="button"
          className="order-detail-back"
          onClick={() => navigate("/mypage/orders")}
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
            {order.orderDetails.map(
              (item: OrderDetailItem) => (
                <article
                  key={item.id}
                  className="order-detail-item"
                >
                  <div className="order-detail-item-main">
                    <span className="order-detail-item-kicker">
                      GODDESS BEAUTY
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
              )
            )}
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
              <p className="order-detail-muted">
                결제 정보가 없습니다.
              </p>
            )}
          </section>

          <section className="order-detail-info-card">
            <div className="order-detail-section-heading">
              <span>03</span>
              <h2>Delivery</h2>
            </div>

            {order.delivery ? (
              <dl>
                <div>
                  <dt>수령인</dt>
                  <dd>{order.delivery.recipient}</dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd>{order.delivery.tel}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>
                    ({order.delivery.zipcode}){" "}
                    {order.delivery.address1}{" "}
                    {order.delivery.address2 || ""}
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
              <p className="order-detail-muted">
                배송 정보가 없습니다.
              </p>
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
