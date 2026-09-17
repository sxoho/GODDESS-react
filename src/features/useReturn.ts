import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  requestReturn,
  type ReturnRequestPayload,
} from "../api/returnApi";

export const useRequestReturn = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReturnRequestPayload) => requestReturn(payload),
    onSuccess: async () => {
      alert("반품 요청이 정상적으로 접수되었습니다. 관리자 확인 후 처리됩니다.");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["myOrders"] }),
        queryClient.invalidateQueries({ queryKey: ["myReturnRequests"] }),
      ]);

      onSuccessCallback?.();
    },
    onError: (error) => {
      console.error("반품 요청 실패:", error);
      alert("반품 요청에 실패했습니다. 현재 주문 상태와 기존 반품 요청 여부를 확인해주세요.");
    },
  });
};
