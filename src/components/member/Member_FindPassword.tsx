import {
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  axiosInstance
} from "../ToolBak";


const Member_FindPassword = () => {

  const navigate =
    useNavigate();


  const [
    loginId,
    setLoginId
  ] = useState("");


  const [
    email,
    setEmail
  ] = useState("");


  const [
    newPassword,
    setNewPassword
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");


  /**
   * 비밀번호 재설정
   */
  const resetPassword = async () => {

    if (!loginId.trim()) {

      alert(
        "아이디를 입력해주세요."
      );

      return;
    }


    if (!email.trim()) {

      alert(
        "이메일을 입력해주세요."
      );

      return;
    }


    if (!newPassword.trim()) {

      alert(
        "새 비밀번호를 입력해주세요."
      );

      return;
    }


    if (!confirmPassword.trim()) {

      alert(
        "새 비밀번호 확인을 입력해주세요."
      );

      return;
    }


    /**
     * 새 비밀번호와 확인 비밀번호 비교
     */
    if (
      newPassword !==
      confirmPassword
    ) {

      alert(
        "새 비밀번호가 일치하지 않습니다."
      );

      return;
    }


    try {

      await axiosInstance.put(
        "/member/reset_password",
        {
          loginId:
            loginId.trim(),

          email:
            email.trim(),

          newPassword:
            newPassword
        }
      );


      alert(
        "비밀번호가 변경되었습니다.\n새 비밀번호로 로그인해주세요."
      );


      navigate(
        "/login"
      );


    } catch (error) {

      console.error(
        "비밀번호 재설정 오류:",
        error
      );


      alert(
        "아이디 또는 이메일이 일치하지 않습니다."
      );
    }
  };


  return (

    <div className="member-page">

      <div className="member-container">


        {/* 제목 */}
        <h1
          style={{
            width: "100%",
            textAlign: "center"
          }}
        >
          FIND PASSWORD
        </h1>


        <p className="member-subtitle">

          가입할 때 등록한 아이디와 이메일을 확인한 후

          <br />

          새로운 비밀번호를 설정해주세요.

        </p>


        {/* 아이디 */}
        <div className="member-form-group">

          <label
            htmlFor="loginId"
            className="member-label"
          >
            아이디
          </label>


          <input
            type="text"
            id="loginId"
            className="member-input"
            value={
              loginId
            }
            onChange={
              (event) =>
                setLoginId(
                  event.target.value
                )
            }
            placeholder="아이디를 입력해주세요."
          />

        </div>


        {/* 이메일 */}
        <div className="member-form-group">

          <label
            htmlFor="email"
            className="member-label"
          >
            이메일
          </label>


          <input
            type="email"
            id="email"
            className="member-input"
            value={
              email
            }
            onChange={
              (event) =>
                setEmail(
                  event.target.value
                )
            }
            placeholder="이메일을 입력해주세요."
          />

        </div>


        {/* 새 비밀번호 */}
        <div className="member-form-group">

          <label
            htmlFor="newPassword"
            className="member-label"
          >
            새 비밀번호
          </label>


          <input
            type="password"
            id="newPassword"
            className="member-input"
            value={
              newPassword
            }
            onChange={
              (event) =>
                setNewPassword(
                  event.target.value
                )
            }
            placeholder="새 비밀번호를 입력해주세요."
          />

        </div>


        {/* 새 비밀번호 확인 */}
        <div className="member-form-group">

          <label
            htmlFor="confirmPassword"
            className="member-label"
          >
            새 비밀번호 확인
          </label>


          <input
            type="password"
            id="confirmPassword"
            className="member-input"
            value={
              confirmPassword
            }
            onChange={
              (event) =>
                setConfirmPassword(
                  event.target.value
                )
            }
            onKeyDown={
              (event) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  resetPassword();
                }
              }
            }
            placeholder="새 비밀번호를 한 번 더 입력해주세요."
          />

        </div>


        {/* 비밀번호 변경 버튼 */}
        <button
          type="button"
          className="member-main-button"
          onClick={
            resetPassword
          }
        >
          비밀번호 변경
        </button>


        {/* 로그인으로 돌아가기 */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center"
          }}
        >

          <Link
            to="/login"
            style={{
              color: "#222",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            LOGIN으로 돌아가기
          </Link>

        </div>


      </div>

    </div>
  );
};


export default Member_FindPassword;