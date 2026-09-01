// src/features/useOrder.ts
import {useMutation, useQuery} from '@tanstack/react-query';
import {createOrder, getOrderDetails, type OrderCreateRequest} from '../api/orderApi';
import {useNavigate} from 'react-router-dom';

export const useCreateOrder = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: OrderCreateRequest) => createOrder(data),
        onSuccess: (data) => {
            alert('주문서가 생성되었습니다. 결제 페이지로 이동합니다.');
            // 추후 결제(Payment) 도메인 페이지가 만들어지면 해당 주문 번호와 함께 라우팅
            navigate(`/payment/${data.id}`);
        },
        onError: (error) => {
            console.error('주문 생성 실패:', error);
            alert('주문 생성에 실패했습니다. 입력 정보를 다시 확인해주세요.');
        },
    });
};

export const ORDER_DETAIL_KEYS = {
    list: (orderId: number) => ['orderDetails', orderId] as const,
};

export const useOrderDetailList = (orderId: number | null) => {
    return useQuery({
        queryKey: ORDER_DETAIL_KEYS.list(orderId!),
        queryFn: () => getOrderDetails(orderId!),
        enabled: !!orderId, // orderId가 선택되었을 때만 API 요청
    });
};