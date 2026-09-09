import { axiosInstance } from '../components/ToolBak';

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

export interface OrderDetailResponse {
  id: number;
  orderDetailId: number;
  orderId: number;
  productOptionId: number;
  productName: string;
  colorName?: string | null;
  variantName?: string | null;
  sizeName?: string | null;
  price: number;
  quantity: number;
}

export interface OrderResponse {
  id: number;
  orderId: number;
  memberId: number;
  orderName: string;
  productTotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  totalAmount: number;
  status: string;
  orderDetails: OrderDetailResponse[];
  createdAt: string;
  cancelDate: string | null;
}

export const createOrder = async (
  data: OrderCreateRequest,
): Promise<OrderResponse> => {
  const response = await axiosInstance.post<ApiResponse<OrderResponse>>(
    '/api/commerce/orders',
    data,
  );
  return response.data.data;
};

const normalizeOrder = (order: Omit<OrderResponse, 'orderId' | 'totalAmount'> & Partial<Pick<OrderResponse, 'orderId' | 'totalAmount'>>): OrderResponse => ({
  ...order,
  orderId: order.orderId ?? order.id,
  totalAmount: order.totalAmount ?? order.total,
  orderDetails: (order.orderDetails ?? []).map((detail) => ({
    ...detail,
    orderDetailId: detail.orderDetailId ?? detail.id,
    sizeName: detail.sizeName ?? detail.variantName ?? null,
  })),
});

export const getMyOrders = async (): Promise<OrderResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<OrderResponse[]>>(
    '/api/commerce/orders/my',
  );
  return response.data.data.map((order) => normalizeOrder(order));
};

export const getOrder = async (orderId: number): Promise<OrderResponse> => {
  const response = await axiosInstance.get<ApiResponse<OrderResponse>>(
    `/api/commerce/orders/${orderId}`,
  );
  return normalizeOrder(response.data.data);
};

export const getOrderDetails = async (orderId: number): Promise<OrderDetailResponse[]> => {
  const order = await getOrder(orderId);
  return order.orderDetails;
};
