// src/api/fittingApi.ts
import axios from 'axios';
// import { axiosInstance } from '../components/Tool';

const BASE_URL = 'http://localhost:9103/api';

export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface FittingResultResponse {
    fittingId: number;
    status: string;
    originFilePath: string;
    filePath: string;
    modelFilePath?: string;
}

export interface QuickFittingResponse {
    quickFittingId: number;
    status: string;
}

export interface CoordFittingResponse {
    coordFittingId: number;
    status: string;
}

// ==========================================
// JWT 미사용
// ==========================================
// 피팅 결과 요청 API
export const getFittingResult = async (fittingId: number): Promise<FittingResultResponse> => {
    const response = await axios.get<ApiResponse<FittingResultResponse>>(`${BASE_URL}/fitting/result/${fittingId}`);
    return response.data.data;
};

// 단일 상품 퀵 피팅 요청 API (이미지 파일 포함)
export const requestQuickFitting = async (formData: FormData): Promise<QuickFittingResponse> => {
    const response = await axios.post<ApiResponse<QuickFittingResponse>>(`${BASE_URL}/fitting/quick`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
};

// 코디 피팅(다중 상품) 요청 API
export const requestCoordFitting = async (formData: FormData): Promise<CoordFittingResponse> => {
    const response = await axios.post<ApiResponse<CoordFittingResponse>>(`${BASE_URL}/fitting/coord`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.data;
};


// ==========================================
// JWT 사용 - axiosInstance 사용
// ==========================================
/*
export const getFittingResult = async (fittingId: number): Promise<FittingResultResponse> => {
  const response = await axiosInstance.get<ApiResponse<FittingResultResponse>>(`/fitting/result/${fittingId}`);
  return response.data.data;
};

export const requestQuickFitting = async (formData: FormData): Promise<QuickFittingResponse> => {
  const response = await axiosInstance.post<ApiResponse<QuickFittingResponse>>('/fitting/quick', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const requestCoordFitting = async (formData: FormData): Promise<CoordFittingResponse> => {
  const response = await axiosInstance.post<ApiResponse<CoordFittingResponse>>('/fitting/coord', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};
*/