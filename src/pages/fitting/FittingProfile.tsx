import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import axios from "axios";

import {
  useGlobalStore
} from "../../store/store";

import {
  createFittingProfile,
  existsFittingProfile,
  getFittingProfile,
  updateFittingProfile
} from "../../api/fittingProfileApi";

import type {
  FittingProfile as FittingProfileType,
  FittingProfileRequest
} from "../../api/fittingProfileApi";

import "../../styles/fitting/FittingProfile.css";


type FormData = {
  height: string;
  bodyType: string;
  topSize: string;
  bottomSize: string;
  preferredFit: string;
};


const initialForm: FormData = {
  height: "",
  bodyType: "",
  topSize: "",
  bottomSize: "",
  preferredFit: ""
};


const FittingProfile = () => {

  const navigate =
    useNavigate();


  const {
    sw,
    memberId
  } = useGlobalStore();


  const [
    profile,
    setProfile
  ] = useState<FittingProfileType | null>(
    null
  );


  const [
    form,
    setForm
  ] = useState<FormData>(
    initialForm
  );


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    saving,
    setSaving
  ] = useState(false);


  const [
    isEditing,
    setIsEditing
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  /**
   * 피팅 프로필 정보 폼에 적용
   */
  const setProfileToForm = (
    data: FittingProfileType
  ) => {

    setForm({
      height:
        data.height != null
          ? String(data.height)
          : "",

      bodyType:
        data.bodyType || "",

      topSize:
        data.topSize || "",

      bottomSize:
        data.bottomSize || "",

      preferredFit:
        data.preferredFit || ""
    });
  };


  /**
   * 피팅 프로필 조회
   */
  const loadProfile =
    async () => {

      if (!memberId) {
        return;
      }


      try {

        setLoading(true);
        setError("");


        const exists =
          await existsFittingProfile(
            memberId
          );


        /**
         * 등록된 프로필 없음
         */
        if (!exists) {

          setProfile(
            null
          );

          setForm(
            initialForm
          );

          setIsEditing(
            true
          );

          return;
        }


        /**
         * 등록된 프로필 조회
         */
        const data =
          await getFittingProfile(
            memberId
          );


        setProfile(
          data
        );


        setProfileToForm(
          data
        );


        setIsEditing(
          false
        );


      } catch (requestError) {

        console.error(
          "피팅 프로필 조회 오류:",
          requestError
        );


        setError(
          "피팅 프로필을 불러오는 중 오류가 발생했습니다."
        );


      } finally {

        setLoading(
          false
        );
      }
    };


  /**
   * 로그인 확인 + 프로필 조회
   */
  useEffect(() => {

    if (
      sw !== true ||
      !memberId
    ) {

      alert(
        "로그인이 필요한 페이지입니다."
      );


      navigate(
        "/login",
        {
          replace: true
        }
      );


      return;
    }


    loadProfile();

  }, [
    sw,
    memberId
  ]);


  /**
   * input 변경
   */
  const handleChange = (
    event:
      React.ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement
      >
  ) => {

    const {
      name,
      value
    } = event.target;


    setForm(
      previous => ({
        ...previous,
        [name]: value
      })
    );
  };


  /**
   * 입력값 확인
   */
  const validateForm =
    () => {

      const height =
        Number(
          form.height
        );


      if (
        !form.height.trim() ||
        Number.isNaN(height)
      ) {

        alert(
          "키를 올바르게 입력해주세요."
        );

        return false;
      }


      if (
        height < 100 ||
        height > 250
      ) {

        alert(
          "키는 100cm 이상 250cm 이하로 입력해주세요."
        );

        return false;
      }


      if (
        !form.bodyType
      ) {

        alert(
          "체형을 선택해주세요."
        );

        return false;
      }


      if (
        !form.topSize
      ) {

        alert(
          "평소 상의 사이즈를 선택해주세요."
        );

        return false;
      }


      if (
        !form.bottomSize
      ) {

        alert(
          "평소 하의 사이즈를 선택해주세요."
        );

        return false;
      }


      if (
        !form.preferredFit
      ) {

        alert(
          "선호 핏을 선택해주세요."
        );

        return false;
      }


      return true;
    };


  /**
   * 등록 / 수정
   */
  const handleSave =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !memberId ||
        !validateForm()
      ) {
        return;
      }


      const requestData:
        FittingProfileRequest = {

          memberId:
            memberId,

          height:
            Number(
              form.height
            ),

          bodyType:
            form.bodyType,

          topSize:
            form.topSize,

          bottomSize:
            form.bottomSize,

          preferredFit:
            form.preferredFit
        };


      try {

        setSaving(
          true
        );


        let savedProfile:
          FittingProfileType;


        /**
         * 기존 프로필이 있으면 수정
         */
        if (profile) {

          savedProfile =
            await updateFittingProfile(
              memberId,
              requestData
            );


          alert(
            "피팅 프로필이 수정되었습니다."
          );


        } else {

          /**
           * 최초 등록
           */
          savedProfile =
            await createFittingProfile(
              requestData
            );


          alert(
            "피팅 프로필이 등록되었습니다."
          );
        }


        setProfile(
          savedProfile
        );


        setProfileToForm(
          savedProfile
        );


        setIsEditing(
          false
        );


      } catch (requestError) {

        console.error(
          "피팅 프로필 저장 오류:",
          requestError
        );


        if (
          axios.isAxiosError(
            requestError
          )
        ) {

          const responseData =
            requestError.response?.data;


          if (
            typeof responseData ===
            "string"
          ) {

            alert(
              responseData
            );

            return;
          }


          if (
            responseData?.message
          ) {

            alert(
              responseData.message
            );

            return;
          }
        }


        alert(
          "피팅 프로필 저장 중 오류가 발생했습니다."
        );


      } finally {

        setSaving(
          false
        );
      }
    };


  /**
   * 수정 시작
   */
  const handleEdit =
    () => {

      if (
        profile
      ) {

        setProfileToForm(
          profile
        );
      }


      setIsEditing(
        true
      );
    };


  /**
   * 수정 취소
   */
  const handleCancel =
    () => {

      if (
        !profile
      ) {
        return;
      }


      setProfileToForm(
        profile
      );


      setIsEditing(
        false
      );
    };


  /**
   * 날짜 표시
   */
  const formatDate =
    (
      date?: string | null
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
   * 체형 한글 표시
   */
  const getBodyTypeLabel =
    (
      value?: string
    ) => {

      const labels:
        Record<string, string> = {

          SLIM:
            "슬림",

          NORMAL:
            "보통",

          CURVY:
            "곡선형"
        };


      return (
        labels[value || ""] ||
        value ||
        "-"
      );
    };


  /**
   * 선호 핏 한글 표시
   */
  const getPreferredFitLabel =
    (
      value?: string
    ) => {

      const labels:
        Record<string, string> = {

          SLIM:
            "슬림핏",

          REGULAR:
            "기본핏",

          RELAXED:
            "여유핏",

          OVERSIZED:
            "오버핏"
        };


      return (
        labels[value || ""] ||
        value ||
        "-"
      );
    };


  if (loading) {

    return (

      <div className="fitting-profile-message">
        피팅 프로필을 불러오는 중입니다.
      </div>

    );
  }


  if (error) {

    return (

      <div className="fitting-profile-message error">
        {error}
      </div>

    );
  }


  return (

    <div className="fitting-profile-page">

      <div className="fitting-profile-heading">

        <span>
          FITTING PROFILE
        </span>


        <h1>
          나의 피팅 프로필
        </h1>


        <p>
          간단한 체형과 사이즈 정보를 등록하면
          더 자연스러운 AI 피팅을 이용할 수 있습니다.
        </p>

      </div>


      {!isEditing && profile ? (

        /**
         * =========================
         * 프로필 조회 화면
         * =========================
         */
        <section className="fitting-profile-card">

          <div className="fitting-profile-row">

            <span>
              키
            </span>

            <strong>
              {profile.height} cm
            </strong>

          </div>


          <div className="fitting-profile-row">

            <span>
              체형
            </span>

            <strong>
              {
                getBodyTypeLabel(
                  profile.bodyType
                )
              }
            </strong>

          </div>


          <div className="fitting-profile-row">

            <span>
              평소 상의 사이즈
            </span>

            <strong>
              {profile.topSize}
            </strong>

          </div>


          <div className="fitting-profile-row">

            <span>
              평소 하의 사이즈
            </span>

            <strong>
              {profile.bottomSize}
            </strong>

          </div>


          <div className="fitting-profile-row">

            <span>
              선호 핏
            </span>

            <strong>
              {
                getPreferredFitLabel(
                  profile.preferredFit
                )
              }
            </strong>

          </div>


          <div className="fitting-profile-date">

            <span>
              등록일
              {" "}
              {
                formatDate(
                  profile.createdAt
                )
              }
            </span>


            {profile.updatedAt && (

              <span>
                수정일
                {" "}
                {
                  formatDate(
                    profile.updatedAt
                  )
                }
              </span>

            )}

          </div>


          <div className="fitting-profile-actions">

            <button
              type="button"
              className="fitting-profile-primary-button"
              onClick={
                handleEdit
              }
            >
              프로필 수정
            </button>

          </div>

        </section>

      ) : (

        /**
         * =========================
         * 프로필 등록 / 수정 화면
         * =========================
         */
        <form
          className="fitting-profile-form"
          onSubmit={
            handleSave
          }
        >

          {!profile && (

            <div className="fitting-profile-guide">

              <strong>
                아직 등록된 피팅 프로필이 없습니다.
              </strong>


              <p>
                AI FITTING 이용을 위해
                기본 정보를 등록해주세요.
              </p>

            </div>

          )}


          <div className="fitting-profile-field">

            <label htmlFor="height">
              키
            </label>


            <div className="fitting-profile-height-wrap">

              <input
                id="height"
                name="height"
                type="number"
                step="0.1"
                min="100"
                max="250"
                value={
                  form.height
                }
                onChange={
                  handleChange
                }
                placeholder="예: 165.5"
              />

              <span>
                cm
              </span>

            </div>

          </div>


          <div className="fitting-profile-field">

            <label htmlFor="bodyType">
              체형
            </label>


            <select
              id="bodyType"
              name="bodyType"
              value={
                form.bodyType
              }
              onChange={
                handleChange
              }
            >

              <option value="">
                체형 선택
              </option>

              <option value="SLIM">
                슬림
              </option>

              <option value="NORMAL">
                보통
              </option>

              <option value="CURVY">
                곡선형
              </option>

            </select>

          </div>


          <div className="fitting-profile-field">

            <label htmlFor="topSize">
              평소 상의 사이즈
            </label>


            <select
              id="topSize"
              name="topSize"
              value={
                form.topSize
              }
              onChange={
                handleChange
              }
            >

              <option value="">
                상의 사이즈 선택
              </option>

              <option value="XS">
                XS
              </option>

              <option value="S">
                S
              </option>

              <option value="M">
                M
              </option>

              <option value="L">
                L
              </option>

              <option value="XL">
                XL
              </option>

              <option value="XXL">
                XXL
              </option>

            </select>

          </div>


          <div className="fitting-profile-field">

            <label htmlFor="bottomSize">
              평소 하의 사이즈
            </label>


            <select
              id="bottomSize"
              name="bottomSize"
              value={
                form.bottomSize
              }
              onChange={
                handleChange
              }
            >

              <option value="">
                하의 사이즈 선택
              </option>

              <option value="XS">
                XS
              </option>

              <option value="S">
                S
              </option>

              <option value="M">
                M
              </option>

              <option value="L">
                L
              </option>

              <option value="XL">
                XL
              </option>

              <option value="XXL">
                XXL
              </option>

            </select>

          </div>


          <div className="fitting-profile-field">

            <label htmlFor="preferredFit">
              선호 핏
            </label>


            <select
              id="preferredFit"
              name="preferredFit"
              value={
                form.preferredFit
              }
              onChange={
                handleChange
              }
            >

              <option value="">
                선호 핏 선택
              </option>

              <option value="SLIM">
                슬림핏
              </option>

              <option value="REGULAR">
                기본핏
              </option>

              <option value="RELAXED">
                여유핏
              </option>

              <option value="OVERSIZED">
                오버핏
              </option>

            </select>

          </div>


          <div className="fitting-profile-actions">

            {profile && (

              <button
                type="button"
                className="fitting-profile-secondary-button"
                onClick={
                  handleCancel
                }
                disabled={
                  saving
                }
              >
                취소
              </button>

            )}


            <button
              type="submit"
              className="fitting-profile-primary-button"
              disabled={
                saving
              }
            >
              {
                saving
                  ? "저장 중..."
                  : profile
                    ? "수정 완료"
                    : "프로필 등록"
              }
            </button>

          </div>

        </form>

      )}

    </div>
  );
};


export default FittingProfile;