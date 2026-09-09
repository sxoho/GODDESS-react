import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  createOrder,
  getOrder,
  getOrderDetails,
  type OrderCreateRequest,
} from '../api/orderApi';

export const useCreateOrder = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: OrderCreateRequest) => createOrder(data),
    onSuccess: (order) => {
      navigate(`/payment/${order.id}`, {
        state: { order },
      });
    },
    onError: (error) => {
      console.error('주문 생성 실패:', error);
      alert('주문 생성에 실패했습니다. 배송지와 재고를 확인해주세요.');
    },
  });
};

export const useOrderInfo = (orderId: number) =>
  useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

export const ORDER_DETAIL_KEYS = {
  list: (orderId: number) => ['orderDetails', orderId] as const,
};

export const useOrderDetailList = (orderId: number | null) =>
  useQuery({
    queryKey: ORDER_DETAIL_KEYS.list(orderId ?? 0),
    queryFn: () => getOrderDetails(orderId!),
    enabled: Boolean(orderId),
  });
