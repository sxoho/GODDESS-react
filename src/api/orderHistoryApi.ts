import { axiosInstance } from "../components/ToolBak";

export type OrderListItem = {
  id: number;
  memberId?: number;
  orderName: string;
  productTotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
  cancelDate?: string | null;
};

export type OrderDetailItem = {
  id: number;
  productOptionId?: number;
  productName: string;
  colorName?: string | null;
  variantName?: string | null;
  price: number;
  quantity: number;
};

export type PaymentInfo = {
  id: number;
  orderId?: number;
  paymentMethod: string;
  amount: number;
  status: string;
  approvalNo?: string | null;
  createdAt?: string;
};

export type DeliveryInfo = {
  id: number;
  orderId?: number;
  recipient: string;
  tel: string;
  zipcode: string;
  address1: string;
  address2?: string | null;
  request?: string | null;
  status: string;
  company?: string | null;
  trackingNo?: string | null;
  shippingDate?: string | null;
  completeDate?: string | null;
  createdAt?: string;
};

export type OrderHistoryDetail = {
  id: number;
  memberId: number;
  orderName: string;
  productTotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
  cancelDate?: string | null;
  orderDetails: OrderDetailItem[];
  payment?: PaymentInfo | null;
  delivery?: DeliveryInfo | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const getMyOrders = async (): Promise<OrderListItem[]> => {
  const response = await axiosInstance.get<ApiResponse<OrderListItem[]>>(
    "/api/commerce/orders/my"
  );

  return response.data.data;
};

export const getMyOrderDetail = async (
  orderId: number
): Promise<OrderHistoryDetail> => {
  const response = await axiosInstance.get<ApiResponse<OrderHistoryDetail>>(
    `/api/commerce/orders/${orderId}`
  );

  return response.data.data;
};


export const cancelOrder = async (
  orderId: number
): Promise<string> => {
  const response = await axiosInstance.patch<ApiResponse<string>>(
    `/api/commerce/orders/${orderId}/cancel`
  );

  return response.data.data;
};
