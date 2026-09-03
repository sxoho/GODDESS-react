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
} from "../../components/ToolBak";

import "../../styles/notice/Notice.css";


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


const NoticeDetail = () => {

  const navigate =
    useNavigate();


  const {
    noticeId
  } = useParams();


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


  useEffect(() => {

    const loadNotice =
      async () => {

        if (!noticeId) {

          setError(
            "공지 번호가 올바르지 않습니다."
          );

          setLoading(false);

          return;
        }


        try {

          setLoading(true);


          const response =
            await axiosInstance.get<Notice>(
              `/notice/${noticeId}`
            );


          setNotice(
            response.data
          );


        } catch (error) {

          console.error(
            "공지사항 상세 조회 오류:",
            error
          );


          setError(
            "공지사항을 불러오는 중 오류가 발생했습니다."
          );


        } finally {

          setLoading(false);
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
   * 파일 크기 표시
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
   * 첨부파일 다운로드
   */
  const handleFileDownload = async () => {

    if (
      !notice ||
      !notice.fileOrigin
    ) {

      return;
    }


    try {

      const response =
        await axiosInstance.get(
          `/notice/${notice.id}/file`,
          {
            responseType:
              "blob"
          }
        );


      const fileBlob =
        new Blob(
          [
            response.data
          ]
        );


      const fileUrl =
        window.URL.createObjectURL(
          fileBlob
        );


      const downloadLink =
        document.createElement(
          "a"
        );


      downloadLink.href =
        fileUrl;


      downloadLink.download =
        notice.fileOrigin;


      document.body.appendChild(
        downloadLink
      );


      downloadLink.click();


      downloadLink.remove();


      window.URL.revokeObjectURL(
        fileUrl
      );


    } catch (error) {

      console.error(
        "첨부파일 다운로드 오류:",
        error
      );


      alert(
        "첨부파일 다운로드 중 오류가 발생했습니다."
      );
    }
  };


  if (loading) {

    return (

      <main className="notice-page">

        <div className="notice-message">
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

      <main className="notice-page">

        <div className="notice-message">

          {
            error ||
            "공지사항을 찾을 수 없습니다."
          }

        </div>

      </main>
    );
  }


  return (

    <main className="notice-page">

      <section className="notice-heading">

        <p>
          GODDESS
        </p>


        <h1>
          NOTICE
        </h1>

      </section>


      <article className="notice-detail">

        <header className="notice-detail-heading">

          {notice.fixed === "Y" && (

            <span className="notice-detail-fixed">
              NOTICE
            </span>

          )}


          <h2>
            {notice.title}
          </h2>


          <div className="notice-detail-info">

            <span>
              작성자 {
                notice.writerName ||
                "관리자"
              }
            </span>


            <span>

              {
                formatDateTime(
                  notice.createdAt
                )
              }

            </span>


            <span>
              조회 {notice.viewCount}
            </span>

          </div>

        </header>


        <div className="notice-detail-content">

          {notice.content}

        </div>


        {
          (
            notice.linkUrl ||
            notice.fileOrigin
          ) && (

            <div className="notice-detail-extra">

              {notice.linkUrl && (

                <div className="notice-detail-extra-row">

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

                <div className="notice-detail-extra-row">

                  <strong>
                    첨부파일
                  </strong>


                  <button
                    type="button"
                    className="notice-file-download"
                    onClick={
                      handleFileDownload
                    }
                  >

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

                  </button>

                </div>

              )}

            </div>

          )
        }


        <div className="notice-detail-actions">

          <button
            type="button"
            onClick={
              () =>
                navigate(-1)
            }
          >
            뒤로가기
          </button>


          <button
            type="button"
            className="notice-list-button"
            onClick={
              () =>
                navigate(
                  "/notice"
                )
            }
          >
            목록
          </button>

        </div>

      </article>

    </main>
  );
};


export default NoticeDetail;