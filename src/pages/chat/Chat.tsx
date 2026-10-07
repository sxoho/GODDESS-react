import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  axiosInstance
} from "../../components/ToolBak";

import {
  useGlobalStore
} from "../../store/store";

import "../../styles/chat/Chat.css";

import chatProfile from "../../assets/logo/chat-profile.png";


/* =========================================
   TYPE
========================================= */

type ChatRoom = {
  id: number;
  memberId: number;
  memberNickname?: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  closedAt?: string | null;
};


type ChatbotAction = {
  type: string;
  label: string;
  path: string;
};


type ChatMessage = {
  id: number;
  chatRoomId: number;
  senderType: "USER" | "BOT";
  message: string;
  createdAt?: string | null;
  action?: ChatbotAction | null;
};


type ChatbotAskResponse = {
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  action?: ChatbotAction | null;
};


/* =========================================
   빠른 질문
========================================= */

const QUICK_QUESTIONS = [
  "봄웜 특징 알려줘",
  "여름쿨에게 어울리는 립 추천해줘",
  "내 피부 타입에 맞는 관리법 알려줘",
  "퍼스널컬러 진단하러 가고 싶어",
  "AI BEAUTY 체험하러 가고 싶어",
  "Premium 이용권 알려줘"
];


/* =========================================
   과거 메시지 ACTION 복원
========================================= */

const getHistoryAction = (
  userMessage: string
): ChatbotAction | null => {

  const text =
    userMessage
      .trim()
      .toLowerCase();


  /* 퍼스널컬러 자가진단 */
  if (
    (
      text.includes("퍼스널컬러") ||
      text.includes("퍼스널 컬러")
    ) &&
    (
      text.includes("진단") ||
      text.includes("가고") ||
      text.includes("어디") ||
      text.includes("이동") ||
      text.includes("바로가기")
    )
  ) {

    return {
      type: "NAVIGATE",
      label: "퍼스널컬러 자가진단 하러 가기",
      path: "/personal-color-diagnosis"
    };
  }


  /* 피부 타입 진단 */
  if (
    text.includes("피부") &&
    (
      text.includes("진단") ||
      text.includes("테스트") ||
      text.includes("체크")
    )
  ) {

    return {
      type: "NAVIGATE",
      label: "피부 타입 진단하러 가기",
      path: "/diagnosis?type=skin"
    };
  }


  /* MY PHOTO */
  if (
    (
      text.includes("사진") ||
      text.includes("my photo")
    ) &&
    (
      text.includes("ai beauty") ||
      text.includes("ai 뷰티") ||
      text.includes("등록") ||
      text.includes("변경")
    )
  ) {

    return {
      type: "NAVIGATE",
      label: "내 사진 관리하러 가기",
      path: "/beauty?view=photo"
    };
  }


  /* 이용 내역 */
  if (
    text.includes("이용 내역") ||
    text.includes("히스토리") ||
    text.includes("history") ||
    text.includes("저장한 결과")
  ) {

    return {
      type: "NAVIGATE",
      label: "AI BEAUTY 이용 내역 보기",
      path: "/beauty?view=saved"
    };
  }


  /* Premium */
  if (
    text.includes("premium") ||
    text.includes("프리미엄") ||
    text.includes("구독") ||
    text.includes("이용권")
  ) {

    return {
      type: "NAVIGATE",
      label: "Premium 이용권 보러가기",
      path: "/beauty?view=membership"
    };
  }


  /* AI BEAUTY */
  if (
    text.includes("ai beauty") ||
    text.includes("ai 뷰티") ||
    text.includes("가상 체험") ||
    text.includes("메이크업 체험") ||
    text.includes("헤어 체험")
  ) {

    return {
      type: "NAVIGATE",
      label: "AI BEAUTY 바로가기",
      path: "/beauty"
    };
  }


  return null;
};


/* =========================================
   COMPONENT
========================================= */

