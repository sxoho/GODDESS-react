import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteCartItem,
  getCartItems,
  updateCartQuantity,
  type CartResponse,
} from "../../api/cartApi";
import { useGlobalStore } from "../../store/store";
import { getSpringApiUrl } from "../../components/ToolBak";
import { useSimpleModal } from "../../contexts/SimpleModalContext";

import "../../styles/cart/Cart.css";

type CartItem = CartResponse & {
  optionName: string;
  discountPrice: number;
};

const Icon = ({
  name,
}: {
  name: "bag" | "truck" | "shield" | "trash" | "arrow" | "check";
}) => {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "bag") {
    return (
      <svg {...common}>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
    );
  }

  if (name === "truck") {
    return (
      <svg {...common}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.7" />
        <circle cx="18" cy="18" r="1.7" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 19 6v5c0 4.5-2.7 8-7 10-4.3-2-7-5.5-7-10V6l7-3Z" />
        <path d="m9.5 12 1.7 1.7 3.6-3.7" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
};

const getImageUrl = (filePath?: string | null) => {
  if (!filePath) return "";

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const apiBase = getSpringApiUrl();
  return `${apiBase}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
};

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openAlert, openConfirm } = useSimpleModal();
  const { loginId, sw } = useGlobalStore();

  const cartQueryKey = ["cartItems", loginId] as const;

  const {
    data: fetchedCartItems = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: cartQueryKey,
    queryFn: getCartItems,
    enabled: Boolean(sw && loginId),
  });

  const [unselectedIds, setUnselectedIds] = useState<Set<number>>(new Set());

  const cartItems: CartItem[] = useMemo(
    () =>
      fetchedCartItems.map((item) => {
        const originalUnitPrice = item.price + (item.addPrice || 0);
        const discountRate = Number(item.discount || 0);
        const discountPrice = Math.round(
          originalUnitPrice * (1 - discountRate / 100),
        );

        return {
          ...item,
          brand: item.brand?.trim() || "GODDESS",
          optionName: [item.colorName, item.variantName]
            .filter(Boolean)
            .join(" / "),
          discountPrice,
        };
      }),
    [fetchedCartItems],
  );

  const selectedIds = useMemo(() => {
    const selected = new Set<number>();

    cartItems.forEach((item) => {
      if (!unselectedIds.has(item.id)) selected.add(item.id);
    });

    return selected;
  }, [cartItems, unselectedIds]);

  const quantityMutation = useMutation({
    mutationFn: ({ cartId, quantity }: { cartId: number; quantity: number }) =>
      updateCartQuantity(cartId, quantity),
    onSuccess: (updated) => {
      queryClient.setQueryData<CartResponse[]>(cartQueryKey, (old = []) =>
        old.map((item) => (item.id === updated.id ? updated : item)),
      );
    },
    onError: (error) => {
      console.error("장바구니 수량 변경 실패:", error);
      openAlert("수량을 변경하지 못했습니다. 재고를 확인해주세요.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (cartId: number) => deleteCartItem(cartId),
    onSuccess: (_, cartId) => {
      queryClient.setQueryData<CartResponse[]>(cartQueryKey, (old = []) =>
        old.filter((item) => item.id !== cartId),
      );

      setUnselectedIds((prev) => {
        const next = new Set(prev);
        next.delete(cartId);
        return next;
      });
    },
    onError: (error) => {
      console.error("장바구니 삭제 실패:", error);
      openAlert("상품 삭제에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: async (cartIds: number[]) => {
      await Promise.all(cartIds.map((id) => deleteCartItem(id)));
      return cartIds;
    },
    onSuccess: (cartIds) => {
      const removed = new Set(cartIds);
      queryClient.setQueryData<CartResponse[]>(cartQueryKey, (old = []) =>
        old.filter((item) => !removed.has(item.id)),
      );
      setUnselectedIds(new Set());
    },
    onError: (error) => {
      console.error("선택 상품 삭제 실패:", error);
      openAlert("선택 상품 삭제에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setUnselectedIds(
      checked ? new Set() : new Set(cartItems.map((item) => item.id)),
    );
  };

  const handleSelectItem = (cartId: number, checked: boolean) => {
    setUnselectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(cartId);
      else next.add(cartId);
      return next;
    });
  };

  const handleQuantity = (item: CartItem, delta: number) => {
    const nextQuantity = item.quantity + delta;
    if (nextQuantity < 1 || nextQuantity > item.stock) return;

    quantityMutation.mutate({
      cartId: item.id,
      quantity: nextQuantity,
    });
  };

  const handleRemoveSingle = async (cartId: number) => {
    const confirmed = await openConfirm({
      title: "상품 삭제",
      message: "해당 상품을 장바구니에서 삭제하시겠습니까?",
      confirmText: "삭제",
      cancelText: "취소",
      tone: "danger",
    });

    if (!confirmed) return;

    deleteMutation.mutate(cartId);
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) {
      openAlert("삭제할 상품을 선택해주세요.");
      return;
    }

    const confirmed = await openConfirm({
      title: "선택 상품 삭제",
      message: `선택한 ${selectedIds.size}개 상품을 장바구니에서 삭제하시겠습니까?`,
      confirmText: "삭제",
      cancelText: "취소",
      tone: "danger",
    });

    if (!confirmed) return;

    deleteMultipleMutation.mutate(Array.from(selectedIds));
  };

  const selectedItems = cartItems.filter((item) => selectedIds.has(item.id));

  const totalOriginal = selectedItems.reduce(
    (sum, item) => sum + (item.price + (item.addPrice || 0)) * item.quantity,
    0,
  );

  const totalProductPrice = selectedItems.reduce(
    (sum, item) => sum + item.discountPrice * item.quantity,
    0,
  );

  const totalDiscount = totalOriginal - totalProductPrice;
  const shippingFee =
    selectedItems.length === 0 ? 0 : totalProductPrice >= 50000 ? 0 : 3000;
  const finalPrice = totalProductPrice + shippingFee;
  const remainingForFreeShipping = Math.max(0, 50000 - totalProductPrice);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      openAlert("주문할 상품을 선택해주세요.");
      return;
    }

    const unavailable = selectedItems.find(
      (item) =>
        item.productStatus !== "ON_SALE" ||
        item.optionVisible !== "Y" ||
        item.stock < item.quantity,
    );

    if (unavailable) {
      openAlert(
        `${unavailable.productName} 상품의 판매 상태 또는 재고가 변경되었습니다.`,
      );
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
      return;
    }

    navigate("/order", {
      state: {
        orderItems: selectedItems.map((item) => ({
          ...item,
          cartId: item.id,
          sizeName: item.variantName,
          optionName: item.optionName,
        })),
        paymentSummary: {
          totalOriginal,
          totalDiscount,
          shippingFee,
          finalPrice,
        },
      },
    });
  };

  if (!sw || !loginId) {
    return (
      <main className="cart-page-wrapper cart-state-page">
        <div className="cart-empty-state">
          <span className="cart-empty-symbol">
            <Icon name="bag" />
          </span>
          <p className="cart-empty-kicker">YOUR BAG</p>
          <h1>로그인이 필요합니다.</h1>
          <p>로그인 후 장바구니에 담아둔 상품을 확인해보세요.</p>
          <button type="button" onClick={() => navigate("/login")}>
            로그인하기 <Icon name="arrow" />
          </button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="cart-page-wrapper cart-state-page">
        장바구니를 불러오는 중입니다...
      </main>
    );
  }

  if (isError) {
    return (
      <main className="cart-page-wrapper cart-state-page">
        장바구니를 불러오지 못했습니다.
      </main>
    );
  }

  return (
    <main className="cart-page-wrapper">
      <section className="cart-main-shell">
        <header className="cart-page-heading">
          <div>
            <span className="cart-heading-kicker">GODDESS SHOPPING BAG</span>
            <h1>CART ({cartItems.length})</h1>
          </div>

          <button
            type="button"
            className="continue-shopping-top"
            onClick={() => navigate("/products")}
          >
            계속 쇼핑하기 <Icon name="arrow" />
          </button>
        </header>

        {cartItems.length === 0 ? (
          <section className="cart-empty-state">
            <span className="cart-empty-symbol">
              <Icon name="bag" />
            </span>
            <p className="cart-empty-kicker">YOUR BAG IS EMPTY</p>
            <h2>장바구니가 비어 있습니다.</h2>
            <p>마음에 드는 뷰티 상품을 천천히 담아보세요.</p>
            <button type="button" onClick={() => navigate("/products")}>
              상품 보러가기 <Icon name="arrow" />
            </button>
          </section>
        ) : (
          <>
            <div className="cart-selection-toolbar">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    cartItems.length > 0 &&
                    selectedIds.size === cartItems.length
                  }
                  onChange={(event) => handleSelectAll(event.target.checked)}
                />
                <span className="custom-checkbox">
                  <Icon name="check" />
                </span>
                <span>전체 선택</span>
              </label>

              <div className="selection-actions">
                <span>
                  {selectedIds.size} / {cartItems.length} 선택
                </span>
                <button
                  type="button"
                  className="btn-text"
                  onClick={handleRemoveSelected}
                >
                  <Icon name="trash" />
                  선택 삭제
                </button>
              </div>
            </div>

            <div className="cart-table-head" aria-hidden="true">
              <div />
              <div>PRODUCT</div>
              <div>ITEM</div>
              <div>OPTION</div>
              <div>QUANTITY</div>
              <div>PRICE</div>
            </div>

            <section className="cart-product-list">
              {cartItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const originalUnitPrice = item.price + (item.addPrice || 0);
                const discountRate = Number(item.discount || 0);
                const itemTotalPrice = item.discountPrice * item.quantity;
                const itemTotalOriginalPrice =
                  originalUnitPrice * item.quantity;
                const unavailable =
                  item.productStatus !== "ON_SALE" ||
                  item.optionVisible !== "Y" ||
                  item.stock <= 0;

                return (
                  <article
                    className={`cart-product-row ${
                      !isSelected ? "is-unselected" : ""
                    }`}
                    key={item.id}
                  >
                    <label className="checkbox-label item-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={unavailable}
                        onChange={(event) =>
                          handleSelectItem(item.id, event.target.checked)
                        }
                      />
                      <span className="custom-checkbox">
                        <Icon name="check" />
                      </span>
                    </label>

                    <div className="cart-product-image-wrap">
                      <button
                        type="button"
                        className="cart-product-image-button"
                        onClick={() => navigate(`/products/${item.productId}`)}
                      >
                        {item.filePath ? (
                          <img
                            src={getImageUrl(item.filePath)}
                            alt={item.productName}
                            className="cart-product-image"
                          />
                        ) : (
                          <span className="item-image-placeholder">
                            NO IMAGE
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="row-remove-button"
                        onClick={() => handleRemoveSingle(item.id)}
                        aria-label="상품 삭제"
                      >
                        ×
                      </button>
                    </div>

                    <div className="cart-product-info">
                      <span className="item-brand">{item.brand}</span>
                      <button
                        type="button"
                        className="item-name"
                        onClick={() => navigate(`/products/${item.productId}`)}
                      >
                        {item.productName}
                      </button>
                      {unavailable && (
                        <p className="item-unavailable">
                          현재 구매할 수 없는 옵션입니다.
                        </p>
                      )}
                    </div>

                    <div className="cart-option-cell">
                      <small>COLOR / SIZE</small>
                      <strong>{item.optionName || "기본 옵션"}</strong>
                      <span>재고 {item.stock.toLocaleString()}개</span>
                    </div>

                    <div className="cart-quantity-cell">
                      <small>QUANTITY</small>
                      <div className="quantity-control">
                        <button
                          type="button"
                          disabled={
                            unavailable ||
                            item.quantity <= 1 ||
                            quantityMutation.isPending
                          }
                          onClick={() => handleQuantity(item, -1)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          disabled={
                            unavailable ||
                            item.quantity >= item.stock ||
                            quantityMutation.isPending
                          }
                          onClick={() => handleQuantity(item, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-price-cell">
                      <small>PRICE</small>
                      <strong>{itemTotalPrice.toLocaleString()}원</strong>
                      {discountRate > 0 && (
                        <>
                          <span className="discount-rate">{discountRate}%</span>
                          <del>{itemTotalOriginalPrice.toLocaleString()}원</del>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="cart-bottom-area">
              <div className="cart-shipping-note">
                <div>
                  <Icon name="truck" />
                  <span>
                    {remainingForFreeShipping === 0
                      ? "무료배송 조건을 충족했어요."
                      : `${remainingForFreeShipping.toLocaleString()}원 더 담으면 무료배송이에요.`}
                  </span>
                </div>
                <p>
                  * 배송비, 할인 및 최종 결제 금액은 주문 단계에서 다시
                  확인됩니다.
                </p>
              </div>

              <div className="cart-total-panel">
                <div className="summary-row">
                  <span>상품 금액</span>
                  <strong>{totalOriginal.toLocaleString()}원</strong>
                </div>
                <div className="summary-row">
                  <span>상품 할인</span>
                  <strong className="summary-discount">
                    -{totalDiscount.toLocaleString()}원
                  </strong>
                </div>
                <div className="summary-row">
                  <span>배송비</span>
                  <strong>
                    {shippingFee === 0
                      ? "무료"
                      : `${shippingFee.toLocaleString()}원`}
                  </strong>
                </div>

                <div className="summary-total-row">
                  <span>TOTAL</span>
                  <strong>{finalPrice.toLocaleString()}원</strong>
                </div>

                <button
                  type="button"
                  className="btn-checkout"
                  onClick={handleCheckout}
                  disabled={selectedIds.size === 0}
                >
                  CHECKOUT
                </button>

                <div className="summary-info-list">
                  <span>
                    <Icon name="shield" />
                    안전한 결제와 주문 정보 보호
                  </span>
                  <span>
                    <Icon name="truck" />
                    50,000원 이상 무료배송
                  </span>
                </div>
              </div>
            </section>

            <footer className="cart-brand-footer cart-brand-footer-reference">
              <div className="cart-footer-newsletter">
                <span className="cart-footer-kicker">JOIN GODDESS BEAUTY</span>
                <p>
                  Discover beauty tips, AI try-on and curated recommendations
                  made for you.
                </p>

                <div className="cart-footer-email">
                  <span>EMAIL</span>
                  <button type="button" aria-label="이메일 구독">
                    →
                  </button>
                </div>
              </div>

              <div className="cart-footer-menu-group">
                <div className="cart-footer-menu-column">
                  <small>NAVIGATE</small>
                  <button type="button" onClick={() => navigate("/products")}>
                    Shop
                  </button>
                  <button type="button" onClick={() => navigate("/beauty")}>
                    AI Beauty
                  </button>
                  <button type="button" onClick={() => navigate("/diagnosis")}>
                    Diagnosis
                  </button>
                  <button type="button" onClick={() => navigate("/mypage")}>
                    My Page
                  </button>
                  <button type="button" onClick={() => navigate("/wishlist")}>
                    Wishlist
                  </button>
                </div>

                <div className="cart-footer-menu-column">
                  <small>OFFICIAL</small>
                  <button type="button" onClick={() => navigate("/")}>
                    About GODDESS
                  </button>
                  <button type="button" onClick={() => navigate("/notice")}>
                    Notice
                  </button>
                  <button type="button" onClick={() => navigate("/faq")}>
                    FAQ
                  </button>
                  <button type="button" onClick={() => navigate("/terms")}>
                    Terms
                  </button>
                  <button type="button" onClick={() => navigate("/privacy")}>
                    Privacy
                  </button>
                </div>

                <div className="cart-footer-menu-column cart-footer-support-column">
                  <small>SUPPORT</small>
                  <p>We're here M-F 9am - 5pm.</p>
                  <a href="mailto:help@goddess.com">help@goddess.com</a>
                  <button type="button" onClick={() => navigate("/qna")}>
                    Customer Service
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/shipping-returns")}
                  >
                    Shipping &amp; Returns
                  </button>
                  <button type="button" onClick={() => navigate("/qna")}>
                    Contact Us
                  </button>
                </div>
              </div>
            </footer>

            <div className="cart-wordmark-row">
              <div className="cart-wordmark">goddess</div>
              <div className="cart-wordmark-social">
                <span>INSTAGRAM</span>
                <span>YOUTUBE</span>
                <span>TIKTOK</span>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Cart;
