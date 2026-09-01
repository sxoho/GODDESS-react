// src/api/chatApi.ts
import axios from 'axios';
// import { axiosInstance } from '../components/Tool';

// TODO: [JWT_BYPASS_TEMP] JWT 인증 없이 사용하기 위해 임시 추가된 스토어. 추후 원복 시 삭제
import { useGlobalStore } from '../store/store';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9102/api';

export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface FaqResponse {
    faqId: number;
    categoryId: number;
    question: string;
    answer: string;
    viewCount: number;
}

export interface ChatRoomCreateRequest {
    productId?: number;
    orderId?: number;
    chatType: string; // 'CHATBOT' | 'LIVE_CHAT'
}

export interface ChatRoomResponse {
    chatRoomId: number;
    memberId: number;
    productId: number | null;
    orderId: number | null;
    chatType: string;
    status: string;
    createdAt: string;
}

export interface ChatMessageSendRequest {
    message: string;
    messageType: string; // 'TEXT' | 'IMAGE' | 'PRODUCT_CARD'
}

export interface ChatMessageResponse {
    chatMessageId: number;
    chatRoomId: number;
    senderType: string; // 'USER' | 'BOT' | 'COUNSELOR'
    message: string;
    messageType: string;
    isRead: string;
    createdAt: string;
}

// ==========================================
// JWT 미사용
// ==========================================
export const getFaqs = async (): Promise<FaqResponse[]> => {
    const response = await axios.get<ApiResponse<FaqResponse[]>>(`${BASE_URL}/api/chat/faqs`);
    return response.data.data;
};

export const createChatRoom = async (data: ChatRoomCreateRequest): Promise<ChatRoomResponse> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // const response = await axios.post<ApiResponse<ChatRoomResponse>>(`${BASE_URL}/api/chat/rooms`, data);
    
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const loginId = useGlobalStore.getState().loginId;
    const response = await axios.post<ApiResponse<ChatRoomResponse>>(`${BASE_URL}/api/chat/rooms?loginId=${loginId}`, data);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝
    
    return response.data.data;
};

export const getMyChatRooms = async (): Promise<ChatRoomResponse[]> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // const response = await axios.get<ApiResponse<ChatRoomResponse[]>>(`${BASE_URL}/api/chat/rooms`);
    
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const loginId = useGlobalStore.getState().loginId;
    const response = await axios.get<ApiResponse<ChatRoomResponse[]>>(`${BASE_URL}/api/chat/rooms?loginId=${loginId}`);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝
    
    return response.data.data;
};

export const getMessages = async (roomId: number): Promise<ChatMessageResponse[]> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // const response = await axios.get<ApiResponse<ChatMessageResponse[]>>(`${BASE_URL}/api/chat/rooms/${roomId}/messages`);
    
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const loginId = useGlobalStore.getState().loginId;
    const response = await axios.get<ApiResponse<ChatMessageResponse[]>>(`${BASE_URL}/api/chat/rooms/${roomId}/messages?loginId=${loginId}`);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝
    
    return response.data.data;
};

export const sendMessage = async (roomId: number, data: ChatMessageSendRequest): Promise<ChatMessageResponse> => {
    // TODO: [JWT_BYPASS_TEMP] JWT 인증 복구 시 아래 원래 코드로 되돌리세요.
    // const response = await axios.post<ApiResponse<ChatMessageResponse>>(`${BASE_URL}/api/chat/rooms/${roomId}/messages`, data);
    
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 시작
    const loginId = useGlobalStore.getState().loginId;
    const response = await axios.post<ApiResponse<ChatMessageResponse>>(`${BASE_URL}/api/chat/rooms/${roomId}/messages?loginId=${loginId}`, data);
    // [JWT_BYPASS_TEMP] 임시 추가된 코드 끝
    
    return response.data.data;
};


// ==========================================
// JWT 사용
// ==========================================
/*
export const getFaqs = async (): Promise<FaqResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<FaqResponse[]>>('/api/chat/faqs');
  return response.data.data;
};

export const createChatRoom = async (data: ChatRoomCreateRequest): Promise<ChatRoomResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChatRoomResponse>>('/api/chat/rooms', data);
  return response.data.data;
};

export const getMyChatRooms = async (): Promise<ChatRoomResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<ChatRoomResponse[]>>('/api/chat/rooms');
  return response.data.data;
};

export const getMessages = async (roomId: number): Promise<ChatMessageResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<ChatMessageResponse[]>>(`/api/chat/rooms/${roomId}/messages`);
  return response.data.data;
};

export const sendMessage = async (roomId: number, data: ChatMessageSendRequest): Promise<ChatMessageResponse> => {
  const response = await axiosInstance.post<ApiResponse<ChatMessageResponse>>(`/api/chat/rooms/${roomId}/messages`, data);
  return response.data.data;
};
*/