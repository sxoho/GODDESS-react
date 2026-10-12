import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance, enterChk } from "../ToolBak";
import { useGlobalStore } from "../../store/store";

import "../../styles/member/MemberLogin.css";

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
    const savedLoginId =
      localStorage.getItem(SAVED_LOGIN_ID) ?? "";

    const savedPassword =
      localStorage.getItem(SAVED_PASSWORD) ?? "";

    const savedLoginIdCheck =
      localStorage.getItem(SAVE_LOGIN_ID_CHECK) === "true";

    const savedPasswordCheck =
      localStorage.getItem(SAVE_PASSWORD_CHECK) === "true";

    setSaveLoginId(savedLoginIdCheck);
    setSavePassword(savedPasswordCheck);

    setMember({
      loginId: savedLoginIdCheck
        ? savedLoginId
        : "",
      password: savedPasswordCheck
        ? savedPassword
        : "",
    });
  }, []);

  /**
   * 입력값 변경
   */
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      localStorage.setItem(
        SAVED_LOGIN_ID,
        member.loginId
      );

      localStorage.setItem(
        SAVE_LOGIN_ID_CHECK,
        "true"
      );
    } else {
      localStorage.removeItem(
        SAVED_LOGIN_ID
      );

      localStorage.setItem(
        SAVE_LOGIN_ID_CHECK,
        "false"
      );
    }

    if (savePassword) {
      localStorage.setItem(
        SAVED_PASSWORD,
        member.password
      );

      localStorage.setItem(
        SAVE_PASSWORD_CHECK,
        "true"
      );
    } else {
      localStorage.removeItem(
        SAVED_PASSWORD
      );

      localStorage.setItem(
        SAVE_PASSWORD_CHECK,
        "false"
      );
    }
  };

  /**
   * 로그인
   */
  const login = async () => {
    if (!member.loginId?.trim()) {
      alert("아이디를 입력해주세요.");
      document
        .getElementById("loginId")
        ?.focus();

      return;
    }

    if (!member.password?.trim()) {
      alert("비밀번호를 입력해주세요.");
      document
        .getElementById("password")
        ?.focus();

      return;
    }

    try {
      const response =
        await axiosInstance.post(
          "/member/login",
          {
            loginId: member.loginId,
            password: member.password,
          }
        );

      const data = response.data;

      console.log("-> login:", data);

      /**
       * JWT Access Token 저장
       */
      if (!data.accessToken) {
        console.error(
          "JWT Access Token이 없습니다."
        );

        alert(
          "로그인 토큰 발급에 실패했습니다."
        );

        return;
      }

      sessionStorage.setItem(
        "jwt",
        data.accessToken
      );

      if (data.refreshToken) {
        sessionStorage.setItem(
          "refreshToken",
          data.refreshToken
        );
      }

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
      setGradeId(
        Number(data.gradeId ?? 0)
      );
      setGradeName(
        data.gradeName ?? ""
      );

      alert("로그인되었습니다.");

      /**
       * 관리자 / 일반 회원 분기
       */
      const gradeId =
        Number(data.gradeId ?? 0);

      if (gradeId === 4) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(error);

      alert(
        "아이디 또는 비밀번호를 확인해주세요."
      );
    }
  };

  return (
    <div className="goddess-login-page">

      {/* 배경 장식 */}
      <div className="goddess-login-glow goddess-login-glow-left" />
      <div className="goddess-login-glow goddess-login-glow-right" />

      <main className="goddess-login-container">

        

        {/* 로그인 영역 */}
        <section className="goddess-login-card">

          <div className="goddess-login-header">
            <span className="goddess-login-eyebrow">
              
            </span>

            <h1>LOGIN</h1>

            <p>
              로그인 하셔서
              <br />
              나만의 뷰티 스타일을 만나보세요.
            </p>
          </div>

          {/* 아이디 */}
          <div className="goddess-login-form-group">
            <label htmlFor="loginId">
              아이디
            </label>

            <input
              type="text"
              id="loginId"
              name="loginId"
              value={member.loginId ?? ""}
              onChange={handleChange}
              onKeyDown={(event) =>
                enterChk(
                  event,
                  "password"
                )
              }
              placeholder="아이디를 입력해주세요."
              autoComplete="username"
            />
          </div>

          {/* 비밀번호 */}
          <div className="goddess-login-form-group">
            <label htmlFor="password">
              비밀번호
            </label>

            <input
              type="password"
              id="password"
              name="password"
              value={member.password ?? ""}
              onChange={handleChange}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  login();
                }
              }}
              placeholder="비밀번호를 입력해주세요."
              autoComplete="current-password"
            />
          </div>

          {/* 저장 옵션 */}
          <div className="goddess-login-options">
            <label className="goddess-login-check">
              <input
                type="checkbox"
                checked={saveLoginId}
                onChange={(event) =>
                  setSaveLoginId(
                    event.target.checked
                  )
                }
              />

              <span className="goddess-login-custom-check" />

              <span>
                아이디 저장
              </span>
            </label>

            <label className="goddess-login-check">
              <input
                type="checkbox"
                checked={savePassword}
                onChange={(event) =>
                  setSavePassword(
                    event.target.checked
                  )
                }
              />

              <span className="goddess-login-custom-check" />

              <span>
                비밀번호 저장
              </span>
            </label>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="button"
            className="goddess-login-button"
            onClick={login}
          >
            LOGIN
          </button>

          {/* 아이디 / 비밀번호 찾기 */}
          <div className="goddess-login-find">
            <Link to="/find_id">
              아이디 찾기
            </Link>

            <span />

            <Link to="/find_password">
              비밀번호 찾기
            </Link>
          </div>

          {/* 회원가입 */}
          <div className="goddess-login-signup">
            <p>
              아직 회원이 아니신가요?
            </p>

            <Link to="/signup">
              SIGN UP
            </Link>
          </div>

          {/* 관리자 테스트 */}
          <button
            type="button"
            className="goddess-login-admin-button"
            onClick={adminTestAccount}
          >
            ADMIN TEST ACCOUNT
          </button>

        </section>

        <p className="goddess-login-footer">
          YOUR BEAUTY, YOUR GODDESS
        </p>

      </main>
    </div>
  );
};

export default Member_Login;