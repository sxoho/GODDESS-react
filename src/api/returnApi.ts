import { axiosInstance } from "../components/ToolBak";

export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface ReturnRequestPayload {
  orderDetailId: number;
  reasonType: string;
  reason?: string;
}

export interface ReturnResponse {
  id: number;
  orderDetailId: number;
  orderId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  productName: string;
  colorName?: string | null;
  variantName?: string | null;
  quantity: number;
  price: number;
  reasonType: string;
  reason?: string | null;
  status: ReturnStatus | string;
  filePath?: string | null;
  createdAt?: string;
  processDate?: string | null;
  refundAmount?: number | null;
}

export const requestReturn = async (
  payload: ReturnRequestPayload,
): Promise<ReturnResponse> => {
  const response = await axiosInstance.post<ApiResponse<ReturnResponse>>(
    "/api/commerce/returns",
    payload,
  );

  return response.data.data;
};

export const getMyReturnRequests = async (): Promise<ReturnResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<ReturnResponse[]>>(
    "/api/commerce/returns",
  );

  return response.data.data ?? [];
};

export const getAdminReturnRequests = async (): Promise<ReturnResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<ReturnResponse[]>>(
    "/api/commerce/returns/admin",
  );

  return response.data.data ?? [];
};

export const processReturnRequest = async (
  returnId: number,
  status: "APPROVED" | "REJECTED",
  refundAmount: number,
): Promise<ReturnResponse> => {
  const response = await axiosInstance.patch<ApiResponse<ReturnResponse>>(
    `/api/commerce/returns/${returnId}/process`,
    {
      status,
      refundAmount,
    },
  );

  return response.data.data;
};
