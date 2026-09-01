import { Outlet } from "react-router-dom";

import AdminMenu from "./AdminMenu";
import "../../styles/admin/AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <AdminMenu />

      <div className="admin-layout-main">
        <header className="admin-topbar">
          <div>
            <span>ADMINISTRATION</span>
          </div>

          <div className="admin-user">
            <span>Administrator</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;