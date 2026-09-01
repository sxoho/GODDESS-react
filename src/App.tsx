import {
  Route,
  Routes,
  useLocation
} from "react-router-dom";

import {
  getCopyright
} from "./components/ToolBak";

import "./App.css";

import Menu from "./components/common/Menu";
import Home from "./pages/Home";
import MyPage from "./pages/mypage/MyPage";
import MyPage_PasswordUpdate from "./pages/mypage/MyPage_PasswordUpdate";

import ProductList from "./pages/product/ProductList";
import ProductDetail from "./pages/product/ProductDetail";

import Member_Login from "./components/member/Member_Login";
import Member_Signup from "./components/member/Member_Signup";
import Member_FindId from "./components/member/Member_FindId";
import Member_FindPassword from "./components/member/Member_FindPassword";

import AdminLayout from "./components/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AdminCategory from "./pages/admin/category/AdminCategory";
import AdminProductList from "./pages/admin/product/AdminProductList";
import AdminProductForm from "./pages/admin/product/AdminProductForm";
import AdminProductDetail from "./pages/admin/product/AdminProductDetail";
import AdminProductQna from "./pages/admin/qna/AdminProductQna";
import AdminCustomerQna from "./pages/admin/qna/AdminCustomerQna";
import AdminProductReview from "./pages/admin/AdminProductReview";
import AdminMemberList from "./pages/admin/member/AdminMemberList";
import AdminMemberDetail from "./pages/admin/member/AdminMemberDetail";
import AdminMemberUpdate from "./pages/admin/member/AdminMemberUpdate";


/**
 * 관리자 공지사항
 */
import AdminNoticeList from "./pages/admin/notice/AdminNoticeList";
import AdminNoticeCreate from "./pages/admin/notice/AdminNoticeCreate";
import AdminNoticeUpdate from "./pages/admin/notice/AdminNoticeUpdate";
import AdminNoticeDetail from "./pages/admin/notice/AdminNoticeDetail";


/**
 * 일반 사용자 공지사항
 */
import NoticeList from "./pages/notice/NoticeList";
import NoticeDetail from "./pages/notice/NoticeDetail";


/**
 * 고객 문의
 */
import CustomerQnaCreate from "./pages/customerqna/CustomerQnaCreate";


/**
 * 쇼핑몰
 */
import Wishlist from "./pages/wishlist/Wishlist";
import Cart from "./pages/cart/Cart";
import Order from "./pages/order/Order.tsx";
import Chat from "./pages/chat/Chat.tsx";


/**
 * AI FITTING
 */
import VirtualFittingRequest from "./pages/fitting/VirtualFittingRequest.tsx";
import FittingLayout from "./pages/fitting/FittingLayout";
import FittingProfile from "./pages/fitting/FittingProfile";


/**
 * ONNIVER 전체 라우팅 설정
 *
 * React 실행 주소:
 * http://localhost:5173
 */
