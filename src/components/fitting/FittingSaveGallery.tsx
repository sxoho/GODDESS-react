// src/components/fitting/FittingSaveGallery.tsx
import React from 'react';
import { useFittingSaveList, useDeleteFittingSave } from '../../features/useFittingSave';
import { useNavigate } from 'react-router-dom';
import '../../styles/fitting/FittingSaveGallery.css';

const FittingSaveGallery: React.FC = () => {
    const navigate = useNavigate();
    const { data: saves, isLoading, isError } = useFittingSaveList();
    const { mutate: deleteSave, isPending: isDeleting } = useDeleteFittingSave();

    const handleDelete = (id: number) => {
        if (window.confirm('저장된 피팅 결과를 삭제하시겠습니까?')) {
            deleteSave(id);
        }
    };

    if (isLoading) return <div className="save-gallery-loading">드레스룸 정보를 불러오는 중입니다...</div>;
    if (isError) return <div className="save-gallery-error">드레스룸 정보를 불러오지 못했습니다.</div>;

    return (
        <div className="fitting-save-gallery">
            <h3 className="gallery-title">나의 드레스룸 (가상 피팅 보관함)</h3>

            {!saves || saves.length === 0 ? (
                <div className="gallery-empty">
                    <p>저장된 피팅 내역이 없습니다.</p>
                    <button onClick={() => navigate('/fitting/request')} className="btn-go-fitting">
                        가상 피팅 하러 가기
                    </button>
                </div>
            ) : (
                <div className="gallery-grid">
                    {saves.map((item) => (
                        <div key={item.id} className="gallery-card">
                            <div className="card-image-box">
                                {/* 2D 썸네일 이미지 출력 */}
                                <img src={item.filePath} alt={item.saveName} className="card-image" />
                                {item.modelFilePath && <span className="badge-3d">3D 지원</span>}
                            </div>
                            <div className="card-info">
                <span className="fitting-type-badge">
                  {item.fittingType === 'QUICK' ? '단일 상품' : '코디 조합'}
                </span>
                                <h4 className="save-name">{item.saveName}</h4>
                                <p className="save-date">{new Date(item.createdAt).toLocaleDateString()}</p>
                                <div className="card-actions">
                                    <button className="btn-view" onClick={() => alert('피팅 뷰어 연결')}>크게 보기</button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={isDeleting}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FittingSaveGallery;