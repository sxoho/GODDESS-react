import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useSearchParams
} from "react-router-dom";

import "../../styles/beauty/BeautyHome.css";

import {
  BRAND
} from "../../config/brand";

import {
  axiosInstance
} from "../../components/ToolBak";

import {
  useGlobalStore
} from "../../store/store";


const API_BASE =
  "http://localhost:9104";


const MODES = [

  {
    id: "makeup",
    label: "메이크업",
    title: "나에게 어울리는 메이크업",
    description:
      "립, 아이섀도, 블러셔. 나에게 어울리는 메이크업을 찾는 새로운 방법을 준비하고 있어요.",
    options: [
      "립 메이크업",
      "아이 메이크업",
      "블러셔",
      "베이스 메이크업"
    ]
  },

  {
    id: "hair-style",
    label: "헤어스타일",
    title: "새로운 헤어스타일",
    description:
      "단발부터 긴 웨이브까지. 머리를 자르기 전에 새로운 분위기를 만나볼 수 있도록 준비하고 있어요.",
    options: [
      "단발",
      "레이어드",
      "웨이브",
      "스트레이트"
    ]
  },

  {
    id: "hair-color",
    label: "헤어컬러",
    title: "분위기를 바꾸는 헤어컬러",
    description:
      "차분한 브라운부터 밝은 블론드까지. 나에게 어울리는 헤어컬러를 미리 살펴보는 경험을 준비하고 있어요.",
    options: [
      "블랙",
      "브라운",
      "애쉬 브라운",
      "블론드"
    ]
  }

] as const;


/* =========================================
   회원 대표 사진
========================================= */

type MemberPhoto = {
  id: number;
  memberId: number;
  photoType: string;
  fileOrigin: string;
  fileSaved: string;
  filePath: string;
  fileSize?: number;
  isMain: string;
  visible: string;
  createdAt?: string;
  updatedAt?: string;
};


/* =========================================
   회원 사진 AI 검사 결과
========================================= */

type PhotoAiCheckResult = {
  faceDetected: boolean;
  isFront: boolean;
  faceCenterOffset?: number | null;
  brightness?: number | null;
  isTooDark: boolean;
  isTooBright: boolean;
  blurScore?: number | null;
  isBlurred: boolean;
  valid: boolean;
  message: string;
};


