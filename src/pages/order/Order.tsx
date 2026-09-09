import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSpringApiUrl } from '../../components/ToolBak';
import { useCreateOrder } from '../../features/useOrder';
import '../../styles/order/Order.css';

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
  discount?: number | string | null;
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
  if (/^https?:\/\//.test(filePath)) return filePath;
  const base = getSpringApiUrl();
  return `${base}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
};

const Order: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const createOrderMutation = useCreateOrder();

  const state = location.state as
    | {
        orderItems?: OrderItem[];
        paymentSummary?: PaymentSummary;
      }
    | undefined;

  const orderItems = state?.orderItems ?? [];
  const paymentSummary = state?.paymentSummary;

  const [recipient, setRecipient] = useState('');
  const [tel, setTel] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [request, setRequest] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (orderItems.length === 0 || !paymentSummary) {
      alert('주문할 상품 정보가 없습니다.');
      navigate('/cart', { replace: true });
    }
  }, [orderItems.length, paymentSummary, navigate]);

  const cartIds = useMemo(
    () =>
      orderItems
        .map((item) => item.cartId ?? item.id)
        .filter((id): id is number => typeof id === 'number'),
    [orderItems],
  );

  if (orderItems.length === 0 || !paymentSummary) return null;

  const totalOriginal = paymentSummary.totalOriginal ?? 0;
  const totalDiscount = paymentSummary.totalDiscount ?? 0;
  const netProductTotal = totalOriginal - totalDiscount;
  const shippingFee =
    paymentSummary.shippingFee ?? (netProductTotal >= 50000 ? 0 : 3000);
  const finalPrice = netProductTotal + shippingFee;

  const submitOrder = (event: React.FormEvent) => {
    event.preventDefault();

    if (cartIds.length !== orderItems.length) {
      alert('장바구니 상품 정보가 올바르지 않습니다.');
      return;
    }

    if (!recipient.trim() || !tel.trim() || !zipcode.trim() || !address1.trim() || !address2.trim()) {
      alert('배송지 필수 정보를 모두 입력해주세요.');
      return;
    }

    if (!agreed) {
      alert('구매조건 확인 및 결제 진행에 동의해주세요.');
      return;
    }

    createOrderMutation.mutate({
      cartIds,
      recipient: recipient.trim(),
      tel: tel.trim(),
      zipcode: zipcode.trim(),
      address1: address1.trim(),
      address2: address2.trim(),
      request: request.trim(),
    });
  };

  return (
    <main className="order-page-wrapper">
      <header className="order-page-header">
        <span>GODDESS CHECKOUT</span>
        <h1>ORDER</h1>
        <p>배송 정보를 확인한 뒤 결제 단계로 이동합니다.</p>
      </header>

      <form className="order-layout" onSubmit={submitOrder}>
        <section className="order-main-section">
          <div className="order-section">
            <div className="order-section-heading">
              <span>01</span>
              <h2>Order items</h2>
              <small>{orderItems.length} items</small>
            </div>

            <div className="order-items-container">
              {orderItems.map((item, index) => {
                const key = item.cartId ?? item.id ?? index;
                const unitPrice =
                  item.discountPrice ?? item.price + (item.addPrice ?? 0);
                const option =
                  item.optionName ||
                  [item.colorName, item.sizeName].filter(Boolean).join(' / ');

                return (
                  <article className="order-item-row" key={key}>
                    <div className="item-thumb">
                      {item.filePath ? (
                        <img src={getImageUrl(item.filePath)} alt={item.productName} />
                      ) : (
                        <span>NO IMAGE</span>
                      )}
                    </div>

                    <div className="item-info">
                      <span className="item-brand">
                        {item.brand || item.brandName || 'GODDESS'}
                      </span>
                      <strong>{item.productName}</strong>
                      {option && <p>{option}</p>}
                    </div>

                    <div className="item-price-qty">
                      <span>{item.quantity}개</span>
                      <strong>{(unitPrice * item.quantity).toLocaleString()}원</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="order-section">
            <div className="order-section-heading">
              <span>02</span>
              <h2>Shipping</h2>
              <small>배송지 입력</small>
            </div>

            <div className="order-form-grid">
              <label>
                <span>받으시는 분 *</span>
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
              </label>

              <label>
                <span>휴대폰 번호 *</span>
                <input
                  type="tel"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </label>

              <label>
                <span>우편번호 *</span>
                <input value={zipcode} onChange={(e) => setZipcode(e.target.value)} />
              </label>

              <label className="full-width">
                <span>기본 주소 *</span>
                <input value={address1} onChange={(e) => setAddress1(e.target.value)} />
              </label>

              <label className="full-width">
                <span>상세 주소 *</span>
                <input value={address2} onChange={(e) => setAddress2(e.target.value)} />
              </label>

              <label className="full-width">
                <span>배송 요청사항</span>
                <input
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="예: 문 앞에 놓아주세요"
                />
              </label>
            </div>
          </div>
        </section>

        <aside className="order-summary-section">
          <div className="summary-box">
            <span className="summary-kicker">PAYMENT SUMMARY</span>
            <h2>Order total</h2>

            <div className="summary-row">
              <span>상품 금액</span>
              <strong>{totalOriginal.toLocaleString()}원</strong>
            </div>
            <div className="summary-row">
              <span>상품 할인</span>
              <strong>-{totalDiscount.toLocaleString()}원</strong>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <strong>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</strong>
            </div>

            <div className="summary-total">
              <span>TOTAL</span>
              <strong>{finalPrice.toLocaleString()}원</strong>
            </div>

            <label className="order-agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>구매조건 확인 및 결제 진행에 동의합니다.</span>
            </label>

            <button
              type="submit"
              className="btn-pay"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? '주문 생성 중...' : '결제 단계로 이동'}
            </button>

            <button type="button" className="back-cart" onClick={() => navigate('/cart')}>
              장바구니로 돌아가기
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
};

export default Order;
