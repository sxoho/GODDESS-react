// src/api/orderApi.ts
import { axiosInstance } from '../components/ToolBak';
import axios from "axios";

const BASE_URL = 'http://localhost:9103/api';

export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface OrderCreateRequest {
    cartIds: number[];
    recipient: string;
    tel: string;
    zipcode: string;
    address1: string;
    address2: string;
    request?: string;
}

export interface OrderResponse {
    id: number;
    memberId: number;
    orderName: string;
    productTotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    status: string;
    orderDetails: any[];
    createdAt: string;
    cancelDate: string | null;
}

export interface OrderHistoryResponse {
    orderId: number;
    orderName: string;
    totalAmount: number;
    status: "PAYMENT_WAITING" | "PAID" | "CANCELED"; // 'PAYMENT_WAITING' (결제 대기중) | 'PAID' (결제됨) | 'CANCELED' (결제 취소됨)
    createdAt: string;
}

export interface OrderDetailResponse {
    orderDetailId: number;
    orderId: number;
    productOptionId: number;
    productName: string;   // 백엔드에서 조인
    colorName: string;     // 백엔드에서 조인
    sizeName: string;      // 백엔드에서 조인
    quantity: number;
    price: number;         // 상품 1개당 가격
}

// 주문서 생성(결제 대기) API
export const createOrder = async (data: OrderCreateRequest): Promise<OrderResponse> => {
    const response = await axiosInstance.post<ApiResponse<OrderResponse>>('/commerce/orders', data);
    return response.data.data;
};

// ==========================================
// JWT 미사용
// ==========================================
export const getMyOrders = async (): Promise<OrderHistoryResponse[]> => {
    // 테스트용 loginId 파라미터 전달 (실제 운영 시에는 삭제하고 axiosInstance 사용)
    const response = await axios.get<ApiResponse<OrderHistoryResponse[]>>(`${BASE_URL}/commerce/orders/my?loginId=testUser`);
    return response.data.data;
};

export const getOrderDetails = async (orderId: number): Promise<OrderDetailResponse[]> => {
    const response = await axios.get<ApiResponse<OrderDetailResponse[]>>(`${BASE_URL}/commerce/order-details/order/${orderId}`);
    return response.data.data;
};

// ==========================================
// JWT 사용
// ==========================================
/*
export const getMyOrders = async (): Promise<OrderHistoryResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<OrderHistoryResponse[]>>('/commerce/orders/my');
  return response.data.data;
};

export const getOrderDetails = async (orderId: number): Promise<OrderDetailResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<OrderDetailResponse[]>>(`/commerce/order-details/order/${orderId}`);
  return response.data.data;
};
*/