import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  approvePayment,
  getOrderInfo,
  type PaymentApprovalRequest,
} from '../api/paymentApi';

export const useOrderInfo = (orderId: number) =>
  useQuery({
    queryKey: ['payment-order', orderId],
    queryFn: () => getOrderInfo(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

export const useApprovePayment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentApprovalRequest) => approvePayment(data),
    onSuccess: async (payment) => {
      await queryClient.invalidateQueries({ queryKey: ['cartItems'] });
      await queryClient.invalidateQueries({ queryKey: ['myOrders'] });

      navigate('/mypage', {
        replace: true,
        state: {
          paymentCompleted: true,
          orderId: payment.orderId,
        },
      });
    },
    onError: (error) => {
      console.error('결제 승인 실패:', error);
      alert('결제 처리에 실패했습니다. 다시 시도해주세요.');
    },
  });
};
