import {
  useEffect,
  useRef,
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


const AdminNoticeUpdate = () => {

  const navigate =
    useNavigate();


  const {
    noticeId
  } = useParams();


  const {
    memberId,
    gradeId
  } = useGlobalStore();


  /**
   * 파일 input 접근
   */
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const [
    writerName,
    setWriterName
  ] = useState(
    "관리자"
  );


  const [
    title,
    setTitle
  ] = useState("");


  const [
    content,
    setContent
  ] = useState("");


  const [
    linkUrl,
    setLinkUrl
  ] = useState("");


  /**
   * 기존 첨부파일명
   */
  const [
    currentFileName,
    setCurrentFileName
  ] = useState("");


  /**
   * 새로 선택한 첨부파일
   */
  const [
    file,
    setFile
  ] = useState<File | null>(
    null
  );


  const [
    fixed,
    setFixed
  ] = useState("N");


  const [
    visible,
    setVisible
  ] = useState("Y");


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    saving,
    setSaving
  ] = useState(false);


  /**
   * 기존 공지사항 불러오기
   */
  useEffect(() => {

    if (!noticeId) {

      alert(
        "공지사항 번호가 올바르지 않습니다."
      );


      navigate(
        "/admin/notices"
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


          setWriterName(
            response.data.writerName ||
            "관리자"
          );


          setTitle(
            response.data.title
          );


          setContent(
            response.data.content
          );


          setLinkUrl(
            response.data.linkUrl ||
            ""
          );


          setCurrentFileName(
            response.data.fileOrigin ||
            ""
          );


          setFixed(
            response.data.fixed
          );


          setVisible(
            response.data.visible
          );


        } catch (error) {

          console.error(
            "공지사항 상세 조회 오류:",
            error
          );


          alert(
            "공지사항을 불러오는 중 오류가 발생했습니다."
          );


          navigate(
            "/admin/notices"
          );


        } finally {

          setLoading(
            false
          );
        }
      };


    loadNotice();

  }, [
    noticeId,
    navigate
  ]);


  /**
   * 새 첨부파일 선택
   */
  const handleFileChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {

    const selectedFile =
      event.target.files?.[0];


    if (!selectedFile) {

      setFile(
        null
      );

      return;
    }


    setFile(
      selectedFile
    );
  };


  /**
   * 새로 선택한 파일 취소
   *
   * 기존 첨부파일은 유지된다.
   */
  const handleFileRemove = () => {

    setFile(
      null
    );


    if (
      fileInputRef.current
    ) {

      fileInputRef.current.value =
        "";
    }
  };


  /**
   * 수정 저장
   */
  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        Number(gradeId) !== 4
      ) {

        alert(
          "관리자만 공지사항을 수정할 수 있습니다."
        );

        return;
      }


      if (
        !memberId ||
        !noticeId
      ) {

        alert(
          "관리자 또는 공지사항 정보를 확인할 수 없습니다."
        );

        return;
      }


      if (
        !title.trim()
      ) {

        alert(
          "공지사항 제목을 입력해주세요."
        );

        return;
      }


      if (
        !content.trim()
      ) {

        alert(
          "공지사항 내용을 입력해주세요."
        );

        return;
      }


      /**
       * 작성자 입력값이 비어 있으면
       * 관리자로 저장
       */
      const finalWriterName =
        writerName.trim()
          ? writerName.trim()
          : "관리자";


      const confirmUpdate =
        window.confirm(
          "공지사항을 수정하시겠습니까?"
        );


      if (!confirmUpdate) {
        return;
      }


      try {

        setSaving(
          true
        );


        /**
         * Spring의 NoticeRequestDto로 보낼 데이터
         */
        const requestData = {

          adminId:
            memberId,

          writerName:
            finalWriterName,

          title:
            title.trim(),

          content:
            content.trim(),

          linkUrl:
            linkUrl.trim(),

          fixed,

          visible

        };


        /**
         * multipart/form-data 생성
         */
        const formData =
          new FormData();


        /**
         * JSON 데이터를
         * request 파트로 추가
         */
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


        /**
         * 새 파일을 선택했을 때만
         * file 파트 추가
         *
         * 선택하지 않으면
         * 기존 파일 그대로 유지
         */
        if (file) {

          formData.append(
            "file",
            file
          );
        }


        await axiosInstance.put(
          `/notice/admin/${noticeId}`,
          formData
        );


        alert(
          "공지사항이 수정되었습니다."
        );


        navigate(
          `/admin/notices/${noticeId}`
        );


      } catch (error) {

        console.error(
          "공지사항 수정 오류:",
          error
        );


        alert(
          "공지사항 수정 중 오류가 발생했습니다."
        );


      } finally {

        setSaving(
          false
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


  return (

    <main className="admin-notice-page">

      <div className="admin-notice-heading">

        <div>

          <p>
            NOTICE MANAGEMENT
          </p>


          <h1>
            공지사항 수정
          </h1>

        </div>

      </div>


      <form
        className="admin-notice-form"
        onSubmit={
          handleSubmit
        }
      >

        {/* 제목 */}
        <div className="admin-notice-form-row">

          <label
            htmlFor="notice-title"
          >
            제목
          </label>


          <input
            id="notice-title"
            type="text"
            maxLength={255}
            value={title}
            onChange={
              (event) =>
                setTitle(
                  event.target.value
                )
            }
          />

        </div>


        {/* 내용 */}
        <div className="admin-notice-form-row content">

          <label
            htmlFor="notice-content"
          >
            내용
          </label>


          <textarea
            id="notice-content"
            value={content}
            onChange={
              (event) =>
                setContent(
                  event.target.value
                )
            }
          />

        </div>


        {/* 관련 링크 */}
        <div className="admin-notice-form-row">

          <label
            htmlFor="notice-link"
          >
            관련 링크
          </label>


          <input
            id="notice-link"
            type="url"
            maxLength={1000}
            value={linkUrl}
            onChange={
              (event) =>
                setLinkUrl(
                  event.target.value
                )
            }
            placeholder="관련 링크가 있다면 입력해주세요."
          />

        </div>


        {/* 첨부파일 */}
        <div className="admin-notice-form-row">

          <label>
            첨부파일
          </label>


          <div className="admin-notice-file-area">

            <input
              ref={
                fileInputRef
              }
              id="notice-file"
              type="file"
              className="admin-notice-file-input"
              onChange={
                handleFileChange
              }
            />


            <button
              type="button"
              className="admin-notice-file-button"
              onClick={
                () =>
                  fileInputRef
                    .current
                    ?.click()
              }
            >
              파일 첨부하기
            </button>


            <span className="admin-notice-file-name">

              {
                file
                  ? file.name
                  : currentFileName
                    ? currentFileName
                    : "선택된 파일이 없습니다."
              }

            </span>


            {file && (

              <button
                type="button"
                className="admin-notice-file-remove"
                onClick={
                  handleFileRemove
                }
              >
                선택 취소
              </button>

            )}

          </div>

        </div>


        {/* 작성자 */}
        <div className="admin-notice-form-row">

          <label
            htmlFor="notice-writer"
          >
            작성자
          </label>


          <input
            id="notice-writer"
            type="text"
            maxLength={100}
            value={writerName}
            onChange={
              (event) =>
                setWriterName(
                  event.target.value
                )
            }
            placeholder="작성자 이름을 입력해주세요."
          />

        </div>


        {/* 옵션 */}
        <div className="admin-notice-options">

          <label>

            <input
              type="checkbox"
              checked={
                fixed === "Y"
              }
              onChange={
                (event) =>
                  setFixed(
                    event.target.checked
                      ? "Y"
                      : "N"
                  )
              }
            />

            <span>
              상단 고정
            </span>

          </label>


          <label>

            <input
              type="checkbox"
              checked={
                visible === "Y"
              }
              onChange={
                (event) =>
                  setVisible(
                    event.target.checked
                      ? "Y"
                      : "N"
                  )
              }
            />

            <span>
              공개
            </span>

          </label>

        </div>


        <div className="admin-notice-form-guide">

          <p>
            상단 고정을 선택하면 NOTICE 목록의 가장 위에 노출됩니다.
          </p>

          <p>
            공개를 해제하면 관리자 화면에서만 확인할 수 있습니다.
          </p>

          {currentFileName && (

            <p>
              새 첨부파일을 선택하지 않으면 기존 첨부파일이 유지됩니다.
            </p>

          )}

        </div>


        <div className="admin-notice-form-actions">

          <button
            type="button"
            onClick={
              () =>
                navigate(
                  `/admin/notices/${noticeId}`
                )
            }
          >
            취소
          </button>


          <button
            type="submit"
            className="save"
            disabled={
              saving
            }
          >

            {
              saving
                ? "수정 중..."
                : "수정 완료"
            }

          </button>

        </div>

      </form>

    </main>
  );
};


export default AdminNoticeUpdate;