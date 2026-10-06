import { axiosInstance } from '../components/ToolBak';

export type SubscriptionPlanType = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatusType = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface SubscriptionStatusResponse {
  memberId: number;
  premium: boolean;
  planType: SubscriptionPlanType | null;
  status: SubscriptionStatusType | null;
  startDate: string | null;
  endDate: string | null;
}

export interface AiUsageStatusResponse {
  memberId: number;
  premium: boolean;
  unlimited: boolean;
  monthlyLimit: number;
  usedCount: number;
  remainingCount: number | null;
}

export interface SubscriptionResponse {
  subscriptionId: number;
  memberId: number;
  planType: SubscriptionPlanType;
  status: SubscriptionStatusType;
  price: number;
  startDate: string;
  endDate: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SubscriptionRequest {
  memberId: number;
  planType: SubscriptionPlanType;
}

export const getSubscriptionStatus = async (
  memberId: number,
): Promise<SubscriptionStatusResponse> => {
  const response =
    await axiosInstance.get<SubscriptionStatusResponse>(
      `/subscription/member/${memberId}/status`,
    );

  return response.data;
};

export const getSubscriptionHistory = async (
  memberId: number,
): Promise<SubscriptionResponse[]> => {
  const response =
    await axiosInstance.get<SubscriptionResponse[]>(
      `/subscription/member/${memberId}`,
    );

  return response.data ?? [];
};

export const getAiUsageStatus = async (
  memberId: number,
): Promise<AiUsageStatusResponse> => {
  const response =
    await axiosInstance.get<AiUsageStatusResponse>(
      `/beauty/ai-usage/member/${memberId}/status`,
    );

  return response.data;
};

export const subscribePremium = async (
  data: SubscriptionRequest,
): Promise<SubscriptionResponse> => {
  const response =
    await axiosInstance.post<SubscriptionResponse>(
      '/subscription',
      data,
    );

  return response.data;
};

export const cancelSubscription = async (
  subscriptionId: number,
): Promise<SubscriptionResponse> => {
  const response =
    await axiosInstance.put<SubscriptionResponse>(
      `/subscription/${subscriptionId}/cancel`,
    );

  return response.data;
};
