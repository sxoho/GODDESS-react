import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  axiosInstance
} from "../../../components/ToolBak";

import "../../../styles/admin/AdminMemberList.css";


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


type MemberFilter =
  | "USER"
  | "GOLD"
  | "VIP"
  | "ADMIN"
  | "WITHDRAWN";


/**
 * 한 페이지에 표시할 회원 수
 */
const PAGE_SIZE = 6;


const AdminMemberList = () => {

  const navigate =
    useNavigate();


  /**
   * ACTIVE 회원
   */
  const [
    members,
    setMembers
  ] = useState<Member[]>([]);


  /**
   * 탈퇴 회원
   */
  const [
    withdrawnMembers,
    setWithdrawnMembers
  ] = useState<Member[]>([]);


  /**
   * 상단 검색
   */
  const [
    searchKeyword,
    setSearchKeyword
  ] = useState("");


  /**
   * 상단 회원 목록 현재 페이지
   */
  const [
    currentPage,
    setCurrentPage
  ] = useState(1);


  /**
   * 하단 등급별 조회
   */
  const [
    selectedFilter,
    setSelectedFilter
  ] = useState<MemberFilter>(
    "USER"
  );


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  /**
   * ACTIVE 회원 목록 조회
   */
  const loadMembers = async () => {

    try {

      setLoading(true);
      setError("");


      const response =
        await axiosInstance.get<Member[]>(
          "/member/find_all"
        );


      console.log(
        "-> ACTIVE 회원 목록:",
        response.data
      );


      setMembers(
        response.data
      );


    } catch (error) {

      console.error(
        "회원 목록 조회 오류:",
        error
      );


      setError(
        "회원 목록을 불러오는 중 오류가 발생했습니다."
      );


    } finally {

      setLoading(false);
    }
  };


  /**
   * 탈퇴 회원 목록 조회
   */
  const loadWithdrawnMembers =
    async () => {

      try {

        const response =
          await axiosInstance.get<Member[]>(
            "/member/find_withdrawn"
          );


        console.log(
          "-> 탈퇴 회원 목록:",
          response.data
        );


        setWithdrawnMembers(
          response.data
        );


      } catch (error) {

        console.error(
          "탈퇴 회원 조회 오류:",
          error
        );
      }
    };


  /**
   * 처음 화면 진입 시
   * 회원 목록 조회
   */
  useEffect(() => {

    loadMembers();

    loadWithdrawnMembers();

  }, []);


  /**
   * 상단 검색
   *
   * ACTIVE 회원 중
   * 아이디 / 이름 / 닉네임 검색
   */
  const filteredMembers =
    useMemo(() => {

      const keyword =
        searchKeyword
          .trim()
          .toLowerCase();


      if (!keyword) {

        return members;
      }


      return members.filter(
        (member) => {

          const loginId =
            member.loginId
              ?.toLowerCase()
            ?? "";


          const name =
            member.name
              ?.toLowerCase()
            ?? "";


          const nickname =
            member.nickname
              ?.toLowerCase()
            ?? "";


          return (
            loginId.includes(
              keyword
            )
            ||
            name.includes(
              keyword
            )
            ||
            nickname.includes(
              keyword
            )
          );
        }
      );


    }, [
      members,
      searchKeyword
    ]);


  /**
   * 검색어 변경 시
   * 1페이지로 이동
   */
  useEffect(() => {

    setCurrentPage(1);

  }, [
    searchKeyword
  ]);


  /**
   * 전체 페이지 수
   *
   * 회원이 없어도
   * 페이지 1은 표시
   */
  const totalPages =
    Math.max(
      Math.ceil(
        filteredMembers.length /
        PAGE_SIZE
      ),
      1
    );


  /**
   * 회원 삭제 등으로
   * 현재 페이지가 없어지는 경우
   * 마지막 페이지로 이동
   */
  useEffect(() => {

    if (
      currentPage >
      totalPages
    ) {

      setCurrentPage(
        totalPages
      );
    }

  }, [
    currentPage,
    totalPages
  ]);


  /**
   * 현재 페이지에 표시할 회원
   */
  const pagedMembers =
    useMemo(() => {

      const startIndex =
        (currentPage - 1) *
        PAGE_SIZE;


      const endIndex =
        startIndex +
        PAGE_SIZE;


      return filteredMembers.slice(
        startIndex,
        endIndex
      );


    }, [
      filteredMembers,
      currentPage
    ]);


  /**
   * 하단 회원 구분
   */
  const categoryMembers =
    useMemo(() => {

      switch (
        selectedFilter
      ) {

        case "USER":

          return members.filter(
            (member) =>
              member.gradeId === 1
          );


        case "GOLD":

          return members.filter(
            (member) =>
              member.gradeId === 2
          );


        case "VIP":

          return members.filter(
            (member) =>
              member.gradeId === 3
          );


        case "ADMIN":

          return members.filter(
            (member) =>
              member.gradeId === 4
          );


        case "WITHDRAWN":

          return withdrawnMembers;


        default:

          return [];
      }


    }, [
      members,
      withdrawnMembers,
      selectedFilter
    ]);


  /**
   * 회원 삭제
   *
   * DB에서는 WITHDRAWN 처리
   */
  const handleDelete = async (
    member: Member
  ) => {

    const confirmDelete =
      window.confirm(
        `${member.loginId} 회원을 삭제하시겠습니까?`
      );


    if (!confirmDelete) {

      return;
    }


    try {

      await axiosInstance.delete(
        `/member/${member.id}`
      );


      /**
       * ACTIVE 목록에서 즉시 제거
       */
      setMembers(
        (prevMembers) =>
          prevMembers.filter(
            (item) =>
              item.id !==
              member.id
          )
      );


      /**
       * 탈퇴 회원 목록 다시 조회
       */
      await loadWithdrawnMembers();


      alert(
        "회원이 삭제되었습니다."
      );


    } catch (error) {

      console.error(
        "회원 삭제 오류:",
        error
      );


      alert(
        "회원 삭제 처리 중 오류가 발생했습니다."
      );
    }
  };


  /**
   * 날짜 표시
   */
  const formatDate = (
    createdAt?: string
  ) => {

    if (!createdAt) {

      return "-";
    }


    return createdAt.substring(
      0,
      10
    );
  };


  /**
   * 회원 구분 제목
   */
  const getFilterTitle = () => {

    switch (
      selectedFilter
    ) {

      case "USER":
        return "USER 회원";


      case "GOLD":
        return "GOLD 회원";


      case "VIP":
        return "VIP 회원";


      case "ADMIN":
        return "관리자 회원";


      case "WITHDRAWN":
        return "탈퇴 회원";


      default:
        return "";
    }
  };


  /**
   * 회원 상세 페이지 이동
   */
  const moveToDetail = (
    memberId: number
  ) => {

    navigate(
      `/admin/members/${memberId}/detail`
    );
  };


  return (
    <main className="admin-member-page">


      {/* =========================
          상단 회원 관리
      ========================= */}

      <div className="admin-member-heading">

        <div className="admin-member-title">

          <p>
            MEMBER MANAGEMENT
          </p>

          <h1>
            회원 관리
          </h1>

        </div>


        {/* 검색 */}
        <div className="admin-member-search">

          <div className="admin-member-search-box">

            <input
              type="text"
              value={
                searchKeyword
              }
              onChange={
                (event) =>
                  setSearchKeyword(
                    event.target.value
                  )
              }
              placeholder="아이디, 이름, 닉네임 검색"
            />


            <span className="admin-member-search-icon">
              Search
            </span>

          </div>


          {searchKeyword && (

            <button
              type="button"
              className="admin-member-search-reset"
              onClick={() =>
                setSearchKeyword("")
              }
            >
              초기화
            </button>

          )}

        </div>

      </div>


      {/* =========================
          검색 결과
      ========================= */}

      {!loading &&
        !error &&
        searchKeyword.trim() && (

          <div className="admin-member-search-result">

            <span>
              검색 결과
            </span>

            <strong>
              {filteredMembers.length}
            </strong>

            <span>
              명
            </span>

          </div>

        )}


      {/* =========================
          로딩
      ========================= */}

      {loading && (

        <div className="admin-message">
          회원 정보를 불러오는 중입니다.
        </div>

      )}


      {/* =========================
          오류
      ========================= */}

      {error && (

        <div className="admin-message">
          {error}
        </div>

      )}


      {/* =========================
          ACTIVE 회원 전체 목록
      ========================= */}

      {!loading &&
        !error && (

          <div className="admin-member-table-wrap">

            <table className="admin-member-table">

              <thead>

                <tr>

                  <th>번호</th>

                  <th>아이디</th>

                  <th>이름</th>

                  <th>닉네임</th>

                  <th>이메일</th>

                  <th>전화번호</th>

                  <th>등급</th>

                  <th>상태</th>

                  <th>가입일</th>

                  <th>관리</th>

                </tr>

              </thead>


              <tbody>

                {filteredMembers.length === 0 ? (

                  <tr>

                    <td
                      colSpan={10}
                      className="admin-member-empty"
                    >

                      {
                        searchKeyword.trim()
                          ? "검색 결과가 없습니다."
                          : "등록된 회원이 없습니다."
                      }

                    </td>

                  </tr>

                ) : (

                  pagedMembers.map(
                    (
                      member,
                      index
                    ) => (

                      <tr
                        key={
                          member.id
                        }
                      >


                        {/* 번호 */}
                        <td>

                          {
                            (currentPage - 1)
                            *
                            PAGE_SIZE
                            +
                            index
                            +
                            1
                          }

                        </td>


                        {/* 아이디 클릭 → 상세 */}
                        <td>

                          <button
                            type="button"
                            className="admin-member-detail-link"
                            onClick={() =>
                              moveToDetail(
                                member.id
                              )
                            }
                          >
                            {member.loginId}
                          </button>

                        </td>


                        {/* 이름 클릭 → 상세 */}
                        <td>

                          <button
                            type="button"
                            className="admin-member-detail-link"
                            onClick={() =>
                              moveToDetail(
                                member.id
                              )
                            }
                          >
                            {member.name}
                          </button>

                        </td>


                        <td>
                          {member.nickname}
                        </td>


                        <td>
                          {member.email}
                        </td>


                        <td>
                          {member.tel || "-"}
                        </td>


                        <td>
                          {member.gradeName || "-"}
                        </td>


                        <td>

                          <span className="admin-member-status-active">
                            {member.status}
                          </span>

                        </td>


                        <td>

                          {
                            formatDate(
                              member.createdAt
                            )
                          }

                        </td>


                        <td>

                          <div className="admin-member-actions">


                            {/* 수정 */}
                            <button
                              type="button"
                              className="admin-member-edit"
                              onClick={() =>
                                navigate(
                                  `/admin/members/${member.id}/edit`
                                )
                              }
                            >
                              수정
                            </button>


                            {/* 삭제 */}
                            <button
                              type="button"
                              className="admin-member-delete"
                              onClick={() =>
                                handleDelete(
                                  member
                                )
                              }
                            >
                              삭제
                            </button>


                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        )}


      {/* =========================
          회원 목록 페이징
          항상 표시
      ========================= */}

      {!loading &&
        !error && (

          <div className="admin-member-pagination">


            {/* 이전 */}
            <button
              type="button"
              className="admin-member-page-arrow"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    prev - 1
                )
              }
            >
              이전
            </button>


            {/* 페이지 번호 */}
            {
              Array.from(
                {
                  length:
                    totalPages
                },
                (
                  _,
                  index
                ) =>
                  index + 1
              ).map(
                (page) => (

                  <button
                    type="button"
                    key={
                      page
                    }
                    className={
                      currentPage ===
                      page
                        ? "admin-member-page-number active"
                        : "admin-member-page-number"
                    }
                    onClick={() =>
                      setCurrentPage(
                        page
                      )
                    }
                  >
                    {page}
                  </button>

                )
              )
            }


            {/* 다음 */}
            <button
              type="button"
              className="admin-member-page-arrow"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    prev + 1
                )
              }
            >
              다음
            </button>


          </div>

        )}


      {/* =========================
          등급별 회원 조회
      ========================= */}

      {!loading &&
        !error && (

          <section className="admin-member-category-section">


            <div className="admin-member-category-header">

              <p>
                MEMBER CATEGORY
              </p>

              <h2>
                회원 구분
              </h2>

              <span>
                회원 등급 또는 탈퇴 상태에 따라
                회원을 확인할 수 있습니다.
              </span>

            </div>


            {/* =========================
                회원 구분 버튼
            ========================= */}

            <div className="admin-member-category-buttons">


              {/* USER */}
              <button
                type="button"
                className={
                  selectedFilter ===
                  "USER"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedFilter(
                    "USER"
                  )
                }
              >

                USER 회원

                <strong>

                  {
                    members.filter(
                      (member) =>
                        member.gradeId ===
                        1
                    ).length
                  }

                </strong>

              </button>


              {/* GOLD */}
              <button
                type="button"
                className={
                  selectedFilter ===
                  "GOLD"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedFilter(
                    "GOLD"
                  )
                }
              >

                GOLD 회원

                <strong>

                  {
                    members.filter(
                      (member) =>
                        member.gradeId ===
                        2
                    ).length
                  }

                </strong>

              </button>


              {/* VIP */}
              <button
                type="button"
                className={
                  selectedFilter ===
                  "VIP"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedFilter(
                    "VIP"
                  )
                }
              >

                VIP 회원

                <strong>

                  {
                    members.filter(
                      (member) =>
                        member.gradeId ===
                        3
                    ).length
                  }

                </strong>

              </button>


              {/* ADMIN */}
              <button
                type="button"
                className={
                  selectedFilter ===
                  "ADMIN"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedFilter(
                    "ADMIN"
                  )
                }
              >

                관리자 회원

                <strong>

                  {
                    members.filter(
                      (member) =>
                        member.gradeId ===
                        4
                    ).length
                  }

                </strong>

              </button>


              {/* 탈퇴 회원 */}
              <button
                type="button"
                className={
                  selectedFilter ===
                  "WITHDRAWN"
                    ? "active withdrawn"
                    : "withdrawn"
                }
                onClick={() =>
                  setSelectedFilter(
                    "WITHDRAWN"
                  )
                }
              >

                탈퇴 회원

                <strong>

                  {
                    withdrawnMembers.length
                  }

                </strong>

              </button>


            </div>


            {/* =========================
                선택된 회원 목록
            ========================= */}

            <div className="admin-member-category-list">


              <div className="admin-member-category-list-title">

                <h3>
                  {getFilterTitle()}
                </h3>

                <span>
                  총 {categoryMembers.length}명
                </span>

              </div>


              <div className="admin-member-category-table-wrap">

                <table className="admin-member-category-table">

                  <thead>

                    <tr>

                      <th>번호</th>

                      <th>아이디</th>

                      <th>이름</th>

                      <th>닉네임</th>

                      <th>이메일</th>

                    </tr>

                  </thead>


                  <tbody>

                    {categoryMembers.length === 0 ? (

                      <tr>

                        <td
                          colSpan={5}
                          className="admin-member-category-empty"
                        >
                          해당 회원이 없습니다.
                        </td>

                      </tr>

                    ) : (

                      categoryMembers.map(
                        (
                          member,
                          index
                        ) => (

                          <tr
                            key={
                              member.id
                            }
                          >


                            <td>
                              {index + 1}
                            </td>


                            {/* 아이디 클릭 → 상세 */}
                            <td>

                              <button
                                type="button"
                                className="admin-member-detail-link"
                                onClick={() =>
                                  moveToDetail(
                                    member.id
                                  )
                                }
                              >
                                {member.loginId}
                              </button>

                            </td>


                            {/* 이름 클릭 → 상세 */}
                            <td>

                              <button
                                type="button"
                                className="admin-member-detail-link"
                                onClick={() =>
                                  moveToDetail(
                                    member.id
                                  )
                                }
                              >
                                {member.name}
                              </button>

                            </td>


                            <td>
                              {member.nickname}
                            </td>


                            <td>
                              {member.email}
                            </td>


                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>

        )}

    </main>
  );
};


export default AdminMemberList;