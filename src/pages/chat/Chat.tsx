import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  axiosInstance,
} from "../../components/ToolBak";

import {
  useGlobalStore,
} from "../../store/store";

import ChatLoadingShowcase from "./ChatLoadingShowcase";

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


type ChatbotRecommendedProduct = {
  productId: number;
  productColorId: number;

  productName: string;

  brand?: string | null;

  price: number;

  discount?: number | null;

  colorName?: string | null;

  colorCode?: string | null;

  imageUrl?: string | null;
};


type ChatMessage = {
  id: number;

  chatRoomId: number;

  senderType:
    | "USER"
    | "BOT";

  message: string;

  createdAt?: string | null;

  action?: ChatbotAction | null;

  recommendedProducts?:
    ChatbotRecommendedProduct[];
};


type ChatbotAskResponse = {
  userMessage: ChatMessage;

  botMessage: ChatMessage;

  action?: ChatbotAction | null;

  recommendedProducts?:
    ChatbotRecommendedProduct[];
};


type StoredProductRecommendations = {
  [botMessageId: string]:
    ChatbotRecommendedProduct[];
};


/* =========================================
   Spring
========================================= */

const SPRING_BASE_URL =
  "http://localhost:9104";


/* =========================================
   상품 이미지
========================================= */

const getProductImageUrl = (
  imageUrl?: string | null
) => {

  if (!imageUrl) {

    return "";
  }


  const normalized =
    imageUrl.replace(
      /\\/g,
      "/"
    );


  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {

    return normalized;
  }


  if (
    normalized.startsWith("/")
  ) {

    return (
      SPRING_BASE_URL +
      normalized
    );
  }


  return (
    `${SPRING_BASE_URL}/${normalized}`
  );
};


/* =========================================
   추천상품 sessionStorage
========================================= */

const getRecommendationStorageKey = (
  roomId: number
) => {

  return (
    `goddess_chat_recommendations_${roomId}`
  );
};


const getStoredRecommendations = (
  roomId: number
): StoredProductRecommendations => {

  try {

    const storageKey =
      getRecommendationStorageKey(
        roomId
      );


    const saved =
      sessionStorage.getItem(
        storageKey
      );


    if (!saved) {

      return {};
    }


    const parsed =
      JSON.parse(
        saved
      );


    if (
      !parsed ||
      typeof parsed !== "object"
    ) {

      return {};
    }


    return (
      parsed as StoredProductRecommendations
    );


  } catch (error) {

    console.error(
      "챗봇 추천상품 저장정보 조회 오류:",
      error
    );


    return {};
  }
};


const saveStoredRecommendation = (
  roomId: number,
  botMessageId: number,
  products: ChatbotRecommendedProduct[]
) => {

  try {

    if (
      !products ||
      products.length === 0
    ) {

      return;
    }


    const storageKey =
      getRecommendationStorageKey(
        roomId
      );


    const current =
      getStoredRecommendations(
        roomId
      );


    const updated:
      StoredProductRecommendations = {

        ...current,

        [String(botMessageId)]:
          products,
      };


    sessionStorage.setItem(
      storageKey,
      JSON.stringify(
        updated
      )
    );


  } catch (error) {

    console.error(
      "챗봇 추천상품 저장 오류:",
      error
    );
  }
};


/* =========================================
   챗봇
========================================= */

const CHATBOT_NAME =
  "여신강림 도우미 챗봇";


const QUICK_QUESTIONS = [
  "봄웜 특징 알려줘",
  "여름쿨에게 어울리는 립 추천해줘",
  "내 피부 타입에 맞는 관리법 알려줘",
  "퍼스널컬러 진단하러 가고 싶어",
  "AI BEAUTY 체험하러 가고 싶어",
  "Premium 이용권 알려줘",
];


const LOADING_MESSAGES = [
  "답변을 준비 중입니다.",
  "보내주신 질문을 확인하고 있어요. 조금만 기다려주세요!",
  "어울리는 답변을 준비하고 있습니다.",
  "여신강림 도우미가 생각 중입니다...",
  "조금만 기다려주세요. 곧 답변해드릴게요!",
];


/* =========================================
   오늘 날짜
========================================= */

