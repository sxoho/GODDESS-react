// src/components/order/MyOrderHistory.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '../../api/orderApi';
import { useDeliveryInfo } from '../../features/useDelivery';
import { useOrderDetailList } from '../../features/useOrder';
import ReturnRequestModal from './ReturnRequestModal';
import '../../styles/order/MyOrderHistory.css';

const MyOrderHistory: React.FC = () => {
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [returnTarget, setReturnTarget] = useState<{ orderDetailId: number; productName: string; optionText?: string } | null>(null);

    // 내 주문 목록 불러오기
    const { data: orders, isLoading: isOrdersLoading } = useQuery({
        queryKey: ['myOrders'],
        queryFn: getMyOrders,
    });

    // 선택한 주문의 '배송 정보' 불러오기
    const { data: deliveryInfo, isLoading: isDeliveryLoading } = useDeliveryInfo(selectedOrderId);

    // ✅ 선택한 주문의 '상세 품목' 불러오기
    const { data: orderDetails, isLoading: isDetailsLoading } = useOrderDetailList(selectedOrderId);

    if (isOrdersLoading) return <div className="order-history-loading">주문 내역을 불러오는 중입니다...</div>;
    if (!orders || orders.length === 0) return <div className="order-history-empty">주문 내역이 없습니다.</div>;

    return (
        <div className="my-order-history-container">
            <h3 className="history-title">주문 / 배송 조회</h3>

            <div className="history-layout">
                {/* 좌측: 주문 목록 */}
                <div className="order-list-section">
                    {orders.map((order) => (
                        <div
                            key={order.orderId}
                            className={`order-card ${selectedOrderId === order.orderId ? 'selected' : ''}`}
                            onClick={() => setSelectedOrderId(order.orderId)}
                        >
                            <div className="order-card-header">
                                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                <span className={`order-status ${order.status.toLowerCase()}`}>
                                    {order.status === 'PAID' ? '결제완료' : '결제대기'}
                                </span>
                            </div>
                            <h4 className="order-name">{order.orderName}</h4>
                            <p className="order-price">{order.totalAmount.toLocaleString()}원</p>
                        </div>
                    ))}
                </div>

                <div className="delivery-detail-section">
                    {!selectedOrderId ? (
                        <div className="delivery-placeholder">좌측에서 주문 내역을 선택해주세요.</div>
                    ) : (
                        <div className="detail-and-delivery-wrapper">
                            <div className="order-detail-card">
                                <h4>주문 상품 상세</h4>
                                {isDetailsLoading ? (
                                    <p className="loading-text">상품 상세를 불러오는 중입니다...</p>
                                ) : !orderDetails || orderDetails.length === 0 ? (
                                    <p className="empty-text">주문 상세 내역이 없습니다.</p>
                                ) : (
                                    <ul className="order-detail-list">
                                        {orderDetails.map((item) => (
                                            <li key={item.orderDetailId} className="detail-item">
                                                <div className="detail-item-info">
                                                    <p className="item-name">{item.productName}</p>
                                                    <p className="item-option">옵션: {item.colorName} / {item.sizeName}</p>
                                                </div>
                                                <div className="detail-item-price">
                                                    <span>{item.quantity}개</span>
                                                    <strong>{(item.price * item.quantity).toLocaleString()}원</strong>
                                                    {deliveryInfo?.status === 'DELIVERED' && (
                                                        <button
                                                            type="button"
                                                            className="btn-return-request"
                                                            onClick={() => setReturnTarget({
                                                                orderDetailId: item.orderDetailId,
                                                                productName: item.productName,
                                                                optionText: [item.colorName, item.sizeName].filter(Boolean).join(' / '),
                                                            })}
                                                        >
                                                            반품 요청
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="delivery-timeline-card mt-4">
                                <h4>배송 진행 상황</h4>
                                {isDeliveryLoading ? (
                                    <p className="loading-text">배송 정보를 조회 중입니다...</p>
                                ) : !deliveryInfo ? (
                                    <p className="empty-text">배송 정보가 아직 생성되지 않았습니다.</p>
                                ) : (
                                    <>
                                        <div className="courier-info">
                                            <strong>{deliveryInfo.courierCompany || '배송사 배정 대기중'}</strong>
                                            <span>{deliveryInfo.trackingNumber ? ` (송장번호: ${deliveryInfo.trackingNumber})` : ''}</span>
                                        </div>

                                        <div className="timeline">
                                            <div className={`timeline-step ${['PREPARING', 'SHIPPING', 'DELIVERED'].includes(deliveryInfo.status) ? 'active' : ''}`}>
                                                <div className="step-circle">1</div>
                                                <div className="step-text">상품 준비중</div>
                                            </div>
                                            <div className="timeline-line"></div>

                                            <div className={`timeline-step ${['SHIPPING', 'DELIVERED'].includes(deliveryInfo.status) ? 'active' : ''}`}>
                                                <div className="step-circle">2</div>
                                                <div className="step-text">배송중</div>
                                            </div>
                                            <div className="timeline-line"></div>

                                            <div className={`timeline-step ${deliveryInfo.status === 'DELIVERED' ? 'active' : ''}`}>
                                                <div className="step-circle">3</div>
                                                <div className="step-text">배송 완료</div>
                                            </div>
                                        </div>

                                    </>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {returnTarget && (
                <ReturnRequestModal
                    orderDetailId={returnTarget.orderDetailId}
                    productName={returnTarget.productName}
                    optionText={returnTarget.optionText}
                    isOpen={Boolean(returnTarget)}
                    onClose={() => setReturnTarget(null)}
                />
            )}
        </div>
    );
};

export default MyOrderHistory;