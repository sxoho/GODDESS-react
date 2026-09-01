// src/pages/payment/Payment.tsx
import React, {useState} from 'react';
import {useParams} from 'react-router-dom';
import {useApprovePayment, useOrderInfo} from '../../features/usePayment';
import '../../styles/payment/Payment.css';

const Payment: React.FC = () => {
    const {orderId} = useParams<{ orderId: string }>();
    const parsedOrderId = Number(orderId);

    const {data: orderInfo, isLoading, isError} = useOrderInfo(parsedOrderId);
    const {mutate: processPayment, isPending} = useApprovePayment();

    const [paymentMethod, setPaymentMethod] = useState<string>('CARD');

    const handlePayment = () => {
        if (!orderInfo) return;

        // [PG 연동 시뮬레이션] 결제 성공 시 고유 승인 번호를 발급받았다고 가정
        const mockApprovalNo = `IMP_MOCK_${new Date().getTime()}`;

        processPayment({
            orderId: parsedOrderId,
            paymentMethod: paymentMethod,
            amount: orderInfo.total,
            approvalNo: mockApprovalNo,
        });
    };

    if (isLoading) return <div className="payment-loading">결제 정보를 불러오는 중입니다...</div>;
    if (isError || !orderInfo) return <div className="payment-error">주문 정보를 찾을 수 없습니다.</div>;

    return (
        <div className="payment-container">
            <h2 className="payment-title">결제하기</h2>

            <div className="payment-card">
                <section className="payment-order-info">
                    <h3>주문 요약</h3>
                    <p><strong>주문 번호:</strong> {orderInfo.orderId}</p>
                    <p><strong>주문 상품:</strong> {orderInfo.orderName}</p>
                    <p className="total-amount">
                        <strong>최종 결제 금액:</strong> {orderInfo.total.toLocaleString()}원
                    </p>
                </section>

                <section className="payment-method-section">
                    <h3>결제 수단 선택</h3>
                    <div className="payment-methods">
                        <label className={`method-label ${paymentMethod === 'CARD' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="CARD"
                                checked={paymentMethod === 'CARD'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            신용/체크카드
                        </label>
                        <label className={`method-label ${paymentMethod === 'TRANSFER' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="TRANSFER"
                                checked={paymentMethod === 'TRANSFER'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            실시간 계좌이체
                        </label>
                        <label className={`method-label ${paymentMethod === 'KAKAOPAY' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="KAKAOPAY"
                                checked={paymentMethod === 'KAKAOPAY'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            카카오페이
                        </label>
                    </div>
                </section>

                <div className="payment-actions">
                    <button
                        className="btn-pay"
                        onClick={handlePayment}
                        disabled={isPending}
                    >
                        {isPending ? '결제 승인 중...' : `${orderInfo.total.toLocaleString()}원 결제하기`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;