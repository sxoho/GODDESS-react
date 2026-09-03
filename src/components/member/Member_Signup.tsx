import { useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  axiosInstance,
  enterChk,
} from "../ToolBak";

import type MemberType from './MemberType';

const Member_Signup = () => {
  const navigate = useNavigate();

  const [member, setMember] =
    useState<MemberType>({
      loginId: '',
      password: '',
      name: '',
      nickname: '',
      email: '',
      tel: '',
      zipcode: '',
      address1: '',
      address2: '',
    });

  /**
   * 비밀번호 확인
   */
  const [
    passwordCheck,
    setPasswordCheck,
  ] = useState('');

  /**
   * 중복 검사 여부
   */
  const [
    loginIdChecked,
    setLoginIdChecked,
  ] = useState(false);

  const [
    nicknameChecked,
    setNicknameChecked,
  ] = useState(false);

  const [
    emailChecked,
    setEmailChecked,
  ] = useState(false);

  /**
   * 입력값 변경
   */
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } =
      event.target;

    setMember((prev) => ({
      ...prev,
      [name]: value,
    }));

    /**
     * 중복 검사 후 값을 다시 변경하면
     * 다시 중복 검사를 해야 함
     */
    if (name === 'loginId') {
      setLoginIdChecked(false);
    }

    if (name === 'nickname') {
      setNicknameChecked(false);
    }

    if (name === 'email') {
      setEmailChecked(false);
    }
  };

  /**
   * 아이디 중복 검사
   */
  const checkLoginId = async () => {
    if (!member.loginId?.trim()) {
      alert(
        '아이디를 입력해주세요.'
      );

      return;
    }

    try {
      const response =
        await axiosInstance.get(
          '/member/check_id',
          {
            params: {
              loginId:
                member.loginId,
            },
          }
        );

      /**
       * false = 중복 없음
       * true  = 중복 있음
       */
      if (response.data === false) {
        alert(
          '사용 가능한 아이디입니다.'
        );

        setLoginIdChecked(true);
      } else {
        alert(
          '이미 사용 중인 아이디입니다.'
        );

        setLoginIdChecked(false);
      }

    } catch (error) {
      console.error(error);

      alert(
        '아이디 중복 검사 중 오류가 발생했습니다.'
      );
    }
  };

  /**
   * 닉네임 중복 검사
   */
  const checkNickname = async () => {
    if (!member.nickname?.trim()) {
      alert(
        '닉네임을 입력해주세요.'
      );

      return;
    }

    try {
      const response =
        await axiosInstance.get(
          '/member/check_nickname',
          {
            params: {
              nickname:
                member.nickname,
            },
          }
        );

      /**
       * false = 중복 없음
       * true  = 중복 있음
       */
      if (response.data === false) {
        alert(
          '사용 가능한 닉네임입니다.'
        );

        setNicknameChecked(true);
      } else {
        alert(
          '이미 사용 중인 닉네임입니다.'
        );

        setNicknameChecked(false);
      }

    } catch (error) {
      console.error(error);

      alert(
        '닉네임 중복 검사 중 오류가 발생했습니다.'
      );
    }
  };

  /**
   * 이메일 중복 검사
   */
  const checkEmail = async () => {
    if (!member.email?.trim()) {
      alert(
        '이메일을 입력해주세요.'
      );

      return;
    }

    try {
      const response =
        await axiosInstance.get(
          '/member/check_email',
          {
            params: {
              email:
                member.email,
            },
          }
        );

      /**
       * false = 중복 없음
       * true  = 중복 있음
       */
      if (response.data === false) {
        alert(
          '사용 가능한 이메일입니다.'
        );

        setEmailChecked(true);
      } else {
        alert(
          '이미 사용 중인 이메일입니다.'
        );

        setEmailChecked(false);
      }

    } catch (error) {
      console.error(error);

      alert(
        '이메일 중복 검사 중 오류가 발생했습니다.'
      );
    }
  };

  /**
   * 회원가입
   */
  const signup = async () => {
    if (!member.loginId?.trim()) {
      alert(
        '아이디를 입력해주세요.'
      );

      return;
    }

    if (!loginIdChecked) {
      alert(
        '아이디 중복 검사를 해주세요.'
      );

      return;
    }

    if (!member.password?.trim()) {
      alert(
        '비밀번호를 입력해주세요.'
      );

      return;
    }

    if (
      member.password !==
      passwordCheck
    ) {
      alert(
        '비밀번호가 일치하지 않습니다.'
      );

      return;
    }

    if (!member.name?.trim()) {
      alert(
        '이름을 입력해주세요.'
      );

      return;
    }

    if (!member.nickname?.trim()) {
      alert(
        '닉네임을 입력해주세요.'
      );

      return;
    }

    if (!nicknameChecked) {
      alert(
        '닉네임 중복 검사를 해주세요.'
      );

      return;
    }

    if (!member.email?.trim()) {
      alert(
        '이메일을 입력해주세요.'
      );

      return;
    }

    if (!emailChecked) {
      alert(
        '이메일 중복 검사를 해주세요.'
      );

      return;
    }

    try {
      const response =
        await axiosInstance.post(
          '/member/save',
          {
            loginId:
              member.loginId,

            password:
              member.password,

            name:
              member.name,

            nickname:
              member.nickname,

            email:
              member.email,

            tel:
              member.tel,

            zipcode:
              member.zipcode,

            address1:
              member.address1,

            address2:
              member.address2,
          }
        );

      console.log(
        '-> signup:',
        response.data
      );

      alert(
        '회원가입이 완료되었습니다.'
      );

      navigate('/login');

    } catch (error) {
      console.error(error);

      alert(
        '회원가입 중 오류가 발생했습니다.'
      );
    }
  };

  return (
    <div className="member-page">
      <div className="member-card member-signup-card">

        <h2 className="member-title">
          SIGN UP
        </h2>

        <p className="member-subtitle">
          GODDESS 회원이 되어
          <br />
          AI 기반 스타일 추천과 가상 피팅을 경험해보세요.
        </p>

        <h3 className="member-section-title">
          기본 정보
        </h3>

        {/* 아이디 */}
        <div className="member-form-group">
          <label
            htmlFor="loginId"
            className="member-label"
          >
            아이디
            <span className="member-required">
              *
            </span>
          </label>

          <div className="member-input-row">

            <input
              type="text"
              id="loginId"
              name="loginId"
              className="member-input"
              value={
                member.loginId ?? ''
              }
              onChange={handleChange}
              onKeyDown={(event) =>
                enterChk(
                  event,
                  'password'
                )
              }
              placeholder="아이디를 입력해주세요."
            />

            <button
              type="button"
              className="member-check-button"
              onClick={checkLoginId}
            >
              중복 확인
            </button>

          </div>
        </div>

        {/* 비밀번호 */}
        <div className="member-form-group">

          <label
            htmlFor="password"
            className="member-label"
          >
            비밀번호
            <span className="member-required">
              *
            </span>
          </label>

          <input
            type="password"
            id="password"
            name="password"
            className="member-input"
            value={
              member.password ?? ''
            }
            onChange={handleChange}
            onKeyDown={(event) =>
              enterChk(
                event,
                'passwordCheck'
              )
            }
            placeholder="비밀번호를 입력해주세요."
          />

        </div>

        {/* 비밀번호 확인 */}
        <div className="member-form-group">

          <label
            htmlFor="passwordCheck"
            className="member-label"
          >
            비밀번호 확인
            <span className="member-required">
              *
            </span>
          </label>

          <input
            type="password"
            id="passwordCheck"
            className="member-input"
            value={passwordCheck}
            onChange={(event) =>
              setPasswordCheck(
                event.target.value
              )
            }
            onKeyDown={(event) =>
              enterChk(
                event,
                'name'
              )
            }
            placeholder="비밀번호를 한 번 더 입력해주세요."
          />

        </div>

        {/* 이름 */}
        <div className="member-form-group">

          <label
            htmlFor="name"
            className="member-label"
          >
            이름
            <span className="member-required">
              *
            </span>
          </label>

          <input
            type="text"
            id="name"
            name="name"
            className="member-input"
            value={
              member.name ?? ''
            }
            onChange={handleChange}
            onKeyDown={(event) =>
              enterChk(
                event,
                'nickname'
              )
            }
            placeholder="이름을 입력해주세요."
          />

        </div>

        {/* 닉네임 */}
        <div className="member-form-group">

          <label
            htmlFor="nickname"
            className="member-label"
          >
            닉네임
            <span className="member-required">
              *
            </span>
          </label>

          <div className="member-input-row">

            <input
              type="text"
              id="nickname"
              name="nickname"
              className="member-input"
              value={
                member.nickname ?? ''
              }
              onChange={handleChange}
              placeholder="닉네임을 입력해주세요."
            />

            <button
              type="button"
              className="member-check-button"
              onClick={checkNickname}
            >
              중복 확인
            </button>

          </div>
        </div>

        {/* 이메일 */}
        <div className="member-form-group">

          <label
            htmlFor="email"
            className="member-label"
          >
            이메일
            <span className="member-required">
              *
            </span>
          </label>

          <div className="member-input-row">

            <input
              type="email"
              id="email"
              name="email"
              className="member-input"
              value={
                member.email ?? ''
              }
              onChange={handleChange}
              placeholder="example@onniver.com"
            />

            <button
              type="button"
              className="member-check-button"
              onClick={checkEmail}
            >
              중복 확인
            </button>

          </div>
        </div>

        <h3 className="member-section-title">
          배송 정보
        </h3>

        {/* 전화번호 */}
        <div className="member-form-group">

          <label
            htmlFor="tel"
            className="member-label"
          >
            전화번호
          </label>

          <input
            type="text"
            id="tel"
            name="tel"
            className="member-input"
            value={
              member.tel ?? ''
            }
            onChange={handleChange}
            placeholder="010-0000-0000"
          />

        </div>

        {/* 우편번호 */}
        <div className="member-form-group">

          <label
            htmlFor="zipcode"
            className="member-label"
          >
            우편번호
          </label>

          <input
            type="text"
            id="zipcode"
            name="zipcode"
            className="member-input"
            value={
              member.zipcode ?? ''
            }
            onChange={handleChange}
            placeholder="우편번호"
          />

        </div>

        {/* 기본 주소 */}
        <div className="member-form-group">

          <label
            htmlFor="address1"
            className="member-label"
          >
            기본 주소
          </label>

          <input
            type="text"
            id="address1"
            name="address1"
            className="member-input"
            value={
              member.address1 ?? ''
            }
            onChange={handleChange}
            placeholder="기본 주소를 입력해주세요."
          />

        </div>

        {/* 상세 주소 */}
        <div className="member-form-group">

          <label
            htmlFor="address2"
            className="member-label"
          >
            상세 주소
          </label>

          <input
            type="text"
            id="address2"
            name="address2"
            className="member-input"
            value={
              member.address2 ?? ''
            }
            onChange={handleChange}
            placeholder="상세 주소를 입력해주세요."
          />

        </div>

        <button
          type="button"
          className="member-main-button"
          onClick={signup}
        >
          SIGN UP
        </button>

        <div className="member-bottom">

          <span>
            이미 회원이신가요?
          </span>

          <Link to="/login">
            LOGIN
          </Link>

        </div>

      </div>
    </div>
  );
};

export default Member_Signup;