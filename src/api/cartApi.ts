import { axiosInstance } from '../components/ToolBak';

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

export interface CartAddRequest {
  productOptionId: number;
  quantity: number;
}

export interface CartResponse {
  id: number;
  productOptionId: number;
  productId: number;

  brand?: string | null;
  productName: string;
  colorName?: string | null;
  variantName?: string | null;

  price: number;
  discount?: number | null;
  addPrice: number;
  stock: number;
  quantity: number;

  filePath?: string | null;
  productStatus: string;
  optionVisible: string;
  createdAt: string;

  // 화면/주문 이동 시 사용하는 보조 값
  optionName?: string;
  discountPrice?: number;
}


export const addCartItem = async (
  data: CartAddRequest,
): Promise<CartResponse> => {
  const response = await axiosInstance.post<ApiResponse<CartResponse>>(
    '/api/commerce/cart',
    data,
  );

  return response.data.data;
};

export const getCartItems = async (): Promise<CartResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<CartResponse[]>>(
    '/api/commerce/cart',
  );

  return response.data.data;
};

export const getMyCart = getCartItems;

export const updateCartQuantity = async (
  cartId: number,
  quantity: number,
): Promise<CartResponse> => {
  const response = await axiosInstance.put<ApiResponse<CartResponse>>(
    `/api/commerce/cart/${cartId}/quantity`,
    { quantity },
  );

  return response.data.data;
};

export const deleteCartItem = async (cartId: number): Promise<void> => {
  await axiosInstance.delete(
    `/api/commerce/cart/${cartId}`,
  );
};
