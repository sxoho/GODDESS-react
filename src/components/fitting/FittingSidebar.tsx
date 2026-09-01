import { NavLink } from "react-router-dom";

import "../../styles/fitting/FittingLayout.css";


const FittingSidebar = () => {

  return (
    <aside className="fitting-sidebar">

      <div className="fitting-sidebar-header">

        <span className="fitting-sidebar-subtitle">
          AI FITTING
        </span>

        <h2>
          FITTING STUDIO
        </h2>

      </div>


      <nav className="fitting-sidebar-menu">

        <NavLink
          to="/fitting/profile"
          className={
            ({ isActive }) =>
              isActive
                ? "fitting-sidebar-link active"
                : "fitting-sidebar-link"
          }
        >
          피팅 프로필
        </NavLink>


        <NavLink
          to="/fitting/photo"
          className={
            ({ isActive }) =>
              isActive
                ? "fitting-sidebar-link active"
                : "fitting-sidebar-link"
          }
        >
          회원 사진
        </NavLink>


        <NavLink
          to="/fitting/tryon"
          className={
            ({ isActive }) =>
              isActive
                ? "fitting-sidebar-link active"
                : "fitting-sidebar-link"
          }
        >
          AI 피팅
        </NavLink>


        <NavLink
          to="/fitting/saved"
          className={
            ({ isActive }) =>
              isActive
                ? "fitting-sidebar-link active"
                : "fitting-sidebar-link"
          }
        >
          저장한 피팅
        </NavLink>

      </nav>

    </aside>
  );
};


export default FittingSidebar;