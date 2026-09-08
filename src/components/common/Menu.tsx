import { useState } from "react";
import { BRAND } from "../../config/brand";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import "../../styles/common/Menu.css";

import { useGlobalStore } from "../../store/store";
import { axiosInstance } from "../ToolBak";

type MegaMenuKey =
  | "shop"
  | "makeup"
  | "skincare"
  | "hair"
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
          >
            {BRAND.name}
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
            to="/beauty"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu(null)
            }
          >
            AI BEAUTY
          </NavLink>

          <NavLink
            to="/notice"
            className="goddess-nav-link"
            onMouseEnter={() =>
              setActiveMenu(null)
            }
          >
            NOTICE
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
                        "/products?category=hair&type=shampoo"
                      )
                    }
                  >
                    <div className="mega-visual shampoo-visual">
                      <span />
                    </div>

                    <p>
                      HAIR CARE
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
                    HAIR
                  </h3>

                  <NavLink to="/products?category=hair&type=shampoo">
                    샴푸
                  </NavLink>

                  <NavLink to="/products?category=hair&type=conditioner">
                    컨디셔너
                  </NavLink>

                  <NavLink to="/products?category=hair&type=treatment">
                    트리트먼트
                  </NavLink>

                  <NavLink to="/products?category=hair&type=essence">
                    헤어 에센스
                  </NavLink>
                </div>

                <div className="mega-column">
                  <h3>
                    AI HAIR
                  </h3>

                  <NavLink to="/beauty?mode=hair-style">
                    헤어스타일 체험
                  </NavLink>

                  <NavLink to="/beauty?mode=hair-color">
                    헤어컬러 체험
                  </NavLink>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Menu;