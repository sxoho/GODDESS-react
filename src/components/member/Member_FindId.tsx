import {
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import {
  axiosInstance
} from "../ToolBak";


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

    <div className="member-page">

      <div className="member-container">

        <h1
          style={{
            width: "100%",
            textAlign: "center"
          }}
        >
          FIND ID
        </h1>


        <p className="member-subtitle">

          가입할 때 등록한

          <br />

          이름과 이메일을 입력해주세요.

        </p>


        {/* 이름 */}
        <div className="member-form-group">

          <label
            htmlFor="name"
            className="member-label"
          >
            이름
          </label>


          <input
            type="text"
            id="name"
            className="member-input"
            value={
              name
            }
            onChange={
              (event) =>
                setName(
                  event.target.value
                )
            }
            placeholder="이름을 입력해주세요."
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


        {/* 아이디 찾기 */}
        <button
          type="button"
          className="member-main-button"
          onClick={
            findId
          }
        >
          아이디 찾기
        </button>


        {/* 성공 */}
        {foundLoginId && (

          <div
            style={{
              marginTop: "24px",
              padding: "18px 14px",
              borderTop: "1px solid #e5e5e5",
              borderBottom: "1px solid #e5e5e5",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: 1.8
            }}
          >

            회원님의 아이디는

            <br />

            <strong
              style={{
                fontSize: "18px"
              }}
            >
              {foundLoginId}
            </strong>

            입니다.

          </div>

        )}


        {/* 실패 */}
        {error && (

          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              color: "#a33",
              fontSize: "13px"
            }}
          >
            {error}
          </div>

        )}


        {/* 로그인으로 */}
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


export default Member_FindId;