const Chat = () => {

  const navigate =
    useNavigate();


  const {
    sw,
    memberId
  } = useGlobalStore();


  const [
    room,
    setRoom
  ] = useState<ChatRoom | null>(
    null
  );


  const [
    messages,
    setMessages
  ] = useState<ChatMessage[]>(
    []
  );


  const [
    input,
    setInput
  ] = useState(
    ""
  );


  const [
    loading,
    setLoading
  ] = useState(
    true
  );


  const [
    sending,
    setSending
  ] = useState(
    false
  );


  const [
    roomResetting,
    setRoomResetting
  ] = useState(
    false
  );


  const [
    error,
    setError
  ] = useState(
    ""
  );


  const initRequestId =
    useRef(
      0
    );


  const messageEndRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );


  /* =========================================
     시간 표시
  ========================================= */

  const formatTime = (
    value?: string | null
  ) => {

    if (!value) {

      return "";
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "";
    }


    return date.toLocaleTimeString(
      "ko-KR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  };


  /* =========================================
     스크롤
  ========================================= */

  const scrollToBottom =
    () => {

      window.setTimeout(
        () => {

          messageEndRef
            .current
            ?.scrollIntoView({
              behavior: "smooth",
              block: "end"
            });

        },
        50
      );
    };


  useEffect(
    () => {

      scrollToBottom();

    },
    [
      messages,
      sending
    ]
  );


  /* =========================================
     기존 메시지 조회
  ========================================= */

  const loadMessages =
    async (
      roomId: number,
      currentMemberId: number
    ) => {

      const response =
        await axiosInstance.get<ChatMessage[]>(

          `/api/chat/rooms/${roomId}/messages`,

          {
            params: {
              memberId:
                currentMemberId
            }
          }
        );


      const history =
        response.data ?? [];


      const restoredMessages =
        history.map(
          (
            message,
            index
          ) => {

            if (
              message.senderType !==
              "BOT"
            ) {

              return message;
            }


            let userQuestion =
              "";


            for (
              let i =
                index - 1;

              i >= 0;

              i--
            ) {

              if (
                history[i].senderType ===
                "USER"
              ) {

                userQuestion =
                  history[i].message;

                break;
              }
            }


            return {

              ...message,

              action:
                getHistoryAction(
                  userQuestion
                )
            };
          }
        );


      setMessages(
        restoredMessages
      );
    };


  /* =========================================
     채팅방 생성 / 조회
  ========================================= */

  const initializeChat =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        setLoading(
          false
        );

        return;
      }


      const requestId =
        initRequestId.current + 1;


      initRequestId.current =
        requestId;


      try {

        setLoading(
          true
        );

        setError(
          ""
        );


        const roomResponse =
          await axiosInstance.post<ChatRoom>(

            "/api/chat/rooms",

            null,

            {
              params: {
                memberId
              }
            }
          );


        if (
          requestId !==
          initRequestId.current
        ) {

          return;
        }


        const chatRoom =
          roomResponse.data;


        setRoom(
          chatRoom
        );


        await loadMessages(
          chatRoom.id,
          memberId
        );


      } catch (error) {

        console.error(
          "챗봇 초기화 오류:",
          error
        );


        if (
          requestId ===
          initRequestId.current
        ) {

          setError(
            "챗봇을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
          );
        }


      } finally {

        if (
          requestId ===
          initRequestId.current
        ) {

          setLoading(
            false
          );
        }
      }
    };


  useEffect(
    () => {

      void initializeChat();

    },
    [
      sw,
      memberId
    ]
  );


  /* =========================================
     질문 전송
  ========================================= */

  const sendMessage =
    async (
      customMessage?: string
    ) => {

      if (
        sw !== true ||
        !memberId
      ) {

        alert(
          "로그인 후 AI 뷰티 상담을 이용할 수 있습니다."
        );


        navigate(
          "/login"
        );


        return;
      }


      if (
        !room
      ) {

        setError(
          "채팅방 정보를 찾을 수 없습니다."
        );

        return;
      }


      const message =
        (
          customMessage ??
          input
        )
          .trim();


      if (
        !message
      ) {

        return;
      }


      if (
        sending
      ) {

        return;
      }


      if (
        message.length >
        2000
      ) {

        alert(
          "질문은 2000자 이내로 입력해주세요."
        );

        return;
      }


      /*
       * 서버 응답 전
       * 화면에 바로 표시할 임시 USER 메시지
       */
      const temporaryMessageId =
        -Date.now();


      const temporaryUserMessage:
        ChatMessage = {

          id:
            temporaryMessageId,

          chatRoomId:
            room.id,

          senderType:
            "USER",

          message,

          createdAt:
            new Date()
              .toISOString()
        };


      /*
       * 사용자가 질문을 보내면
       * 서버 응답을 기다리지 않고
       * 즉시 오른쪽 말풍선 표시
       */
      setMessages(
        (
          previous
        ) => [

          ...previous,

          temporaryUserMessage
        ]
      );


      /*
       * 입력창 바로 비우기
       */
      setInput(
        ""
      );


      try {

        /*
         * AI 작성 중 표시
         */
        setSending(
          true
        );

        setError(
          ""
        );


        const response =
          await axiosInstance.post<ChatbotAskResponse>(

            `/api/chat/rooms/${room.id}/ask`,

            {
              message
            },

            {
              params: {
                memberId
              },

              timeout:
                180000
            }
          );


        const data =
          response.data;


        const botMessage:
          ChatMessage = {

          ...data.botMessage,

          action:
            data.action ??
            null
        };


        /*
         * 임시 USER 메시지를
         * DB에 저장된 실제 USER 메시지로 교체
         *
         * 그 뒤 BOT 메시지 추가
         */
        setMessages(
          (
            previous
          ) => {

            const replacedMessages =
              previous.map(
                (
                  item
                ) => {

                  if (
                    item.id ===
                    temporaryMessageId
                  ) {

                    return data.userMessage;
                  }


                  return item;
                }
              );


            return [

              ...replacedMessages,

              botMessage
            ];
          }
        );


      } catch (error) {

        console.error(
          "AI 챗봇 질문 오류:",
          error
        );


        /*
         * 실패한 임시 메시지 제거
         */
        setMessages(
          (
            previous
          ) =>
            previous.filter(
              (
                item
              ) =>
                item.id !==
                temporaryMessageId
            )
        );


        /*
         * 실패한 질문 다시 입력창에 표시
         */
        setInput(
          message
        );


        setError(
          "AI 답변을 받아오지 못했습니다. 잠시 후 다시 질문해주세요."
        );


      } finally {

        setSending(
          false
        );


        window.setTimeout(
          () => {

            textareaRef
              .current
              ?.focus();

          },
          50
        );
      }
    };


  /* =========================================
     ENTER
  ========================================= */

  const handleKeyDown =
    (
      event:
        React.KeyboardEvent<HTMLTextAreaElement>
    ) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();


        void sendMessage();
      }
    };


  /* =========================================
     바로가기
  ========================================= */

  const handleAction =
    (
      action:
        ChatbotAction
    ) => {

      if (
        action.type !==
        "NAVIGATE"
      ) {

        return;
      }


      if (
        !action.path
      ) {

        return;
      }


      navigate(
        action.path
      );
    };


  /* =========================================
     새 대화
  ========================================= */

  const handleNewChat =
    async () => {

      if (
        !room ||
        !memberId
      ) {

        return;
      }


      const confirmed =
        window.confirm(
          "현재 대화를 종료하고 새 대화를 시작할까요?"
        );


      if (
        !confirmed
      ) {

        return;
      }


      try {

        setRoomResetting(
          true
        );

        setError(
          ""
        );


        await axiosInstance.patch(

          `/api/chat/rooms/${room.id}/close`,

          null,

          {
            params: {
              memberId
            }
          }
        );


        const response =
          await axiosInstance.post<ChatRoom>(

            "/api/chat/rooms",

            null,

            {
              params: {
                memberId
              }
            }
          );


        setRoom(
          response.data
        );


        setMessages(
          []
        );


        setInput(
          ""
        );


      } catch (error) {

        console.error(
          "새 대화 생성 오류:",
          error
        );


        setError(
          "새 대화를 시작하지 못했습니다."
        );


      } finally {

        setRoomResetting(
          false
        );
      }
    };


  /* =========================================
     로그인 전
  ========================================= */

  if (
    sw !== true ||
    !memberId
  ) {

    return (

      <main className="gd-chat-page">

        <section className="gd-chat-login">

          <div className="gd-chat-login-mark">

            <img
              src={chatProfile}
              alt="여신강림 AI"
            />

          </div>

          <h1>
            AI 뷰티 챗봇
          </h1>


          <p className="gd-chat-login-description">

            여신강림을 사용하면서 모르는 것과 
            궁금한 것들을
            자유롭게 물어보세요.

          </p>


          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/login"
                )
            }
          >
            로그인하고 상담하기
          </button>

        </section>

      </main>
    );
  }


  /* =========================================
     로딩
  ========================================= */

  if (
    loading
  ) {

    return (

      <main className="gd-chat-page">

        <div className="gd-chat-page-loading">

          <span />


          <p>
            여신강림 AI 상담을 준비하고 있어요.
          </p>

        </div>

      </main>
    );
  }


  /* =========================================
     MAIN
  ========================================= */

  return (

    <main className="gd-chat-page">

      <section className="gd-chat-shell">


        {/* =====================================
            HEADER
        ===================================== */}

        <header className="gd-chat-header">

          <div className="gd-chat-header-left">

            <div className="gd-chat-avatar">

              <img
                src={chatProfile}
                alt="여신강림 AI"
              />

            </div>


            <div>

              <h1>
                무엇이든 물어보세요 ! 
              </h1>


              <div className="gd-chat-status">

                <span />

                AI 상담 가능

              </div>

            </div>

          </div>


          <button
            type="button"
            className="gd-chat-new-button"
            onClick={
              handleNewChat
            }
            disabled={
              roomResetting ||
              sending
            }
          >

            {
              roomResetting
                ? "준비 중..."
                : "새 대화"
            }

          </button>

        </header>


        {/* =====================================
            소개
        ===================================== */}

        <div className="gd-chat-intro">

          <p className="gd-chat-intro-title">
            무엇을 도와드릴까요?
          </p>


          <p>
            K-뷰티와 여신강림 서비스를
            AI에게 편하게 물어보세요.
          </p>

        </div>


        {/* =====================================
            빠른 질문
        ===================================== */}

        <div className="gd-chat-quick">

          {
            QUICK_QUESTIONS.map(
              (
                question
              ) => (

                <button
                  key={
                    question
                  }
                  type="button"
                  onClick={
                    () =>
                      void sendMessage(
                        question
                      )
                  }
                  disabled={
                    sending ||
                    !room
                  }
                >

                  {
                    question
                  }

                </button>
              )
            )
          }

        </div>


        {/* =====================================
            메시지
        ===================================== */}

        <div className="gd-chat-messages">

          {
            messages.length === 0 &&
            !sending
              ? (

                <div className="gd-chat-empty">

                  <div className="gd-chat-empty-icon">

                    <img
                      src={chatProfile}
                      alt="여신강림 AI"
                    />

                  </div>


                  <strong>
                    여신강림 AI에게 물어보세요
                  </strong>


                  <p>

                    퍼스널컬러부터 피부 관리,
                    메이크업과 헤어 추천,
                    AI BEAUTY 이용 방법까지
                    도와드릴게요.

                  </p>

                </div>

              )
              : (

                messages.map(
                  (
                    message
                  ) => {

                    const isUser =
                      message.senderType ===
                      "USER";


                    return (

                      <div
                        key={
                          message.id
                        }
                        className={
                          `gd-chat-message-row ${
                            isUser
                              ? "user"
                              : "bot"
                          }`
                        }
                      >


                        <div className="gd-chat-message-wrap">

                          {
                            !isUser &&
                            (
                              <span className="gd-chat-message-name">
                                도우미 ' 여강이 '
                              </span>
                            )
                          }


                          <div className="gd-chat-bubble">

                            {
                              message.message
                            }

                          </div>


                          {
                            message.action &&
                            message.action.type ===
                              "NAVIGATE" &&
                            (
                              <button
                                type="button"
                                className="gd-chat-action-button"
                                onClick={
                                  () =>
                                    handleAction(
                                      message.action!
                                    )
                                }
                              >

                                {
                                  message
                                    .action
                                    .label
                                }


                                <span>
                                  →
                                </span>

                              </button>
                            )
                          }


                          <span className="gd-chat-message-time">

                            {
                              formatTime(
                                message.createdAt
                              )
                            }

                          </span>

                        </div>

                      </div>
                    );
                  }
                )
              )
          }


          {/* =====================================
              AI 작성 중
          ===================================== */}

          {
            sending &&
            (
              <div className="gd-chat-message-row bot">

                <div className="gd-chat-message-avatar">

                  <img
                    src={chatProfile}
                    alt="여신강림 AI"
                  />

                </div>


                <div className="gd-chat-message-wrap">

                  <span className="gd-chat-message-name">
                    여신강림 AI
                  </span>


                  <div className="gd-chat-bubble gd-chat-thinking">

                    <span />
                    <span />
                    <span />

                  </div>

                </div>

              </div>
            )
          }


          <div
            ref={
              messageEndRef
            }
          />

        </div>


        {/* =====================================
            오류
        ===================================== */}

        {
          error &&
          (
            <div className="gd-chat-error">

              <span>
                {
                  error
                }
              </span>


              <button
                type="button"
                onClick={
                  () =>
                    setError(
                      ""
                    )
                }
              >
                ×
              </button>

            </div>
          )
        }


        {/* =====================================
            입력
        ===================================== */}

        <div className="gd-chat-input-area">

          <div className="gd-chat-input-box">

            <textarea
              ref={
                textareaRef
              }
              value={
                input
              }
              onChange={
                (
                  event
                ) =>
                  setInput(
                    event.target.value
                  )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="궁금한 뷰티 고민을 입력해주세요."
              maxLength={
                2000
              }
              rows={
                1
              }
              disabled={
                sending ||
                !room
              }
            />


            <button
              type="button"
              className="gd-chat-send-button"
              onClick={
                () =>
                  void sendMessage()
              }
              disabled={
                sending ||
                !input.trim() ||
                !room
              }
              aria-label="메시지 보내기"
            >
              ↑
            </button>

          </div>


          <div className="gd-chat-input-bottom">

            <span>
              Enter 전송 · Shift + Enter 줄바꿈
            </span>


            <span>
              {
                input.length
              }
              /2000
            </span>

          </div>

        </div>

      </section>

    </main>
  );
};


export default Chat;