export default function BeautyHome() {

  const [
    params,
    setParams
  ] = useSearchParams();


  const navigate =
    useNavigate();


  const {
    sw,
    memberId
  } = useGlobalStore();


  /* =========================================
     현재 화면
  ========================================= */

  const view =
    params.get("view") ?? "start";


  const mode =
    MODES.find(
      (item) =>
        item.id ===
        params.get("mode")
    ) ??
    MODES[0];


  /* =========================================
     사진 input
  ========================================= */

  const galleryPhotoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const cameraPhotoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const photoCheckRequestId =
    useRef(0);


  /* =========================================
     회원사진 상태
  ========================================= */

  const [
    memberPhoto,
    setMemberPhoto
  ] =
    useState<MemberPhoto | null>(
      null
    );


  const [
    photoLoaded,
    setPhotoLoaded
  ] =
    useState(false);


  const [
    photoLoading,
    setPhotoLoading
  ] =
    useState(false);


  const [
    photoEditing,
    setPhotoEditing
  ] =
    useState(false);


  const [
    selectedPhoto,
    setSelectedPhoto
  ] =
    useState<File | null>(
      null
    );


  const [
    photoPreview,
    setPhotoPreview
  ] =
    useState("");


  const [
    photoSaving,
    setPhotoSaving
  ] =
    useState(false);


  /* =========================================
     AI 검사
  ========================================= */

  const [
    photoChecking,
    setPhotoChecking
  ] =
    useState(false);


  const [
    photoAiResult,
    setPhotoAiResult
  ] =
    useState<PhotoAiCheckResult | null>(
      null
    );


  const [
    photoAiError,
    setPhotoAiError
  ] =
    useState("");


  /* =========================================
     이미지 URL
  ========================================= */

  const getImageUrl = (
    path?: string
  ) => {

    if (!path) {
      return "";
    }


    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      return path;
    }


    return `${API_BASE}${path}`;
  };


  /* =========================================
     대표사진 조회
  ========================================= */

  const loadMemberPhoto =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        setMemberPhoto(
          null
        );

        setPhotoLoaded(
          true
        );

        return;
      }


      try {

        setPhotoLoading(
          true
        );


        const response =
          await axiosInstance.get<MemberPhoto>(
            `/member_photo/member/${memberId}/main`
          );


        if (
          response.status === 200 &&
          response.data &&
          response.data.id
        ) {

          setMemberPhoto(
            response.data
          );

        } else {

          setMemberPhoto(
            null
          );
        }


      } catch (error) {

        console.log(
          "등록된 회원 사진 없음:",
          error
        );


        setMemberPhoto(
          null
        );


      } finally {

        setPhotoLoading(
          false
        );

        setPhotoLoaded(
          true
        );
      }
    };


  useEffect(
    () => {

      loadMemberPhoto();

    },
    [
      sw,
      memberId
    ]
  );


  /* =========================================
     미리보기 URL 정리
  ========================================= */

  useEffect(
    () => {

      return () => {

        if (
          photoPreview
        ) {

          URL.revokeObjectURL(
            photoPreview
          );
        }
      };

    },
    [
      photoPreview
    ]
  );


  /* =========================================
     날짜
  ========================================= */

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


  /* =========================================
     선택 상태 초기화
  ========================================= */

  const resetPhotoSelection =
    () => {

      photoCheckRequestId.current += 1;


      if (
        photoPreview
      ) {

        URL.revokeObjectURL(
          photoPreview
        );
      }


      setSelectedPhoto(
        null
      );

      setPhotoPreview(
        ""
      );

      setPhotoAiResult(
        null
      );

      setPhotoAiError(
        ""
      );

      setPhotoChecking(
        false
      );


      if (
        galleryPhotoInputRef.current
      ) {

        galleryPhotoInputRef.current.value =
          "";
      }


      if (
        cameraPhotoInputRef.current
      ) {

        cameraPhotoInputRef.current.value =
          "";
      }
    };


  /* =========================================
     사진 선택 + AI 사전검사
  ========================================= */

  const handlePhotoChange =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      /* 이미지 형식 */

      const allowedTypes = [
        "image/jpeg",
        "image/png"
      ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        alert(
          "JPG, JPEG, PNG 이미지 파일만 등록할 수 있습니다."
        );


        event.target.value =
          "";


        return;
      }


      /* 10MB 제한 */

      const maxSize =
        10 *
        1024 *
        1024;


      if (
        file.size >
        maxSize
      ) {

        alert(
          "사진은 10MB 이하만 등록할 수 있습니다."
        );


        event.target.value =
          "";


        return;
      }


      /* 기존 미리보기 제거 */

      if (
        photoPreview
      ) {

        URL.revokeObjectURL(
          photoPreview
        );
      }


      const preview =
        URL.createObjectURL(
          file
        );


      setSelectedPhoto(
        file
      );


      setPhotoPreview(
        preview
      );


      setPhotoAiResult(
        null
      );


      setPhotoAiError(
        ""
      );


      const requestId =
        photoCheckRequestId.current + 1;


      photoCheckRequestId.current =
        requestId;


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      try {

        setPhotoChecking(
          true
        );


        const response =
          await axiosInstance.post<PhotoAiCheckResult>(
            "/member_photo/check",
            formData,
            {
              timeout: 30000
            }
          );


        if (
          requestId !==
          photoCheckRequestId.current
        ) {

          return;
        }


        setPhotoAiResult(
          response.data
        );


      } catch (error) {

        console.error(
          "회원 사진 AI 검사 오류:",
          error
        );


        const errorData =
          (
            error as {
              response?: {
                data?:
                  | {
                      message?: string;
                      error?: string;
                    }
                  | string;
              };
            }
          )?.response?.data;


        let errorMessage =
          "사진 AI 검사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";


        if (
          typeof errorData ===
            "string" &&
          errorData.trim()
        ) {

          errorMessage =
            errorData;

        } else if (
          errorData &&
          typeof errorData ===
            "object"
        ) {

          errorMessage =
            errorData.message ||
            errorData.error ||
            errorMessage;
        }


        if (
          requestId ===
          photoCheckRequestId.current
        ) {

          setPhotoAiResult(
            null
          );


          setPhotoAiError(
            errorMessage
          );
        }


      } finally {

        if (
          requestId ===
          photoCheckRequestId.current
        ) {

          setPhotoChecking(
            false
          );
        }
      }
    };


  /* =========================================
     회원사진 등록 / 변경
  ========================================= */

  const handlePhotoUpload =
    async () => {

      if (
        sw !== true ||
        !memberId
      ) {

        alert(
          "로그인이 필요한 기능입니다."
        );


        navigate(
          "/login"
        );


        return;
      }


      if (
        !selectedPhoto
      ) {

        alert(
          "등록할 사진을 선택해주세요."
        );


        return;
      }


      if (
        photoChecking
      ) {

        alert(
          "사진 AI 검사가 진행 중입니다."
        );


        return;
      }


      if (
        !photoAiResult ||
        !photoAiResult.valid
      ) {

        alert(
          photoAiResult?.message ||
          photoAiError ||
          "AI 사진 검사를 통과한 사진만 등록할 수 있습니다."
        );


        return;
      }


      const existedPhoto =
        Boolean(
          memberPhoto
        );


      const formData =
        new FormData();


      formData.append(
        "file",
        selectedPhoto
      );


      try {

        setPhotoSaving(
          true
        );


        await axiosInstance.post<MemberPhoto>(
          `/member_photo/member/${memberId}`,
          formData
        );


        /*
         * 저장 직후 대표사진을 다시 조회한다.
         *
         * 사진 등록/변경 POST 응답만 바로 상태에 넣으면
         * createdAt이 화면에 즉시 반영되지 않아 등록일이
         * "-"로 보일 수 있으므로, 저장이 완료된 뒤 DB의
         * 최신 대표사진을 다시 가져와 화면 상태를 갱신한다.
         */
        const mainPhotoResponse =
          await axiosInstance.get<MemberPhoto>(
            `/member_photo/member/${memberId}/main`
          );


        setMemberPhoto(
          mainPhotoResponse.data
        );


        resetPhotoSelection();


        setPhotoEditing(
          false
        );


        alert(
          existedPhoto
            ? "AI BEAUTY 사진이 변경되었습니다."
            : "AI BEAUTY 사진이 등록되었습니다."
        );


      } catch (error) {

        console.error(
          "회원 사진 등록 오류:",
          error
        );


        alert(
          "회원 사진 저장 중 오류가 발생했습니다."
        );


      } finally {

        setPhotoSaving(
          false
        );
      }
    };


  /* =========================================
     사진 변경 취소
  ========================================= */

  const handlePhotoEditCancel =
    () => {

      resetPhotoSelection();


      setPhotoEditing(
        false
      );
    };


  /* =========================================
     사이드바 이동
  ========================================= */

  const goStart =
    () => {

      navigate(
        "/beauty"
      );
    };


  const goPhoto =
    () => {

      navigate(
        "/beauty?view=photo"
      );
    };


  const goHistory =
    () => {

      navigate(
        "/beauty?view=saved"
      );
    };


  const goMembership =
    () => {

      navigate(
        "/beauty?view=membership"
      );
    };


  /* =========================================
     내 사진 화면
  ========================================= */

  const renderPhotoView =
    () => {

      /* 로그인하지 않은 경우 */

      if (
        sw !== true ||
        !memberId
      ) {

        return (

          <section className="gd-photo-page">

            <div className="gd-photo-page-head">

              <span>
                MY PHOTO
              </span>

              <h2>
                AI BEAUTY에 사용할 내 사진
              </h2>

              <p>
                AI BEAUTY의 메이크업과 헤어 체험을 이용하려면
                먼저 회원 사진을 등록해주세요.
              </p>

            </div>


            <div className="gd-photo-login">

              <div className="gd-photo-login-icon">
                ♡
              </div>

              <strong>
                로그인이 필요합니다.
              </strong>

              <p>
                로그인 후 AI BEAUTY에 사용할
                회원 사진을 등록할 수 있어요.
              </p>

              <button
                type="button"
                onClick={
                  () =>
                    navigate(
                      "/login"
                    )
                }
              >
                로그인하기
              </button>

            </div>

          </section>
        );
      }


      /* 조회 중 */

      if (
        photoLoading ||
        !photoLoaded
      ) {

        return (

          <section className="gd-photo-page">

            <div className="gd-photo-loading">
              회원 사진을 불러오는 중입니다.
            </div>

          </section>
        );
      }


      /* =====================================
         사진이 없거나 수정 중
      ===================================== */

      if (
        !memberPhoto ||
        photoEditing
      ) {

        return (

          <section className="gd-photo-page">

            <div className="gd-photo-page-head">

              <span>
                MY PHOTO
              </span>

              <h2>
                {
                  memberPhoto
                    ? "새로운 사진으로 변경하기"
                    : "AI BEAUTY에 사용할 내 사진"
                }
              </h2>

              <p>
                {
                  memberPhoto
                    ? "새로운 사진을 선택하면 기존 회원 대표사진도 함께 변경됩니다."
                    : "등록한 사진을 기준으로 메이크업과 헤어 체험을 진행해요."
                }
              </p>

            </div>


            <div className="gd-photo-editor">

              {/* 사진 영역 */}

              <div className="gd-photo-editor-preview">

                {photoPreview ? (

                  <img
                    src={
                      photoPreview
                    }
                    alt="선택한 회원 사진 미리보기"
                  />

                ) : memberPhoto ? (

                  <img
                    src={
                      getImageUrl(
                        memberPhoto.filePath
                      )
                    }
                    alt="현재 회원 대표사진"
                  />

                ) : (

                  <div className="gd-photo-empty-visual">

                    <span>
                      ♡
                    </span>

                    <strong>
                      NO PHOTO
                    </strong>

                    <small>
                      아직 등록된 사진이 없어요.
                    </small>

                  </div>

                )}

              </div>


              {/* 오른쪽 */}

              <div className="gd-photo-editor-info">

                {!memberPhoto && (

                  <div className="gd-photo-empty-title">

                    <strong>
                      아직 등록된 사진이 없어요.
                    </strong>

                    <p>
                      AI BEAUTY를 이용하려면
                      정면 얼굴사진을 먼저 등록해주세요.
                    </p>

                  </div>

                )}


                <div className="gd-photo-guide">

                  <span>
                    PHOTO GUIDE
                  </span>

                  <h3>
                    AI 체험에 적합한 사진
                  </h3>

                  <ul>

                    <li>
                      정면을 바라본 얼굴 사진
                    </li>

                    <li>
                      얼굴이 선명하게 보이는 사진
                    </li>

                    <li>
                      너무 어둡거나 밝지 않은 사진
                    </li>

                    <li>
                      과도한 필터나 보정이 없는 사진
                    </li>

                  </ul>

                </div>


                {/* 숨김 input */}

                <input
                  ref={
                    galleryPhotoInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={
                    handlePhotoChange
                  }
                  className="gd-photo-hidden-input"
                />


                <input
                  ref={
                    cameraPhotoInputRef
                  }
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={
                    handlePhotoChange
                  }
                  className="gd-photo-hidden-input"
                />


                <div className="gd-photo-source-actions">

                  <button
                    type="button"
                    className="gd-photo-source-button"
                    onClick={
                      () =>
                        galleryPhotoInputRef.current?.click()
                    }
                  >
                    사진 선택하기
                  </button>


                  <button
                    type="button"
                    className="gd-photo-source-button camera"
                    onClick={
                      () =>
                        cameraPhotoInputRef.current?.click()
                    }
                  >
                    카메라로 촬영
                  </button>

                </div>


                {selectedPhoto && (

                  <div className="gd-photo-selected-file">

                    <span>
                      SELECTED
                    </span>

                    <strong>
                      {
                        selectedPhoto.name
                      }
                    </strong>

                  </div>

                )}


                {/* AI 검사 */}

                {photoChecking && (

                  <div className="gd-photo-ai-check checking">

                    <span>
                      AI PHOTO CHECK
                    </span>

                    <strong>
                      사진을 확인하고 있어요.
                    </strong>

                    <p>
                      얼굴 방향, 밝기와 선명도를 확인하는 중입니다.
                    </p>

                  </div>

                )}


                {!photoChecking &&
                  photoAiResult && (

                  <div
                    className={
                      photoAiResult.valid
                        ? "gd-photo-ai-check success"
                        : "gd-photo-ai-check fail"
                    }
                  >

                    <span>
                      AI PHOTO CHECK
                    </span>

                    <strong>
                      {
                        photoAiResult.valid
                          ? "AI BEAUTY 사용 가능"
                          : "사진을 다시 확인해주세요."
                      }
                    </strong>

                    <p>
                      {
                        photoAiResult.message
                      }
                    </p>


                    {!photoAiResult.valid && (

                      <div className="gd-photo-ai-detail">

                        <span>
                          얼굴 검출{" "}
                          <b>
                            {
                              photoAiResult.faceDetected
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                        <span>
                          정면 여부{" "}
                          <b>
                            {
                              photoAiResult.isFront
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                        <span>
                          밝기{" "}
                          <b>
                            {
                              !photoAiResult.isTooDark &&
                              !photoAiResult.isTooBright
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                        <span>
                          선명도{" "}
                          <b>
                            {
                              !photoAiResult.isBlurred
                                ? "정상"
                                : "확인 필요"
                            }
                          </b>
                        </span>

                      </div>

                    )}

                  </div>

                )}


                {photoAiError && (

                  <div className="gd-photo-ai-check fail">

                    <span>
                      AI PHOTO CHECK
                    </span>

                    <strong>
                      사진 검사에 실패했습니다.
                    </strong>

                    <p>
                      {
                        photoAiError
                      }
                    </p>

                  </div>

                )}


                <div className="gd-photo-editor-actions">

                  {memberPhoto && (

                    <button
                      type="button"
                      className="gd-photo-cancel-button"
                      onClick={
                        handlePhotoEditCancel
                      }
                    >
                      취소
                    </button>

                  )}


                  <button
                    type="button"
                    className="gd-photo-save-button"
                    disabled={
                      !selectedPhoto ||
                      photoChecking ||
                      photoSaving ||
                      !photoAiResult?.valid
                    }
                    onClick={
                      handlePhotoUpload
                    }
                  >
                    {
                      photoSaving
                        ? "저장 중..."
                        : memberPhoto
                          ? "변경사항 저장"
                          : "사진 저장하기"
                    }
                  </button>

                </div>

              </div>

            </div>

          </section>
        );
      }


      /* =====================================
         사진 등록 완료 상태
      ===================================== */

      return (

        <section className="gd-photo-page">

          <div className="gd-photo-page-head">

            <span>
              MY PHOTO
            </span>

            <h2>
              AI BEAUTY에 사용하는 내 사진
            </h2>

            <p>
              현재 등록된 회원 대표사진을
              AI BEAUTY 체험에 사용하고 있어요.
            </p>

          </div>


          <div className="gd-photo-current">

            <div className="gd-photo-current-image">

              <img
                src={
                  getImageUrl(
                    memberPhoto.filePath
                  )
                }
                alt={`${BRAND.name} 회원 대표사진`}
              />

            </div>


            <div className="gd-photo-current-info">

              <span className="gd-photo-current-overline">
                CURRENT PHOTO
              </span>


              <h3>
                AI BEAUTY 사용 사진
              </h3>


              <div className="gd-photo-available">

                <span />

                AI BEAUTY 사용 가능

              </div>


              <p className="gd-photo-current-description">
                이 사진을 기준으로 메이크업,
                헤어컬러 및 헤어스타일 체험을
                진행하게 됩니다.
              </p>


              <dl className="gd-photo-meta">

                <div>

                  <dt>
                    등록일
                  </dt>

                  <dd>
                    {
                      formatDate(
                        memberPhoto.createdAt
                      )
                    }
                  </dd>

                </div>

              </dl>


              <div className="gd-photo-current-actions">

                <button
                  type="button"
                  className="gd-photo-edit-button"
                  onClick={
                    () => {

                      resetPhotoSelection();

                      setPhotoEditing(
                        true
                      );
                    }
                  }
                >
                  사진 변경하기
                </button>


                <button
                  type="button"
                  className="gd-photo-start-button"
                  onClick={
                    goStart
                  }
                >
                  이 사진으로 시작하기
                  <span>
                    →
                  </span>
                </button>

              </div>

            </div>

          </div>

        </section>
      );
    };


  /* =========================================
     저장 내역 - 현재 화면 준비
  ========================================= */

  const renderSavedView =
    () => (

      <section className="gd-beauty-placeholder">

        <span>
          MY HISTORY
        </span>

        <h2>
          나의 이용 내역
        </h2>

        <p>
          AI BEAUTY에서 저장한 메이크업과
          헤어 체험 결과가 이곳에 표시될 예정입니다.
        </p>

        <div className="gd-beauty-placeholder-box">

          <strong>
            아직 저장된 이용 내역이 없어요.
          </strong>

          <p>
            AI BEAUTY 체험 후 마음에 드는 결과를
            저장하면 이곳에서 다시 확인할 수 있어요.
          </p>

        </div>

      </section>
    );


  /* =========================================
     이용권 · 구독 - 현재 화면 준비
  ========================================= */

  const renderMembershipView =
    () => (

      <section className="gd-beauty-placeholder">

        <span>
          MEMBERSHIP
        </span>

        <h2>
          이용권 · 구독
        </h2>

        <p>
          현재 이용권과 AI BEAUTY 이용 횟수를
          확인할 수 있는 화면입니다.
        </p>

        <div className="gd-beauty-placeholder-box">

          <strong>
            FREE
          </strong>

          <p>
            매월 3회 무료 이용 · Premium 구독 기능은
            추후 연결할 예정입니다.
          </p>

        </div>

      </section>
    );


  /* =========================================
     START 기본 화면
  ========================================= */

  const renderStartView =
    () => (

      <>

        {/* 사진 미등록 안내 */}

        {
          sw === true &&
          photoLoaded &&
          !memberPhoto && (

            <div className="gd-beauty-photo-alert">

              <div>

                <span>
                  PHOTO REQUIRED
                </span>

                <strong>
                  아직 AI BEAUTY에 사용할 사진을 등록하지 않으셨네요.
                </strong>

                <p>
                  AI 메이크업과 헤어 체험을 시작하려면
                  먼저 정면 얼굴사진을 등록해주세요.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  goPhoto
                }
              >
                사진 등록하기
                <span>
                  →
                </span>
              </button>

            </div>

          )
        }


        <div className="gd-beauty-layout">

          <div className="gd-beauty-image">

            <img
              src="/images/goddess/beauty-editorial.webp"
              alt={`${BRAND.name} 메이크업 컨셉 화보`}
              width="1254"
              height="1254"
            />

          </div>


          <section
            className="gd-beauty-panel"
            aria-labelledby="beauty-mode-title"
          >

            <div
              className="gd-beauty-tabs"
              aria-label="AI 뷰티 서비스 선택"
            >

              {
                MODES.map(
                  (item) => (

                    <button
                      key={
                        item.id
                      }
                      aria-pressed={
                        mode.id ===
                        item.id
                      }
                      onClick={
                        () =>
                          setParams({
                            mode:
                              item.id
                          })
                      }
                    >

                      {
                        item.label
                      }

                    </button>

                  )
                )
              }

            </div>


            <div
              className="gd-beauty-panel-body"
              aria-live="polite"
            >

              <h2
                id="beauty-mode-title"
              >
                {
                  mode.title
                }
              </h2>


              <p className="gd-beauty-description">
                {
                  mode.description
                }
              </p>


              <ul className="gd-beauty-options">

                {
                  mode.options.map(
                    (option) => (

                      <li
                        key={
                          option
                        }
                      >
                        {
                          option
                        }
                      </li>

                    )
                  )
                }

              </ul>


              <div className="gd-beauty-status">

                <strong>
                  곧 만나요.
                </strong>

                <p>
                  AI 체험 서비스는 준비 중이에요.
                  <br />
                  지금은 서비스 소개를 둘러볼 수 있어요.
                </p>

              </div>


              <button
                className="gd-beauty-shop"
                onClick={
                  () =>
                    navigate(
                      "/products"
                    )
                }
              >
                상품 먼저 둘러보기

                <span
                  aria-hidden="true"
                >
                  ↗
                </span>
              </button>

            </div>

          </section>

        </div>

      </>
    );


  return (

    <div className="gd-beauty">

      <header className="gd-beauty-heading">

        <h1>
          AI BEAUTY
        </h1>

        <span>
          메이크업부터 헤어까지,
          나에게 어울리는 변화를 찾아보세요.
        </span>

      </header>


      <div className="gd-beauty-page-layout">


        {/* =================================
            왼쪽 사이드바
        ================================= */}

        <aside className="gd-beauty-sidebar">

          <div className="gd-beauty-sidebar-title">

            <span>
              AI BEAUTY
            </span>

            <strong>
              나의 AI 뷰티
            </strong>

          </div>


          <nav className="gd-beauty-sidebar-menu">


            <button
              type="button"
              className={
                view === "start"
                  ? "active"
                  : ""
              }
              onClick={
                goStart
              }
            >
              <span>
                START
              </span>

              <small>
                AI 뷰티 체험
              </small>
            </button>


            <button
              type="button"
              className={
                view === "photo"
                  ? "active"
                  : ""
              }
              onClick={
                goPhoto
              }
            >
              <span>
                MY PHOTO
              </span>

              <small>
                내 사진
              </small>
            </button>


            <button
              type="button"
              className={
                view === "saved"
                  ? "active"
                  : ""
              }
              onClick={
                goHistory
              }
            >
              <span>
                MY HISTORY
              </span>

              <small>
                나의 이용 내역
              </small>
            </button>


            <button
              type="button"
              className={
                view === "membership"
                  ? "active"
                  : ""
              }
              onClick={
                goMembership
              }
            >
              <span>
                MEMBERSHIP
              </span>

              <small>
                이용권 · 구독
              </small>
            </button>

          </nav>

        </aside>


        {/* =================================
            오른쪽 내용
        ================================= */}

        <div className="gd-beauty-main">

          {
            view === "photo"
              ? renderPhotoView()
              : view === "saved"
                ? renderSavedView()
                : view === "membership"
                  ? renderMembershipView()
                  : renderStartView()
          }

        </div>

      </div>

    </div>
  );
}