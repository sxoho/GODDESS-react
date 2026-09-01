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

import {
  useGlobalStore
} from "../../../store/store";

import "../../../styles/admin/AdminNotice.css";


type Notice = {
  id: number;

  adminId: number;
  adminName: string;

  writerName: string;

  title: string;
  content: string;

  linkUrl?: string | null;

  fileOrigin?: string | null;
  fileSaved?: string | null;
  filePath?: string | null;
  fileSize?: number | null;

  viewCount: number;

  fixed: string;
  visible: string;

  createdAt?: string;
  updatedAt?: string;
};


const PAGE_SIZE = 8;


const AdminNoticeList = () => {

  const navigate =
    useNavigate();


  const {
    memberId
  } = useGlobalStore();


  const [
    notices,
    setNotices
  ] = useState<Notice[]>([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  /**
   * 검색어
   */
  const [
    searchKeyword,
    setSearchKeyword
  ] = useState("");


  /**
   * 현재 페이지
   */
  const [
    currentPage,
    setCurrentPage
  ] = useState(1);


  /**
   * 관리자 공지사항 전체 목록
   */
  const loadNotices =
    async () => {

      try {

        setLoading(true);
        setError("");


        const response =
          await axiosInstance.get<Notice[]>(
            "/notice/admin/list"
          );


        setNotices(
          response.data
        );


      } catch (error) {

        console.error(
          "관리자 공지사항 목록 조회 오류:",
          error
        );


        setError(
          "공지사항 목록을 불러오는 중 오류가 발생했습니다."
        );


      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    loadNotices();

  }, []);


  /**
   * 검색된 공지사항
   *
   * 제목 / 내용 / 작성자 검색
   */
  const filteredNotices =
    useMemo(
      () => {

        const keyword =
          searchKeyword
            .trim()
            .toLowerCase();


        if (!keyword) {

          return notices;
        }


        return notices.filter(
          (notice) => {

            const title =
              notice.title
                ?.toLowerCase() ||
              "";


            const content =
              notice.content
                ?.toLowerCase() ||
              "";


            const writerName =
              (
                notice.writerName ||
                notice.adminName ||
                "관리자"
              )
                .toLowerCase();


            return (
              title.includes(
                keyword
              ) ||
              content.includes(
                keyword
              ) ||
              writerName.includes(
                keyword
              )
            );
          }
        );
      },
      [
        notices,
        searchKeyword
      ]
    );


  /**
   * 전체 페이지 수
   */
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredNotices.length /
        PAGE_SIZE
      )
    );


  /**
   * 검색 결과가 바뀌면
   * 1페이지로 이동
   */
  useEffect(() => {

    setCurrentPage(1);

  }, [
    searchKeyword
  ]);


  /**
   * 삭제 등으로 전체 페이지 수가 줄어든 경우
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
   * 현재 페이지에 보여줄 공지
   */
  const pagedNotices =
    useMemo(
      () => {

        const startIndex =
          (
            currentPage - 1
          ) *
          PAGE_SIZE;


        return filteredNotices.slice(
          startIndex,
          startIndex +
          PAGE_SIZE
        );
      },
      [
        filteredNotices,
        currentPage
      ]
    );


  /**
   * 날짜 출력
   */
  const formatDate = (
    date?: string
  ) => {

    if (!date) {
      return "-";
    }


    return date.substring(
      0,
      10
    );
  };


  /**
   * 공지 수정용 FormData 생성
   */
  const createNoticeFormData = (
    notice: Notice,
    nextFixed: string,
    nextVisible: string
  ) => {

    const requestData = {

      adminId:
        memberId,

      writerName:
        notice.writerName ||
        "관리자",

      title:
        notice.title,

      content:
        notice.content,

      linkUrl:
        notice.linkUrl ||
        "",

      fixed:
        nextFixed,

      visible:
        nextVisible

    };


    const formData =
      new FormData();


    formData.append(
      "request",
      new Blob(
        [
          JSON.stringify(
            requestData
          )
        ],
        {
          type:
            "application/json"
        }
      )
    );


    return formData;
  };


  /**
   * 상단 고정 여부 변경
   */
  const handleFixedToggle =
    async (
      notice: Notice
    ) => {

      if (!memberId) {

        alert(
          "관리자 회원 정보를 확인할 수 없습니다."
        );

        return;
      }


      const nextFixed =
        notice.fixed === "Y"
          ? "N"
          : "Y";


      try {

        const formData =
          createNoticeFormData(
            notice,
            nextFixed,
            notice.visible
          );


        const response =
          await axiosInstance.put<Notice>(
            `/notice/admin/${notice.id}`,
            formData
          );


        setNotices(
          (prevNotices) =>
            prevNotices.map(
              (item) =>
                item.id ===
                notice.id
                  ? response.data
                  : item
            )
        );


      } catch (error) {

        console.error(
          "공지사항 상단 고정 변경 오류:",
          error
        );


        alert(
          "상단 고정 상태 변경 중 오류가 발생했습니다."
        );
      }
    };


  /**
   * 공개 여부 변경
   */
  const handleVisibleToggle =
    async (
      notice: Notice
    ) => {

      if (!memberId) {

        alert(
          "관리자 회원 정보를 확인할 수 없습니다."
        );

        return;
      }


      const nextVisible =
        notice.visible === "Y"
          ? "N"
          : "Y";


      try {

        const formData =
          createNoticeFormData(
            notice,
            notice.fixed,
            nextVisible
          );


        const response =
          await axiosInstance.put<Notice>(
            `/notice/admin/${notice.id}`,
            formData
          );


        setNotices(
          (prevNotices) =>
            prevNotices.map(
              (item) =>
                item.id ===
                notice.id
                  ? response.data
                  : item
            )
        );


      } catch (error) {

        console.error(
          "공지사항 공개 여부 변경 오류:",
          error
        );


        alert(
          "공개 여부 변경 중 오류가 발생했습니다."
        );
      }
    };


  /**
   * 공지 삭제
   */
  const handleDelete =
    async (
      noticeId: number
    ) => {

      if (!memberId) {

        alert(
          "관리자 회원 정보를 확인할 수 없습니다."
        );

        return;
      }


      const confirmDelete =
        window.confirm(
          "공지사항을 삭제하시겠습니까?"
        );


      if (!confirmDelete) {
        return;
      }


      try {

        await axiosInstance.delete(
          `/notice/admin/${noticeId}`,
          {
            params: {
              adminId:
                memberId
            }
          }
        );


        alert(
          "공지사항이 삭제되었습니다."
        );


        await loadNotices();


      } catch (error) {

        console.error(
          "공지사항 삭제 오류:",
          error
        );


        alert(
          "공지사항 삭제 중 오류가 발생했습니다."
        );
      }
    };


  return (

    <main className="admin-notice-page">

      <div className="admin-notice-heading">

        <div>

          <p>
            NOTICE MANAGEMENT
          </p>


          <h1>
            공지사항 관리
          </h1>

        </div>


        <div className="admin-notice-heading-actions">

          <div className="admin-notice-search">

            <div className="admin-notice-search-box">

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
                placeholder="제목, 내용, 작성자 검색"
              />


              <span className="admin-notice-search-icon">
                Search
              </span>

            </div>


            {searchKeyword && (

              <button
                type="button"
                className="admin-notice-search-reset"
                onClick={
                  () =>
                    setSearchKeyword("")
                }
              >
                초기화
              </button>

            )}

          </div>


          <button
            type="button"
            className="admin-notice-create-button"
            onClick={
              () =>
                navigate(
                  "/admin/notices/create"
                )
            }
          >
            공지 등록
          </button>

        </div>

      </div>


      {!loading &&
        !error &&
        searchKeyword.trim() && (

          <div className="admin-notice-search-result">

            <span>
              검색 결과
            </span>

            <strong>
              {
                filteredNotices.length
              }
            </strong>

            <span>
              건
            </span>

          </div>

        )}


      {loading ? (

        <div className="admin-notice-message">
          공지사항을 불러오는 중입니다.
        </div>

      ) : error ? (

        <div className="admin-notice-message">
          {error}
        </div>

      ) : filteredNotices.length === 0 ? (

        <div className="admin-notice-message">

          {
            searchKeyword.trim()
              ? "검색 결과가 없습니다."
              : "등록된 공지사항이 없습니다."
          }

        </div>

      ) : (

        <>

          <div className="admin-notice-table-wrap">

            <table className="admin-notice-table">

              <thead>

                <tr>

                  <th>
                    번호
                  </th>

                  <th>
                    제목
                  </th>

                  <th>
                    작성자
                  </th>

                  <th>
                    상단 고정
                  </th>

                  <th>
                    공개 여부
                  </th>

                  <th>
                    조회수
                  </th>

                  <th>
                    등록일
                  </th>

                  <th>
                    관리
                  </th>

                </tr>

              </thead>


              <tbody>

                {pagedNotices.map(
                  (
                    notice,
                    index
                  ) => {

                    const globalIndex =
                      (
                        currentPage - 1
                      ) *
                      PAGE_SIZE +
                      index;


                    return (

                      <tr
                        key={
                          notice.id
                        }
                      >

                        <td>
                          {
                            filteredNotices.length -
                            globalIndex
                          }
                        </td>


                        <td>

                          <button
                            type="button"
                            className="admin-notice-title-button"
                            onClick={
                              () =>
                                navigate(
                                  `/admin/notices/${notice.id}`
                                )
                            }
                          >

                            {notice.fixed === "Y" && (

                              <span>
                                [고정]
                              </span>

                            )}

                            {notice.title}

                          </button>

                        </td>


                        <td>
                          {
                            notice.writerName ||
                            "관리자"
                          }
                        </td>


                        <td>

                          <button
                            type="button"
                            className={
                              notice.fixed === "Y"
                                ? "admin-notice-state fixed active"
                                : "admin-notice-state fixed"
                            }
                            onClick={
                              () =>
                                handleFixedToggle(
                                  notice
                                )
                            }
                          >

                            {
                              notice.fixed === "Y"
                                ? "고정"
                                : "일반"
                            }

                          </button>

                        </td>


                        <td>

                          <button
                            type="button"
                            className={
                              notice.visible === "Y"
                                ? "admin-notice-state visible active"
                                : "admin-notice-state visible hidden"
                            }
                            onClick={
                              () =>
                                handleVisibleToggle(
                                  notice
                                )
                            }
                          >

                            {
                              notice.visible === "Y"
                                ? "공개"
                                : "비공개"
                            }

                          </button>

                        </td>


                        <td>
                          {notice.viewCount}
                        </td>


                        <td>
                          {
                            formatDate(
                              notice.createdAt
                            )
                          }
                        </td>


                        <td>

                          <div className="admin-notice-actions">

                            <button
                              type="button"
                              onClick={
                                () =>
                                  navigate(
                                    `/admin/notices/${notice.id}/update`
                                  )
                              }
                            >
                              수정
                            </button>


                            <button
                              type="button"
                              className="delete"
                              onClick={
                                () =>
                                  handleDelete(
                                    notice.id
                                  )
                              }
                            >
                              삭제
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>


          <div className="admin-notice-pagination">

            <button
              type="button"
              className="admin-notice-page-arrow"
              disabled={
                currentPage === 1
              }
              onClick={
                () =>
                  setCurrentPage(
                    (prev) =>
                      prev - 1
                  )
              }
            >
              이전
            </button>


            {
              Array.from(
                {
                  length:
                    totalPages
                },
                (
                  _,
                  index
                ) => {

                  const page =
                    index + 1;


                  return (

                    <button
                      type="button"
                      key={
                        page
                      }
                      className={
                        currentPage ===
                        page
                          ? "admin-notice-page-number active"
                          : "admin-notice-page-number"
                      }
                      onClick={
                        () =>
                          setCurrentPage(
                            page
                          )
                      }
                    >
                      {page}
                    </button>

                  );
                }
              )
            }


            <button
              type="button"
              className="admin-notice-page-arrow"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={
                () =>
                  setCurrentPage(
                    (prev) =>
                      prev + 1
                  )
              }
            >
              다음
            </button>

          </div>

        </>
      )}

    </main>
  );
};


export default AdminNoticeList;