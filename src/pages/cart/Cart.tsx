import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteCartItem,
  getCartItems,
  updateCartQuantity,
  type CartResponse,
} from '../../api/cartApi';
import { useGlobalStore } from '../../store/store';
import { getSpringApiUrl } from '../../components/ToolBak';

import '../../styles/cart/Cart.css';

type CartItem = CartResponse & {
  optionName: string;
  discountPrice: number;
};

interface BrandGroup {
  brand: string;
  items: CartItem[];
}

const getImageUrl = (filePath?: string | null) => {
  if (!filePath) return '';

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const apiBase = getSpringApiUrl();
  return `${apiBase}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
};

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loginId, sw } = useGlobalStore();

  const cartQueryKey = ['cartItems', loginId] as const;

  const {
    data: fetchedCartItems = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: cartQueryKey,
    queryFn: getCartItems,
    enabled: Boolean(sw && loginId),
  });

  const [unselectedIds, setUnselectedIds] = useState<Set<number>>(
    new Set(),
  );

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
          brand: item.brand?.trim() || 'GODDESS',
          optionName: [item.colorName, item.variantName]
            .filter(Boolean)
            .join(' / '),
          discountPrice,
        };
      }),
    [fetchedCartItems],
  );

  const brandGroups: BrandGroup[] = useMemo(() => {
    const groups = new Map<string, CartItem[]>();

    cartItems.forEach((item) => {
      const brand = item.brand?.trim() || 'GODDESS';
      const list = groups.get(brand) ?? [];
      list.push(item);
      groups.set(brand, list);
    });

    return Array.from(groups.entries()).map(([brand, items]) => ({
      brand,
      items,
    }));
  }, [cartItems]);

  const selectedIds = useMemo(() => {
    const selected = new Set<number>();

    cartItems.forEach((item) => {
      if (!unselectedIds.has(item.id)) {
        selected.add(item.id);
      }
    });

    return selected;
  }, [cartItems, unselectedIds]);

  const quantityMutation = useMutation({
    mutationFn: ({
      cartId,
      quantity,
    }: {
      cartId: number;
      quantity: number;
    }) => updateCartQuantity(cartId, quantity),

    onSuccess: (updated) => {
      queryClient.setQueryData<CartResponse[]>(cartQueryKey, (old = []) =>
        old.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );
    },

    onError: (error) => {
      console.error('장바구니 수량 변경 실패:', error);
      alert('수량을 변경하지 못했습니다. 재고를 확인해주세요.');
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
      console.error('장바구니 삭제 실패:', error);
      alert('상품 삭제에 실패했습니다. 다시 시도해주세요.');
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
      console.error('선택 상품 삭제 실패:', error);
      alert('선택 상품 삭제에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setUnselectedIds(
      checked ? new Set() : new Set(cartItems.map((item) => item.id)),
    );
  };

  const handleSelectBrand = (
    brandItems: CartItem[],
    checked: boolean,
  ) => {
    setUnselectedIds((prev) => {
      const next = new Set(prev);

      brandItems.forEach((item) => {
        if (checked) next.delete(item.id);
        else next.add(item.id);
      });

      return next;
    });
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

    if (nextQuantity < 1 || nextQuantity > item.stock) {
      return;
    }

    quantityMutation.mutate({
      cartId: item.id,
      quantity: nextQuantity,
    });
  };

  const handleRemoveSingle = (cartId: number) => {
    if (!window.confirm('해당 상품을 장바구니에서 삭제하시겠습니까?')) {
      return;
    }

    deleteMutation.mutate(cartId);
  };

  const handleRemoveSelected = () => {
    if (selectedIds.size === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }

    if (
      !window.confirm(
        `선택한 ${selectedIds.size}개 상품을 장바구니에서 삭제하시겠습니까?`,
      )
    ) {
      return;
    }

    deleteMultipleMutation.mutate(Array.from(selectedIds));
  };

  const selectedItems = cartItems.filter((item) =>
    selectedIds.has(item.id),
  );

  const totalOriginal = selectedItems.reduce(
    (sum, item) =>
      sum + (item.price + (item.addPrice || 0)) * item.quantity,
    0,
  );

  const totalProductPrice = selectedItems.reduce(
    (sum, item) => sum + item.discountPrice * item.quantity,
    0,
  );

  const totalDiscount = totalOriginal - totalProductPrice;
  const shippingFee =
    selectedItems.length === 0
      ? 0
      : totalProductPrice >= 50000
        ? 0
        : 3000;

  const finalPrice = totalProductPrice + shippingFee;

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('주문할 상품을 선택해주세요.');
      return;
    }

    const unavailable = selectedItems.find(
      (item) =>
        item.productStatus !== 'ON_SALE' ||
        item.optionVisible !== 'Y' ||
        item.stock < item.quantity,
    );

    if (unavailable) {
      alert(
        `${unavailable.productName} 상품의 판매 상태 또는 재고가 변경되었습니다.`,
      );
      queryClient.invalidateQueries({ queryKey: cartQueryKey });
      return;
    }

    navigate('/order', {
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
          <span className="cart-empty-icon">♡</span>
          <h1>로그인이 필요합니다.</h1>
          <p>로그인 후 장바구니에 담아둔 상품을 확인해보세요.</p>
          <button type="button" onClick={() => navigate('/login')}>
            로그인하기
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
      <section className="cart-page-heading">
        <div>
          <span>SHOPPING BAG</span>
          <h1>장바구니</h1>
        </div>
        <p>{cartItems.length}개의 상품이 담겨 있어요.</p>
      </section>

      {cartItems.length === 0 ? (
        <section className="cart-empty-state">
          <span className="cart-empty-icon">♡</span>
          <h2>장바구니가 비어 있습니다.</h2>
          <p>마음에 드는 뷰티 상품을 담아보세요.</p>
          <button type="button" onClick={() => navigate('/products')}>
            상품 보러가기
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-list-section">
            <div className="cart-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    cartItems.length > 0 &&
                    selectedIds.size === cartItems.length
                  }
                  onChange={(event) =>
                    handleSelectAll(event.target.checked)
                  }
                />
                <span className="custom-checkbox" />
                전체선택 {selectedIds.size}/{cartItems.length}
              </label>

              <button
                type="button"
                className="btn-text"
                onClick={handleRemoveSelected}
              >
                선택삭제
              </button>
            </div>

            <div className="cart-benefit-note">
              <span className="cart-benefit-icon">✦</span>
              <div>
                <strong>상품 할인은 자동 적용됩니다.</strong>
                <p>5만원 이상 구매 시 배송비가 무료예요.</p>
              </div>
            </div>

            {brandGroups.map((group) => {
              const isBrandAllSelected = group.items.every((item) =>
                selectedIds.has(item.id),
              );

              return (
                <article className="cart-brand-group" key={group.brand}>
                  <header className="brand-header">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isBrandAllSelected}
                        onChange={(event) =>
                          handleSelectBrand(
                            group.items,
                            event.target.checked,
                          )
                        }
                      />
                      <span className="custom-checkbox" />
                      <strong>{group.brand}</strong>
                    </label>
                  </header>

                  <div className="brand-items-list">
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      const originalUnitPrice =
                        item.price + (item.addPrice || 0);
                      const discountRate = Number(item.discount || 0);
                      const itemTotalPrice =
                        item.discountPrice * item.quantity;
                      const itemTotalOriginalPrice =
                        originalUnitPrice * item.quantity;
                      const unavailable =
                        item.productStatus !== 'ON_SALE' ||
                        item.optionVisible !== 'Y' ||
                        item.stock <= 0;

                      return (
                        <div className="cart-item-card" key={item.id}>
                          <div className="item-body">
                            <label className="checkbox-label item-checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={unavailable}
                                onChange={(event) =>
                                  handleSelectItem(
                                    item.id,
                                    event.target.checked,
                                  )
                                }
                              />
                              <span className="custom-checkbox" />
                            </label>

                            <button
                              type="button"
                              className="item-image-container"
                              onClick={() =>
                                navigate(`/products/${item.productId}`)
                              }
                            >
                              {item.filePath ? (
                                <img
                                  src={getImageUrl(item.filePath)}
                                  alt={item.productName}
                                  className="cart-item-image"
                                />
                              ) : (
                                <span className="item-image-placeholder">
                                  NO IMAGE
                                </span>
                              )}
                            </button>

                            <div className="item-details">
                              <div className="item-title-row">
                                <div>
                                  <span className="item-brand">
                                    {item.brand}
                                  </span>
                                  <button
                                    type="button"
                                    className="item-name"
                                    onClick={() =>
                                      navigate(`/products/${item.productId}`)
                                    }
                                  >
                                    {item.productName}
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  className="btn-close"
                                  onClick={() =>
                                    handleRemoveSingle(item.id)
                                  }
                                  aria-label="상품 삭제"
                                >
                                  ×
                                </button>
                              </div>

                              <p className="item-option">
                                {item.optionName || '기본 옵션'}
                              </p>

                              {unavailable && (
                                <p className="item-unavailable">
                                  현재 구매할 수 없는 옵션입니다.
                                </p>
                              )}

                              <div className="item-bottom-row">
                                <div className="quantity-control">
                                  <button
                                    type="button"
                                    disabled={
                                      unavailable ||
                                      item.quantity <= 1 ||
                                      quantityMutation.isPending
                                    }
                                    onClick={() =>
                                      handleQuantity(item, -1)
                                    }
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
                                    onClick={() =>
                                      handleQuantity(item, 1)
                                    }
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="item-pricing">
                                  {discountRate > 0 && (
                                    <span className="discount-rate">
                                      {discountRate}%
                                    </span>
                                  )}
                                  <strong className="final-price">
                                    {itemTotalPrice.toLocaleString()}원
                                  </strong>
                                  {discountRate > 0 && (
                                    <del className="original-price">
                                      {itemTotalOriginalPrice.toLocaleString()}원
                                    </del>
                                  )}
                                </div>
                              </div>

                              <small className="item-stock">
                                재고 {item.stock.toLocaleString()}개
                              </small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="cart-summary-section">
            <div className="summary-box">
              <div className="summary-heading">
                <span>ORDER SUMMARY</span>
                <strong>{selectedIds.size} items</strong>
              </div>

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
                    ? '무료'
                    : `${shippingFee.toLocaleString()}원`}
                </strong>
              </div>

              <div className="summary-divider" />

              <div className="summary-total-row">
                <span>총 결제 예정 금액</span>
                <strong>{finalPrice.toLocaleString()}원</strong>
              </div>

              <button
                type="button"
                className="btn-checkout"
                onClick={handleCheckout}
                disabled={selectedIds.size === 0}
              >
                주문하기
                <span>{finalPrice.toLocaleString()}원</span>
              </button>

              <p className="summary-caption">
                결제 단계에서 배송지와 주문 정보를 최종 확인합니다.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default Cart;
