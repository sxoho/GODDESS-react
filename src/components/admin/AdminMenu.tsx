import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

type IconName =
  | "home"
  | "box"
  | "grid"
  | "order"
  | "user"
  | "star"
  | "message"
  | "help"
  | "notice"
  | "shop"
  | "logout";

const AdminIcon = ({ name }: { name: IconName }) => {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></>,
    box: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/></>,
    grid: <><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></>,
    order: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3.2-6 7-6s6.3 2 7 6"/></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>,
    message: <><path d="M4 5h16v12H9l-5 4z"/><path d="M8 9h8M8 13h5"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.7 1.6c-1.3 1-2.2 1.5-2.2 3"/><path d="M12 17h.01"/></>,
    notice: <><path d="M5 12h3l7-5v10l-7-5H5z"/><path d="m15 10 4-2v8l-4-2"/></>,
    shop: <><path d="M5 8h14l-1 12H6z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></>,
    logout: <><path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4M8 12h10"/></>,
  };

  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

const AdminMenu = () => {
  const navigate = useNavigate();

  return (
    <aside className="admin-sidebar">
      <button
        type="button"
        className="admin-brand"
        onClick={() => navigate("/")}
        aria-label="GODDESS 쇼핑몰 홈으로 이동"
      >
        <span className="admin-brand-mark">G</span>
        <span className="admin-brand-copy">
          <strong>GODDESS</strong>
          <small>ADMIN STUDIO</small>
        </span>
      </button>

      <div className="admin-nav-scroll">
        <div className="admin-nav-group">
          <span className="admin-nav-label">OVERVIEW</span>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="home" />
            <span>대시보드</span>
          </NavLink>
        </div>

        <div className="admin-nav-group">
          <span className="admin-nav-label">COMMERCE</span>
          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="box" />
            <span>상품 관리</span>
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="grid" />
            <span>카테고리</span>
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="order" />
            <span>주문 관리</span>
          </NavLink>
        </div>

        <div className="admin-nav-group">
          <span className="admin-nav-label">CUSTOMER</span>
          <NavLink to="/admin/members" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="user" />
            <span>회원 관리</span>
          </NavLink>
          <NavLink to="/admin/reviews" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="star" />
            <span>상품 후기</span>
          </NavLink>
          <NavLink to="/admin/product-qna" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="message" />
            <span>상품 문의</span>
          </NavLink>
          <NavLink to="/admin/customer-qna" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="help" />
            <span>고객 문의</span>
          </NavLink>
        </div>

        <div className="admin-nav-group">
          <span className="admin-nav-label">CONTENT</span>
          <NavLink to="/admin/notices" className={({ isActive }) => (isActive ? "active" : "")}>
            <AdminIcon name="notice" />
            <span>공지사항</span>
          </NavLink>
        </div>
      </div>

      <div className="admin-sidebar-bottom">
        <button type="button" className="admin-shop-link" onClick={() => navigate("/")}>
          <AdminIcon name="shop" />
          <span>쇼핑몰 보기</span>
        </button>

        <button type="button" className="admin-logout-button" onClick={() => navigate("/login")}>
          <AdminIcon name="logout" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminMenu;
