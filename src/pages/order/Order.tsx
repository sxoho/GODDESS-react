// src/pages/order/Order.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSpringApiUrl } from '../../components/ToolBak';
import '../../styles/order/Order.css';

// --- Types ---
interface OrderItem {
    id?: number;
    cartId?: number;
    productId?: number;
    productOptionId?: number;
    brand?: string | null;
    brandName?: string;
    productName: string;
    colorName?: string;
    sizeName?: string;
    optionName?: string;
    price: number;
    addPrice?: number;
    discount?: string | null;
    discountPrice?: number;
    quantity: number;
    filePath?: string | null;
}

interface PaymentSummary {
    totalOriginal: number;
    totalDiscount: number;
    shippingFee?: number;
    finalPrice: number;
}

const getImageUrl = (filePath?: string | null) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    const apiBase = getSpringApiUrl();
    return `${apiBase}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
};

const Order: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Cart.tsx에서 navigate state로 넘겨준 데이터 수신
    const { orderItems, paymentSummary } = (location.state as {
        orderItems: OrderItem[];
        paymentSummary: PaymentSummary;
    }) || {};

    // 배송지 폼 상태
    const [recipient, setRecipient] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryRequest, setDeliveryRequest] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 잘못된 접근(장바구니를 거치지 않은 경우) 차단
    useEffect(() => {
        if (!orderItems || orderItems.length === 0) {
            alert('주문할 상품 정보가 없습니다. 장바구니로 이동합니다.');
            navigate('/cart', { replace: true });
        }
    }, [orderItems, navigate]);

    if (!orderItems || !paymentSummary) return null;

    // 배송비 및 결제 금액 실시간 계산
    const totalOriginal = paymentSummary.totalOriginal ?? 0;
    const totalDiscount = paymentSummary.totalDiscount ?? 0;
    const netProductTotal = totalOriginal - totalDiscount;

    // 전달받은 shippingFee가 있거나, 없을 경우 50,000원 이상 무료배송 / 미만 3,000원 적용
    const shippingFee = paymentSummary.shippingFee !== undefined
        ? paymentSummary.shippingFee
        : (netProductTotal >= 50000 ? 0 : 3000);

    const calculatedFinalPrice = netProductTotal + shippingFee;

    // --- 결제 프로세스 핸들러 ---
    const handleCheckoutProcess = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!recipient || !phone || !address) {
            alert('배송지 정보를 모두 입력해주세요.');
            return;
        }

        setIsProcessing(true);

        try {
            // 1. [API 호출 위치] 백엔드 주문 생성 (POST /commerce/orders)
            console.log('1. 주문서 생성 완료');

            // 2. PG사 결제창 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1500));
            const isPgSuccess = window.confirm(`[가상 결제창] ${calculatedFinalPrice.toLocaleString()}원을 결제하시겠습니까?`);

            if (!isPgSuccess) {
                alert('결제가 취소되었습니다.');
                setIsProcessing(false);
                return;
            }

            // 3. [API 호출 위치] 백엔드 결제 검증 및 승인
            console.log('2. 결제 승인 완료');

            alert('결제가 성공적으로 완료되었습니다!');

            // 4. 결제 완료 후 마이페이지의 주문 내역으로 이동
            navigate('/mypage', { replace: true });

        } catch (error) {
            console.error('결제 에러:', error);
            alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="order-page-wrapper">
            <h2 className="page-title">주문 / 결제</h2>

            <form className="order-layout" onSubmit={handleCheckoutProcess}>
                {/* --- 좌측: 주문 상품 정보 및 배송지 폼 --- */}
                <div className="order-main-section">

                    {/* 1. 주문 상품 요약 */}
                    <section className="order-section">
                        <h3 className="section-title">주문 상품 정보 ({orderItems.length}개)</h3>
                        <div className="order-items-container">
                            {orderItems.map((item, index) => {
                                const itemKey = item.id || item.cartId || index;
                                const itemOriginalUnitPrice = item.price + (item.addPrice || 0);
                                const itemUnitPrice = item.discountPrice !== undefined ? item.discountPrice : itemOriginalUnitPrice;
                                const itemTotalPrice = itemUnitPrice * item.quantity;
                                const optionText = item.optionName || (item.colorName && item.sizeName ? `${item.colorName} / ${item.sizeName}` : '');

                                return (
                                    <div key={itemKey} className="order-item-row">
                                        <div className="item-thumb">
                                            {item.filePath ? (
                                                <img
                                                    src={getImageUrl(item.filePath)}
                                                    alt={item.productName}
                                                    className="order-item-img"
                                                    onError={(e) => {
                                                        const target = e.currentTarget;
                                                        target.style.display = 'none';
                                                        if (target.nextElementSibling) {
                                                            (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="item-thumb-placeholder"
                                                style={{ display: item.filePath ? 'none' : 'flex' }}
                                            >
                                                NO IMAGE
                                            </div>
                                        </div>
                                        <div className="item-info">
                                            <p className="item-brand">{item.brand || item.brandName || 'GODDESS'}</p>
                                            <p className="item-name">{item.productName}</p>
                                            {optionText && <p className="item-option">[옵션] {optionText}</p>}
                                        </div>
                                        <div className="item-price-qty">
                                            <span>{item.quantity}개</span>
                                            <strong>{itemTotalPrice.toLocaleString()}원</strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 2. 배송지 정보 입력 폼 */}
                    <section className="order-section">
                        <h3 className="section-title">배송지 정보</h3>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>받으시는 분 *</label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>휴대폰 번호 *</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="010-0000-0000"
                                    required
                                />
                            </div>
                            <div className="input-group full-width">
                                <label>배송 주소 *</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="상세 주소를 입력하세요"
                                    required
                                />
                            </div>
                            <div className="input-group full-width">
                                <label>배송 요청사항</label>
                                <input
                                    type="text"
                                    value={deliveryRequest}
                                    onChange={(e) => setDeliveryRequest(e.target.value)}
                                    placeholder="예: 문 앞에 놓아주세요"
                                />
                            </div>
                        </div>
                    </section>

                </div>

                {/* --- 우측: 결제 정보 요약 (Sticky) --- */}
                <div className="order-summary-section">
                    <div className="summary-box">
                        <h3 className="summary-title">결제 상세</h3>

                        <div className="summary-row font-md">
                            <span>총 상품 금액</span>
                            <strong>{totalOriginal.toLocaleString()}원</strong>
                        </div>

                        <div className="summary-row font-md">
                            <span>총 할인 금액</span>
                            <strong className="text-orange">-{totalDiscount.toLocaleString()}원</strong>
                        </div>

                        <div className="summary-row font-md">
                            <span>배송비</span>
                            <strong>
                                {shippingFee === 0 ? '0원 (무료배송)' : `${shippingFee.toLocaleString()}원`}
                            </strong>
                        </div>

                        <div className="divider lg"></div>

                        <div className="summary-row font-xl">
                            <span>최종 결제 금액</span>
                            <strong className="text-blue">{calculatedFinalPrice.toLocaleString()}원</strong>
                        </div>

                        <div className="agreement-box">
                            <label className="checkbox-label">
                                <input type="checkbox" required />
                                <span className="custom-checkbox"></span>
                                <span>(필수) 구매조건 확인 및 결제진행에 동의</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn-pay"
                            disabled={isProcessing}
                        >
                            {isProcessing ? '결제 진행 중...' : `${calculatedFinalPrice.toLocaleString()}원 결제하기`}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Order;
