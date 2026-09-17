import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import { axiosInstance } from "../../../components/ToolBak";
import "../../../styles/admin/AdminMail.css";

type TranslateResult = {
  title: string;
  content: string;
};

type TranslateResponse = {
  result: TranslateResult;
};

const LANGUAGE_OPTIONS = [
  { value: "영어", label: "English · 영어" },
  { value: "일본어", label: "日本語 · 일본어" },
  { value: "중국어", label: "中文 · 중국어" },
  { value: "프랑스어", label: "Français · 프랑스어" },
  { value: "독일어", label: "Deutsch · 독일어" },
  { value: "스페인어", label: "Español · 스페인어" },
];

type AdminMailLocationState = {
  returnMail?: {
    to?: string;
    title?: string;
    content?: string;
  };
};

const AdminMail = () => {
  const location = useLocation();
  const [to, setTo] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("영어");
  const [translated, setTranslated] = useState<TranslateResult | null>(null);
  const [translating, setTranslating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const state = location.state as AdminMailLocationState | null;
    const returnMail = state?.returnMail;

    if (!returnMail) {
      return;
    }

    setTo(returnMail.to ?? "");
    setTitle(returnMail.title ?? "");
    setContent(returnMail.content ?? "");
    setTranslated(null);
  }, [location.key, location.state]);

  const canTranslate = useMemo(
    () => title.trim().length > 0 && content.trim().length > 0,
    [title, content],
  );

  const canSend = useMemo(
    () => to.trim().length > 0 && canTranslate,
    [to, canTranslate],
  );

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | { error?: string; message?: string; detail?: string }
        | undefined;

      return data?.error || data?.message || data?.detail || fallback;
    }

    return error instanceof Error ? error.message : fallback;
  };

  const handleTranslate = async () => {
    if (!canTranslate) {
      alert("메일 제목과 내용을 먼저 입력해주세요.");
      return;
    }

    try {
      setTranslating(true);
      setTranslated(null);

      const response = await axiosInstance.post<TranslateResponse>(
        "/api/mail/translate",
        {
          title: title.trim(),
          content: content.trim(),
          language,
        },
        {
          timeout: 120000,
        },
      );

      setTranslated(response.data.result);
    } catch (error) {
      console.error("메일 AI 번역 오류", error);
      alert(getErrorMessage(error, "메일 번역 중 오류가 발생했습니다."));
    } finally {
      setTranslating(false);
    }
  };

  const handleApplyTranslation = () => {
    if (!translated) {
      return;
    }

    setTitle(translated.title);
    setContent(translated.content);
    setTranslated(null);
  };

  const handleSend = async (useTranslated: boolean) => {
    if (!canSend) {
      alert("받는 사람, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    const sendTitle = useTranslated && translated ? translated.title : title.trim();
    const sendContent = useTranslated && translated ? translated.content : content.trim();

    const confirmed = window.confirm(
      `${to.trim()} 주소로 메일을 발송하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSending(true);

      await axiosInstance.post("/api/mail/send", {
        to: to.trim(),
        title: sendTitle,
        content: sendContent.replace(/\n/g, "<br />"),
      });

      alert("메일이 정상적으로 발송되었습니다.");
    } catch (error) {
      console.error("메일 발송 오류", error);
      alert(getErrorMessage(error, "메일 발송 중 오류가 발생했습니다."));
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    if (
      (to || title || content || translated) &&
      !window.confirm("작성 중인 내용을 모두 초기화하시겠습니까?")
    ) {
      return;
    }

    setTo("");
    setTitle("");
    setContent("");
    setLanguage("영어");
    setTranslated(null);
  };

  return (
    <main className="admin-mail-page">
      <div className="admin-mail-heading">
        <div>
          <p>MAIL MANAGEMENT</p>
          <h1>다국어 메일 발송</h1>
          <span>
            GODDESS 고객에게 안내 메일을 작성하고 AI 번역 후 실제 이메일로 발송합니다.
          </span>
        </div>

        <button type="button" className="admin-mail-reset" onClick={handleReset}>
          작성 초기화
        </button>
      </div>

      <div className="admin-mail-grid">
        <section className="admin-mail-card admin-mail-compose">
          <div className="admin-mail-card-title">
            <span>01</span>
            <div>
              <h2>메일 작성</h2>
              <p>받는 사람과 발송할 내용을 입력해주세요.</p>
            </div>
          </div>

          <div className="admin-mail-field">
            <label htmlFor="admin-mail-to">받는 사람</label>
            <input
              id="admin-mail-to"
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="customer@example.com"
            />
          </div>

          <div className="admin-mail-field">
            <label htmlFor="admin-mail-title">제목</label>
            <input
              id="admin-mail-title"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setTranslated(null);
              }}
              placeholder="예: GODDESS 가을 프로모션 안내"
              maxLength={200}
            />
          </div>

          <div className="admin-mail-field">
            <div className="admin-mail-label-row">
              <label htmlFor="admin-mail-content">내용</label>
              <small>{content.length.toLocaleString()}자</small>
            </div>
            <textarea
              id="admin-mail-content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setTranslated(null);
              }}
              placeholder="고객에게 전달할 내용을 입력해주세요."
              rows={13}
            />
          </div>

          <div className="admin-mail-actions">
            <button
              type="button"
              className="admin-mail-send-button secondary"
              disabled={!canSend || sending}
              onClick={() => handleSend(false)}
            >
              {sending ? "발송 중..." : "원문으로 메일 발송"}
            </button>
          </div>
        </section>

        <section className="admin-mail-card admin-mail-ai">
          <div className="admin-mail-card-title">
            <span>02</span>
            <div>
              <h2>AI 번역</h2>
              <p>H200의 Gemma 모델이 제목과 본문을 함께 번역합니다.</p>
            </div>
          </div>

          <div className="admin-mail-translate-control">
            <div className="admin-mail-field">
              <label htmlFor="admin-mail-language">번역 언어</label>
              <select
                id="admin-mail-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="admin-mail-translate-button"
              disabled={!canTranslate || translating}
              onClick={handleTranslate}
            >
              {translating ? (
                <>
                  <span
                    className="admin-mail-button-spinner"
                    aria-hidden="true"
                  />
                  AI 번역 중...
                </>
              ) : (
                <>
                  <span aria-hidden="true">✦</span>
                  AI 번역하기
                </>
              )}
            </button>
          </div>

          <div
            className={`admin-mail-preview ${
              translated ? "has-result" : ""
            } ${translating ? "is-loading" : ""}`}
            aria-busy={translating}
          >
            {translating ? (
              <div className="admin-mail-translation-loading">
                <div
                  className="admin-mail-loading-orbit"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </div>

                <strong>AI가 메일을 번역하고 있어요</strong>
                <p>
                  H200의 Gemma 모델이 제목과 본문을 분석하고 있습니다.
                  잠시만 기다려주세요.
                </p>

                <div
                  className="admin-mail-loading-dots"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : translated ? (
              <>
                <div className="admin-mail-preview-head">
                  <div>
                    <small>TRANSLATED MAIL</small>
                    <strong>{language} 번역 결과</strong>
                  </div>
                  <span>AI</span>
                </div>

                <div className="admin-mail-preview-section">
                  <small>SUBJECT</small>
                  <h3>{translated.title}</h3>
                </div>

                <div className="admin-mail-preview-section content">
                  <small>MESSAGE</small>
                  <p>{translated.content}</p>
                </div>

                <div className="admin-mail-preview-actions">
                  <button
                    type="button"
                    className="admin-mail-apply-button"
                    onClick={handleApplyTranslation}
                  >
                    작성란에 적용
                  </button>
                  <button
                    type="button"
                    className="admin-mail-send-button"
                    disabled={!to.trim() || sending}
                    onClick={() => handleSend(true)}
                  >
                    {sending ? "발송 중..." : "번역 내용으로 발송"}
                  </button>
                </div>
              </>
            ) : (
              <div className="admin-mail-preview-empty">
                <span>✦</span>
                <strong>번역 결과가 여기에 표시됩니다.</strong>
                <p>
                  왼쪽에서 제목과 내용을 작성한 뒤 번역 언어를 선택하고 AI 번역을 실행해주세요.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-mail-guide">
        <span>G</span>
        <div>
          <small>GODDESS MAIL GUIDE</small>
          <strong>이벤트 · 신상품 · 주문/배송 안내 등에 활용할 수 있어요.</strong>
          <p>
            번역 결과를 확인한 후 발송하면 해외 고객에게도 동일한 운영 메일을 전달할 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
};

export default AdminMail;
