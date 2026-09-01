import {
  useRef,
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


const AdminNoticeCreate = () => {

  const navigate =
    useNavigate();


  const {
    memberId,
    gradeId
  } = useGlobalStore();


  /**
   * 첨부파일 input 접근용
   */
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const [
    title,
    setTitle
  ] = useState("");


  const [
    content,
    setContent
  ] = useState("");


  /**
   * 작성자 표시 이름
   *
   * 관리자 화면이므로
   * 기본값은 "관리자"
   */
  const [
    writerName,
    setWriterName
  ] = useState(
    "관리자"
  );


  /**
   * 관련 링크
   */
  const [
    linkUrl,
    setLinkUrl
  ] = useState("");


  /**
   * 첨부파일
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
    saving,
    setSaving
  ] = useState(false);


  /**
   * 파일 선택
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
   * 선택한 파일 제거
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
   * 공지사항 등록
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
          "관리자만 공지사항을 등록할 수 있습니다."
        );

        return;
      }


      if (!memberId) {

        alert(
          "관리자 회원 정보를 확인할 수 없습니다."
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
       * 작성자 이름은
       * 기본 관리자로 들어가지만
       * 혹시 빈 값이면 관리자로 처리
       */
      const finalWriterName =
        writerName.trim()
          ? writerName.trim()
          : "관리자";


      const confirmSave =
        window.confirm(
          "공지사항을 등록하시겠습니까?"
        );


      if (!confirmSave) {
        return;
      }


      try {

        setSaving(
          true
        );


        /**
         * Spring의
         * @RequestPart("request")
         * 와 맞추기 위한 JSON 데이터
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
         * multipart/form-data
         */
        const formData =
          new FormData();


        /**
         * NoticeRequestDto를
         * JSON Blob으로 추가
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
         * 첨부파일이 있는 경우에만 추가
         */
        if (file) {

          formData.append(
            "file",
            file
          );
        }


        await axiosInstance.post(
          "/notice/admin",
          formData
        );


        alert(
          "공지사항이 등록되었습니다."
        );


        navigate(
          "/admin/notices"
        );


      } catch (error) {

        console.error(
          "공지사항 등록 오류:",
          error
        );


        alert(
          "공지사항 등록 중 오류가 발생했습니다."
        );


      } finally {

        setSaving(
          false
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
            공지사항 등록
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
            placeholder="공지사항 제목을 입력해주세요."
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
            placeholder="공지사항 내용을 입력해주세요."
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
                삭제
              </button>

            )}

          </div>

        </div>


        {/* 작성자 이름 */}
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
            상단 고정을 선택하면 일반 NOTICE 목록의 가장 위에 노출됩니다.
          </p>

          <p>
            공개를 해제하면 관리자 화면에서만 확인할 수 있습니다.
          </p>

        </div>


        <div className="admin-notice-form-actions">

          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/admin/notices"
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
                ? "등록 중..."
                : "등록하기"
            }

          </button>

        </div>

      </form>

    </main>
  );
};


export default AdminNoticeCreate;