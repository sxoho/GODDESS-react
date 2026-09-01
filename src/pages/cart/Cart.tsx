// src/pages/cart/Cart.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCartItems, deleteCartItem } from '../../api/cartApi';
import { useGlobalStore } from '../../store/store';
import { axiosInstance, getSpringApiUrl } from '../../components/ToolBak';
import '../../styles/cart/Cart.css';

// --- Types (백엔드 CartResponseDto 규격) ---
export interface CartItem {
    id: number;                          // 장바구니 ID (Cart ID)
    productOptionId: number;             // 상품 옵션 ID
    brand?: string | null;               // 브랜드명
    productName: string;                 // 상품명
    colorName: string;                   // 색상명
    sizeName: string;                    // 사이즈명
    price: number;                       // 기본 상품 가격
    discount?: string | null;            // 할인율
    addPrice: number;                    // 옵션 추가 금액
    quantity: number;                    // 수량
    filePath?: string | null;            // 상품 이미지 경로
    quickFittingResultId: number | null; // 퀵 피팅 결과 ID
    coordFittingResultId: number | null; // 코디 피팅 결과 ID
    createdAt: string;                   // 생성일시 (ISO 문자열)

    // UI 보조 필드 (선택적)
    brandName?: string;                  // 브랜드명 (호환용)
    optionName?: string;                 // 옵션명 (색상/사이즈 조합 등)
    discountPrice?: number;              // 할인가
}

interface ProductOptionInfo {
    id: number;
    productId: number;
    colorName?: string;
    sizeName?: string;
}

interface ProductInfo {
    id: number;
    brand?: string;
    name?: string;
    price?: number;
    discount?: string;
}

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

const getDiscountRate = (discount?: string | number | null) => {
    if (!discount) return 0;
    if (typeof discount === 'number') return discount;
    const val = Number(discount.replace(/[^0-9]/g, ''));
    return Number.isNaN(val) ? 0 : val;
};