function App() {

  const location =
    useLocation();


  const isAdminPage =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");


  return (
    <>
      {isAdminPage ? (

        <Routes>

          {/* =========================
              관리자 영역
          ========================= */}

          <Route
            path="/admin"
            element={<AdminLayout />}
          >

            {/* 관리자 홈 */}
            <Route
              index
              element={<AdminHome />}
            />


            {/* =========================
                관리자 상품 & 카테고리
            ========================= */}

            {/* 관리자 상품 목록 */}
            <Route
              path="products"
              element={<AdminProductList />}
            />

            {/* 관리자 상품 등록 */}
            <Route
              path="products/new"
              element={<AdminProductForm />}
            />

            {/* 관리자 상품 수정 */}
            <Route
              path="products/:productId/edit"
              element={<AdminProductForm />}
            />

            {/* 관리자 카테고리 */}
            <Route
              path="categories"
              element={<AdminCategory />}
            />


            {/* =========================
                관리자 회원
            ========================= */}

            {/* 관리자 회원 목록 */}
            <Route
              path="members"
              element={<AdminMemberList />}
            />

            {/* 관리자 회원 정보보기 */}
            <Route
              path="members/:memberId/detail"
              element={<AdminMemberDetail />}
            />

            {/* 관리자 회원 수정 */}
            <Route
              path="members/:memberId/edit"
              element={<AdminMemberUpdate />}
            />


            {/* =========================
                관리자 상품 문의
            ========================= */}

            <Route
              path="product-qna"
              element={<AdminProductQna />}
            />


            {/* =========================
                관리자 고객 문의
            ========================= */}

            <Route
              path="customer-qna"
              element={<AdminCustomerQna />}
            />


            {/* =========================
                관리자 상품 리뷰
            ========================= */}

            <Route
              path="reviews"
              element={<AdminProductReview />}
            />


            {/* =========================
                관리자 공지사항
            ========================= */}

            {/* 관리자 공지사항 목록 */}
            <Route
              path="notices"
              element={<AdminNoticeList />}
            />

            {/* 관리자 공지사항 등록 */}
            <Route
              path="notices/create"
              element={<AdminNoticeCreate />}
            />

            {/* 관리자 공지사항 상세 */}
            <Route
              path="notices/:noticeId"
              element={<AdminNoticeDetail />}
            />

            {/* 관리자 공지사항 수정 */}
            <Route
              path="notices/:noticeId/update"
              element={<AdminNoticeUpdate />}
            />

          </Route>


          {/* 관리자 상품 정보
              단독 레이아웃
          */}
          <Route
            path="/admin/products/:productId"
            element={<AdminProductDetail />}
          />

        </Routes>

      ) : (

        /* =========================
            일반 사용자 영역
        ========================= */

        <div className="app">

          {/* 공통 상단 메뉴 */}
          <Menu />


          {/* 페이지 본문 */}
          <main className="content">

            <Routes>

              {/* =========================
                  홈
              ========================= */}

              <Route
                path="/"
                element={<Home />}
              />


              {/* =========================
                  상품 / 쇼핑몰 기능
              ========================= */}

              {/* 상품 목록 */}
              <Route
                path="/products"
                element={<ProductList />}
              />

              {/* 상품 상세 */}
              <Route
                path="/products/:productId"
                element={<ProductDetail />}
              />

              {/* 상품 찜 */}
              <Route
                path="/wishlist"
                element={<Wishlist />}
              />

              {/* 장바구니 */}
              <Route
                path="/cart"
                element={<Cart />}
              />

              {/* 주문 */}
              <Route
                path="/order"
                element={<Order />}
              />

              {/* 챗봇 */}
              <Route
                path="/chat"
                element={<Chat />}
              />


              {/* =========================
                  AI FITTING
              ========================= */}

              <Route
                path="/fitting"
                element={<FittingLayout />}
              >

                {/* AI FITTING 첫 화면 */}
                <Route
                  index
                  element={<FittingProfile />}
                />


                {/* 피팅 프로필 */}
                <Route
                  path="profile"
                  element={<FittingProfile />}
                />


                {/* AI 가상 피팅 */}
                <Route
                  path="tryon"
                  element={<VirtualFittingRequest />}
                />

              </Route>


              {/* 기존 가상 피팅 경로
                  기존 연결 보호를 위해 유지
              */}
              <Route
                path="/fitting/request"
                element={<VirtualFittingRequest />}
              />


              {/* =========================
                  공지사항
              ========================= */}

              {/* 공지사항 목록 */}
              <Route
                path="/notice"
                element={<NoticeList />}
              />

              {/* 공지사항 상세 */}
              <Route
                path="/notice/:noticeId"
                element={<NoticeDetail />}
              />


              {/* =========================
                  고객 문의
              ========================= */}

              {/* 고객 문의 등록 */}
              <Route
                path="/customer_qna"
                element={<CustomerQnaCreate />}
              />


              {/* =========================
                  회원
              ========================= */}

              {/* 로그인 */}
              <Route
                path="/login"
                element={<Member_Login />}
              />

              {/* 회원가입 */}
              <Route
                path="/signup"
                element={<Member_Signup />}
              />

              {/* 아이디 찾기 */}
              <Route
                path="/find_id"
                element={<Member_FindId />}
              />

              {/* 비밀번호 찾기 */}
              <Route
                path="/find_password"
                element={<Member_FindPassword />}
              />


              {/* =========================
                  마이페이지
              ========================= */}

              {/* 마이페이지 */}
              <Route
                path="/mypage"
                element={<MyPage />}
              />

              {/* 마이페이지 비밀번호 변경 */}
              <Route
                path="/mypage/password"
                element={<MyPage_PasswordUpdate />}
              />

            </Routes>

          </main>


          {/* 공통 하단 영역 */}
          <footer className="footer">

            <p className="footer-description">
              AI 기반 가상 피팅 패션 플랫폼
            </p>

            <p className="footer-copyright">
              © 2026 {getCopyright()}. All rights reserved.
            </p>

          </footer>

        </div>
      )}
    </>
  );
}


export default App;