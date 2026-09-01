import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  axiosInstance
} from "../../../components/ToolBak";

import "../../../styles/admin/AdminMemberDetail.css";

type Member = {
  id: number;
  loginId: string;
  name: string;
  nickname: string;
  email: string;
  tel?: string;
  zipcode?: string;
  address1?: string;
  address2?: string;
  status: string;
  gradeId?: number;
  gradeName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type LoginHistory = {
  id: number;
  memberId: number;
  success: string;
  ip?: string;
  device?: string;
  createdAt?: string;
  logoutDate?: string;
};

const AdminMemberDetail = () => {

  const navigate =
    useNavigate();

  const {
    memberId
  } = useParams();

  const [
    member,
    setMember
  ] = useState<Member | null>(
    null
  );

  const [
    loginHistories,
    setLoginHistories
  ] = useState<LoginHistory[]>([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  useEffect(() => {

    const loadData = async () => {

      if (!memberId) {

        setError(
          "회원 번호가 없습니다."
        );

        setLoading(false);

        return;
      }

      try {

        setLoading(true);
        setError("");

        /**
         * 기본 회원 정보
         */
        const memberResponse =
          await axiosInstance.get<Member>(
            `/member/${memberId}`
          );

        /**
         * 해당 회원 로그인 내역
         */
        const historyResponse =
          await axiosInstance.get<LoginHistory[]>(
            `/login-history/member/${memberId}`
          );

        setMember(
          memberResponse.data
        );

        setLoginHistories(
          historyResponse.data
        );

      } catch (error) {

        console.error(
          "회원 상세 정보 조회 오류:",
          error
        );

        setError(
          "회원 정보를 불러오는 중 오류가 발생했습니다."
        );

      } finally {

        setLoading(false);
      }
    };

    loadData();

  }, [
    memberId
  ]);

  /**
   * 날짜 + 시간 표시
   */
  const formatDateTime = (
    date?: string
  ) => {

    if (!date) {
      return "-";
    }

    return date
      .replace("T", " ")
      .substring(
        0,
        19
      );
  };

  if (loading) {

    return (
      <main className="admin-member-detail-page">

        <div className="admin-member-detail-message">
          회원 정보를 불러오는 중입니다.
        </div>

      </main>
    );
  }

  if (
    error ||
    !member
  ) {

    return (
      <main className="admin-member-detail-page">

        <div className="admin-member-detail-message">
          {error || "회원 정보가 없습니다."}
        </div>

      </main>
    );
  }

  return (
    <main className="admin-member-detail-page">

      {/* 상단 */}
      <div className="admin-member-detail-heading">

        <div>

          <p>
            MEMBER INFORMATION
          </p>

          <h1>
            회원 정보
          </h1>

        </div>

        <button
          type="button"
          className="admin-member-detail-back"
          onClick={() =>
            navigate(
              "/admin/members"
            )
          }
        >
          목록으로
        </button>

      </div>


      {/* =========================
          01 기본 회원 정보
      ========================= */}

      <section className="admin-member-detail-section">

        <div className="admin-member-detail-section-title">

          <span>
            01
          </span>

          <h2>
            기본 회원 정보
          </h2>

        </div>

        <div className="admin-member-detail-grid">

          <div className="admin-member-detail-item">

            <span>
              회원 번호
            </span>

            <strong>
              {member.id}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              아이디
            </span>

            <strong>
              {member.loginId}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              이름
            </span>

            <strong>
              {member.name}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              닉네임
            </span>

            <strong>
              {member.nickname}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              이메일
            </span>

            <strong>
              {member.email}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              전화번호
            </span>

            <strong>
              {member.tel || "-"}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              등급
            </span>

            <strong>
              {member.gradeName || "-"}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              상태
            </span>

            <strong>
              {member.status}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              우편번호
            </span>

            <strong>
              {member.zipcode || "-"}
            </strong>

          </div>

          <div className="admin-member-detail-item admin-member-detail-wide">

            <span>
              기본 주소
            </span>

            <strong>
              {member.address1 || "-"}
            </strong>

          </div>

          <div className="admin-member-detail-item admin-member-detail-wide">

            <span>
              상세 주소
            </span>

            <strong>
              {member.address2 || "-"}
            </strong>

          </div>

          <div className="admin-member-detail-item">

            <span>
              가입일
            </span>

            <strong>
              {formatDateTime(
                member.createdAt
              )}
            </strong>

          </div>

        </div>

      </section>


      {/* =========================
          02 로그인 내역
      ========================= */}

      <section className="admin-member-detail-section">

        <div className="admin-member-detail-section-title">

          <span>
            02
          </span>

          <h2>
            로그인 내역
          </h2>

        </div>

        <div className="admin-login-history-wrap">

          <table className="admin-login-history-table">

            <thead>

              <tr>
                <th>번호</th>
                <th>로그인 내역 번호</th>
                <th>회원 번호</th>
                <th>성공 여부</th>
                <th>접속 IP</th>
                <th>기기 / 브라우저</th>
                <th>로그인 일시</th>
                <th>로그아웃 일시</th>
              </tr>

            </thead>

            <tbody>

              {loginHistories.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="admin-login-history-empty"
                  >
                    로그인 내역이 없습니다.
                  </td>

                </tr>

              ) : (

                loginHistories.map(
                  (
                    history,
                    index
                  ) => (

                    <tr
                      key={
                        history.id
                      }
                    >

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {history.id}
                      </td>

                      <td>
                        {history.memberId}
                      </td>

                      <td>

                        <span
                          className={
                            history.success === "Y"
                              ? "admin-login-success"
                              : "admin-login-fail"
                          }
                        >
                          {history.success === "Y"
                            ? "성공"
                            : "실패"}
                        </span>

                      </td>

                      <td>
                        {history.ip || "-"}
                      </td>

                      <td>
                        {history.device || "-"}
                      </td>

                      <td>
                        {formatDateTime(
                          history.createdAt
                        )}
                      </td>

                      <td>
                        {formatDateTime(
                          history.logoutDate
                        )}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

    </main>
  );
};

export default AdminMemberDetail;