import {
  axiosInstance
} from "../components/ToolBak";


/**
 * 피팅 프로필 응답
 */
export type FittingProfile = {
  fittingProfileId: number;
  memberId: number;
  height: number;
  bodyType: string;
  topSize: string;
  bottomSize: string;
  preferredFit: string;
  createdAt?: string;
  updatedAt?: string | null;
};


/**
 * 피팅 프로필 등록 / 수정 요청
 */
export type FittingProfileRequest = {
  memberId: number;
  height: number;
  bodyType: string;
  topSize: string;
  bottomSize: string;
  preferredFit: string;
};


/**
 * 피팅 프로필 존재 여부
 */
export const existsFittingProfile =
  async (
    memberId: number
  ): Promise<boolean> => {

    const response =
      await axiosInstance.get<boolean>(
        `/fitting_profile/member/${memberId}/exists`
      );

    return response.data;
  };


/**
 * 회원 피팅 프로필 조회
 */
export const getFittingProfile =
  async (
    memberId: number
  ): Promise<FittingProfile> => {

    const response =
      await axiosInstance.get<FittingProfile>(
        `/fitting_profile/member/${memberId}`
      );

    return response.data;
  };


/**
 * 피팅 프로필 최초 등록
 */
export const createFittingProfile =
  async (
    request: FittingProfileRequest
  ): Promise<FittingProfile> => {

    const response =
      await axiosInstance.post<FittingProfile>(
        "/fitting_profile",
        request
      );

    return response.data;
  };


/**
 * 피팅 프로필 수정
 */
export const updateFittingProfile =
  async (
    memberId: number,
    request: FittingProfileRequest
  ): Promise<FittingProfile> => {

    const response =
      await axiosInstance.put<FittingProfile>(
        `/fitting_profile/member/${memberId}`,
        request
      );

    return response.data;
  };