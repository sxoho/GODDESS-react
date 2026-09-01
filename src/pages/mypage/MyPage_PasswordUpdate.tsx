import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import axios from "axios";

import {
  axiosInstance
} from "../../components/ToolBak";

import {
  useGlobalStore
} from "../../store/store";

import "../../styles/member/MyPage.css";


const MyPage_PasswordUpdate = () => {

  const navigate =
    useNavigate();


  const {
    sw,
    memberId
  } = useGlobalStore();


  const [
    currentPassword,
    setCurrentPassword
  ] = useState("");


  const [
    newPassword,
    setNewPassword
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");


  const [
    saving,
    setSaving
  ] = useState(false);


  /**
   * 로그인 확인
   */
  useEffect(() => {

    if (
      sw !== true ||
      !memberId
    ) {

      alert(
        "로그인이 필요한 페이지입니다."
      );


      navigate(
        "/login",
        {
          replace: true
        }
      );
    }

  }, [
    sw,
    memberId,
    navigate
  ]);


  /**
   * 비밀번호 변경
   */
  const handlePasswordUpdate =
    async () => {

      if (!memberId) {

        alert(
          "회원 정보를 확인할 수 없습니다."
        );

        return;
      }


      if (
        !currentPassword.trim()
      ) {

        alert(
          "현재 비밀번호를 입력해주세요."
        );

        return;
      }


      if (
        !newPassword.trim()
      ) {

        alert(
          "새 비밀번호를 입력해주세요."
        );

        return;
      }


      if (
        !confirmPassword.trim()
      ) {

        alert(
          "새 비밀번호 확인을 입력해주세요."
        );

        return;
      }


      if (
        newPassword !==
        confirmPassword
      ) {

        alert(
          "새 비밀번호가 일치하지 않습니다."
        );

        return;
      }


      if (
        currentPassword ===
        newPassword
      ) {

        alert(
          "현재 비밀번호와 다른 비밀번호를 입력해주세요."
        );

        return;
      }


      const confirmUpdate =
        window.confirm(
          "비밀번호를 변경하시겠습니까?"
        );


      if (!confirmUpdate) {
        return;
      }


      try {

        setSaving(true);


        await axiosInstance.put(
          `/mypage/${memberId}/password`,
          {
            currentPassword:
              currentPassword,

            newPassword:
              newPassword
          }
        );


        alert(
          "비밀번호가 변경되었습니다."
        );


        navigate(
          "/mypage"
        );


      } catch (error) {

        console.error(
          "마이페이지 비밀번호 변경 오류:",
          error
        );


        if (
          axios.isAxiosError(error)
        ) {

          const responseData =
            error.response?.data;


          if (
            typeof responseData ===
            "string"
          ) {

            alert(
              responseData
            );

            return;
          }


          if (
            responseData?.message
          ) {

            alert(
              responseData.message
            );

            return;
          }
        }


        alert(
          "비밀번호 변경 중 오류가 발생했습니다."
        );


      } finally {

        setSaving(false);
      }
    };


  return (

    <main className="mypage">

      <section className="mypage-heading">

        <p className="mypage-heading-label">
          MEMBER
        </p>


        <h1>
          PASSWORD
        </h1>


        <p className="mypage-heading-description">

          현재 비밀번호를 확인한 후

          <br />

          새로운 비밀번호로 변경해주세요.

        </p>

      </section>


      <section className="mypage-section mypage-password-section">

        <div className="mypage-section-heading">

          <span>
            01
          </span>


          <div>

            <p>
              PASSWORD CHANGE
            </p>

            <h2>
              비밀번호 변경
            </h2>

          </div>

        </div>


        <div className="mypage-password-update-form">

          <div className="mypage-password-field">

            <div className="mypage-password-label-row">

              <label
                htmlFor="currentPassword"
              >
                현재 비밀번호
              </label>


              <button
                type="button"
                className="mypage-password-find-button"
                onClick={
                  () =>
                    navigate(
                      "/find_password"
                    )
                }
              >
                비밀번호를 잃어버리셨나요?
              </button>

            </div>


            <input
              type="password"
              id="currentPassword"
              value={
                currentPassword
              }
              onChange={
                (event) =>
                  setCurrentPassword(
                    event.target.value
                  )
              }
              placeholder="현재 비밀번호를 입력해주세요."
            />

          </div>


          <div className="mypage-password-field">

            <label
              htmlFor="newPassword"
            >
              새 비밀번호
            </label>


            <input
              type="password"
              id="newPassword"
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


          <div className="mypage-password-field">

            <label
              htmlFor="confirmPassword"
            >
              새 비밀번호 확인
            </label>


            <input
              type="password"
              id="confirmPassword"
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

                    handlePasswordUpdate();
                  }
                }
              }
              placeholder="새 비밀번호를 한 번 더 입력해주세요."
            />

          </div>


          <div className="mypage-password-actions">

            <button
              type="button"
              className="mypage-password-cancel-button"
              onClick={
                () =>
                  navigate(
                    "/mypage"
                  )
              }
              disabled={
                saving
              }
            >
              취소
            </button>


            <button
              type="button"
              className="mypage-password-submit-button"
              onClick={
                handlePasswordUpdate
              }
              disabled={
                saving
              }
            >

              {
                saving
                  ? "변경 중..."
                  : "비밀번호 변경"
              }

            </button>

          </div>

        </div>

      </section>

    </main>
  );
};


export default MyPage_PasswordUpdate;
