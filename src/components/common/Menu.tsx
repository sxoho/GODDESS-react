import {
  NavLink,
  useLocation,
} from "react-router-dom";

import "../../styles/common/Menu.css";

import {
  useGlobalStore
} from "../../store/store";


const Menu = () => {

  const location =
    useLocation();


  const {
    sw,
    gradeId,
  } = useGlobalStore();


  /**
   * 로그인 후 사용자 메뉴를 표시할 페이지
   *
   * SHOP / AI FITTING / STYLE RECOMMENDATION /
   * CART / NOTICE /
   * MY PAGE / MY LIKE / SHOPPING BAG
   *
   * 위 페이지와 관련 상세 페이지에서는
   *
   * 우측에
   * MY PAGE / MY LIKE / SHOPPING BAG / LOGOUT
   * 메뉴를 계속 표시한다.
   */
  const isMemberMenuPage =
    /* SHOP */
    location.pathname === "/products" ||
    location.pathname.startsWith("/products/") ||

    /* MY PAGE */
    location.pathname === "/mypage" ||
    location.pathname.startsWith("/mypage/") ||

    /* MY LIKE */
    location.pathname === "/wishlist" ||
    location.pathname.startsWith("/wishlist/") ||

    /* AI FITTING */
    location.pathname === "/fitting" ||
    location.pathname.startsWith("/fitting/") ||

    /* STYLE RECOMMENDATION */
    location.pathname === "/recommend" ||
    location.pathname.startsWith("/recommend/") ||

    /* CART / SHOPPING BAG */
    location.pathname === "/cart" ||
    location.pathname.startsWith("/cart/") ||

    /* NOTICE */
    location.pathname === "/notice" ||
    location.pathname.startsWith("/notice/");


  /**
   * 관리자 여부
   *
   * GRADE_ID
   * 4 = ADMIN
   */
  const isAdmin =
    Number(gradeId) === 4;


  return (
    <header className="common-header">

      <div className="common-header-inner">

        {/* 로고 */}
        <NavLink
          to="/"
          className="common-header-logo"
        >
          ONNIVER
        </NavLink>


        {/* 주요 메뉴 */}
        <nav
          className="common-header-navigation"
          aria-label="주요 메뉴"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "common-header-link active"
                : "common-header-link"
            }
          >
            HOME
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive
                ? "common-header-link active"
                : "common-header-link"
            }
          >
            SHOP
          </NavLink>

          <NavLink
            to="/fitting"
            className={({ isActive }) =>
              isActive
                ? "common-header-link active"
                : "common-header-link"
            }
          >
            AI FITTING
          </NavLink>

          <NavLink
            to="/recommend"
            className={({ isActive }) =>
              isActive
                ? "common-header-link active"
                : "common-header-link"
            }
          >
            STYLE RECOMMENDATION
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              isActive
                ? "common-header-link active"
                : "common-header-link"
            }
          >
            CART
          </NavLink>

          {/* 공지사항 */}
          <NavLink
            to="/notice"
            className={({ isActive }) =>
              isActive
                ? "common-header-link active"
                : "common-header-link"
            }
          >
            NOTICE
          </NavLink>
        </nav>


        {/* 우측 사용자 메뉴 */}
        {isMemberMenuPage ? (

          <nav
            className="common-header-member-menu product-member-menu"
            aria-label="사용자 메뉴"
          >

            {/* 관리자 모드 */}
            {sw === true &&
              isAdmin && (

                <NavLink
                  to="/admin"
                  className="common-header-admin-mode"
                >
                  ADMIN MODE
                </NavLink>
              )}


            <NavLink to="/mypage">
              MY PAGE
            </NavLink>

            <NavLink to="/wishlist">
              MY LIKE
            </NavLink>

            <NavLink to="/cart">
              SHOPPING BAG
            </NavLink>


            {sw === true ? (

              <NavLink to="/logout">
                LOGOUT
              </NavLink>

            ) : (

              <NavLink to="/login">
                LOGIN
              </NavLink>
            )}

          </nav>

        ) : (

          <nav
            className="common-header-member-menu"
            aria-label="회원 메뉴"
          >

            {sw === true ? (

              <>

                {/* 관리자 모드 */}
                {isAdmin && (

                  <NavLink
                    to="/admin"
                    className="common-header-admin-mode"
                  >
                    ADMIN MODE
                  </NavLink>
                )}


                <NavLink
                  to="/logout"
                  className="common-header-login-logout"
                >
                  LOGOUT
                </NavLink>


                {/* SIGN UP 자리는 유지하고 화면에서는 숨김 */}
                <NavLink
                  to="/signup"
                  className="common-header-signup common-header-signup-hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  SIGN UP
                </NavLink>

              </>

            ) : (

              <>

                <NavLink
                  to="/login"
                  className="common-header-login-logout"
                >
                  LOGIN
                </NavLink>

                <NavLink
                  to="/signup"
                  className="common-header-signup"
                >
                  SIGN UP
                </NavLink>

              </>
            )}

          </nav>
        )}

      </div>

    </header>
  );
};


export default Menu;