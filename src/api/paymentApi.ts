import { axiosInstance } from '../components/ToolBak';
import type { ApiResponse, OrderResponse } from './orderApi';

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
  createdAt: string;
}

export const getOrderInfo = async (
  orderId: number,
): Promise<OrderResponse> => {
  const response = await axiosInstance.get<ApiResponse<OrderResponse>>(
    `/api/commerce/orders/${orderId}`,
  );
  return response.data.data;
};

export const approvePayment = async (
  data: PaymentApprovalRequest,
): Promise<PaymentResponse> => {
  const response = await axiosInstance.post<ApiResponse<PaymentResponse>>(
    '/api/commerce/payment/approve',
    data,
  );
  return response.data.data;
};
