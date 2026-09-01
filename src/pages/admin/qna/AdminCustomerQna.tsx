import {
  useEffect,
  useState
} from "react";
import type { FormEvent } from "react";

import {
  axiosInstance
} from "../../../components/ToolBak";

import "../../../styles/admin/qna/AdminCustomerQna.css";


type CustomerQna = {
  id: number;
  memberId: number;
  memberNickname?: string;
  category: string;
  orderId?: number | null;
  title: string;
  content: string;
  answer?: string | null;
  status: string;
  createdAt?: string;
  answerDate?: string | null;
};


type CustomerQnaPageResponse = {
  content: CustomerQna[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};


const getCategoryLabel = (
  category?: string
) => {
  const value =
    (category || "").toUpperCase();

  const labels: Record<string, string> = {
    GENERAL: "일반 문의",
    ORDER: "주문 문의",
    DELIVERY: "배송 문의",
    CANCEL: "주문 취소 문의",
    RETURN: "반품 문의",
    EXCHANGE: "교환 문의",
    PAYMENT: "결제 문의",
    ETC: "기타 문의"
  };

  return labels[value] || category || "-";
};


const formatDateTime = (
  date?: string | null
) => {
  if (!date) {
    return "-";
  }

  return date
    .replace("T", " ")
    .substring(0, 16);
};


/**
 * 관리자 고객 문의 관리
 */
const AdminCustomerQna = () => {
  const [items, setItems] =
    useState<CustomerQna[]>([]);

  const [status, setStatus] =
    useState<"ALL" | "WAITING" | "ANSWERED">("ALL");

  const [keyword, setKeyword] =
    useState("");

  const [searchKeyword, setSearchKeyword] =
    useState("");

  const [page, setPage] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [totalElements, setTotalElements] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selected, setSelected] =
    useState<CustomerQna | null>(null);

  const [answer, setAnswer] =
    useState("");

  const [answerSaving, setAnswerSaving] =
    useState(false);


  /**
   * 관리자 고객 문의 목록 조회
   */
  const loadItems = async (
    targetPage = page,
    targetStatus = status,
    targetKeyword = searchKeyword
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await axiosInstance.get<CustomerQnaPageResponse>(
          "/customer_qna/admin/page",
          {
            params: {
              page: targetPage,
              size: 10,
              status:
                targetStatus === "ALL"
                  ? undefined
                  : targetStatus,
              keyword:
                targetKeyword.trim() ||
                undefined
            }
          }
        );

      setItems(
        response.data.content || []
      );

      setPage(
        response.data.number ?? targetPage
      );

      setTotalPages(
        response.data.totalPages ?? 0
      );

      setTotalElements(
        response.data.totalElements ?? 0
      );

    } catch (requestError) {
      console.error(
        "관리자 고객 문의 조회 오류:",
        requestError
      );

      setError(
        "고객 문의 목록을 불러오는 중 오류가 발생했습니다."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadItems(0, status, searchKeyword);
  }, [status]);


  /**
   * 검색
   */
  const handleSearch = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextKeyword =
      keyword.trim();

    setSearchKeyword(nextKeyword);
    setPage(0);

    await loadItems(
      0,
      status,
      nextKeyword
    );
  };


  /**
   * 문의 상세 조회
   */
  const openDetail = async (
    id: number
  ) => {
    try {
      const response =
        await axiosInstance.get<CustomerQna>(
          `/customer_qna/admin/${id}`
        );

      setSelected(response.data);
      setAnswer(response.data.answer || "");

    } catch (requestError) {
      console.error(
        "관리자 고객 문의 상세 조회 오류:",
        requestError
      );

      alert(
        "고객 문의 상세 정보를 불러오지 못했습니다."
      );
    }
  };


  /**
   * 모달 닫기
   */
  const closeDetail = () => {
    if (answerSaving) {
      return;
    }

    setSelected(null);
    setAnswer("");
  };


  /**
   * 관리자 답변 등록 / 수정
   */
  const saveAnswer = async () => {
    if (!selected) {
      return;
    }

    if (!answer.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      setAnswerSaving(true);

      const response =
        await axiosInstance.put<CustomerQna>(
          `/customer_qna/admin/${selected.id}/answer`,
          {
            answer: answer.trim()
          }
        );

      setSelected(response.data);
      setAnswer(response.data.answer || "");

      alert("고객 문의 답변이 저장되었습니다.");

      await loadItems(
        page,
        status,
        searchKeyword
      );

    } catch (requestError: any) {
      console.error(
        "관리자 고객 문의 답변 오류:",
        requestError
      );

      alert(
        requestError?.response?.data?.message ||
        "고객 문의 답변 저장 중 오류가 발생했습니다."
      );

    } finally {
      setAnswerSaving(false);
    }
  };


  /**
   * 페이지 변경
   */
  const changePage = async (
    nextPage: number
  ) => {
    if (
      nextPage < 0 ||
      nextPage >= totalPages ||
      nextPage === page
    ) {
      return;
    }

    await loadItems(
      nextPage,
      status,
      searchKeyword
    );
  };


  return (
    <div className="admin-customer-qna-page">
      {/* =========================
          제목
      ========================= */}
      <div className="admin-customer-qna-title">
        <div>
          <span>CUSTOMER Q&A</span>
          <h1>고객 문의 관리</h1>
        </div>

        <p>
          총 <strong>{totalElements}</strong>건
        </p>
      </div>

      {/* =========================
          상태 필터 + 검색
      ========================= */}
      <div className="admin-customer-qna-toolbar">
        <div className="admin-customer-qna-status-filter">
          <button
            type="button"
            className={status === "ALL" ? "active" : ""}
            onClick={() => setStatus("ALL")}
          >
            전체
          </button>

          <button
            type="button"
            className={status === "WAITING" ? "active" : ""}
            onClick={() => setStatus("WAITING")}
          >
            답변대기
          </button>

          <button
            type="button"
            className={status === "ANSWERED" ? "active" : ""}
            onClick={() => setStatus("ANSWERED")}
          >
            답변완료
          </button>
        </div>

        <form
          className="admin-customer-qna-search"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            placeholder="제목, 내용, 문의 유형, 회원 닉네임 검색"
          />

          <button type="submit">
            검색
          </button>
        </form>
      </div>

      {/* =========================
          문의 목록
      ========================= */}
      {loading ? (
        <div className="admin-customer-qna-message">
          고객 문의를 불러오는 중입니다.
        </div>

      ) : error ? (
        <div className="admin-customer-qna-message">
          {error}
        </div>

      ) : items.length === 0 ? (
        <div className="admin-customer-qna-message">
          조건에 맞는 고객 문의가 없습니다.
        </div>

      ) : (
        <div className="admin-customer-qna-table-wrap">
          <div className="admin-customer-qna-table-head">
            <span>번호</span>
            <span>상태</span>
            <span>회원</span>
            <span>문의 유형</span>
            <span>제목</span>
            <span>주문 번호</span>
            <span>작성일</span>
          </div>

          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="admin-customer-qna-row"
              onClick={() => openDetail(item.id)}
            >
              <span>{item.id}</span>

              <span>
                <i
                  className={`admin-customer-qna-badge ${
                    item.status === "ANSWERED"
                      ? "answered"
                      : "waiting"
                  }`}
                >
                  {item.status === "ANSWERED"
                    ? "답변완료"
                    : "답변대기"}
                </i>
              </span>

              <span>
                {item.memberNickname || `회원 ${item.memberId}`}
              </span>

              <span>
                {getCategoryLabel(item.category)}
              </span>

              <span className="admin-customer-qna-subject">
                {item.title}
              </span>

              <span>
                {item.orderId || "-"}
              </span>

              <span>
                {formatDateTime(item.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* =========================
          페이징
      ========================= */}
      {totalPages > 1 && (
        <div className="admin-customer-qna-pagination">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => changePage(page - 1)}
          >
            이전
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => (
              <button
                type="button"
                key={index}
                className={page === index ? "active" : ""}
                onClick={() => changePage(index)}
              >
                {index + 1}
              </button>
            )
          )}

          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => changePage(page + 1)}
          >
            다음
          </button>
        </div>
      )}

      {/* =========================
          문의 상세 / 답변 모달
      ========================= */}
      {selected && (
        <div
          className="admin-customer-qna-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetail();
            }
          }}
        >
          <section className="admin-customer-qna-modal">
            <div className="admin-customer-qna-modal-head">
              <div>
                <span>
                  CUSTOMER Q&A #{selected.id}
                </span>
                <h2>{selected.title}</h2>
              </div>

              <button
                type="button"
                onClick={closeDetail}
              >
                ×
              </button>
            </div>

            <dl className="admin-customer-qna-meta">
              <div>
                <dt>회원</dt>
                <dd>
                  {selected.memberNickname || `회원 ${selected.memberId}`}
                </dd>
              </div>

              <div>
                <dt>문의 유형</dt>
                <dd>{getCategoryLabel(selected.category)}</dd>
              </div>

              <div>
                <dt>주문 번호</dt>
                <dd>{selected.orderId || "-"}</dd>
              </div>

              <div>
                <dt>작성일</dt>
                <dd>{formatDateTime(selected.createdAt)}</dd>
              </div>

              <div>
                <dt>상태</dt>
                <dd>
                  {selected.status === "ANSWERED"
                    ? "답변완료"
                    : "답변대기"}
                </dd>
              </div>

              <div>
                <dt>답변일</dt>
                <dd>{formatDateTime(selected.answerDate)}</dd>
              </div>
            </dl>

            <div className="admin-customer-qna-question">
              <strong>문의 내용</strong>
              <p>{selected.content}</p>
            </div>

            <div className="admin-customer-qna-answer-box">
              <label htmlFor="admin-customer-qna-answer">
                관리자 답변
              </label>

              <textarea
                id="admin-customer-qna-answer"
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                placeholder="고객에게 전달할 답변을 입력해주세요."
              />

              {selected.status === "ANSWERED" && (
                <small>
                  기존 답변을 수정한 뒤 다시 저장할 수 있습니다.
                </small>
              )}
            </div>

            <div className="admin-customer-qna-modal-actions">
              <button
                type="button"
                className="cancel"
                onClick={closeDetail}
                disabled={answerSaving}
              >
                닫기
              </button>

              <button
                type="button"
                onClick={saveAnswer}
                disabled={answerSaving}
              >
                {answerSaving
                  ? "저장 중..."
                  : selected.status === "ANSWERED"
                    ? "답변 수정"
                    : "답변 등록"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerQna;
