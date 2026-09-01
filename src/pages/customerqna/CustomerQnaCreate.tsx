import {
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  axiosInstance
} from "../../components/ToolBak";

import {
  useGlobalStore
} from "../../store/store";

import "../../styles/customerqna/CustomerQna.css";


/**
 * 고객 문의 등록 요청 데이터
 */
type CustomerQnaRequest = {
  memberId: number;
  category: string;
  orderId: number | null;
  title: string;
  content: string;
};


/**
 * 고객 문의 등록 응답 데이터
 */
type CustomerQnaResponse = {
  id: number;
  memberId: number;
  memberNickname?: string;

  category: string;

  orderId?: number | null;

  title: string;
  content: string;

  answer?: string | null;

  status: string;

  createdAt?: string;
  answerDate?: string | null;
};


const CustomerQnaCreate = () => {

  const navigate =
    useNavigate();


  /**
   * 로그인 정보
   */
  const {
    sw,
    memberId
  } = useGlobalStore();


  /**
   * 문의 유형
   */
  const [
    category,
    setCategory
  ] = useState("GENERAL");


  /**
   * 관련 주문 번호
   *
   * 주문과 관련 없는 문의는
   * 입력하지 않아도 된다.
   */
  const [
    orderId,
    setOrderId
  ] = useState("");


  /**
   * 제목
   */
  const [
    title,
    setTitle
  ] = useState("");


  /**
   * 문의 내용
   */
  const [
    content,
    setContent
  ] = useState("");


  /**
   * 등록 처리 중 여부
   *
   * 연속 클릭으로
   * 중복 문의가 등록되는 것을 방지한다.
   */
  const [
    submitting,
    setSubmitting
  ] = useState(false);


  /**
   * 고객 문의 등록
   */
  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      /**
       * 로그인 여부 확인
       */
      if (
        !sw ||
        !memberId
      ) {

        alert(
          "로그인 후 고객 문의를 등록할 수 있습니다."
        );

        navigate(
          "/login"
        );

        return;
      }


      /**
       * 문의 유형 확인
       */
      if (
        !category.trim()
      ) {

        alert(
          "문의 유형을 선택해주세요."
        );

        return;
      }


      /**
       * 제목 확인
       */
      if (
        !title.trim()
      ) {

        alert(
          "문의 제목을 입력해주세요."
        );

        return;
      }


      /**
       * 제목 최대 길이 확인
       *
       * Spring DTO:
       * @Size(max = 255)
       */
      if (
        title.trim().length > 255
      ) {

        alert(
          "문의 제목은 255자 이하로 입력해주세요."
        );

        return;
      }


      /**
       * 문의 내용 확인
       */
      if (
        !content.trim()
      ) {

        alert(
          "문의 내용을 입력해주세요."
        );

        return;
      }


      /**
       * 주문 번호 확인
       *
       * 비어 있으면 null 처리
       */
      let parsedOrderId:
        number | null = null;


      if (
        orderId.trim() !== ""
      ) {

        const value =
          Number(
            orderId
          );


        if (
          !Number.isInteger(value) ||
          value <= 0
        ) {

          alert(
            "관련 주문 번호를 올바르게 입력해주세요."
          );

          return;
        }


        parsedOrderId =
          value;
      }


      const requestData:
        CustomerQnaRequest = {

          memberId:
            memberId,

          category:
            category,

          orderId:
            parsedOrderId,

          title:
            title.trim(),

          content:
            content.trim()
        };


      try {

        setSubmitting(
          true
        );


        const response =
          await axiosInstance.post<CustomerQnaResponse>(
            "/customer_qna",
            requestData
          );


        console.log(
          "고객 문의 등록 성공:",
          response.data
        );


        alert(
          "고객 문의가 등록되었습니다."
        );


        /**
         * 등록 완료 후
         * 마이페이지 Q&A로 이동
         */
        navigate(
          "/mypage"
        );


      } catch (error: any) {

        console.error(
          "고객 문의 등록 오류:",
          error
        );


        const serverMessage =
          error?.response?.data?.message;


        if (serverMessage) {

          alert(
            serverMessage
          );

        } else {

          alert(
            "고객 문의 등록 중 오류가 발생했습니다."
          );
        }


      } finally {

        setSubmitting(
          false
        );
      }
    };


  /**
   * 비로그인 사용자
   */
  if (
    !sw ||
    !memberId
  ) {

    return (

      <main className="customer-qna-page">

        <section className="customer-qna-heading">

          <p>
            CUSTOMER SERVICE
          </p>

          <h1>
            고객 문의
          </h1>

          <span>
            문의를 등록하려면 로그인이 필요합니다.
          </span>

        </section>


        <section className="customer-qna-login-box">

          <p>
            로그인 후 고객 문의를 이용해주세요.
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
            로그인
          </button>

        </section>

      </main>
    );
  }


  return (

    <main className="customer-qna-page">

      {/* =========================
          고객 문의 제목
      ========================= */}
      <section className="customer-qna-heading">

        <p>
          CUSTOMER SERVICE
        </p>

        <h1>
          고객 문의
        </h1>

        <span>
          주문, 배송, 교환·반품 및 기타 이용 문의를 남겨주세요.
        </span>

      </section>


      {/* =========================
          고객 문의 등록 폼
      ========================= */}
      <form
        className="customer-qna-form"
        onSubmit={
          handleSubmit
        }
      >

        {/* 문의 유형 */}
        <div className="customer-qna-form-row">

          <label
            htmlFor="customer-qna-category"
          >
            문의 유형
            <span className="customer-qna-required">
              *
            </span>
          </label>


          <div className="customer-qna-form-field">

            <select
              id="customer-qna-category"
              value={
                category
              }
              onChange={
                (
                  event
                ) =>
                  setCategory(
                    event.target.value
                  )
              }
            >
              <option value="GENERAL">
                일반 문의
              </option>

              <option value="ORDER">
                주문 문의
              </option>

              <option value="DELIVERY">
                배송 문의
              </option>

              <option value="CANCEL">
                주문 취소 문의
              </option>

              <option value="RETURN">
                반품 문의
              </option>

              <option value="EXCHANGE">
                교환 문의
              </option>

              <option value="PAYMENT">
                결제 문의
              </option>

              <option value="ETC">
                기타 문의
              </option>
            </select>

          </div>

        </div>


        {/* 관련 주문 번호 */}
        <div className="customer-qna-form-row">

          <label
            htmlFor="customer-qna-order-id"
          >
            관련 주문 번호
          </label>


          <div className="customer-qna-form-field">

            <input
              id="customer-qna-order-id"
              type="number"
              min="1"
              value={
                orderId
              }
              onChange={
                (
                  event
                ) =>
                  setOrderId(
                    event.target.value
                  )
              }
              placeholder="주문 관련 문의인 경우에만 입력해주세요."
            />


            <p className="customer-qna-help">
              주문과 관계없는 문의라면 입력하지 않아도 됩니다.
            </p>

          </div>

        </div>


        {/* 제목 */}
        <div className="customer-qna-form-row">

          <label
            htmlFor="customer-qna-title"
          >
            제목
            <span className="customer-qna-required">
              *
            </span>
          </label>


          <div className="customer-qna-form-field">

            <input
              id="customer-qna-title"
              type="text"
              maxLength={
                255
              }
              value={
                title
              }
              onChange={
                (
                  event
                ) =>
                  setTitle(
                    event.target.value
                  )
              }
              placeholder="문의 제목을 입력해주세요."
            />


            <div className="customer-qna-length">

              {
                title.length
              }

              / 255

            </div>

          </div>

        </div>


        {/* 내용 */}
        <div className="customer-qna-form-row customer-qna-content-row">

          <label
            htmlFor="customer-qna-content"
          >
            문의 내용
            <span className="customer-qna-required">
              *
            </span>
          </label>


          <div className="customer-qna-form-field">

            <textarea
              id="customer-qna-content"
              value={
                content
              }
              onChange={
                (
                  event
                ) =>
                  setContent(
                    event.target.value
                  )
              }
              placeholder={
                "문의 내용을 자세하게 입력해주세요.\n확인이 필요한 주문이 있다면 관련 주문 번호도 함께 입력해주세요."
              }
            />

          </div>

        </div>


        {/* 안내 */}
        <div className="customer-qna-notice">

          <strong>
            문의 전 확인해주세요.
          </strong>

          <p>
            등록된 문의는 마이페이지의 Q&A 메뉴에서 확인할 수 있습니다.
          </p>

          <p>
            관리자 답변이 완료되기 전에는 문의 내용을 수정하거나 삭제할 수 있습니다.
          </p>

        </div>


        {/* 버튼 */}
        <div className="customer-qna-actions">

          <button
            className="customer-qna-cancel-button"
            type="button"
            onClick={
              () =>
                navigate(
                  -1
                )
            }
            disabled={
              submitting
            }
          >
            취소
          </button>


          <button
            className="customer-qna-submit-button"
            type="submit"
            disabled={
              submitting
            }
          >

            {
              submitting
                ? "등록 중..."
                : "문의 등록"
            }

          </button>

        </div>

      </form>

    </main>
  );
};


export default CustomerQnaCreate;