const getTodayDateKey =
  () => {

    const today =
      new Date();


    const year =
      today.getFullYear();


    const month =
      String(
        today.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const day =
      String(
        today.getDate()
      ).padStart(
        2,
        "0"
      );


    return (
      `${year}-${month}-${day}`
    );
  };


const isTodayChatRoom = (
  createdAt?: string | null
) => {

  if (!createdAt) {

    return false;
  }


  return (
    createdAt.substring(0, 10) ===
    getTodayDateKey()
  );
};


/* =========================================
   과거 ACTION 복원
========================================= */

const getHistoryAction = (
  userMessage: string
): ChatbotAction | null => {

  const text =
    userMessage
      .trim()
      .toLowerCase();


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
      path: "/personal-color-diagnosis",
    };
  }


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
      path: "/diagnosis?type=skin",
    };
  }


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
      path: "/beauty?view=photo",
    };
  }


  if (
    text.includes("이용 내역") ||
    text.includes("히스토리") ||
    text.includes("history") ||
    text.includes("저장한 결과")
  ) {

    return {
      type: "NAVIGATE",
      label: "AI BEAUTY 이용 내역 보기",
      path: "/beauty?view=saved",
    };
  }


  if (
    text.includes("premium") ||
    text.includes("프리미엄") ||
    text.includes("구독") ||
    text.includes("이용권")
  ) {

    return {
      type: "NAVIGATE",
      label: "Premium 이용권 보러가기",
      path: "/beauty?view=membership",
    };
  }


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
      path: "/beauty",
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
    memberId,
  } = useGlobalStore();


  const [
    room,
    setRoom,
  ] = useState<ChatRoom | null>(
    null
  );


  const [
    messages,
    setMessages,
  ] = useState<ChatMessage[]>(
    []
  );


  const [
    input,
    setInput,
  ] = useState(
    ""
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true
  );


  const [
    sending,
    setSending,
  ] = useState(
    false
  );


  const [
    roomResetting,
    setRoomResetting,
  ] = useState(
    false
  );


  const [
    error,
    setError,
  ] = useState(
    ""
  );


  const [
    loadingMessageIndex,
    setLoadingMessageIndex,
  ] = useState(
    0
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
     시간
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
        minute: "2-digit",
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
              block: "end",
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
      sending,
      loadingMessageIndex,
    ]
  );


  /* =========================================
     기존 로딩 문구
  ========================================= */

  useEffect(
    () => {

      if (!sending) {

        setLoadingMessageIndex(
          0
        );

        return;
      }


      const timer =
        window.setInterval(
          () => {

            setLoadingMessageIndex(
              (
                previous
              ) =>
                (
                  previous + 1
                ) %
                LOADING_MESSAGES.length
            );

          },
          3000
        );


      return () => {

        window.clearInterval(
          timer
        );
      };

    },
    [
      sending,
    ]
  );


  /* =========================================
     메시지 조회
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
                currentMemberId,
            },
          }
        );


      const history =
        response.data ??
        [];


      const storedRecommendations =
        getStoredRecommendations(
          roomId
        );


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
              let i = index - 1;
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


            const storedProducts =
              storedRecommendations[
                String(
                  message.id
                )
              ] ??
              [];


            return {
              ...message,

              action:
                getHistoryAction(
                  userQuestion
                ),

              recommendedProducts:
                storedProducts,
            };
          }
        );


      setMessages(
        restoredMessages
      );
    };


  /* =========================================
     초기화
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
                memberId,
              },
            }
          );


        if (
          requestId !==
          initRequestId.current
        ) {

          return;
        }


        let chatRoom =
          roomResponse.data;


        if (
          !isTodayChatRoom(
            chatRoom.createdAt
          )
        ) {

          await axiosInstance.patch(

            `/api/chat/rooms/${chatRoom.id}/close`,

            null,

            {
              params: {
                memberId,
              },
            }
          );


          const newRoomResponse =
            await axiosInstance.post<ChatRoom>(

              "/api/chat/rooms",

              null,

              {
                params: {
                  memberId,
                },
              }
            );


          chatRoom =
            newRoomResponse.data;
        }


        if (
          requestId !==
          initRequestId.current
        ) {

          return;
        }


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
      memberId,
    ]
  );


  /* =========================================
     메시지 전송
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


      if (!room) {

        setError(
          "채팅방 정보를 찾을 수 없습니다."
        );

        return;
      }


      const message =
        (
          customMessage ??
          input
        ).trim();


      if (!message) {

        return;
      }


      if (sending) {

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
              .toISOString(),
        };


      setMessages(
        (
          previous
        ) => [

          ...previous,

          temporaryUserMessage,
        ]
      );


      setInput(
        ""
      );


      try {

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
              message,
            },

            {
              params: {
                memberId,
              },

              timeout:
                180000,
            }
          );


        const data =
          response.data;


        const recommendedProducts =
          data.recommendedProducts ??
          [];


        const botMessage:
          ChatMessage = {

          ...data.botMessage,

          action:
            data.action ??
            null,

          recommendedProducts,
        };


        if (
          recommendedProducts.length >
          0
        ) {

          saveStoredRecommendation(
            room.id,
            data.botMessage.id,
            recommendedProducts
          );
        }


        setMessages(
          (
            previous
          ) => {

            const replaced =
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
              ...replaced,
              botMessage,
            ];
          }
        );


      } catch (error) {

        console.error(
          "AI 챗봇 질문 오류:",
          error
        );


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

  const handleKeyDown = (
    event:
      React.KeyboardEvent<HTMLTextAreaElement>
  ) => {

    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();


      void sendMessage();
    }
  };


  /* =========================================
     ACTION
  ========================================= */

  const handleAction = (
    action:
      ChatbotAction
  ) => {

    if (
      action.type !==
      "NAVIGATE"
    ) {

      return;
    }


    if (!action.path) {

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


      if (!confirmed) {

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
              memberId,
            },
          }
        );


        const response =
          await axiosInstance.post<ChatRoom>(

            "/api/chat/rooms",

            null,

            {
              params: {
                memberId,
              },
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
              alt={CHATBOT_NAME}
            />

          </div>


          <h1>
            {CHATBOT_NAME}
          </h1>


          <p className="gd-chat-login-description">

            여신강림을 사용하면서
            모르는 것과 궁금한 것들을
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
     초기 로딩
  ========================================= */

  if (loading) {

    return (

      <main className="gd-chat-page">

        <div className="gd-chat-page-loading">

          <span />


          <p>
            {CHATBOT_NAME} 상담을 준비하고 있어요.
          </p>

        </div>

      </main>
    );
  }


  return (

    <main className="gd-chat-page">

      <section className="gd-chat-shell">


        {/* HEADER */}

        <header className="gd-chat-header">

          <div className="gd-chat-header-left">

            <div className="gd-chat-avatar">

              <img
                src={chatProfile}
                alt={CHATBOT_NAME}
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


        {/* INTRO */}

        <div className="gd-chat-intro">

          <p className="gd-chat-intro-title">
            무엇을 도와드릴까요?
          </p>


          <p>
            여신강림 서비스를
            AI에게 편하게 물어보세요.
          </p>

        </div>


        {/* QUICK */}

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


        {/* MESSAGES */}

        <div className="gd-chat-messages">

          {
            messages.length === 0 &&
            !sending
              ? (

                <div className="gd-chat-empty">

                  <div className="gd-chat-empty-icon">

                    <img
                      src={chatProfile}
                      alt={CHATBOT_NAME}
                    />

                  </div>


                  <strong>
                    {CHATBOT_NAME}에게 물어보세요
                  </strong>


                  <p>

                    이용하셨던 것 중 궁금한 것과
                    메이크업과 헤어 추천,
                    AI BEAUTY 이용 방법까지
                    모두 도와드릴게요.

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
                                {CHATBOT_NAME}
                              </span>

                            )
                          }


                          <div className="gd-chat-bubble">

                            {
                              message.message
                            }

                          </div>


                          {/* 추천 상품 */}

                          {
                            !isUser &&
                            message.recommendedProducts &&
                            message.recommendedProducts.length >
                              0 &&
                            (

                              <div className="gd-chat-products">

                                <div className="gd-chat-products-title">
                                  AI픽 추천 상품
                                </div>


                                <div className="gd-chat-products-list">

                                  {
                                    message
                                      .recommendedProducts
                                      .map(
                                        (
                                          product
                                        ) => {

                                          const discount =
                                            product.discount ??
                                            0;


                                          const salePrice =
                                            discount > 0
                                              ? Math.round(
                                                  product.price *
                                                  (
                                                    1 -
                                                    discount /
                                                    100
                                                  )
                                                )
                                              : product.price;


                                          const imageUrl =
                                            getProductImageUrl(
                                              product.imageUrl
                                            );


                                          return (

                                            <div
                                              key={`${product.productId}-${product.productColorId}`}
                                              className="gd-chat-product-card"
                                              onClick={() =>
                                                navigate(
                                                  `/products/${product.productId}`
                                                )
                                              }
                                              role="button"
                                              tabIndex={0}
                                              onKeyDown={(event) => {
                                                if (
                                                  event.key === "Enter" ||
                                                  event.key === " "
                                                ) {
                                                  event.preventDefault();

                                                  navigate(
                                                    `/products/${product.productId}`
                                                  );
                                                }
                                              }}
                                            >

                                              <div className="gd-chat-product-image-wrap">

                                                {
                                                  imageUrl
                                                    ? (

                                                      <img
                                                        src={
                                                          imageUrl
                                                        }
                                                        alt={
                                                          product.productName
                                                        }
                                                        className="gd-chat-product-image"
                                                      />

                                                    )
                                                    : (

                                                      <div className="gd-chat-product-image-empty">
                                                        이미지 준비 중
                                                      </div>

                                                    )
                                                }

                                              </div>


                                              <div className="gd-chat-product-info">

                                                {
                                                  product.brand &&
                                                  (

                                                    <div className="gd-chat-product-brand">
                                                      {product.brand}
                                                    </div>

                                                  )
                                                }


                                                <div className="gd-chat-product-name">
                                                  {product.productName}
                                                </div>


                                                {
                                                  product.colorName &&
                                                  (

                                                    <div className="gd-chat-product-color">

                                                      {
                                                        product.colorCode &&
                                                        (

                                                          <span
                                                            className="gd-chat-product-color-chip"
                                                            style={{
                                                              backgroundColor:
                                                                product.colorCode,
                                                            }}
                                                          />

                                                        )
                                                      }


                                                      <span>
                                                        {product.colorName}
                                                      </span>

                                                    </div>

                                                  )
                                                }


                                                <div className="gd-chat-product-price">

                                                  {
                                                    discount >
                                                      0 &&
                                                    (

                                                      <span className="gd-chat-product-discount">
                                                        {discount}%
                                                      </span>

                                                    )
                                                  }


                                                  <strong>

                                                    {
                                                      salePrice
                                                        .toLocaleString()
                                                    }
                                                    원

                                                  </strong>


                                                  {
                                                    discount >
                                                      0 &&
                                                    (

                                                      <del>

                                                        {
                                                          product
                                                            .price
                                                            .toLocaleString()
                                                        }
                                                        원

                                                      </del>

                                                    )
                                                  }

                                                </div>

                                              </div>

                                            </div>
                                          );
                                        }
                                      )
                                  }

                                </div>

                              </div>

                            )
                          }


                          {/* ACTION */}

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
              별도 로딩 컴포넌트
          ===================================== */}

          {
            sending &&
            (
              <ChatLoadingShowcase />
            )
          }


          {/* =====================================
              기존 대기 문구 유지
          ===================================== */}

          {
            sending &&
            (

              <div className="gd-chat-message-row bot">

                <div className="gd-chat-message-wrap">

                  <span className="gd-chat-message-name">
                    {CHATBOT_NAME}
                  </span>


                  <div className="gd-chat-bubble gd-chat-thinking-text">

                    <span className="gd-chat-thinking-sparkle">
                      ✦
                    </span>


                    <span>

                      {
                        LOADING_MESSAGES[
                          loadingMessageIndex
                        ]
                      }

                    </span>

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


        {/* ERROR */}

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


        {/* INPUT */}

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

            <span />


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