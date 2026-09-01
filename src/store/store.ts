import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

/**
 * 쿠키 저장소
 */
const cookieStorage = {
  getItem: (name: string): string | null => {
    const cookies = document.cookie.split(';');

    const targetCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${name}=`)
    );

    if (!targetCookie) {
      return null;
    }

    const value = targetCookie
      .trim()
      .substring(name.length + 1);

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  },

  setItem: (name: string, value: string): void => {
    const maxAge = 60 * 60 * 24;

    document.cookie =
      `${name}=${encodeURIComponent(value)}; ` +
      `path=/; max-age=${maxAge}; SameSite=Lax`;
  },

  removeItem: (name: string): void => {
    document.cookie =
      `${name}=; path=/; max-age=0; SameSite=Lax`;
  },
};

interface GlobalStore {
  /** 로그인 여부 */
  sw: boolean;
  setSW: (value: boolean) => void;

  /** 회원 번호 */
  memberId: number;
  setMemberId: (value: number) => void;

  /** 로그인 아이디 */
  loginId: string;
  setLoginId: (value: string) => void;

  /** 닉네임 */
  nickname: string;
  setNickname: (value: string) => void;

  /** 회원 등급 번호 */
  gradeId: number;
  setGradeId: (value: number) => void;

  /** 회원 등급명 */
  gradeName: string;
  setGradeName: (value: string) => void;

  /** 로그인 정보 초기화 */
  resetMember: () => void;
}

export const useGlobalStore = create<GlobalStore>()(
  persist(
    (set) => ({
      sw: false,
      setSW: (value) => set({ sw: value }),

      memberId: 0,
      setMemberId: (value) => set({ memberId: value }),

      loginId: '',
      setLoginId: (value) => set({ loginId: value }),

      nickname: '',
      setNickname: (value) => set({ nickname: value }),

      gradeId: 0,
      setGradeId: (value) => set({ gradeId: value }),

      gradeName: '',
      setGradeName: (value) => set({ gradeName: value }),

      resetMember: () =>
        set({
          sw: false,
          memberId: 0,
          loginId: '',
          nickname: '',
          gradeId: 0,
          gradeName: '',
        }),
    }),
    {
      name: 'onniver-global-store',
      storage: createJSONStorage(() => cookieStorage),
    },
  ),
);