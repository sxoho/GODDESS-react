import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalStore } from "../../store/store";
import { axiosInstance } from "../ToolBak";

let logoutRunning = false;

const Member_Logout = () => {
  const navigate = useNavigate();
  const effectStarted = useRef(false);

  const {
    sw,
    memberId,
    setSW,
    setMemberId,
    setLoginId,
    setNickname,
    setGradeId,
    setGradeName,
  } = useGlobalStore();

  useEffect(() => {
    if (effectStarted.current || logoutRunning) {
      return;
    }

    effectStarted.current = true;
    logoutRunning = true;

    const logout = async () => {
      try {
        if (sw === true && memberId) {
          await axiosInstance.put(
            `/login-history/logout/${memberId}`
          );
        }
      } catch (error) {
        console.error(
          "로그아웃 시간 저장 오류:",
          error
        );
      } finally {
        sessionStorage.removeItem("jwt");

        setSW(false);
        setMemberId(0);
        setLoginId("");
        setNickname("");
        setGradeId(0);
        setGradeName("");

        alert("로그아웃되었습니다.");

        logoutRunning = false;
        navigate("/", { replace: true });
      }
    };

    logout();
  }, []);

  return null;
};

export default Member_Logout;