const Cart: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { loginId, sw } = useGlobalStore();

    const { data: fetchedCartItems, isLoading, isError } = useQuery({
        queryKey: ['cartItems', loginId],
        queryFn: () => getCartItems(loginId),
        enabled: Boolean(sw && loginId),
    });

    // 브랜드명 및 할인 정보 fallback 조회를 위한 옵션 및 상품 정보
    const { data: allOptions } = useQuery<ProductOptionInfo[]>({
        queryKey: ['optionsForCart'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product_option/find_all');
            return Array.isArray(res.data) ? res.data : (res.data as { data?: ProductOptionInfo[] })?.data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    const { data: allProducts } = useQuery<ProductInfo[]>({
        queryKey: ['productsForCart'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/find_all');
            return Array.isArray(res.data) ? res.data : (res.data as { data?: ProductInfo[] })?.data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // 프론트엔드 수량 변경 임시 반영을 위한 상태
    const [quantityOverrides, setQuantityOverrides] = useState<Record<number, number>>({});
    const [unselectedIds, setUnselectedIds] = useState<Set<number>>(new Set());
    const [isMaxDiscount, setIsMaxDiscount] = useState<boolean>(true);

    // 단건 삭제 Mutation (DB 반영)
    const deleteMutation = useMutation({
        mutationFn: (cartId: number) => deleteCartItem(cartId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cartItems'] });
        },
        onError: (error) => {
            console.error('장바구니 삭제 실패:', error);
            alert('상품 삭제에 실패했습니다. 다시 시도해주세요.');
        },
    });

    // 선택 다건 삭제 Mutation (DB 반영)
    const deleteMultipleMutation = useMutation({
        mutationFn: (ids: number[]) => Promise.all(ids.map(id => deleteCartItem(id))),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cartItems'] });
            setUnselectedIds(new Set());
        },
        onError: (error) => {
            console.error('선택 상품 삭제 실패:', error);
            alert('선택 상품 삭제에 실패했습니다. 다시 시도해주세요.');
        },
    });

    // 서버 데이터 + 수량 변경 + 브랜드/할인 정보 보정 결합된 리스트
    const cartItems: CartItem[] = useMemo(() => {
        if (!fetchedCartItems) return [];
        return fetchedCartItems.map(item => {
            let brand = item.brand || item.brandName;
            let discount = item.discount;
            let productName = item.productName;

            // DTO에 brand가 없거나 기본값일 경우 상품 마스터에서 실제 브랜드명 조회
            if ((!brand || brand === 'ONNIVER') && allOptions && allProducts) {
                const opt = allOptions.find(o => o.id === item.productOptionId);
                if (opt && opt.productId) {
                    const prod = allProducts.find(p => p.id === opt.productId);
                    if (prod) {
                        if (prod.brand) brand = prod.brand;
                        if (!discount && prod.discount) discount = prod.discount;
                        if (!productName && prod.name) productName = prod.name;
                    }
                }
            }

            return {
                ...item,
                brand: brand || 'ONNIVER',
                discount: discount ?? item.discount,
                productName: productName || item.productName,
                quantity: quantityOverrides[item.id] ?? item.quantity,
            };
        });
    }, [fetchedCartItems, quantityOverrides, allOptions, allProducts]);

    // 브랜드별 그룹화 (동일 브랜드 상품 묶음)
    const brandGroups: BrandGroup[] = useMemo(() => {
        const map = new Map<string, CartItem[]>();
        cartItems.forEach(item => {
            const brand = (item.brand || item.brandName || 'ONNIVER').trim();
            if (!map.has(brand)) {
                map.set(brand, []);
            }
            map.get(brand)!.push(item);
        });

        return Array.from(map.entries()).map(([brand, items]) => ({
            brand,
            items,
        }));
    }, [cartItems]);

    // 선택된 아이템 목록 계산 (기본값: 전체 선택)
    const selectedIds = useMemo(() => {
        const set = new Set<number>();
        cartItems.forEach(item => {
            if (!unselectedIds.has(item.id)) {
                set.add(item.id);
            }
        });
        return set;
    }, [cartItems, unselectedIds]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setUnselectedIds(new Set());
        } else {
            setUnselectedIds(new Set(cartItems.map(i => i.id)));
        }
    };

    const handleSelectBrand = (brandItems: CartItem[], checked: boolean) => {
        const newSet = new Set(unselectedIds);
        brandItems.forEach(item => {
            if (checked) {
                newSet.delete(item.id);
            } else {
                newSet.add(item.id);
            }
        });
        setUnselectedIds(newSet);
    };

    const handleSelectItem = (id: number, checked: boolean) => {
        const newSet = new Set(unselectedIds);
        if (checked) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setUnselectedIds(newSet);
    };

    // 수량 변경
    const handleQuantity = (id: number, delta: number) => {
        setQuantityOverrides(prev => {
            const currentItem = cartItems.find(i => i.id === id);
            const currentQ = prev[id] ?? currentItem?.quantity ?? 1;
            const newQ = Math.max(1, currentQ + delta);
            return { ...prev, [id]: newQ };
        });
    };

    // 단건 삭제 (DB 삭제 API 호출)
    const handleRemoveSingle = (id: number) => {
        if (!window.confirm('해당 상품을 장바구니에서 삭제하시겠습니까?')) return;
        deleteMutation.mutate(id);
    };

    // 선택 삭제 (DB 삭제 API 호출)
    const handleRemoveSelected = () => {
        if (selectedIds.size === 0) {
            alert('삭제할 상품을 선택해주세요.');
            return;
        }
        if (!window.confirm(`선택한 ${selectedIds.size}개 상품을 장바구니에서 삭제하시겠습니까?`)) return;
        deleteMultipleMutation.mutate(Array.from(selectedIds));
    };

    // 실시간 파생 데이터 계산 (주문금액, 할인금액, 배송비, 총결제금액)
    let totalOriginal = 0;
    let totalDiscount = 0;

    cartItems.forEach(item => {
        if (selectedIds.has(item.id)) {
            const itemOriginalUnitPrice = item.price + (item.addPrice || 0);
            const discountRate = getDiscountRate(item.discount);
            const unitDiscount = isMaxDiscount && discountRate > 0
                ? Math.round(itemOriginalUnitPrice * (discountRate / 100))
                : 0;

            totalOriginal += itemOriginalUnitPrice * item.quantity;
            totalDiscount += unitDiscount * item.quantity;
        }
    });

    const netProductTotal = totalOriginal - totalDiscount;
    const shippingFee = selectedIds.size > 0 ? (netProductTotal >= 50000 ? 0 : 3000) : 0; // 50,000원 이상 무료배송, 미만 3,000원 적용
    const finalPrice = netProductTotal + shippingFee;
    const summary = { totalOriginal, totalDiscount, shippingFee, finalPrice };

    // 결제 이동 핸들러
    const handleCheckout = () => {
        const selectedCartItems = cartItems.filter(item => selectedIds.has(item.id));

        navigate('/order', {
            state: {
                orderItems: selectedCartItems,
                paymentSummary: summary,
            },
        });
    };

    if (!sw || !loginId) {
        return (
            <div className="cart-page-wrapper">
                <div className="cart-empty" style={{ padding: '80px 0', textAlign: 'center' }}>
                    <p style={{ fontSize: '18px', marginBottom: '20px', color: '#555' }}>
                        로그인이 필요한 서비스입니다.
                    </p>
                    <button
                        className="btn-checkout"
                        style={{ maxWidth: '200px', margin: '0 auto', display: 'inline-block' }}
                        onClick={() => navigate('/member/login')}
                    >
                        로그인하기
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) return <div className="cart-page-wrapper">장바구니를 불러오는 중입니다...</div>;
    if (isError) return <div className="cart-page-wrapper">장바구니를 불러오는데 실패했습니다.</div>;

    return (
        <div className="cart-page-wrapper">
            <div className="cart-list-section">
                <div className="cart-controls">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={cartItems.length > 0 && selectedIds.size === cartItems.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                        <span className="custom-checkbox"></span>
                        전체선택 ({selectedIds.size}/{cartItems.length})
                    </label>
                    <button className="btn-text" onClick={handleRemoveSelected}>선택삭제</button>
                </div>

                <div className="discount-toggle-banner">
                    <div className="toggle-info">
                        <strong>선택 상품에 <span className="text-orange">최대 할인 적용</span> ⓘ</strong>
                        <p className="sub-text">적용된 장바구니 쿠폰 없음 &gt;</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isMaxDiscount}
                            onChange={(e) => setIsMaxDiscount(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {cartItems.length === 0 ? (
                    <div className="cart-empty" style={{ padding: '60px 0', textAlign: 'center', color: '#888' }}>
                        장바구니에 담긴 상품이 없습니다.
                    </div>
                ) : (
                    brandGroups.map((group) => {
                        const isBrandAllSelected = group.items.length > 0 && group.items.every(i => selectedIds.has(i.id));

                        return (
                            <div key={group.brand} className="cart-brand-group">
                                <div className="brand-header">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={isBrandAllSelected}
                                            onChange={(e) => handleSelectBrand(group.items, e.target.checked)}
                                        />
                                        <span className="custom-checkbox"></span>
                                        <strong>{group.brand} &gt;</strong>
                                    </label>
                                </div>

                                <div className="brand-items-list">
                                    {group.items.map(item => {
                                        const isSelected = selectedIds.has(item.id);
                                        const itemOriginalUnitPrice = item.price + (item.addPrice || 0);
                                        const discountRate = getDiscountRate(item.discount);
                                        const unitDiscount = isMaxDiscount && discountRate > 0
                                            ? Math.round(itemOriginalUnitPrice * (discountRate / 100))
                                            : 0;
                                        const unitPrice = itemOriginalUnitPrice - unitDiscount;

                                        // 상품 개수 반영된 가격 (수량 변경 시 즉시 연동)
                                        const itemTotalPrice = unitPrice * item.quantity;
                                        const itemTotalOriginalPrice = itemOriginalUnitPrice * item.quantity;

                                        return (
                                            <div key={item.id} className="cart-item-card">
                                                <div className="item-body">
                                                    <label className="checkbox-label item-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                                        />
                                                        <span className="custom-checkbox"></span>
                                                    </label>

                                                    <div className="item-image-container">
                                                        {item.filePath ? (
                                                            <img
                                                                src={getImageUrl(item.filePath)}
                                                                alt={item.productName}
                                                                className="cart-item-image"
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
                                                            className="item-image-placeholder"
                                                            style={{ display: item.filePath ? 'none' : 'flex' }}
                                                        >
                                                            NO IMAGE
                                                        </div>
                                                    </div>

                                                    <div className="item-details">
                                                        <div className="item-title-row">
                                                            <p className="item-name">{item.productName}</p>
                                                            <button
                                                                className="btn-close"
                                                                onClick={() => handleRemoveSingle(item.id)}
                                                                aria-label="상품 삭제"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                        <p className="item-option">
                                                            [옵션] {item.optionName || `${item.colorName} / ${item.sizeName}`}
                                                        </p>

                                                        <div className="quantity-control">
                                                            <button onClick={() => handleQuantity(item.id, -1)}>-</button>
                                                            <span>{item.quantity}</span>
                                                            <button onClick={() => handleQuantity(item.id, 1)}>+</button>
                                                        </div>

                                                        <div className="item-pricing">
                                                            {discountRate > 0 && isMaxDiscount && (
                                                                <span className="text-orange percent">{discountRate}%</span>
                                                            )}
                                                            <span className="final-price">{itemTotalPrice.toLocaleString()}원</span>
                                                            {discountRate > 0 && isMaxDiscount && (
                                                                <span className="original-price">{itemTotalOriginalPrice.toLocaleString()}원</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="cart-summary-section">
                <div className="summary-box">
                    <div className="summary-row font-lg">
                        <span>총 주문 금액</span>
                        <strong>{summary.totalOriginal.toLocaleString()}원</strong>
                    </div>

                    <div className="divider"></div>

                    <div className="summary-row font-lg">
                        <span>총 할인 금액</span>
                        <strong className="text-orange">-{summary.totalDiscount.toLocaleString()}원</strong>
                    </div>

                    <div className="summary-row font-lg">
                        <span>배송비</span>
                        <strong>{summary.shippingFee === 0 ? '0원 (무료배송)' : `${summary.shippingFee.toLocaleString()}원`}</strong>
                    </div>

                    <div className="divider lg"></div>

                    <div className="summary-row font-xl">
                        <span>총 결제 금액</span>
                        <strong>{summary.finalPrice.toLocaleString()}원</strong>
                    </div>

                    <button
                        className="btn-checkout"
                        onClick={handleCheckout}
                        disabled={selectedIds.size === 0}
                    >
                        {summary.finalPrice.toLocaleString()}원 결제하기 ({selectedIds.size}개)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
