import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getSpringApiUrl } from "../../components/ToolBak";
import "../../styles/admin/AdminHome.css";

type ProductQna = { id: number; status: string };

type IconName = "box" | "message" | "star" | "check" | "grid" | "plus";

const DashboardIcon = ({ name }: { name: IconName }) => {
  const shapes = {
    box: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></>,
    message: <><path d="M4 5h16v12H9l-5 4z"/><path d="M8 9h8M8 13h5"/></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    grid: <><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
  } as const;

  return <svg className="dashboard-icon" viewBox="0 0 24 24" aria-hidden="true">{shapes[name]}</svg>;
};

const API_BASE = getSpringApiUrl();

const AdminHome = () => {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [waitingQnaCount, setWaitingQnaCount] = useState(0);
  const [totalQnaCount, setTotalQnaCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const productResponse = await fetch(`${API_BASE}/product/find_all`);
        if (productResponse.ok) {
          const products = await productResponse.json();
          setProductCount(Array.isArray(products) ? products.length : 0);
        }

        const qnaResponse = await fetch(`${API_BASE}/product_qna/find_all`);
        if (qnaResponse.ok) {
          const qnas: ProductQna[] = await qnaResponse.json();
          setTotalQnaCount(qnas.length);
          setWaitingQnaCount(qnas.filter((qna) => qna.status === "WAITING").length);
        }

        const reviewResponse = await fetch(`${API_BASE}/product_review/admin/page?page=0&size=1`);
        if (reviewResponse.ok) {
          const reviews = await reviewResponse.json();
          setReviewCount(reviews.totalElements ?? 0);
        }
      } catch (error) {
        console.error("관리자 대시보드 조회 오류", error);
      }
    };

    loadDashboard();
  }, []);

  const answeredQnaCount = useMemo(
    () => Math.max(0, totalQnaCount - waitingQnaCount),
    [totalQnaCount, waitingQnaCount],
  );

  const statCards = [
    { label: "등록 상품", value: productCount, icon: "box" as const, path: "/admin/products" },
    { label: "답변 대기", value: waitingQnaCount, icon: "message" as const, path: "/admin/product-qna" },
    { label: "상품 후기", value: reviewCount, icon: "star" as const, path: "/admin/reviews" },
    { label: "답변 완료", value: answeredQnaCount, icon: "check" as const, path: "/admin/product-qna" },
  ];

  return (
    <main className="goddess-admin-dashboard">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-eyebrow">GODDESS ADMIN</span>
          <h1>오늘의 운영 현황</h1>
          <p>필요한 업무만 빠르게 확인할 수 있도록 간결하게 정리했어요.</p>
        </div>

        <div className="dashboard-welcome-actions">
          <button type="button" className="dashboard-secondary-button" onClick={() => navigate("/")}>
            쇼핑몰 보기
          </button>
          <button type="button" className="dashboard-primary-button" onClick={() => navigate("/admin/products/new")}>
            <DashboardIcon name="plus" />
            상품 등록
          </button>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="운영 지표">
        {statCards.map((item) => (
          <button key={item.label} type="button" className="dashboard-stat-card" onClick={() => navigate(item.path)}>
            <span className="dashboard-stat-icon"><DashboardIcon name={item.icon} /></span>
            <span className="dashboard-stat-copy">
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </span>
            <span className="dashboard-stat-arrow">→</span>
          </button>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-priority-card">
          <div className="dashboard-card-head">
            <span className="dashboard-soft-icon"><DashboardIcon name="message" /></span>
            <span className="dashboard-eyebrow">PRIORITY</span>
          </div>

          <div className="dashboard-priority-body">
            <div>
              <h2>답변을 기다리는 문의</h2>
              <p>고객이 기다리고 있는 상품 문의를 먼저 확인해보세요.</p>
            </div>
            <strong>{waitingQnaCount}</strong>
          </div>

          <button type="button" className="dashboard-text-button" onClick={() => navigate("/admin/product-qna")}>
            문의 관리로 이동 <span>→</span>
          </button>
        </article>

        <article className="dashboard-quick-card">
          <div className="dashboard-section-title">
            <div>
              <span className="dashboard-eyebrow">QUICK MENU</span>
              <h2>빠른 관리</h2>
            </div>
            <DashboardIcon name="grid" />
          </div>

          <div className="dashboard-quick-list">
            <button type="button" onClick={() => navigate("/admin/products")}>
              <span><DashboardIcon name="box" /> 상품 관리</span><b>→</b>
            </button>
            <button type="button" onClick={() => navigate("/admin/categories")}>
              <span><DashboardIcon name="grid" /> 카테고리</span><b>→</b>
            </button>
            <button type="button" onClick={() => navigate("/admin/reviews")}>
              <span><DashboardIcon name="star" /> 후기 관리</span><b>→</b>
            </button>
            <button type="button" onClick={() => navigate("/admin/product-qna")}>
              <span><DashboardIcon name="message" /> 상품 문의</span><b>→</b>
            </button>
          </div>
        </article>
      </section>

      <section className="dashboard-guide">
        <div className="dashboard-guide-icon"><span>G</span></div>
        <div>
          <span className="dashboard-eyebrow">GODDESS TIP</span>
          <h3>상품 추천 정보도 함께 관리해주세요.</h3>
          <p>피부 타입, 퍼스널컬러, AI BEAUTY 적용 여부가 쇼핑 필터와 바로 연결됩니다.</p>
        </div>
        <button type="button" onClick={() => navigate("/admin/products/new")}>새 상품 등록 →</button>
      </section>
    </main>
  );
};

export default AdminHome;
