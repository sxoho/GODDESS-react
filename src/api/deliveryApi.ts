// src/api/deliveryApi.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9102/api';

export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface DeliveryResponse {
    deliveryId: number;
    orderId: number;
    status: "PREPARING" | "SHIPPING" | "DELIVERED"; // 'PREPARING' (상품준비중) | 'SHIPPING' (배송중) | 'DELIVERED' (배송완료)
    trackingNumber: string | null;
    courierCompany: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
}

// ==========================================
// JWT 미사용
// ==========================================
export const getDeliveryInfo = async (orderId: number): Promise<DeliveryResponse> => {
    const response = await axios.get<ApiResponse<DeliveryResponse>>(`${BASE_URL}/commerce/delivery/order/${orderId}`);
    return response.data.data;
};

// ==========================================
// JWT 사용
// ==========================================
/*
import { axiosInstance } from '../components/Tool';
export const getDeliveryInfo = async (orderId: number): Promise<DeliveryResponse> => {
  const response = await axiosInstance.get<ApiResponse<DeliveryResponse>>(`/commerce/delivery/order/${orderId}`);
  return response.data.data;
};
*/