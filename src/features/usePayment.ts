// src/features/usePayment.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { getOrderInfo, approvePayment, type PaymentApprovalRequest } from '../api/paymentApi';
import { useNavigate } from 'react-router-dom';

// 주문 정보 단건 조회 훅 (결제 금액 표시용)
export const useOrderInfo = (orderId: number) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrderInfo(orderId),
        enabled: !!orderId,
    });
};

// 결제 최종 승인 처리 훅
export const useApprovePayment = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: PaymentApprovalRequest) => approvePayment(data),
        onSuccess: () => {
            alert('결제가 성공적으로 완료되었습니다! 배송이 곧 시작됩니다.');
            // 결제 성공 후 마이페이지로 이동
            navigate('/mypage');
        },
        onError: (error) => {
            console.error('결제 승인 실패:', error);
            alert('결제 검증에 실패했습니다. 입력 정보를 확인해주세요.');
        },
    });
};