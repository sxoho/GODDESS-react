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


const AdminNoticeDetail = () => {

  const navigate =
    useNavigate();


  const {
    noticeId
  } = useParams();


  const {
    memberId
  } = useGlobalStore();


  const [
    notice,
    setNotice
  ] = useState<Notice | null>(
    null
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
   * 관리자 상세 조회
   *
   * 일반 NOTICE 상세 API가 아니므로
   * 조회수는 증가하지 않음
   */
  useEffect(() => {

    if (!noticeId) {

      setError(
        "공지사항 번호가 올바르지 않습니다."
      );

      setLoading(
        false
      );

      return;
    }


    const loadNotice =
      async () => {

        try {

          setLoading(
            true
          );


          const response =
            await axiosInstance.get<Notice>(
              `/notice/admin/${noticeId}`
            );


          setNotice(
            response.data
          );


        } catch (error) {

          console.error(
            "관리자 공지 상세 조회 오류:",
            error
          );


          setError(
            "공지사항을 불러오는 중 오류가 발생했습니다."
          );


        } finally {

          setLoading(
            false
          );
        }
      };


    loadNotice();

  }, [
    noticeId
  ]);


  /**
   * 날짜 + 시간
   */
  const formatDateTime = (
    date?: string
  ) => {

    if (!date) {
      return "-";
    }


    return date
      .replace(
        "T",
        " "
      )
      .substring(
        0,
        16
      );
  };


  /**
   * 파일 크기 출력
   */
  const formatFileSize = (
    size?: number | null
  ) => {

    if (
      size === null ||
      size === undefined
    ) {

      return "";
    }


    if (size < 1024) {

      return `${size} B`;
    }


    if (
      size < 1024 * 1024
    ) {

      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }


    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };


  /**
   * 삭제
   */
  const handleDelete =
    async () => {

      if (
        !noticeId ||
        !memberId
      ) {

        alert(
          "공지사항 또는 관리자 정보를 확인할 수 없습니다."
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
              adminId: memberId
            }
          }
        );


        alert(
          "공지사항이 삭제되었습니다."
        );


        navigate(
          "/admin/notices"
        );


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


  if (loading) {

    return (

      <main className="admin-notice-page">

        <div className="admin-notice-message">
          공지사항을 불러오는 중입니다.
        </div>

      </main>
    );
  }


  if (
    error ||
    !notice
  ) {

    return (

      <main className="admin-notice-page">

        <div className="admin-notice-message">

          {
            error ||
            "공지사항을 찾을 수 없습니다."
          }

        </div>

      </main>
    );
  }


  return (

    <main className="admin-notice-page">

      <div className="admin-notice-heading">

        <div>

          <p>
            NOTICE MANAGEMENT
          </p>


          <h1>
            공지사항 상세
          </h1>

        </div>

      </div>


      <article className="admin-notice-detail">

        <div className="admin-notice-detail-heading">

          <div className="admin-notice-detail-state">

            {notice.fixed === "Y" && (

              <span className="admin-notice-state fixed active">
                상단 고정
              </span>

            )}


            <span
              className={
                notice.visible === "Y"
                  ? "admin-notice-state visible active"
                  : "admin-notice-state visible hidden"
              }
            >

              {
                notice.visible === "Y"
                  ? "공개"
                  : "비공개"
              }

            </span>

          </div>


          <h2>
            {notice.title}
          </h2>


          <div className="admin-notice-detail-info">

            <span>
              작성자 {
                notice.writerName ||
                "관리자"
              }
            </span>


            <span>
              등록일 {
                formatDateTime(
                  notice.createdAt
                )
              }
            </span>


            <span>
              조회수 {notice.viewCount}
            </span>

          </div>

        </div>


        <div className="admin-notice-detail-content">

          {notice.content}

        </div>


        {
          (
            notice.linkUrl ||
            notice.fileOrigin
          ) && (

            <div className="admin-notice-detail-extra">

              {notice.linkUrl && (

                <div className="admin-notice-detail-extra-row">

                  <strong>
                    관련 링크
                  </strong>


                  <a
                    href={
                      notice.linkUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {notice.linkUrl}
                  </a>

                </div>

              )}


              {notice.fileOrigin && (

                <div className="admin-notice-detail-extra-row">

                  <strong>
                    첨부파일
                  </strong>


                  <span>

                    {notice.fileOrigin}

                    {notice.fileSize != null && (

                      <>
                        {" "}
                        (
                        {
                          formatFileSize(
                            notice.fileSize
                          )
                        }
                        )
                      </>

                    )}

                  </span>

                </div>

              )}

            </div>

          )
        }


        <div className="admin-notice-detail-actions">

          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/admin/notices"
                )
            }
          >
            목록
          </button>


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
              handleDelete
            }
          >
            삭제
          </button>

        </div>

      </article>

    </main>
  );
};


export default AdminNoticeDetail;