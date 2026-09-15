import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrderInfo } from '../../features/usePayment';
import '../../styles/payment/PaymentComplete.css';

const PaymentComplete: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const parsedOrderId = Number(orderId);

  const {
    data: orderInfo,
    isLoading,
    isError,
  } = useOrderInfo(parsedOrderId);

  if (isLoading) {
    return (
      <main className="payment-complete-state">
        결제 결과를 확인하는 중입니다...
      </main>
    );
  }

  if (isError || !orderInfo) {
    return (
      <main className="payment-complete-state">
        <p>결제 정보를 확인할 수 없습니다.</p>
        <button
          type="button"
          onClick={() =>
            navigate('/mypage', {
              state: { activeMenu: 'order' },
            })
          }
        >
          주문 내역으로 이동
        </button>
      </main>
    );
  }

  if (orderInfo.status !== 'PAID') {
    return (
      <main className="payment-complete-page">
        <section className="payment-complete-card payment-complete-card-warning">
          <span className="payment-complete-kicker">
            PAYMENT STATUS
          </span>

          <div className="payment-complete-symbol">!</div>

          <h1>결제 완료 상태를 확인할 수 없습니다.</h1>

          <p className="payment-complete-description">
            현재 주문 상태는 <strong>{orderInfo.status}</strong> 입니다.
          </p>

          <div className="payment-complete-actions">
            {orderInfo.status === 'PAYMENT_WAITING' && (
              <button
                type="button"
                className="payment-complete-primary"
                onClick={() =>
                  navigate(`/payment/${parsedOrderId}`, {
                    replace: true,
                  })
                }
              >
                결제 계속하기
              </button>
            )}

            <button
              type="button"
              className="payment-complete-secondary"
              onClick={() =>
                navigate(`/mypage/orders/${parsedOrderId}`)
              }
            >
              주문 상세 보기
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-complete-page">
      <section className="payment-complete-card">
        <span className="payment-complete-kicker">
          PAYMENT COMPLETE
        </span>

        <div className="payment-complete-symbol">✓</div>

        <h1>결제가 완료되었습니다.</h1>

        <p className="payment-complete-description">
          주문이 정상적으로 접수되었습니다.
          <br />
          주문 상세에서 결제 및 배송 정보를 확인할 수 있습니다.
        </p>

        <div className="payment-complete-order">
          <div>
            <span>ORDER</span>
            <strong>#{orderInfo.id}</strong>
          </div>

          <div>
            <span>ITEM</span>
            <strong>{orderInfo.orderName}</strong>
          </div>

          <div>
            <span>PAYMENT TOTAL</span>
            <strong>{orderInfo.total.toLocaleString()}원</strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong className="payment-complete-status">
              결제완료
            </strong>
          </div>
        </div>

        <div className="payment-complete-actions">
          <button
            type="button"
            className="payment-complete-primary"
            onClick={() =>
              navigate(`/mypage/orders/${parsedOrderId}`)
            }
          >
            주문 상세 보기
          </button>

          <button
            type="button"
            className="payment-complete-secondary"
            onClick={() =>
              navigate('/mypage', {
                state: { activeMenu: 'order' },
              })
            }
          >
            주문 내역
          </button>

          <button
            type="button"
            className="payment-complete-text-button"
            onClick={() => navigate('/products')}
          >
            쇼핑 계속하기
          </button>
        </div>

        <p className="payment-complete-note">
          서버의 주문 상태를 다시 조회하여 표시합니다.
        </p>
      </section>
    </main>
  );
};

export default PaymentComplete;
