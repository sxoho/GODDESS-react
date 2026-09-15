import { useEffect, useState } from "react";
import { axiosInstance } from "../../../components/ToolBak";
import "../../../styles/admin/AdminOrderList.css";

type AdminOrder = {
  id: number;
  loginId: string;
  memberName: string;
  orderName: string;
  total: number;
  status: string;
  createdAt: string;
  company?: string | null;
  trackingNo?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const DELIVERY_COMPANIES = [
  "CJ대한통운",
  "한진택배",
  "롯데택배",
  "로젠택배",
  "우체국택배",
];

const statusLabel = (status: string) => {
  switch (status) {
    case "PAYMENT_WAITING": return "결제대기";
    case "PAID": return "결제완료";
    case "PREPARING": return "상품준비중";
    case "SHIPPED": return "배송시작";
    case "SHIPPING": return "배송중";
    case "DELIVERED": return "배송완료";
    case "CANCEL_REQUESTED": return "취소요청";
    case "CANCELLED": return "주문취소";
    default: return status;
  }
};

const nextStatus = (status: string) => {
  switch (status) {
    case "PAID": return "PREPARING";
    case "PREPARING": return "SHIPPED";
    case "SHIPPED": return "SHIPPING";
    case "SHIPPING": return "DELIVERED";
    default: return null;
  }
};

const AdminOrderList = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingId, setChangingId] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Record<number, string>>({});

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<ApiResponse<AdminOrder[]>>(
        "/api/commerce/admin/orders",
      );
      setOrders(response.data.data ?? []);
    } catch (error) {
      console.error("관리자 주문 조회 오류:", error);
      alert("주문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, []);

  const changeStatus = async (order: AdminOrder) => {
    const next = nextStatus(order.status);
    if (!next) return;

    const company = selectedCompany[order.id] ?? "";

    if (next === "SHIPPED" && !company.trim()) {
      alert("배송 시작 처리 전에 택배사를 선택해주세요.");
      return;
    }

    if (!window.confirm(`주문 #${order.id}을(를) '${statusLabel(next)}' 처리하시겠습니까?`)) return;

    try {
      setChangingId(order.id);

      await axiosInstance.patch(`/api/commerce/admin/orders/${order.id}/status`, {
        status: next,
        company: next === "SHIPPED" ? company.trim() : undefined,
      });

      await loadOrders();
    } catch (error) {
      console.error("주문 상태 변경 오류:", error);
      alert("주문 상태 변경에 실패했습니다.");
    } finally {
      setChangingId(null);
    }
  };

  const processCancel = async (orderId: number, action: "approve" | "reject") => {
    const text = action === "approve"
      ? "취소 요청을 승인하시겠습니까? 결제 취소와 재고 복구가 함께 처리됩니다."
      : "취소 요청을 거절하시겠습니까? 주문은 상품준비중으로 돌아갑니다.";

    if (!window.confirm(text)) return;

    try {
      setChangingId(orderId);
      await axiosInstance.patch(`/api/commerce/admin/orders/${orderId}/cancel/${action}`);
      alert(action === "approve" ? "취소 요청을 승인했습니다." : "취소 요청을 거절했습니다.");
      await loadOrders();
    } catch (error) {
      console.error("취소 요청 처리 오류:", error);
      alert("취소 요청 처리에 실패했습니다.");
    } finally {
      setChangingId(null);
    }
  };

  if (loading) {
    return <main className="admin-order-page"><div className="admin-order-state">주문 목록을 불러오는 중입니다.</div></main>;
  }

  return (
    <main className="admin-order-page">
      <header className="admin-order-header">
        <div><p>ORDER MANAGEMENT</p><h1>주문 / 배송 관리</h1></div>
        <span>결제완료 → 상품준비중 → 배송시작 → 배송중 → 배송완료</span>
      </header>

      <div className="admin-order-table-wrap">
        {orders.map((order) => {
          const next = nextStatus(order.status);
          const company = selectedCompany[order.id] ?? "";

          return (
            <article key={order.id} className="admin-order-card">
              <div className="admin-order-meta">
                <div><small>ORDER</small><strong>#{order.id}</strong></div>
                <div><small>MEMBER</small><strong>{order.memberName}</strong><span>{order.loginId}</span></div>
                <div className="admin-order-item"><small>ITEM</small><strong>{order.orderName}</strong></div>
                <div><small>TOTAL</small><strong>{order.total.toLocaleString()}원</strong></div>
                <div><small>STATUS</small><strong className={`admin-order-status status-${order.status.toLowerCase()}`}>{statusLabel(order.status)}</strong></div>
              </div>

              {order.status === "PREPARING" && (
                <div className="admin-order-shipping-form">
                  <select
                    value={company}
                    onChange={(event) =>
                      setSelectedCompany((prev) => ({
                        ...prev,
                        [order.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">택배사 선택</option>
                    {DELIVERY_COMPANIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <p>배송시작 처리 시 운송장번호가 자동으로 생성됩니다.</p>
                </div>
              )}

              {(order.status === "SHIPPED" || order.status === "SHIPPING" || order.status === "DELIVERED") && (
                <div className="admin-order-shipping-info">
                  <span>택배사 <strong>{order.company || "-"}</strong></span>
                  <span>운송장 <strong>{order.trackingNo || "-"}</strong></span>
                </div>
              )}

              <div className="admin-order-actions">
                {order.status === "CANCEL_REQUESTED" ? (
                  <>
                    <button disabled={changingId === order.id} onClick={() => processCancel(order.id, "approve")}>취소 승인</button>
                    <button className="secondary" disabled={changingId === order.id} onClick={() => processCancel(order.id, "reject")}>취소 거절</button>
                  </>
                ) : next ? (
                  <button disabled={changingId === order.id} onClick={() => changeStatus(order)}>
                    {changingId === order.id ? "처리 중..." : `${statusLabel(next)} 처리`}
                  </button>
                ) : (
                  <span>{order.status === "PAYMENT_WAITING" ? "고객 결제 대기" : order.status === "CANCELLED" ? "취소 완료" : order.status === "DELIVERED" ? "배송 완료" : "-"}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
};

export default AdminOrderList;
