// src/components/order/ReturnRequestModal.tsx
import React, { useState, useRef } from 'react';
import { useRequestReturn } from '../../features/useReturn';
import '../../styles/order/ReturnRequestModal.css';

interface ReturnRequestModalProps {
    orderId: number;
    isOpen: boolean;
    onClose: () => void;
}

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({ orderId, isOpen, onClose }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [reasonCategory, setReasonCategory] = useState<string>('단순 변심');
    const [detailReason, setDetailReason] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    // 모달을 닫는 콜백을 넘겨 훅 초기화
    const { mutate: submitReturn, isPending } = useRequestReturn(onClose);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
        }
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (!detailReason.trim()) {
            alert('상세 반품 사유를 입력해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('orderId', orderId.toString());
        formData.append('reasonCategory', reasonCategory);
        formData.append('detailReason', detailReason);

        // 테스트용 하드코딩 회원 데이터 (JWT 주석 해제 시 제거)
        formData.append('loginId', 'testUser');

        if (selectedImage) {
            formData.append('file', selectedImage); // 증빙 사진
        }

        submitReturn(formData);
    };

    return (
        <div className="return-modal-overlay" onClick={onClose}>
            <div className="return-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="return-modal-header">
                    <h3>반품 신청</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <form className="return-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>주문 번호</label>
                        <input type="text" value={orderId} readOnly className="readonly-input" />
                    </div>

                    <div className="form-group">
                        <label>반품 사유 선택</label>
                        <select value={reasonCategory} onChange={(e) => setReasonCategory(e.target.value)}>
                            <option value="단순 변심">단순 변심 (사이즈/색상 불만)</option>
                            <option value="상품 불량">상품 파손 및 불량</option>
                            <option value="오배송">다른 상품이 배송됨</option>
                            <option value="기타">기타</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>상세 사유</label>
                        <textarea
                            rows={4}
                            placeholder="반품하시려는 상세한 이유를 적어주세요."
                            value={detailReason}
                            onChange={(e) => setDetailReason(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>증빙 사진 첨부 (선택)</label>
                        <div className="file-upload-wrapper">
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="btn-upload"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                사진 선택
                            </button>
                            <span className="file-name">
                                {selectedImage ? selectedImage.name : '선택된 파일 없음'}
                            </span>
                        </div>
                        <small className="file-hint">* 상품 불량 및 파손의 경우 사진을 첨부해주시면 처리가 빠릅니다.</small>
                    </div>

                    <div className="return-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isPending}>취소</button>
                        <button type="submit" className="btn-submit" disabled={isPending}>
                            {isPending ? '처리 중...' : '반품 신청 완료'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReturnRequestModal;