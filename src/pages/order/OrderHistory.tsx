import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  getMyOrders,
  type OrderListItem,
} from "../../api/orderHistoryApi";
import "../../styles/order/OrderHistory.css";

const statusLabel = (status: string) => {
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
      return status;
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
  }).format(date);
};

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myOrders"],
    queryFn: getMyOrders,
  });

  if (isLoading) {
    return (
      <main className="order-history-state">
        주문내역을 불러오는 중입니다...
      </main>
    );
  }

  if (isError) {
    return (
      <main className="order-history-state">
        주문내역을 불러오지 못했습니다.
      </main>
    );
  }

  return (
    <main className="order-history-page">
      <section className="order-history-shell">
        <header className="order-history-header">
          <span>MY GODDESS</span>
          <h1>ORDER HISTORY</h1>
          <p>주문과 결제 내역을 확인할 수 있습니다.</p>
        </header>

        {orders.length === 0 ? (
          <section className="order-history-empty">
            <span>NO ORDERS YET</span>
            <h2>아직 주문내역이 없습니다.</h2>
            <button
              type="button"
              onClick={() => navigate("/products")}
            >
              SHOP NOW
            </button>
          </section>
        ) : (
          <section className="order-history-list">
            <div className="order-history-table-head">
              <span>ORDER</span>
              <span>DATE</span>
              <span>ITEM</span>
              <span>STATUS</span>
              <span>TOTAL</span>
              <span />
            </div>

            {orders.map((order: OrderListItem) => (
              <article
                key={order.id}
                className="order-history-row"
              >
                <div className="order-history-number">
                  <small>ORDER</small>
                  <strong>#{order.id}</strong>
                </div>

                <div>
                  <small>DATE</small>
                  <span>{formatDate(order.createdAt)}</span>
                </div>

                <div className="order-history-name">
                  <small>ITEM</small>
                  <strong>{order.orderName}</strong>
                </div>

                <div>
                  <small>STATUS</small>
                  <span
                    className={`order-status status-${order.status.toLowerCase()}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="order-history-total">
                  <small>TOTAL</small>
                  <strong>{order.total.toLocaleString()}원</strong>
                </div>

                <button
                  type="button"
                  className="order-history-detail-button"
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
                    : "DETAIL"}
                </button>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
};

export default OrderHistory;
