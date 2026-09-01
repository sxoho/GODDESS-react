// src/pages/fitting/VirtualFitting.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { getFittingResult, type FittingResultResponse } from '../../api/fittingApi';

import { useAddFittingSave } from '../../features/useFittingSave';
import { useAddCartItem } from '../../features/useCart';

import '../../styles/fitting/VirtualFitting.css';
import {useGlobalStore} from "../../store/store.ts";

const ModelViewer3D = lazy(() => import('../../components/fitting/ModelViewer3D'));

const VirtualFitting: React.FC = () => {
    // 라우터 파라미터 추출 (예: /fitting/result/quick/15)
    const { type, id } = useParams<{ type: string; id: string }>();

    // ✅ 전역 스토어에서 현재 로그인한 유저의 memberId 가져오기
    const memberId = useGlobalStore((state) => state.memberId);

    const [result, setResult] = useState<FittingResultResponse | null>(null);
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
    const [isLoading, setIsLoading] = useState(true);

    // ✅ 버튼 액션을 위한 Mutation 훅 호출
    const { mutate: saveFitting, isPending: isSaving } = useAddFittingSave();
    const { mutate: addCart, isPending: isAddingCart } = useAddCartItem();

    useEffect(() => {
        if (id) {
            getFittingResult(Number(id))
                .then((data) => {
                    setResult(data);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('결과 로딩 실패', err);
                    setIsLoading(false);
                });
        }
    }, [id]);

    // 드레스룸 보관 버튼 핸들러
    const handleSaveToDressRoom = () => {
        const saveName = window.prompt('드레스룸에 보관할 이름을 입력하세요.', '나의 멋진 피팅 결과');
        if (!saveName) return; // 취소 시 중단

        saveFitting({
            fittingType: type?.toUpperCase() || 'QUICK',
            quickFittingResultId: type === 'quick' ? Number(id) : null,
            coordFittingResultId: type === 'coord' ? Number(id) : null,
            saveName: saveName,
        });
    };

    // 장바구니 담기 버튼 핸들러
    const handleAddToCart = () => {
        // 로그인이 되어있지 않은 경우 방어 로직 (선택 사항)
        if (!memberId) {
            alert('로그인이 필요한 서비스입니다.');
            // navigate('/login');
            return;
        }

        const mockProductOptionId = 1;

        addCart({
            memberId: memberId,
            productOptionId: mockProductOptionId,
            quickFittingResultId: type === 'quick' ? Number(id) : null,
            coordFittingResultId: type === 'coord' ? Number(id) : null,
            quantity: 1,
        });
    };

    if (isLoading) return <div className="fitting-loading">AI 피팅 결과를 불러오는 중입니다...</div>;
    if (!result || result.status !== 'COMPLETED') return <div className="fitting-error">피팅이 아직 완료되지 않았거나 실패했습니다.</div>;

    return (
        <div className="fitting-container">
            <div className="fitting-header">
                <h2 className="fitting-title">AI 가상 피팅 결과</h2>

                {result.modelFilePath && (
                    <div className="toggle-switch">
                        <button
                            className={`btn-toggle ${viewMode === '2D' ? 'active' : ''}`}
                            onClick={() => setViewMode('2D')}
                        >
                            2D 비교 보기
                        </button>
                        <button
                            className={`btn-toggle ${viewMode === '3D' ? 'active' : ''}`}
                            onClick={() => setViewMode('3D')}
                        >
                            3D 아바타 보기
                        </button>
                    </div>
                )}
            </div>

            <div className="fitting-viewer-area">
                {viewMode === '2D' ? (
                    <div className="slider-wrapper">
                        <ReactCompareSlider
                            itemOne={<ReactCompareSliderImage src={result.originFilePath} alt="Before" />}
                            itemTwo={<ReactCompareSliderImage src={result.filePath} alt="After" />}
                            defaultPosition={50}
                        />
                        <div className="slider-labels">
                            <span className="label-before">Before</span>
                            <span className="label-after">After</span>
                        </div>
                    </div>
                ) : (
                    <div className="model-wrapper">
                        <Suspense fallback={<div className="model-loading">3D 렌더러를 불러오는 중입니다...</div>}>
                            <ModelViewer3D modelUrl={result.modelFilePath!} />
                        </Suspense>
                        <div className="model-helper">마우스로 드래그하여 360도로 돌려보세요.</div>
                    </div>
                )}
            </div>

            <div className="fitting-actions">
                {/* ✅ 이벤트 바인딩 및 로딩 처리 */}
                <button
                    className="btn-action btn-save"
                    onClick={handleSaveToDressRoom}
                    disabled={isSaving}
                >
                    {isSaving ? '보관 중...' : '드레스룸에 보관하기'}
                </button>

                <button
                    className="btn-action btn-cart"
                    onClick={handleAddToCart}
                    disabled={isAddingCart}
                >
                    {isAddingCart ? '담는 중...' : '이 상품 장바구니에 담기'}
                </button>
            </div>
        </div>
    );
};

export default VirtualFitting;