/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string; // 사용할 변수 추가
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}