// src/api/returnApi.ts
import axios from 'axios';
// import { axiosInstance } from '../components/Tool';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9102/api';

export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface ReturnResponse {
    returnRequestId: number;
    status: string;
}

// ==========================================
// JWT 미사용
// ==========================================
export const requestReturn = async (formData: FormData): Promise<ReturnResponse> => {
    // 사진 첨부가 포함되므로 multipart/form-data 사용
    const response = await axios.post<ApiResponse<ReturnResponse>>(`${BASE_URL}/commerce/returns`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
};

// ==========================================
// JWT 사용
// ==========================================
/*
export const requestReturn = async (formData: FormData): Promise<ReturnResponse> => {
  const response = await axiosInstance.post<ApiResponse<ReturnResponse>>('/commerce/returns', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};
*/