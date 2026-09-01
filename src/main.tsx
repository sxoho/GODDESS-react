import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';

/**
 * React Query 공통 설정
 *
 * Spring Boot 또는 FastAPI에서 받아온 서버 데이터를
 * 캐시하고 관리할 때 사용한다.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 창을 다시 선택할 때마다 자동 재요청하지 않도록 설정
      refetchOnWindowFocus: false,

      // API 요청 실패 시 한 번만 재시도
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'index.html에서 root 요소를 찾을 수 없습니다.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);