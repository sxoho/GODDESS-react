import { Outlet } from "react-router-dom";

import FittingSidebar from "../../components/fitting/FittingSidebar";

import "../../styles/fitting/FittingLayout.css";


const FittingLayout = () => {

  return (
    <main className="fitting-layout">

      <FittingSidebar />


      <section className="fitting-layout-content">

        <Outlet />

      </section>

    </main>
  );
};


export default FittingLayout;