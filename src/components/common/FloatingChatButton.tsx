import {
  useLocation,
  useNavigate
} from "react-router-dom";

import chatProfile from "../../assets/logo/chat-profile.png";

import "../../styles/common/FloatingChatButton.css";


const FloatingChatButton = () => {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  const pathname =
    location.pathname;


  /**
   * 챗봇 버튼을 숨길 화면
   *
   * 관리자 화면
   * 마이페이지
   * 챗봇 화면
   */
  const hidden =
    pathname === "/chat" ||

    pathname === "/mypage" ||
    pathname.startsWith("/mypage/") ||

    pathname === "/admin" ||
    pathname.startsWith("/admin/");


  if (
    hidden
  ) {

    return null;
  }


  return (

    <button
      type="button"
      className="floating-chat-button"
      onClick={
        () =>
          navigate(
            "/chat"
          )
      }
      aria-label="챗봇 상담 열기"
      title="챗봇 상담"
    >

      {/* 꽃가루 / 반짝이 효과 */}
      <span className="fairy-sparkle sparkle-1" />
      <span className="fairy-sparkle sparkle-2" />
      <span className="fairy-sparkle sparkle-3" />
      <span className="fairy-sparkle sparkle-4" />
      <span className="fairy-sparkle sparkle-5" />
      <span className="fairy-sparkle sparkle-6" />
      <span className="fairy-sparkle sparkle-7" />
      <span className="fairy-sparkle sparkle-8" />


      {/* 챗봇 요정 이미지 */}
      <img
        src={chatProfile}
        alt="챗봇 도우미"
      />


      {/* 챗봇 이름 */}
      <span className="floating-chat-label">
        챗봇 도우미
      </span>

    </button>
  );
};


export default FloatingChatButton;