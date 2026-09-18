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

import "../../styles/member/MemberRecovery.css";

import "../../styles/member/MemberLogin.css";


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
    <div className="goddess-recovery-page">
      <main className="goddess-recovery-container">
        <section className="goddess-recovery-card">
          <div className="goddess-recovery-header">
            <span className="goddess-recovery-eyebrow">ACCOUNT RECOVERY</span>
            <h1>FIND PASSWORD</h1>
            <p>가입한 아이디와 이메일을 확인한 후<br/>새로운 비밀번호를 설정해주세요.</p>
          </div>
          <div className="goddess-recovery-form-group"><label htmlFor="loginId">아이디</label><input id="loginId" value={loginId} onChange={(e)=>setLoginId(e.target.value)} placeholder="아이디를 입력해주세요." /></div>
          <div className="goddess-recovery-form-group"><label htmlFor="email">이메일</label><input type="email" id="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="이메일을 입력해주세요." /></div>
          <div className="goddess-recovery-divider"><span>NEW PASSWORD</span></div>
          <div className="goddess-recovery-form-group"><label htmlFor="newPassword">새 비밀번호</label><input type="password" id="newPassword" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="새 비밀번호를 입력해주세요." /></div>
          <div className="goddess-recovery-form-group"><label htmlFor="confirmPassword">새 비밀번호 확인</label><input type="password" id="confirmPassword" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter")resetPassword();}} placeholder="새 비밀번호를 한 번 더 입력해주세요." /></div>
          <button type="button" className="goddess-recovery-primary" onClick={resetPassword}>RESET PASSWORD</button>
          <div className="goddess-recovery-bottom"><Link to="/login">← BACK TO LOGIN</Link></div>
        </section>
        <p className="goddess-recovery-footer">YOUR BEAUTY, YOUR GODDESS</p>
      </main>
    </div>
  );
};


export default Member_FindPassword;