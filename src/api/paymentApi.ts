// src/api/paymentApi.ts
import axios from 'axios';
// import { axiosInstance } from '../components/Tool';

const BASE_URL = 'http://localhost:9103/api';

export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface PaymentApprovalRequest {
    orderId: number;
    paymentMethod: string;
    amount: number;
    approvalNo: string;
}

export interface PaymentResponse {
    paymentId: number;
    orderId: number;
    paymentMethod: string;
    amount: number;
    status: string;
    approvalNo: string;
}

export interface OrderSimpleResponse {
    orderId: number;
    orderName: string;
    total: number;
}

// ==========================================
// JWT 미사용
// ==========================================
export const getOrderInfo = async (orderId: number): Promise<OrderSimpleResponse> => {
    const response = await axios.get<ApiResponse<OrderSimpleResponse>>(`${BASE_URL}/commerce/orders/${orderId}`);
    return response.data.data;
};

export const approvePayment = async (data: PaymentApprovalRequest): Promise<PaymentResponse> => {
    const response = await axios.post<ApiResponse<PaymentResponse>>(`${BASE_URL}/commerce/payment/approve`, data);
    return response.data.data;
};


// ==========================================
// JWT 사용
// ==========================================
/*
export const getOrderInfo = async (orderId: number): Promise<OrderSimpleResponse> => {
  const response = await axiosInstance.get<ApiResponse<OrderSimpleResponse>>(`/commerce/orders/${orderId}`);
  return response.data.data;
};

export const approvePayment = async (data: PaymentApprovalRequest): Promise<PaymentResponse> => {
  const response = await axiosInstance.post<ApiResponse<PaymentResponse>>('/commerce/payment/approve', data);
  return response.data.data;
};
*/