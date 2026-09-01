// src/features/useFitting.ts
import { useMutation } from '@tanstack/react-query';
import { requestQuickFitting, requestCoordFitting } from '../api/fittingApi';
import { useNavigate } from 'react-router-dom';

// 간편 피팅 (Quick Fitting) 훅
export const useRequestQuickFitting = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (formData: FormData) => requestQuickFitting(formData),
        onSuccess: (data) => {
            alert('간편 피팅 요청이 완료되었습니다.');
            // 간편 피팅 결과 페이지로 이동 (기존에 만든 VirtualFitting.tsx 라우트 활용)
            navigate(`/fitting/result/quick/${data.quickFittingId}`);
        },
        onError: (error) => {
            console.error('간편 피팅 요청 실패:', error);
            alert('가상 피팅 요청에 실패했습니다.');
        },
    });
};

// 코디 피팅 (Coord Fitting) 훅
export const useRequestCoordFitting = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (formData: FormData) => requestCoordFitting(formData),
        onSuccess: (data) => {
            alert('코디 피팅 요청이 완료되었습니다. (다중 AI 분석 진행)');
            // 코디 피팅 결과 페이지로 이동
            navigate(`/fitting/result/coord/${data.coordFittingId}`);
        },
        onError: (error) => {
            console.error('코디 피팅 요청 실패:', error);
            alert('코디 피팅 요청에 실패했습니다.');
        },
    });
};