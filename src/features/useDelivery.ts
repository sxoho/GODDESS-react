// src/features/useDelivery.ts
import { useQuery } from '@tanstack/react-query';
import { getDeliveryInfo } from '../api/deliveryApi';

export const DELIVERY_KEYS = {
    detail: (orderId: number) => ['delivery', orderId] as const,
};

export const useDeliveryInfo = (orderId: number | null) => {
    return useQuery({
        queryKey: DELIVERY_KEYS.detail(orderId!),
        queryFn: () => getDeliveryInfo(orderId!),
        enabled: !!orderId, // orderId가 있을 때만 자동 페칭
    });
};