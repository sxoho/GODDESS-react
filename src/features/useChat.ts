// src/features/useChat.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {ChatMessageSendRequest, ChatRoomCreateRequest} from '../api/chatApi';
import {createChatRoom, getFaqs, getMessages, getMyChatRooms, sendMessage} from '../api/chatApi';

export const CHAT_KEYS = {
    faqs: ['faqs'] as const,
    rooms: ['chatRooms'] as const,
    messages: (roomId: number) => ['chatMessages', roomId] as const,
};

export const useFaqList = () => {
    return useQuery({queryKey: CHAT_KEYS.faqs, queryFn: getFaqs});
};

export const useChatRoomList = () => {
    return useQuery({queryKey: CHAT_KEYS.rooms, queryFn: getMyChatRooms});
};

export const useMessageList = (roomId: number | null) => {
    return useQuery({
        queryKey: CHAT_KEYS.messages(roomId!),
        queryFn: () => getMessages(roomId!),
        enabled: !!roomId,
        // 실시간 느낌을 주기 위해 짧은 주기로 리페칭 (폴링 방식)
        refetchInterval: 3000,
    });
};

export const useCreateChatRoom = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ChatRoomCreateRequest) => createChatRoom(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: CHAT_KEYS.rooms});
        },
    });
};

export const useSendMessage = (roomId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ChatMessageSendRequest) => sendMessage(roomId, data),
        onSuccess: () => {
            // 메시지 전송 성공 시 즉시 캐시 갱신
            queryClient.invalidateQueries({queryKey: CHAT_KEYS.messages(roomId)});
        },
    });
};