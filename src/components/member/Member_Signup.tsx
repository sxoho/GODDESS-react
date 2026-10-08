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
import "../../styles/member/MemberSignup.css";

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
   * 다음 우편번호 검색
   * - 외부 스크립트를 최초 1회 로드한 뒤 주소 검색창을 연다.
   * - 선택한 우편번호와 기본 주소를 회원 정보에 자동 입력한다.
   */
  const openPostcode = () => {
    const openDaumPostcode = () => {
      const daum = (window as any).daum;

      if (!daum?.Postcode) {
        alert('주소 검색 서비스를 불러오지 못했습니다.');
        return;
      }

      new daum.Postcode({
        oncomplete: (data: any) => {
          let address = data.roadAddress || data.jibunAddress || '';

          if (data.userSelectedType === 'R' && data.bname) {
            const extraAddress = [];

            if (/[동|로|가]$/g.test(data.bname)) {
              extraAddress.push(data.bname);
            }

            if (data.buildingName && data.apartment === 'Y') {
              extraAddress.push(data.buildingName);
            }

            if (extraAddress.length > 0) {
              address += ` (${extraAddress.join(', ')})`;
            }
          }

          setMember((prev) => ({
            ...prev,
            zipcode: data.zonecode ?? '',
            address1: address,
          }));

          window.setTimeout(() => {
            document.getElementById('address2')?.focus();
          }, 0);
        },
      }).open();
    };

    if ((window as any).daum?.Postcode) {
      openDaumPostcode();
      return;
    }

    const scriptId = 'daum-postcode-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', openDaumPostcode, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = openDaumPostcode;
    script.onerror = () => {
      alert('주소 검색 서비스를 불러오지 못했습니다.');
    };

    document.head.appendChild(script);
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
    <div className="goddess-signup-page">
      <div className="goddess-signup-container">
        <div className="goddess-signup-header">
          <h1>SIGN UP</h1>
          <p>
            회원가입하고
            <br />
            AI 뷰티 추천과 가상 메이크업 · 헤어 체험을 만나보세요.
          </p>
        </div>

        <div className="goddess-signup-card">
          <section className="goddess-signup-section">
            <div className="goddess-signup-section-header">
              <div>
                <span>01</span>
                <h2>기본 정보</h2>
              </div>
              <p><strong>*</strong> 필수 입력</p>
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="loginId">아이디 <span>*</span></label>
              <div className="goddess-signup-input-row">
                <input
                  type="text"
                  id="loginId"
                  name="loginId"
                  value={member.loginId ?? ''}
                  onChange={handleChange}
                  onKeyDown={(event) => enterChk(event, 'password')}
                  placeholder="아이디를 입력해주세요."
                  autoComplete="username"
                />
                <button type="button" onClick={checkLoginId}>중복 확인</button>
              </div>
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="password">비밀번호 <span>*</span></label>
              <input
                type="password"
                id="password"
                name="password"
                value={member.password ?? ''}
                onChange={handleChange}
                onKeyDown={(event) => enterChk(event, 'passwordCheck')}
                placeholder="비밀번호를 입력해주세요."
                autoComplete="new-password"
              />
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="passwordCheck">비밀번호 확인 <span>*</span></label>
              <input
                type="password"
                id="passwordCheck"
                value={passwordCheck}
                onChange={(event) => setPasswordCheck(event.target.value)}
                onKeyDown={(event) => enterChk(event, 'name')}
                placeholder="비밀번호를 한 번 더 입력해주세요."
                autoComplete="new-password"
              />
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="name">이름 <span>*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={member.name ?? ''}
                onChange={handleChange}
                onKeyDown={(event) => enterChk(event, 'nickname')}
                placeholder="이름을 입력해주세요."
              />
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="nickname">닉네임 <span>*</span></label>
              <div className="goddess-signup-input-row">
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={member.nickname ?? ''}
                  onChange={handleChange}
                  placeholder="닉네임을 입력해주세요."
                />
                <button type="button" onClick={checkNickname}>중복 확인</button>
              </div>
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="email">이메일 <span>*</span></label>
              <div className="goddess-signup-input-row">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={member.email ?? ''}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  autoComplete="email"
                />
                <button type="button" onClick={checkEmail}>중복 확인</button>
              </div>
            </div>
          </section>

          <section className="goddess-signup-section goddess-signup-delivery">
            <div className="goddess-signup-section-header">
              <div>
                <span>02</span>
                <h2>배송 정보</h2>
              </div>
              <p>선택 입력</p>
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="tel">전화번호 ex) 01012345678 , 010-1234-5678 둘 다 가능합니다 </label>
              <input
                type="text"
                id="tel"
                name="tel"
                value={member.tel ?? ''}
                onChange={handleChange}
                placeholder="010-0000-0000"
                autoComplete="tel"
              />
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="zipcode">주소</label>
              <div className="goddess-signup-input-row goddess-signup-address-row">
                <input
                  type="text"
                  id="zipcode"
                  name="zipcode"
                  value={member.zipcode ?? ''}
                  placeholder="우편번호"
                  readOnly
                />
                <button type="button" onClick={openPostcode}>우편번호 찾기</button>
              </div>
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="address1">기본 주소</label>
              <input
                type="text"
                id="address1"
                name="address1"
                value={member.address1 ?? ''}
                placeholder="주소 검색 후 자동 입력됩니다."
                readOnly
              />
            </div>

            <div className="goddess-signup-form-group">
              <label htmlFor="address2">상세 주소</label>
              <input
                type="text"
                id="address2"
                name="address2"
                value={member.address2 ?? ''}
                onChange={handleChange}
                placeholder="상세 주소를 입력해주세요."
                autoComplete="address-line2"
              />
            </div>
          </section>

          <button
            type="button"
            className="goddess-signup-submit"
            onClick={signup}
          >
            SIGN UP
          </button>

          <div className="goddess-signup-login">
            <span>이미 회원이신가요?</span>
            <Link to="/login">LOGIN</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Member_Signup;