// src/features/commerce/useCart.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {addCartItem, type CartAddRequest, deleteCartItem, getMyCart} from '../api/cartApi';

// Query Key 상수로 관리 (오타 방지 및 무효화 시 편의성)
export const CART_QUERY_KEYS = {
    all: ['cart'] as const,
    lists: () => [...CART_QUERY_KEYS.all, 'list'] as const,
};

/**
 * [Query] 내 장바구니 목록 조회 훅
 */
export const useCartList = () => {
    return useQuery({
        queryKey: CART_QUERY_KEYS.lists(),
        queryFn: getMyCart,
        // 로그인한 유저만 가져오도록 추가 설정 가능 (필요 시 enabled 옵션 사용)
    });
};

/**
 * [Mutation] 장바구니 담기 훅
 */
export const useAddCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CartAddRequest) => addCartItem(data),
        onSuccess: () => {
            // 장바구니 담기 성공 시, 기존 장바구니 리스트 캐시를 무효화하여 최신 데이터로 refetch 유도
            queryClient.invalidateQueries({queryKey: CART_QUERY_KEYS.lists()});
            alert('장바구니에 상품이 담겼습니다.');
        },
        onError: (error) => {
            console.error('장바구니 담기 실패:', error);
            alert('장바구니 담기에 실패했습니다. 다시 시도해주세요.');
        },
    });
};

/**
 * [Mutation] 장바구니 삭제 훅
 */
export const useDeleteCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cartId: number) => deleteCartItem(cartId),
        onSuccess: () => {
            // 삭제 성공 시 장바구니 리스트 즉시 재조회(동기화)
            queryClient.invalidateQueries({queryKey: CART_QUERY_KEYS.lists()});
        },
        onError: (error) => {
            console.error('장바구니 삭제 실패:', error);
            alert('상품 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
        },
    });
};