// src/api/fittingSaveApi.ts
import axios from 'axios';

import { getSpringApiUrl } from '../components/ToolBak';

const BASE_URL  = getSpringApiUrl();

export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface FittingSaveRequest {
    fittingType: string; // 'QUICK' | 'COORD'
    quickFittingResultId?: number | null;
    coordFittingResultId?: number | null;
    saveName: string;
    memo?: string;
}

export interface FittingSaveResponse {
    id: number;
    fittingType: string;
    saveName: string;
    memo: string;
    filePath: string; // 2D 결과 이미지 경로 (썸네일용)
    modelFilePath: string | null; // 3D 모델 존재 여부
    createdAt: string;
}

// ==========================================
// JWT 미사용
// ==========================================
export const getMyFittingSaves = async (): Promise<FittingSaveResponse[]> => {
    const response = await axios.get<ApiResponse<FittingSaveResponse[]>>(`${BASE_URL}/fitting/saves`);
    return response.data.data;
};

export const addFittingSave = async (data: FittingSaveRequest): Promise<void> => {
    await axios.post(`${BASE_URL}/fitting/saves`, data);
};

export const deleteFittingSave = async (saveId: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/fitting/saves/${saveId}`);
};

// ==========================================
// JWT 사용
// ==========================================
/*
import { axiosInstance } from '../components/Tool';

export const getMyFittingSaves = async (): Promise<FittingSaveResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<FittingSaveResponse[]>>('/fitting/saves');
  return response.data.data;
};

export const addFittingSave = async (data: FittingSaveRequest): Promise<void> => {
  await axiosInstance.post('/fitting/saves', data);
};

export const deleteFittingSave = async (saveId: number): Promise<void> => {
  await axiosInstance.delete(`/fitting/saves/${saveId}`);
};
*/