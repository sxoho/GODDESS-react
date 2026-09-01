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
} from "../../components/ToolBak";

import "../../styles/notice/Notice.css";


type Notice = {
  id: number;

  adminId: number;
  adminName: string;

  writerName?: string | null;

  title: string;
  content: string;

  viewCount: number;

  fixed: string;
  visible: string;

  createdAt?: string;
  updatedAt?: string;
};


const PAGE_SIZE = 8;


const NoticeList = () => {

  const navigate =
    useNavigate();


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
   * 공개 공지 목록
   */
  const loadNotices =
    async () => {

      try {

        setLoading(true);
        setError("");


        const response =
          await axiosInstance.get<Notice[]>(
            "/notice"
          );


        setNotices(
          response.data
        );


      } catch (error) {

        console.error(
          "공지사항 조회 오류:",
          error
        );


        setError(
          "공지사항을 불러오는 중 오류가 발생했습니다."
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


  useEffect(() => {

    setCurrentPage(1);

  }, [
    searchKeyword
  ]);


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
   * 현재 페이지 공지사항
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
   * 날짜
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


  return (

    <main className="notice-page">

      <section className="notice-heading">

        <p>
          ONNIVER
        </p>


        <h1>
          NOTICE
        </h1>


        <span>
          ONNIVER의 새로운 소식과 안내사항을 확인하세요.
        </span>

      </section>


      <div className="notice-list-top">

        <div />


        <div className="notice-search">

          <div className="notice-search-box">

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


            <span className="notice-search-icon">
              Search
            </span>

          </div>


          {searchKeyword && (

            <button
              type="button"
              className="notice-search-reset"
              onClick={
                () =>
                  setSearchKeyword("")
              }
            >
              초기화
            </button>

          )}

        </div>

      </div>


      {!loading &&
        !error &&
        searchKeyword.trim() && (

          <div className="notice-search-result">

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

        <div className="notice-message">
          공지사항을 불러오는 중입니다.
        </div>

      ) : error ? (

        <div className="notice-message">
          {error}
        </div>

      ) : filteredNotices.length === 0 ? (

        <div className="notice-message">

          {
            searchKeyword.trim()
              ? "검색 결과가 없습니다."
              : "등록된 공지사항이 없습니다."
          }

        </div>

      ) : (

        <>

          <section className="notice-list-section">

            <div className="notice-list-header">

              <span>번호</span>
              <span>제목</span>
              <span>작성자</span>
              <span>등록일</span>
              <span>조회수</span>

            </div>


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

                  <button
                    type="button"
                    key={
                      notice.id
                    }
                    className={
                      notice.fixed === "Y"
                        ? "notice-list-row notice-fixed"
                        : "notice-list-row"
                    }
                    onClick={
                      () =>
                        navigate(
                          `/notice/${notice.id}`
                        )
                    }
                  >

                    <span className="notice-number">

                      {
                        notice.fixed === "Y"
                          ? (

                            <strong>
                              공지
                            </strong>

                          )
                          : (
                            filteredNotices.length -
                            globalIndex
                          )
                      }

                    </span>


                    <span className="notice-title">

                      {notice.fixed === "Y" && (

                        <span className="notice-fixed-label">
                          NOTICE
                        </span>

                      )}

                      {notice.title}

                    </span>


                    <span>
                      {
                        notice.writerName ||
                        notice.adminName ||
                        "관리자"
                      }
                    </span>


                    <span>
                      {
                        formatDate(
                          notice.createdAt
                        )
                      }
                    </span>


                    <span>
                      {notice.viewCount}
                    </span>

                  </button>

                );
              }
            )}

          </section>


          <div className="notice-pagination">

            <button
              type="button"
              className="notice-page-arrow"
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
                          ? "notice-page-number active"
                          : "notice-page-number"
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
              className="notice-page-arrow"
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


export default NoticeList;