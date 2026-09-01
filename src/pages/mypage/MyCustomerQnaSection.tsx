import {
  Fragment,
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  axiosInstance
} from "../../components/ToolBak";


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


type CustomerQnaUpdateRequest = {
  memberId: number;
  category: string;
  orderId: number | null;
  title: string;
  content: string;
};


type CustomerQnaAiSummaryResponse = {
  result: string;
};


/**
 * 고객 문의 유형 한글 표시
 */
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


/**
 * 고객 문의 상태 한글 표시
 */
const getStatusLabel = (
  status?: string
) => {
  return status === "ANSWERED"
    ? "답변완료"
    : "답변대기";
};


/**
 * 날짜 표시
 */
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
 * 마이페이지 고객 문의 목록
 */
const MyCustomerQnaSection = ({
  memberId
}: {
  memberId: number;
}) => {
  const navigate = useNavigate();

  const [items, setItems] =
    useState<CustomerQna[]>([]);

  const [page, setPage] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [totalElements, setTotalElements] =
    useState(0);

  const [openedId, setOpenedId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editCategory, setEditCategory] =
    useState("GENERAL");

  const [editOrderId, setEditOrderId] =
    useState("");

  const [editTitle, setEditTitle] =
    useState("");

  const [editContent, setEditContent] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  /**
   * 고객 문의 AI 요약
   */
  const [aiSummary, setAiSummary] =
    useState("");

  const [aiSummaryLoading, setAiSummaryLoading] =
    useState(false);

  const [aiSummaryError, setAiSummaryError] =
    useState("");


  /**
   * 고객 문의 목록 조회
   */
  const loadItems = async (
    targetPage = page
  ) => {
    try {
      setLoading(true);
      setError("");

      const response =
        await axiosInstance.get<CustomerQnaPageResponse>(
          `/customer_qna/member/${memberId}/page`,
          {
            params: {
              page: targetPage,
              size: 5
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
        "고객 문의 조회 오류:",
        requestError
      );

      setError(
        "고객 문의 내역을 불러오는 중 오류가 발생했습니다."
      );

    } finally {
      setLoading(false);
    }
  };


  /**
   * 고객 문의 AI 분석 요약 조회
   */
  const loadAiSummary = async () => {
    try {
      setAiSummaryLoading(true);
      setAiSummaryError("");

      const response =
        await axiosInstance.get<CustomerQnaAiSummaryResponse>(
          `/customer_qna/member/${memberId}/ai_summary`,
          {
            timeout: 120000
          }
        );

      setAiSummary(
        response.data.result || ""
      );

    } catch (requestError) {
      console.error(
        "고객 문의 AI 요약 조회 오류:",
        requestError
      );

      setAiSummaryError(
        "AI 문의 분석을 불러오는 중 오류가 발생했습니다."
      );

    } finally {
      setAiSummaryLoading(false);
    }
  };


  useEffect(() => {
    if (!memberId) {
      return;
    }

    loadItems(0);
    loadAiSummary();

  }, [memberId]);


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

    setOpenedId(null);
    setEditingId(null);

    await loadItems(nextPage);
  };


  /**
   * 문의 상세 열기 / 닫기
   */
  const toggleOpen = (
    id: number
  ) => {
    setOpenedId(
      openedId === id
        ? null
        : id
    );

    if (editingId !== id) {
      setEditingId(null);
    }
  };


  /**
   * 수정 시작
   */
  const startEdit = (
    item: CustomerQna
  ) => {
    if (item.status !== "WAITING") {
      alert(
        "답변이 완료된 문의는 수정할 수 없습니다."
      );
      return;
    }

    setOpenedId(item.id);
    setEditingId(item.id);
    setEditCategory(item.category || "GENERAL");
    setEditOrderId(
      item.orderId
        ? String(item.orderId)
        : ""
    );
    setEditTitle(item.title);
    setEditContent(item.content);
  };


  /**
   * 수정 취소
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory("GENERAL");
    setEditOrderId("");
    setEditTitle("");
    setEditContent("");
  };


  /**
   * 고객 문의 수정
   */
  const updateItem = async (
    item: CustomerQna
  ) => {
    if (!editTitle.trim()) {
      alert("문의 제목을 입력해주세요.");
      return;
    }

    if (!editContent.trim()) {
      alert("문의 내용을 입력해주세요.");
      return;
    }

    let parsedOrderId: number | null = null;

    if (editOrderId.trim() !== "") {
      const value = Number(editOrderId);

      if (!Number.isInteger(value) || value <= 0) {
        alert(
          "관련 주문 번호를 올바르게 입력해주세요."
        );
        return;
      }

      parsedOrderId = value;
    }

    const requestData:
      CustomerQnaUpdateRequest = {
        memberId,
        category: editCategory,
        orderId: parsedOrderId,
        title: editTitle.trim(),
        content: editContent.trim()
      };

    try {
      setSaving(true);

      await axiosInstance.put(
        `/customer_qna/${item.id}`,
        requestData
      );

      alert("고객 문의가 수정되었습니다.");

      cancelEdit();

      await loadItems(page);

      /**
       * 문의 내용이 수정되었으므로
       * AI 분석도 다시 갱신
       */
      await loadAiSummary();

    } catch (requestError: any) {
      console.error(
        "고객 문의 수정 오류:",
        requestError
      );

      alert(
        requestError?.response?.data?.message ||
        "고객 문의 수정 중 오류가 발생했습니다."
      );

    } finally {
      setSaving(false);
    }
  };


  /**
   * 고객 문의 삭제
   */
  const deleteItem = async (
    item: CustomerQna
  ) => {
    if (item.status !== "WAITING") {
      alert(
        "답변이 완료된 문의는 삭제할 수 없습니다."
      );
      return;
    }

    if (
      !window.confirm(
        "이 고객 문의를 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    try {
      await axiosInstance.delete(
        `/customer_qna/${item.id}/member/${memberId}`
      );

      alert("고객 문의가 삭제되었습니다.");

      setOpenedId(null);
      setEditingId(null);

      const nextPage =
        items.length === 1 && page > 0
          ? page - 1
          : page;

      await loadItems(nextPage);

      /**
       * 문의가 삭제되었으므로
       * AI 분석도 다시 갱신
       */
      await loadAiSummary();

    } catch (requestError: any) {
      console.error(
        "고객 문의 삭제 오류:",
        requestError
      );

      alert(
        requestError?.response?.data?.message ||
        "고객 문의 삭제 중 오류가 발생했습니다."
      );
    }
  };


  return (
    <div className="mypage-customer-qna">

      {/* 고객 문의 AI 분석 */}
      <div className="mypage-customer-qna-ai">

        <div className="mypage-customer-qna-ai-title">
          <span>
            AI
          </span>

          <div>
            <strong>
              AI 문의 분석
            </strong>

            <p>
              최근 고객 문의 내역을 분석한 요약입니다.
            </p>
          </div>
        </div>


        <div className="mypage-customer-qna-ai-content">

          {aiSummaryLoading ? (
          <div className="mypage-customer-qna-ai-loading">
            <span className="mypage-customer-qna-ai-spinner"></span>

            <p>
              AI가 고객 문의를 분석하고 있습니다.
            </p>
          </div>

          ) : aiSummaryError ? (
            <p className="error">
              {aiSummaryError}
            </p>

          ) : aiSummary ? (
            <p>
              {aiSummary}
            </p>

          ) : (
            <p>
              분석할 고객 문의 내역이 없습니다.
            </p>
          )}

        </div>
      </div>


      {/* 고객 문의 상단 */}
      <div className="mypage-customer-qna-top">
        <p>
          총 <strong>{totalElements}</strong>건의 고객 문의가 있습니다.
        </p>

        <button
          type="button"
          onClick={() => navigate("/customer_qna")}
        >
          고객 문의하기
        </button>
      </div>

      {loading ? (
        <div className="mypage-customer-qna-message">
          고객 문의를 불러오는 중입니다.
        </div>

      ) : error ? (
        <div className="mypage-customer-qna-message">
          {error}
        </div>

      ) : items.length === 0 ? (
        <div className="mypage-customer-qna-empty">
          아직 등록한 고객 문의가 없습니다.
        </div>

      ) : (
        <>
          <div className="mypage-customer-qna-table-wrap">
            <table className="mypage-customer-qna-table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>문의 유형</th>
                  <th>제목</th>
                  <th>주문 번호</th>
                  <th>작성일</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const opened =
                    openedId === item.id;

                  return (
                    <Fragment key={item.id}>
                      <tr
                        className="mypage-customer-qna-row"
                        onClick={() => toggleOpen(item.id)}
                      >
                        <td>
                          <span
                            className={`mypage-customer-qna-status ${
                              item.status === "ANSWERED"
                                ? "answered"
                                : "waiting"
                            }`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </td>

                        <td>
                          {getCategoryLabel(item.category)}
                        </td>

                        <td className="mypage-customer-qna-title">
                          {item.title}
                        </td>

                        <td>
                          {item.orderId || "-"}
                        </td>

                        <td>
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>

                      {opened && (
                        <tr className="mypage-customer-qna-detail-row">
                          <td colSpan={5}>
                            <div className="mypage-customer-qna-detail">

                              {editingId === item.id ? (
                                <div className="mypage-customer-qna-edit">

                                  <div className="mypage-customer-qna-edit-row">
                                    <label>
                                      문의 유형
                                    </label>

                                    <select
                                      value={editCategory}
                                      onChange={(event) =>
                                        setEditCategory(event.target.value)
                                      }
                                    >
                                      <option value="GENERAL">일반 문의</option>
                                      <option value="ORDER">주문 문의</option>
                                      <option value="DELIVERY">배송 문의</option>
                                      <option value="CANCEL">주문 취소 문의</option>
                                      <option value="RETURN">반품 문의</option>
                                      <option value="EXCHANGE">교환 문의</option>
                                      <option value="PAYMENT">결제 문의</option>
                                      <option value="ETC">기타 문의</option>
                                    </select>
                                  </div>

                                  <div className="mypage-customer-qna-edit-row">
                                    <label>
                                      관련 주문 번호
                                    </label>

                                    <input
                                      type="number"
                                      min="1"
                                      value={editOrderId}
                                      onChange={(event) =>
                                        setEditOrderId(event.target.value)
                                      }
                                      placeholder="선택 입력"
                                    />
                                  </div>

                                  <div className="mypage-customer-qna-edit-row">
                                    <label>
                                      제목
                                    </label>

                                    <input
                                      type="text"
                                      maxLength={255}
                                      value={editTitle}
                                      onChange={(event) =>
                                        setEditTitle(event.target.value)
                                      }
                                    />
                                  </div>

                                  <div className="mypage-customer-qna-edit-row content">
                                    <label>
                                      내용
                                    </label>

                                    <textarea
                                      value={editContent}
                                      onChange={(event) =>
                                        setEditContent(event.target.value)
                                      }
                                    />
                                  </div>

                                  <div className="mypage-customer-qna-edit-actions">
                                    <button
                                      type="button"
                                      onClick={() => updateItem(item)}
                                      disabled={saving}
                                    >
                                      {saving ? "수정 중..." : "수정 완료"}
                                    </button>

                                    <button
                                      type="button"
                                      className="cancel"
                                      onClick={cancelEdit}
                                      disabled={saving}
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>

                              ) : (
                                <>
                                  <div className="mypage-customer-qna-question">
                                    <strong>
                                      Q.
                                    </strong>

                                    <p>
                                      {item.content}
                                    </p>
                                  </div>

                                  <div
                                    className={`mypage-customer-qna-answer ${
                                      item.status === "ANSWERED"
                                        ? "answered"
                                        : "waiting"
                                    }`}
                                  >
                                    <strong>
                                      A.
                                    </strong>

                                    {item.status === "ANSWERED" && item.answer ? (
                                      <div>
                                        <p>
                                          {item.answer}
                                        </p>

                                        <span>
                                          답변일 {formatDateTime(item.answerDate)}
                                        </span>
                                      </div>
                                    ) : (
                                      <p>
                                        관리자 답변을 기다리고 있습니다.
                                      </p>
                                    )}
                                  </div>

                                  {item.status === "WAITING" && (
                                    <div className="mypage-customer-qna-actions">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          startEdit(item);
                                        }}
                                      >
                                        수정
                                      </button>

                                      <button
                                        type="button"
                                        className="delete"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          deleteItem(item);
                                        }}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}

                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mypage-customer-qna-pagination">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
              >
                ‹
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => (
                  <button
                    type="button"
                    key={index}
                    className={
                      page === index
                        ? "active"
                        : ""
                    }
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
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyCustomerQnaSection;