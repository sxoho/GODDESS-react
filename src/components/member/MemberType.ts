export default interface MemberType {
  id?: number;
  gradeId?: number;

  loginId?: string;
  password?: string;

  name?: string;
  nickname?: string;
  email?: string;
  tel?: string;

  zipcode?: string;
  address1?: string;
  address2?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;
  withdrawnAt?: string;

  /** 비밀번호 변경 시 사용 */
  newPassword?: string;
}