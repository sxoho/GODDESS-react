import { NavLink, useNavigate } from "react-router-dom";

const AdminMenu = () => {
  const navigate = useNavigate();

  return (
    <aside className="admin-sidebar">
      {/* =========================
          관리자 로고
          클릭 시 쇼핑몰 HOME 이동
      ========================= */}

      <div className="admin-logo" onClick={() => navigate("/")}>
        <strong>GODDESS</strong>

        <span>ADMIN</span>
      </div>

      <nav className="admin-menu">
        {/* Dashboard */}

        <NavLink
          to="/admin"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Dashboard
        </NavLink>

        {/* 카테고리 관리 */}

        <NavLink
          to="/admin/categories"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          카테고리 관리
        </NavLink>

        {/* 상품 관리 */}

        <NavLink
          to="/admin/products"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          상품 관리
        </NavLink>

        {/* 회원 관리 */}

        <NavLink
          to="/admin/members"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          회원 관리
        </NavLink>

        {/* 주문 관리 */}

        <button type="button" disabled>
          주문 관리
        </button>

        {/* 상품 후기 */}

        <NavLink
          to="/admin/reviews"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          상품 후기
        </NavLink>

        {/* 상품 문의 */}

        <NavLink
          to="/admin/product-qna"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          상품 문의
        </NavLink>

        {/* 고객 문의 */}

        <NavLink
          to="/admin/customer-qna"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          고객 문의
        </NavLink>

        {/* 공지사항 */}

        <NavLink
          to="/admin/notices"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          공지사항
        </NavLink>
      </nav>

      <div className="admin-sidebar-bottom">
        {/* 쇼핑몰 이동 */}

        <a href="/" className="admin-shop-link">
          쇼핑몰 보기
        </a>

        <button
          type="button"
          className="admin-logout-button"
          onClick={() => navigate("/login")}
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
};

export default AdminMenu;
