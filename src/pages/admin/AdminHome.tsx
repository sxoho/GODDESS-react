import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getSpringApiUrl } from "../../components/ToolBak";
import "../../styles/admin/AdminHome.css";

type ProductQna = {
  id: number;
  status: string;
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
        // 전체 상품
        const productResponse = await fetch(`${API_BASE}/product/find_all`);

        if (productResponse.ok) {
          const products = await productResponse.json();

          setProductCount(Array.isArray(products) ? products.length : 0);
        }

        // 상품 문의
        const qnaResponse = await fetch(`${API_BASE}/product_qna/find_all`);

        if (qnaResponse.ok) {
          const qnas: ProductQna[] = await qnaResponse.json();

          setTotalQnaCount(qnas.length);

          setWaitingQnaCount(
            qnas.filter((qna) => qna.status === "WAITING").length,
          );
        }

        
        // 상품 후기
        const reviewResponse = await fetch(
          `${API_BASE}/product_review/admin/page?page=0&size=1`,
        );

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

  return (
    <main className="admin-home">
      <section className="admin-home-heading">
        <p>ONNIVER ADMINISTRATION</p>

        <h1>Dashboard</h1>

        <span>ONNIVER 서비스 운영 현황을 확인하세요.</span>
      </section>

      {/* 운영 현황 */}
      <section className="admin-summary-grid">
        <article
          className="admin-summary-link"
          onClick={() => navigate("/admin/products")}
        >
          <span>TOTAL PRODUCTS</span>

          <strong>{productCount}</strong>

          <p>전체 등록 상품</p>
        </article>

        <article
          className="admin-summary-link"
          onClick={() => navigate("/admin/product-qna")}
        >
          <span>WAITING Q&A</span>

          <strong>{waitingQnaCount}</strong>

          <p>답변 대기 문의</p>
        </article>

        <article
          className="admin-summary-link"
          onClick={() => navigate("/admin/product-qna")}
        >
          <span>TOTAL Q&A</span>

          <strong>{totalQnaCount}</strong>

          <p>전체 상품 문의</p>
        </article>

        <article
          className="admin-summary-link"
          onClick={() => navigate("/admin/reviews")}
        >
          <span>REVIEWS</span>

          <strong>{reviewCount}</strong>

          <p>등록된 상품 후기</p>
        </article>
      </section>

      {/* 상품 관리 */}
      <section className="admin-home-section">
        <div className="admin-section-heading">
          <div>
            <p>PRODUCT</p>

            <h2>상품 관리</h2>
          </div>

          <button type="button" onClick={() => navigate("/admin/products")}>
            전체 상품 보기 →
          </button>
        </div>

        <div className="admin-quick-grid">
          <button type="button" onClick={() => navigate("/admin/products")}>
            <span>01</span>

            <strong>상품 목록</strong>

            <p>등록된 상품과 판매 상태를 관리합니다.</p>
          </button>

          <button type="button" onClick={() => navigate("/admin/products/new")}>
            <span>02</span>

            <strong>상품 등록</strong>

            <p>상품 정보와 옵션을 새로 등록합니다.</p>
          </button>

          <button type="button" onClick={() => navigate("/admin/product-qna")}>
            <span>03</span>

            <strong>상품 문의 관리</strong>

            <p>고객의 상품 문의를 확인하고 답변합니다.</p>
          </button>

          <button type="button" onClick={() => navigate("/admin/reviews")}>
            <span>04</span>

            <strong>상품 후기 관리</strong>

            <p>등록된 상품 후기를 확인하고 관리합니다.</p>
          </button>
        </div>
      </section>
    </main>
  );
};

export default AdminHome;
