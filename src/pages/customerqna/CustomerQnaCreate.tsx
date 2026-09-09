import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { axiosInstance } from "../../components/ToolBak";
import { useGlobalStore } from "../../store/store";

import "../../styles/customerqna/CustomerQna.css";


type CustomerQnaRequest = {
  memberId: number;
  category: string;
  orderId: number | null;
  title: string;
  content: string;
};


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


const CATEGORY_OPTIONS = [
  {
    value: "ACCOUNT",
    label: "회원 / 로그인"
  },
  {
    value: "ORDER",
    label: "주문 / 결제"
  },
  {
    value: "DELIVERY",
    label: "배송 / 반품"
  },
  {
    value: "DIAGNOSIS",
    label: "피부 · 퍼스널컬러 진단"
  },
  {
    value: "AI_BEAUTY",
    label: "AI BEAUTY"
  },
  {
    value: "SERVICE",
    label: "서비스 이용"
  },
  {
    value: "ETC",
    label: "기타 문의"
  }
];


const CustomerQnaCreate = () => {
  const navigate = useNavigate();

  const {
    sw,
    memberId
  } = useGlobalStore();

  const [
    category,
    setCategory
  ] = useState("ACCOUNT");

  const [
    orderId,
    setOrderId
  ] = useState("");

  const [
    title,
    setTitle
  ] = useState("");

  const [
    content,
    setContent
  ] = useState("");

  const [
    submitting,
    setSubmitting
  ] = useState(false);


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

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


    const trimmedTitle =
      title.trim();

    const trimmedContent =
      content.trim();


    if (!category) {
      alert(
        "문의 유형을 선택해주세요."
      );

      return;
    }


    if (!trimmedTitle) {
      alert(
        "문의 제목을 입력해주세요."
      );

      return;
    }


    if (
      trimmedTitle.length > 255
    ) {
      alert(
        "문의 제목은 255자 이하로 입력해주세요."
      );

      return;
    }


    if (!trimmedContent) {
      alert(
        "문의 내용을 입력해주세요."
      );

      return;
    }


    let parsedOrderId:
      number | null = null;


    if (orderId.trim()) {
      const value =
        Number(orderId);


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
        memberId,
        category,
        orderId:
          parsedOrderId,
        title:
          trimmedTitle,
        content:
          trimmedContent
      };


    try {
      setSubmitting(
        true
      );


      await axiosInstance
        .post<CustomerQnaResponse>(
          "/customer_qna",
          requestData
        );


      alert(
        "고객 문의가 등록되었습니다."
      );


      navigate(
        "/mypage"
      );

    } catch (error: any) {
      console.error(
        "고객 문의 등록 오류:",
        error
      );


      alert(
        error?.response?.data?.message ||
        "고객 문의 등록 중 오류가 발생했습니다."
      );

    } finally {
      setSubmitting(
        false
      );
    }
  };


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
            onClick={() =>
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

      <section className="customer-qna-heading">
        <p>
          CUSTOMER SERVICE
        </p>

        <h1>
          고객 문의
        </h1>

        <span>
          회원, 주문, 배송, 자가진단,
          AI BEAUTY 등 서비스 이용 중
          궁금한 점을 남겨주세요.
        </span>
      </section>


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
                (event) =>
                  setCategory(
                    event.target.value
                  )
              }
            >
              {
                CATEGORY_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )
              }
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
                (event) =>
                  setOrderId(
                    event.target.value
                  )
              }
              placeholder="주문 또는 배송 관련 문의인 경우 입력해주세요."
            />


            <p className="customer-qna-help">
              회원, 자가진단,
              AI BEAUTY 등 주문과 관계없는 문의는
              입력하지 않아도 됩니다.
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
                (event) =>
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


        {/* 문의 내용 */}
        <div
          className="
            customer-qna-form-row
            customer-qna-content-row
          "
        >

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
                (event) =>
                  setContent(
                    event.target.value
                  )
              }
              placeholder={
                "문의 내용을 자세하게 입력해주세요.\n주문 또는 배송 관련 문의라면 관련 주문 번호도 함께 입력해주세요."
              }
            />

          </div>

        </div>


        <div className="customer-qna-notice">

          <strong>
            문의 전 확인해주세요.
          </strong>

          <p>
            등록된 문의는 마이페이지의
            Q&A 메뉴에서 확인할 수 있습니다.
          </p>

          <p>
            관리자 답변 전에는
            문의 내용을 수정하거나 삭제할 수 있습니다.
          </p>

        </div>


        <div className="customer-qna-actions">

          <button
            className="customer-qna-cancel-button"
            type="button"
            disabled={
              submitting
            }
            onClick={() =>
              navigate(
                -1
              )
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