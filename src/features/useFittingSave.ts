// src/features/useFittingSave.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyFittingSaves, addFittingSave, deleteFittingSave, type FittingSaveRequest } from '../api/fittingSaveApi';

export const FITTING_SAVE_KEYS = {
    all: ['fittingSaves'] as const,
};

export const useFittingSaveList = () => {
    return useQuery({
        queryKey: FITTING_SAVE_KEYS.all,
        queryFn: getMyFittingSaves,
    });
};

export const useAddFittingSave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FittingSaveRequest) => addFittingSave(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FITTING_SAVE_KEYS.all });
            alert('마이 드레스룸에 저장되었습니다.');
        },
    });
};

export const useDeleteFittingSave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (saveId: number) => deleteFittingSave(saveId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FITTING_SAVE_KEYS.all });
        },
    });
};