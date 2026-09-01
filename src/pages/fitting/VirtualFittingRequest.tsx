// src/pages/fitting/VirtualFittingRequest.tsx
import React, { useState, useRef } from 'react';
import { useRequestQuickFitting, useRequestCoordFitting } from '../../features/useFitting';
import '../../styles/fitting/VirtualFittingRequest.css';

type FittingType = 'QUICK' | 'COORD';

const VirtualFittingRequest: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<FittingType>('QUICK');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // 폼 상태
    const [quickProductId, setQuickProductId] = useState<string>('');
    const [topId, setTopId] = useState<string>('');
    const [bottomId, setBottomId] = useState<string>('');
    const [outerId, setOuterId] = useState<string>('');

    const quickMutation = useRequestQuickFitting();
    const coordMutation = useRequestCoordFitting();

    const isPending = quickMutation.isPending || coordMutation.isPending;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedImage) {
            alert('전신 사진을 업로드해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('loginId', 'testUser'); // JWT 미사용 임시 하드코딩

        if (activeTab === 'QUICK') {
            if (!quickProductId) {
                alert('피팅해볼 상품 ID를 입력해주세요.');
                return;
            }
            formData.append('productId', quickProductId);
            quickMutation.mutate(formData);

        } else {
            if (!topId && !bottomId && !outerId) {
                alert('코디할 상품을 최소 1개 이상 입력해주세요.');
                return;
            }
            formData.append('topId', topId);
            formData.append('bottomId', bottomId);
            formData.append('outerId', outerId);
            coordMutation.mutate(formData);
        }
    };

    return (
        <div className="fitting-req-container">
            <div className="fitting-req-header">
                <h2>AI 가상 피팅 신청</h2>
                <p>나의 전신 사진을 업로드하고, 원하는 옷을 가상으로 입어보세요.</p>
            </div>

            {/* 피팅 타입 탭 */}
            <div className="fitting-tabs">
                <button
                    className={`tab-btn ${activeTab === 'QUICK' ? 'active' : ''}`}
                    onClick={() => setActiveTab('QUICK')}
                >
                    단일 간편 피팅
                </button>
                <button
                    className={`tab-btn ${activeTab === 'COORD' ? 'active' : ''}`}
                    onClick={() => setActiveTab('COORD')}
                >
                    상/하의 코디 피팅
                </button>
            </div>

            <form className="fitting-req-form" onSubmit={handleSubmit}>
                <div className="req-layout">
                    {/* 좌측: 사진 업로드 영역 */}
                    <div className="upload-section">
                        <h3>1. 내 사진 업로드</h3>
                        <div
                            className={`image-preview-box ${previewUrl ? 'has-image' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="preview-img" />
                            ) : (
                                <div className="upload-placeholder">
                                    <span className="upload-icon">+</span>
                                    <p>클릭하여 전신 사진 업로드</p>
                                    <span className="upload-hint">정면을 바라보는 전신 사진이 가장 정확합니다.</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* 우측: 상품 선택 옵션 영역 */}
                    <div className="options-section">
                        <h3>2. 상품 선택 ({activeTab === 'QUICK' ? '단일' : '조합'})</h3>

                        <div className="options-card">
                            {activeTab === 'QUICK' ? (
                                <div className="form-group">
                                    <label htmlFor="quickProductId">입어볼 상품 ID</label>
                                    <input
                                        type="number" id="quickProductId"
                                        value={quickProductId} onChange={(e) => setQuickProductId(e.target.value)}
                                        placeholder="예: 1"
                                    />
                                </div>
                            ) : (
                                <div className="coord-groups">
                                    <div className="form-group">
                                        <label htmlFor="topId">상의 상품 ID</label>
                                        <input type="number" id="topId" value={topId} onChange={(e) => setTopId(e.target.value)} placeholder="선택사항" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="bottomId">하의 상품 ID</label>
                                        <input type="number" id="bottomId" value={bottomId} onChange={(e) => setBottomId(e.target.value)} placeholder="선택사항" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="outerId">아우터 상품 ID</label>
                                        <input type="number" id="outerId" value={outerId} onChange={(e) => setOuterId(e.target.value)} placeholder="선택사항" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="fitting-guide">
                            <h4>💡 가상 피팅 안내</h4>
                            <ul>
                                <li>배경이 단색이고 밝은 곳에서 촬영한 사진이 좋습니다.</li>
                                <li>H200 GPU 서버를 통해 2D/3D 모델이 고속 생성됩니다.</li>
                                <li>코디 피팅 시 여러 겹의 옷을 입는 경우 분석 시간이 추가될 수 있습니다.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="req-actions">
                    <button type="submit" className="btn-submit-fitting" disabled={isPending}>
                        {isPending ? 'AI가 피팅을 진행 중입니다...' : '가상 피팅 시작하기'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VirtualFittingRequest;