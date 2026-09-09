import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApprovePayment, useOrderInfo } from '../../features/usePayment';
import '../../styles/payment/Payment.css';

type PaymentMethod = 'CARD' | 'TRANSFER' | 'KAKAOPAY';

const methods: Array<{
  value: PaymentMethod;
  title: string;
  description: string;
}> = [
  { value: 'CARD', title: '신용 / 체크카드', description: '국내 발급 카드 결제' },
  { value: 'TRANSFER', title: '실시간 계좌이체', description: '계좌에서 바로 결제' },
  { value: 'KAKAOPAY', title: '카카오페이', description: '간편결제 시뮬레이션' },
];

const Payment: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const parsedOrderId = Number(orderId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [agreed, setAgreed] = useState(false);

  const {
    data: orderInfo,
    isLoading,
    isError,
  } = useOrderInfo(parsedOrderId);

  const approvePaymentMutation = useApprovePayment();

  const handlePayment = () => {
    if (!orderInfo) {
      return;
    }

    /*
     * DB CK_ORDERS_STATUS 기준
     * 결제 전 주문 상태는 ORDERED
     */
    if (orderInfo.status !== 'ORDERED') {
      alert('현재 결제할 수 없는 주문입니다.');
      return;
    }

    if (!agreed) {
      alert('결제 진행에 동의해주세요.');
      return;
    }

    const approved = window.confirm(
      `[가상 결제창] ${orderInfo.total.toLocaleString()}원을 결제하시겠습니까?`,
    );

    if (!approved) {
      return;
    }

    approvePaymentMutation.mutate({
      orderId: parsedOrderId,
      paymentMethod,
      amount: orderInfo.total,
      approvalNo: `GODDESS_MOCK_${Date.now()}`,
    });
  };

  if (isLoading) {
    return (
      <main className="payment-state">
        결제 정보를 불러오는 중입니다...
      </main>
    );
  }

  if (isError || !orderInfo) {
    return (
      <main className="payment-state">
        주문 정보를 찾을 수 없습니다.
      </main>
    );
  }

  return (
    <main className="payment-page-wrapper">
      <header className="payment-page-header">
        <span>GODDESS SECURE PAYMENT</span>
        <h1>PAYMENT</h1>
        <p>
          실제 PG 결제 대신 프로젝트용 승인 시뮬레이션으로 처리됩니다.
        </p>
      </header>

      <div className="payment-layout">
        <section className="payment-main">
          <div className="payment-section-heading">
            <span>01</span>
            <h2>Payment method</h2>
          </div>

          <div className="payment-methods">
            {methods.map((method) => (
              <label
                key={method.value}
                className={`payment-method-card ${
                  paymentMethod === method.value ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                />

                <span className="method-radio" />

                <span className="method-copy">
                  <strong>{method.title}</strong>
                  <small>{method.description}</small>
                </span>
              </label>
            ))}
          </div>

          <div className="payment-guide">
            <strong>PROJECT PAYMENT</strong>
            <p>
              포트폴리오용 프로젝트이므로 실제 카드 정보는 입력하지 않습니다.
              결제 버튼을 누르면 승인 번호를 가상 생성하고 PAYMENT 테이블에
              결제 완료 내역을 저장합니다.
            </p>
          </div>
        </section>

        <aside className="payment-summary-card">
          <span className="payment-summary-kicker">
            ORDER #{orderInfo.id}
          </span>

          <h2>{orderInfo.orderName}</h2>

          <div className="payment-summary-lines">
            <div>
              <span>상품 금액</span>
              <strong>
                {orderInfo.productTotal.toLocaleString()}원
              </strong>
            </div>

            <div>
              <span>할인</span>
              <strong>
                -{orderInfo.discount.toLocaleString()}원
              </strong>
            </div>

            <div>
              <span>배송비</span>
              <strong>
                {orderInfo.deliveryFee === 0
                  ? '무료'
                  : `${orderInfo.deliveryFee.toLocaleString()}원`}
              </strong>
            </div>
          </div>

          <div className="payment-total">
            <span>TOTAL</span>
            <strong>
              {orderInfo.total.toLocaleString()}원
            </strong>
          </div>

          <label className="payment-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) =>
                setAgreed(event.target.checked)
              }
            />

            <span>
              주문 정보와 결제 금액을 확인했습니다.
            </span>
          </label>

          <button
            type="button"
            className="payment-submit"
            onClick={handlePayment}
            disabled={
              approvePaymentMutation.isPending ||
              orderInfo.status !== 'ORDERED'
            }
          >
            {approvePaymentMutation.isPending
              ? '결제 승인 중...'
              : `${orderInfo.total.toLocaleString()}원 결제하기`}
          </button>

          <p className="payment-security-note">
            JWT 인증 회원의 본인 주문만 결제할 수 있습니다.
          </p>
        </aside>
      </div>
    </main>
  );
};

export default Payment;
