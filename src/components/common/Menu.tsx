import { useState } from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import "../../styles/common/Menu.css";

import { useGlobalStore } from "../../store/store";
import { axiosInstance } from "../ToolBak";
import goddessLogo from "../../assets/logo/goddesslogo1.png";

type MegaMenuKey =
  | "shop"
  | "makeup"
  | "skincare"
  | "hair"
  | "diagnosis"
  | null;

const Menu = () => {
  const navigate = useNavigate();

  const { sw } = useGlobalStore();

  const [activeMenu, setActiveMenu] =
    useState<MegaMenuKey>(null);

  const goUserPage = () => {
    if (sw === true) {
      navigate("/mypage");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("로그아웃하시겠습니까?");

    if (!confirmed) {
      return;
    }

    try {
      // Spring AuthController: POST /api/auth/logout
      await axiosInstance.post("/api/auth/logout");
    } catch (error) {
      // 서버 로그아웃 요청이 실패해도 브라우저 로그인 상태는 정리한다.
      console.error("로그아웃 API 오류", error);
    } finally {
      // 현재 프로젝트에서 사용 중인 Zustand 로그인 상태 초기화
      useGlobalStore.setState({
        sw: false,
        memberId: 0,
      });

      // 기존 인증 구현에서 사용할 수 있는 토큰 키도 함께 정리
      [
        "accessToken",
        "refreshToken",
        "token",
        "jwtToken",
      ].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      navigate("/", { replace: true });
    }
  };

  return (
    <header
      className="goddess-header"
      onMouseLeave={() =>
        setActiveMenu(null)
      }
    >
      {/* =========================
          TOP
      ========================= */}
      <div className="goddess-header-top">
        <div className="goddess-header-top-inner">

          <div className="goddess-header-left">
            <span>
              DISCOVER YOUR BEAUTY
            </span>
          </div>

          {/* 가운데 로고 */}
          <NavLink
            to="/"
            className="goddess-header-logo"
            aria-label="여신강림 홈으로 이동"
          >
            <img
              src={goddessLogo}
              alt="여신강림"
              className="goddess-header-logo-image"
            />
          </NavLink>

          {/* 오른쪽 */}
          <div className="goddess-header-actions">

            {/* USER */}
            <button
              type="button"
              className="goddess-header-icon-button"
              onClick={goUserPage}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                />
                <path d="M4.5 21c.7-4.3 3.5-7 7.5-7s6.8 2.7 7.5 7" />
              </svg>

              <span>
                {sw
                  ? "MY PAGE"
                  : "LOGIN"}
              </span>
            </button>

            {sw && (
              <button
                type="button"
                className="goddess-header-icon-button"
                onClick={handleLogout}
                aria-label="로그아웃"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M10 4H5v16h5" />
                  <path d="M14 8l4 4-4 4" />
                  <path d="M8 12h10" />
                </svg>

                <span>LOGOUT</span>
              </button>
            )}

            {/* CART */}
            <button
              type="button"
              className="goddess-header-icon-button"
              onClick={() =>
                navigate("/cart")
              }
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6.5 8h11l1 13h-13l1-13Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>

              <span>
                BAG
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          MAIN NAV
      ========================= */}
      <div className="goddess-header-bottom">
        <nav className="goddess-main-nav">

          <NavLink
            to="/products"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu("shop")
            }
          >
            SHOP ALL
          </NavLink>

          <NavLink
            to="/products?category=makeup"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu("makeup")
            }
          >
            MAKEUP
          </NavLink>

          <NavLink
            to="/products?category=skincare"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu(
                "skincare"
              )
            }
          >
            SKINCARE
          </NavLink>

          <NavLink
            to="/products?category=hair"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu("hair")
            }
          >
            HAIR
          </NavLink>

          <NavLink
            to="/diagnosis?type=skin"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu("diagnosis")
            }
          >
            BEAUTY CHECK
          </NavLink>

          <NavLink
            to="/beauty"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu(null)
            }
          >
            AI BEAUTY
          </NavLink>
        </nav>
      </div>

      {/* =========================
          MEGA MENU
      ========================= */}

      {activeMenu && (
        <div
          className="goddess-mega-menu"
          onMouseEnter={() =>
            setActiveMenu(
              activeMenu
            )
          }
        >
          <div className="goddess-mega-inner">

            {/* =====================
                SHOP
            ====================== */}
            {activeMenu ===
              "shop" && (
              <>
                <div className="mega-feature">
                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/products?category=makeup"
                      )
                    }
                  >
                    <div className="mega-visual makeup-visual">
                      <span />
                    </div>

                    <p>
                      MAKEUP COLLECTION
                    </p>
                  </div>

                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/products?category=skincare"
                      )
                    }
                  >
                    <div className="mega-visual skincare-visual">
                      <span />
                    </div>

                    <p>
                      SKINCARE EDIT
                    </p>
                  </div>
                </div>

                <div className="mega-column">
                  <h3>
                    SHOP
                  </h3>

                  <NavLink to="/products">
                    전체 상품
                  </NavLink>

                  <NavLink to="/products?sort=new">
                    신상품
                  </NavLink>

                  <NavLink to="/products?sort=best">
                    베스트
                  </NavLink>

                  <NavLink to="/products?category=makeup">
                    메이크업
                  </NavLink>

                  <NavLink to="/products?category=skincare">
                    스킨케어
                  </NavLink>

                  <NavLink to="/products?category=hair">
                    헤어
                  </NavLink>
                </div>

                <div className="mega-column">
                  <h3>
                    AI BEAUTY
                  </h3>

                  <NavLink to="/beauty?mode=makeup">
                    AI 메이크업
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-style">
                    AI 헤어스타일
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-color">
                    AI 헤어컬러
                  </NavLink>
                </div>
              </>
            )}

            {/* =====================
                MAKEUP
            ====================== */}
            {activeMenu ===
              "makeup" && (
              <>
                <div className="mega-feature">
                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/products?category=makeup&type=base"
                      )
                    }
                  >
                    <div className="mega-visual cushion-visual">
                      <span />
                    </div>

                    <p>
                      BASE MAKEUP
                    </p>
                  </div>

                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/products?category=makeup&type=lip"
                      )
                    }
                  >
                    <div className="mega-visual lip-visual">
                      <span />
                    </div>

                    <p>
                      LIP COLLECTION
                    </p>
                  </div>
                </div>

                <div className="mega-column">
                  <h3>
                    FACE
                  </h3>

                  <NavLink to="/products?category=makeup&type=foundation">
                    파운데이션
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=cushion">
                    쿠션
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=blusher">
                    블러셔
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=powder">
                    파우더
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=concealer">
                    컨실러
                  </NavLink>
                </div>

                <div className="mega-column">
                  <h3>
                    LIP
                  </h3>

                  <NavLink to="/products?category=makeup&type=lipstick">
                    립스틱
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=lipbalm">
                    립밤
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=lip-tint">
                    립틴트
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=lip-gloss">
                    립글로스
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=lip-liner">
                    립라이너
                  </NavLink>
                </div>

                <div className="mega-column">
                  <h3>
                    EYE
                  </h3>

                  <NavLink to="/products?category=makeup&type=mascara">
                    마스카라
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=eyeshadow">
                    아이 팔레트
                  </NavLink>

                  <NavLink to="/products?category=makeup&type=eyeliner">
                    아이라이너
                  </NavLink>
                </div>
              </>
            )}

            {/* =====================
                SKINCARE
            ====================== */}
            {activeMenu ===
              "skincare" && (
              <>
                <div className="mega-feature">
                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/products?category=skincare&type=serum"
                      )
                    }
                  >
                    <div className="mega-visual serum-visual">
                      <span />
                    </div>

                    <p>
                      SERUM EDIT
                    </p>
                  </div>

                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/products?category=skincare&type=cream"
                      )
                    }
                  >
                    <div className="mega-visual cream-visual">
                      <span />
                    </div>

                    <p>
                      DAILY MOISTURE
                    </p>
                  </div>
                </div>

                <div className="mega-column">
                  <h3>
                    SKINCARE
                  </h3>

                  <NavLink to="/products?category=skincare&type=toner">
                    토너
                  </NavLink>

                  <NavLink to="/products?category=skincare&type=serum">
                    세럼
                  </NavLink>

                  <NavLink to="/products?category=skincare&type=cream">
                    크림
                  </NavLink>

                  <NavLink to="/products?category=skincare&type=mask">
                    마스크
                  </NavLink>

                  <NavLink to="/products?category=skincare&type=cleanser">
                    클렌저
                  </NavLink>
                </div>

                <div className="mega-column">
                  <h3>
                    CARE
                  </h3>

                  <NavLink to="/products?category=skincare">
                    스킨케어 모두 보기
                  </NavLink>

                  <NavLink to="/products?category=skincare&sort=new">
                    신제품
                  </NavLink>

                  <NavLink to="/products?category=skincare&sort=best">
                    베스트
                  </NavLink>
                </div>
              </>
            )}

            {/* =====================
                HAIR
            ====================== */}
            {activeMenu ===
              "hair" && (
              <>
                <div className="mega-feature">
                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/beauty?mode=hair-style"
                      )
                    }
                  >
                    <div className="mega-visual hairstyle-visual">
                      <span />
                    </div>

                    <p>
                      TRY HAIR STYLE
                    </p>
                  </div>

                  <div
                    className="mega-feature-card"
                    onClick={() =>
                      navigate(
                        "/beauty?mode=hair-color"
                      )
                    }
                  >
                    <div className="mega-visual haircolor-visual">
                      <span />
                    </div>

                    <p>
                      TRY HAIR COLOR
                    </p>
                  </div>
                </div>

                <div className="mega-column">
                  <h3>
                    HAIR STYLE
                  </h3>

                  <NavLink to="/beauty?mode=hair-style&style=short">
                    단발
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-style&style=long">
                    장발
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-style&style=layered">
                    레이어드
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-style&style=wave">
                    웨이브
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-style&style=straight">
                    스트레이트
                  </NavLink>
                </div>

                <div className="mega-column">
                  <h3>
                    HAIR COLOR
                  </h3>

                  <NavLink to="/beauty?mode=hair-color&color=black">
                    블랙
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-color&color=brown">
                    브라운
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-color&color=ash-brown">
                    애쉬브라운
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-color&color=red-brown">
                    레드브라운
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-color&color=blonde">
                    블론드
                  </NavLink>
                </div>
              </>
            )}

            {/* =====================
                DIAGNOSIS
            ====================== */}
            {activeMenu === "diagnosis" && (
              <div className="diagnosis-mega">
                <div className="diagnosis-mega-heading">
                  <span>DISCOVER YOUR BEAUTY</span>
                  <h3>나에게 맞는 뷰티 기준을 찾아보세요.</h3>
                  <p>
                    간단한 셀프 진단으로 피부 타입과 퍼스널 컬러를 확인하고
                    나에게 어울리는 제품 선택에 활용할 수 있어요.
                  </p>
                </div>

                <button
                  type="button"
                  className="diagnosis-mega-card skin"
                  onClick={() => navigate("/diagnosis?type=skin")}
                >
                  <span className="diagnosis-mega-number">01</span>
                  <div>
                    <small>SKIN DIAGNOSIS</small>
                    <strong>피부 타입 진단</strong>
                    <p>건성 · 지성 · 복합성 · 중성 · 민감성</p>
                  </div>
                  <b>→</b>
                </button>

                <button
                  type="button"
                  className="diagnosis-mega-card personal"
                  onClick={() => navigate("/diagnosis?type=personal-color")}
                >
                  <span className="diagnosis-mega-number">02</span>
                  <div>
                    <small>PERSONAL COLOR</small>
                    <strong>퍼스널 컬러 진단</strong>
                    <p>봄웜 · 여름쿨 · 가을웜 · 겨울쿨</p>
                  </div>
                  <b>→</b>
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </header>
  );
};

export default Menu;