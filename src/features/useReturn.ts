// src/features/useReturn.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestReturn } from '../api/returnApi';

export const useRequestReturn = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData: FormData) => requestReturn(formData),
        onSuccess: () => {
            alert('반품 신청이 정상적으로 접수되었습니다. 관리자 확인 후 처리됩니다.');
            // 반품 신청 후 주문 목록/배송 상태를 최신화
            queryClient.invalidateQueries({ queryKey: ['myOrders'] });

            if (onSuccessCallback) {
                onSuccessCallback(); // 모달 닫기 등 콜백 실행
            }
        },
        onError: (error) => {
            console.error('반품 신청 실패:', error);
            alert('반품 신청에 실패했습니다. 다시 시도해주세요.');
        },
    });
};