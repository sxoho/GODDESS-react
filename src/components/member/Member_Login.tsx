import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance, enterChk } from "../ToolBak";
import { useGlobalStore } from "../../store/store";

/**
 * 로그인 정보 저장용 Key
 */
const SAVED_LOGIN_ID = "onniver_saved_login_id";
const SAVED_PASSWORD = "onniver_saved_password";
const SAVE_LOGIN_ID_CHECK = "onniver_save_login_id_check";
const SAVE_PASSWORD_CHECK = "onniver_save_password_check";

const Member_Login = () => {
  const navigate = useNavigate();

  const {
    setSW,
    setMemberId,
    setLoginId,
    setNickname,
    setGradeId,
    setGradeName,
  } = useGlobalStore();

  /**
   * 로그인 입력 정보
   */
  const [member, setMember] = useState({
    loginId: "",
    password: "",
  });

  /**
   * 아이디 / 비밀번호 저장 여부
   */
  const [saveLoginId, setSaveLoginId] = useState(false);
  const [savePassword, setSavePassword] = useState(false);

  /**
   * 로그인 화면 진입 시
   * 저장된 아이디 / 비밀번호 불러오기
   */
  useEffect(() => {
    const savedLoginId = localStorage.getItem(SAVED_LOGIN_ID) ?? "";
    const savedPassword = localStorage.getItem(SAVED_PASSWORD) ?? "";
    const savedLoginIdCheck = localStorage.getItem(SAVE_LOGIN_ID_CHECK) === "true";
    const savedPasswordCheck = localStorage.getItem(SAVE_PASSWORD_CHECK) === "true";

    setSaveLoginId(savedLoginIdCheck);
    setSavePassword(savedPasswordCheck);

    setMember({
      loginId: savedLoginIdCheck ? savedLoginId : "",
      password: savedPasswordCheck ? savedPassword : "",
    });
  }, []);

  /**
   * 입력값 변경
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setMember((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * 관리자 테스트 계정 입력
   */
  const adminTestAccount = () => {
    setMember((prev) => ({
      ...prev,
      loginId: "admin",
      password: "1234",
    }));
  };

  /**
   * 로그인 정보 저장
   */
  const saveLoginInformation = () => {
    if (saveLoginId) {
      localStorage.setItem(SAVED_LOGIN_ID, member.loginId);
      localStorage.setItem(SAVE_LOGIN_ID_CHECK, "true");
    } else {
      localStorage.removeItem(SAVED_LOGIN_ID);
      localStorage.setItem(SAVE_LOGIN_ID_CHECK, "false");
    }

    if (savePassword) {
      localStorage.setItem(SAVED_PASSWORD, member.password);
      localStorage.setItem(SAVE_PASSWORD_CHECK, "true");
    } else {
      localStorage.removeItem(SAVED_PASSWORD);
      localStorage.setItem(SAVE_PASSWORD_CHECK, "false");
    }
  };

  /**
   * 로그인
   */
  const login = async () => {
    if (!member.loginId?.trim()) {
      alert("아이디를 입력해주세요.");
      document.getElementById("loginId")?.focus();
      return;
    }

    if (!member.password?.trim()) {
      alert("비밀번호를 입력해주세요.");
      document.getElementById("password")?.focus();
      return;
    }

    try {
      const response = await axiosInstance.post("/member/login", {
        loginId: member.loginId,
        password: member.password,
      });

      const data = response.data;

      console.log("-> login:", data);

      /**
       * JWT Access Token 저장
       *
       * Spring LoginResponseDto의
       * accessToken 값을 sessionStorage에 저장한다.
       */
      if (!data.accessToken) {
        console.error("JWT Access Token이 없습니다.");
        alert("로그인 토큰 발급에 실패했습니다.");
        return;
      }

      sessionStorage.setItem("jwt", data.accessToken);

      /**
       * 로그인 성공 후
       * 아이디 / 비밀번호 저장
       */
      saveLoginInformation();

      /**
       * Zustand 로그인 정보 저장
       */
      setSW(true);
      setMemberId(data.memberId ?? 0);
      setLoginId(data.loginId ?? "");
      setNickname(data.nickname ?? "");
      setGradeId(Number(data.gradeId ?? 0));
      setGradeName(data.gradeName ?? "");

      alert("로그인되었습니다.");

      /**
       * 관리자 / 일반 회원 분기
       *
       * GRADE_ID
       * 1 = USER
       * 2 = GOLD
       * 3 = VIP
       * 4 = ADMIN
       */
      const gradeId = Number(data.gradeId ?? 0);

      if (gradeId === 4) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert("아이디 또는 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="member-page">
      <div className="member-container">

        {/* =========================
            로그인 제목
        ========================= */}
        <h1
          style={{
            width: "100%",
            textAlign: "center",
            marginLeft: 0,
            marginRight: 0,
          }}
        >
          LOGIN
        </h1>

        <p className="member-subtitle">
          ONNIVER에 로그인하고
          <br />
          나만의 스타일과 가상 피팅을 만나보세요.
        </p>

        {/* =========================
            아이디
        ========================= */}
        <div className="member-form-group">
          <label htmlFor="loginId" className="member-label">
            아이디
          </label>

          <input
            type="text"
            id="loginId"
            name="loginId"
            className="member-input"
            value={member.loginId ?? ""}
            onChange={handleChange}
            onKeyDown={(event) => enterChk(event, "password")}
            placeholder="아이디를 입력해주세요."
          />
        </div>

        {/* =========================
            비밀번호
        ========================= */}
        <div className="member-form-group">
          <label htmlFor="password" className="member-label">
            비밀번호
          </label>

          <input
            type="password"
            id="password"
            name="password"
            className="member-input"
            value={member.password ?? ""}
            onChange={handleChange}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                login();
              }
            }}
            placeholder="비밀번호를 입력해주세요."
          />
        </div>

        {/* =========================
            아이디 / 비밀번호 저장
        ========================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            marginTop: "-4px",
            marginBottom: "22px",
            fontSize: "13px",
            color: "#555",
          }}
        >
          {/* 아이디 저장 */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={saveLoginId}
              onChange={(event) => setSaveLoginId(event.target.checked)}
            />
            <span>아이디 저장</span>
          </label>

          {/* 비밀번호 저장 */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={savePassword}
              onChange={(event) => setSavePassword(event.target.checked)}
            />
            <span>비밀번호 저장</span>
          </label>
        </div>

        {/* =========================
            관리자 테스트 계정
        ========================= */}
        <button
          type="button"
          className="member-main-button"
          onClick={adminTestAccount}
          style={{ marginBottom: "10px" }}
        >
          관리자 테스트 계정 입력
        </button>

        {/* =========================
            로그인 버튼
        ========================= */}
        <button
          type="button"
          className="member-main-button"
          onClick={login}
        >
          LOGIN
        </button>

        {/* =========================
            회원가입
        ========================= */}
        <div className="member-bottom">
          <span>아직 회원이 아니신가요?</span>
          <Link to="/signup">SIGN UP</Link>
        </div>

        {/* =========================
            아이디 / 비밀번호 찾기
        ========================= */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "18px",
            fontSize: "13px",
          }}
        >
          <Link
            to="/find_id"
            style={{
              color: "#555",
              textDecoration: "none",
            }}
          >
            아이디 찾기
          </Link>

          <span style={{ color: "#ccc" }}>|</span>

          <Link
            to="/find_password"
            style={{
              color: "#555",
              textDecoration: "none",
            }}
          >
            비밀번호 찾기
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Member_Login;