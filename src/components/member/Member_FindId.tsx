import {
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  axiosInstance
} from "../ToolBak";

import "../../styles/member/MemberRecovery.css";

import "../../styles/member/MemberLogin.css";


const Member_FindId = () => {

  const [
    name,
    setName
  ] = useState("");


  const [
    email,
    setEmail
  ] = useState("");


  const [
    foundLoginId,
    setFoundLoginId
  ] = useState("");


  const [
    error,
    setError
  ] = useState("");


  /**
   * 아이디 찾기
   */
  const findId = async () => {

    if (!name.trim()) {

      alert(
        "이름을 입력해주세요."
      );

      return;
    }


    if (!email.trim()) {

      alert(
        "이메일을 입력해주세요."
      );

      return;
    }


    try {

      setError("");
      setFoundLoginId("");


      const response =
        await axiosInstance.get<string>(
          "/member/find_id",
          {
            params: {
              name:
                name.trim(),

              email:
                email.trim()
            }
          }
        );


      setFoundLoginId(
        response.data
      );


    } catch (error) {

      console.error(
        "아이디 찾기 오류:",
        error
      );


      setFoundLoginId("");

      setError(
        "일치하는 회원 정보를 찾을 수 없습니다."
      );
    }
  };


  return (
    <div className="goddess-recovery-page">
      <main className="goddess-recovery-container">
        <section className="goddess-recovery-card">
          <div className="goddess-recovery-header">
            <span className="goddess-recovery-eyebrow">ACCOUNT RECOVERY</span>
            <h1>FIND ID</h1>
            <p>가입할 때 등록한 이름과 이메일을 입력하면<br/>회원님의 아이디를 확인할 수 있어요.</p>
          </div>
          <div className="goddess-recovery-form-group">
            <label htmlFor="name">이름</label>
            <input id="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="이름을 입력해주세요." />
          </div>
          <div className="goddess-recovery-form-group">
            <label htmlFor="email">이메일</label>
            <input type="email" id="email" value={email} onChange={(e)=>setEmail(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter")findId();}} placeholder="이메일을 입력해주세요." />
          </div>
          <button type="button" className="goddess-recovery-primary" onClick={findId}>FIND MY ID</button>
          {foundLoginId && <div className="goddess-recovery-result success"><span>YOUR LOGIN ID</span><strong>{foundLoginId}</strong><p>위 아이디로 로그인해주세요.</p></div>}
          {error && <div className="goddess-recovery-result error"><span>NOT FOUND</span><p>{error}</p></div>}
          <div className="goddess-recovery-bottom"><Link to="/login">← BACK TO LOGIN</Link></div>
        </section>
        <p className="goddess-recovery-footer">YOUR BEAUTY, YOUR GODDESS</p>
      </main>
    </div>
  );
};


export default Member_FindId;