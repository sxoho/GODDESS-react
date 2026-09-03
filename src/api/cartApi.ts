// src/api/cartApi.ts
import { axiosInstance } from '../components/ToolBak';

// TODO: [JWT_BYPASS_TEMP] JWT 인증 없이 사용하기 위해 임시 추가된 스토어. 추후 원복 시 삭제하세요.
import { useGlobalStore } from '../store/store';

// 백엔드 공통 응답 포맷 (ApiResponse<T>)
export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

// 요청 DTO 인터페이스
export interface CartAddRequest {
    memberId: number;
    productOptionId: number;
    quantity: number;
}

// 응답 DTO 인터페이스
export interface CartResponse {
    id: number;                          // 장바구니 ID (Cart ID)
    productOptionId: number;             // 상품 옵션 ID
    brand?: string | null;               // 브랜드명
    productName: string;                 // 상품명
    colorName: string;                   // 색상명
    variantName: string;                 // 색상/용량/타입 등 상품 옵션명
    price: number;                       // 기본 상품 가격
    discount?: number | null;            // 할인율
    addPrice: number;                    // 옵션 추가 금액
    quantity: number;                    // 수량
    createdAt: string;                   // 생성일시 (ISO 문자열)

    // UI 보조 필드 (선택적)
    brandName?: string;                  // 브랜드명 (호환용)
    optionName?: string;                 // 옵션명 (색상/사이즈 조합 등)
    discountPrice?: number;              // 할인가
}

export interface CartItemResponse {
    cartId: number;
    productId: number;
    brandName: string;
    productName: string;
    optionName: string;
    price: number;
    discountPrice: number;
    quantity: number;
}

// 장바구니 담기 API
export const addCartItem = async (data: CartAddRequest): Promise<CartResponse> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // const response = await axiosInstance.post<ApiResponse<CartResponse>>('/commerce/cart', data);
    
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const loginId = useGlobalStore.getState().loginId;
    const response = await axiosInstance.post<ApiResponse<CartResponse>>(`/api/commerce/cart?loginId=${loginId}`, data);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝

    return response.data.data;
};

// 장바구니 조회 API
export const getCartItems = async (loginId: string = 'testUser'): Promise<CartResponse[]> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // const response = await axiosInstance.get<ApiResponse<CartResponse[]>>('/commerce/cart');

    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const response = await axiosInstance.get<ApiResponse<CartResponse[]>>(`/api/commerce/cart?loginId=${loginId}`);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝

    return response.data.data;
};

// 내 장바구니 목록 조회 API
export const getMyCart = async (): Promise<CartResponse[]> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // const response = await axiosInstance.get<ApiResponse<CartResponse[]>>('/commerce/cart');
    
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const loginId = useGlobalStore.getState().loginId;
    const response = await axiosInstance.get<ApiResponse<CartResponse[]>>(`/api/commerce/cart?loginId=${loginId}`);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝
    
    return response.data.data;
};

// 장바구니 단건 삭제 API
export const deleteCartItem = async (cartId: number): Promise<void> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // await axiosInstance.delete(`/commerce/cart/${cartId}`);
    
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const loginId = useGlobalStore.getState().loginId;
    await axiosInstance.delete(`/api/commerce/cart/${cartId}?loginId=${loginId}`);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝
};
