import React, { useEffect, useState } from "react";
import { useRequestReturn } from "../../features/useReturn";
import "../../styles/order/ReturnRequestModal.css";

interface ReturnRequestModalProps {
  orderDetailId: number;
  productName: string;
  optionText?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const REASON_OPTIONS = [
  { value: "CHANGE_MIND", label: "단순 변심" },
  { value: "DEFECT", label: "상품 파손 / 불량" },
  { value: "WRONG_DELIVERY", label: "오배송" },
  { value: "OTHER", label: "기타" },
];

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  orderDetailId,
  productName,
  optionText,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [reasonType, setReasonType] = useState("CHANGE_MIND");
  const [reason, setReason] = useState("");

  const { mutate: submitReturn, isPending } = useRequestReturn(() => {
    onSubmitted?.();
    onClose();
  });

  useEffect(() => {
    if (isOpen) {
      setReasonType("CHANGE_MIND");
      setReason("");
    }
  }, [isOpen, orderDetailId]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!reason.trim()) {
      alert("상세 반품 사유를 입력해주세요.");
      return;
    }

    submitReturn({
      orderDetailId,
      reasonType,
      reason: reason.trim(),
    });
  };

  return (
    <div className="return-modal-overlay" onMouseDown={onClose}>
      <section
        className="return-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="반품 요청"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="return-modal-header">
          <div>
            <small>RETURN REQUEST</small>
            <h3>반품 요청</h3>
          </div>

          <button type="button" className="btn-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="return-product-summary">
          <span>ORDER ITEM #{orderDetailId}</span>
          <strong>{productName}</strong>
          {optionText && <p>{optionText}</p>}
        </div>

        <form className="return-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="return-reason-type">반품 사유</label>
            <select
              id="return-reason-type"
              value={reasonType}
              onChange={(event) => setReasonType(event.target.value)}
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="return-reason">상세 사유</label>
            <textarea
              id="return-reason"
              rows={5}
              maxLength={1000}
              placeholder="반품을 요청하는 이유를 자세히 입력해주세요."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <small className="return-character-count">{reason.length} / 1000</small>
          </div>

          <p className="return-notice">
            반품 요청은 배송완료된 상품만 가능하며, 접수 후 관리자가 승인 또는 거절합니다.
          </p>

          <div className="return-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isPending}
            >
              취소
            </button>
            <button type="submit" className="btn-submit" disabled={isPending}>
              {isPending ? "접수 중..." : "반품 요청 접수"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ReturnRequestModal;
