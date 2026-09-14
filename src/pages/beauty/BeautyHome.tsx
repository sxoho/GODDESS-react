import {
  useSearchParams,
  useNavigate
} from "react-router-dom";

import "../../styles/beauty/BeautyHome.css";

import {
  BRAND
} from "../../config/brand";


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


export default function BeautyHome() {

  const [
    params,
    setParams
  ] = useSearchParams();


  const navigate =
    useNavigate();


  const mode =
    MODES.find(
      (item) =>
        item.id ===
        params.get("mode")
    ) ??
    MODES[0];


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


      {/* =========================
          전체 레이아웃
      ========================= */}

      <div className="gd-beauty-page-layout">


        {/* =========================
            왼쪽 사이드바
        ========================= */}

        <aside className="gd-beauty-sidebar">

          <div className="gd-beauty-sidebar-title">

            <span>
              AI BEAUTY
            </span>

            <strong>
              나의 뷰티 체험
            </strong>

          </div>


          <nav className="gd-beauty-sidebar-menu">

            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    "/beauty?view=photo"
                  )
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
              onClick={
                () =>
                  navigate(
                    "/beauty?view=saved"
                  )
              }
            >

              <span>
                SAVED BEAUTY
              </span>

              <small>
                저장 내역
              </small>

            </button>


            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    "/beauty?view=membership"
                  )
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


        {/* =========================
            오른쪽 기존 AI BEAUTY 화면
        ========================= */}

        <div className="gd-beauty-main">


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

                {MODES.map(
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

                      {item.label}

                    </button>

                  )
                )}

              </div>


              <div
                className="gd-beauty-panel-body"
                aria-live="polite"
              >

                <h2
                  id="beauty-mode-title"
                >
                  {mode.title}
                </h2>


                <p className="gd-beauty-description">
                  {mode.description}
                </p>


                <ul className="gd-beauty-options">

                  {mode.options.map(
                    (option) => (

                      <li
                        key={
                          option
                        }
                      >
                        {option}
                      </li>

                    )
                  )}

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

        </div>

      </div>

    </div>
  );
}