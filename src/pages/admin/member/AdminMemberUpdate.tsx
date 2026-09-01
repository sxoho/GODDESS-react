import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  axiosInstance
} from "../../../components/ToolBak";

import "../../../styles/admin/AdminMemberUpdate.css";

type Member = {
  id: number;
  loginId: string;
  name: string;
  nickname: string;
  email: string;
  tel?: string;
  zipcode?: string;
  address1?: string;
  address2?: string;
  status: string;
  gradeId?: number;
  gradeName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MemberUpdateForm = {
  nickname: string;
  password: string;
  email: string;
  gradeId: number;
  zipcode: string;
  address1: string;
  address2: string;
};

const AdminMemberUpdate = () => {

  const navigate = useNavigate();

  const { memberId } =
    useParams();

  const [member, setMember] =
    useState<Member | null>(
      null
    );

  const [form, setForm] =
    useState<MemberUpdateForm>({
      nickname: "",
      password: "",
      email: "",
      gradeId: 1,
      zipcode: "",
      address1: "",
      address2: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [nicknameChecked, setNicknameChecked] =
    useState(false);

  /**
   * 회원 정보 조회
   */
  useEffect(() => {

    const loadMember = async () => {

      if (!memberId) {
        return;
      }

      try {

        setLoading(true);

        const response =
          await axiosInstance.get<Member>(
            `/member/${memberId}`
          );

        const data =
          response.data;

        console.log(
          "-> 회원 상세:",
          data
        );

        setMember(data);

        setForm({
          nickname:
            data.nickname || "",

          password:
            "",

          email:
            data.email || "",

          gradeId:
            data.gradeId || 1,

          zipcode:
            data.zipcode || "",

          address1:
            data.address1 || "",

          address2:
            data.address2 || "",
        });

        /**
         * 기존 닉네임은
         * 이미 현재 회원이 사용 중이므로
         * 처음에는 검사 완료 상태
         */
        setNicknameChecked(true);

      } catch (error) {

        console.error(
          "회원 상세 조회 오류:",
          error
        );

        alert(
          "회원 정보를 불러오지 못했습니다."
        );

        navigate(
          "/admin/members"
        );

      } finally {

        setLoading(false);
      }
    };

    loadMember();

  }, [
    memberId,
    navigate
  ]);

  /**
   * 입력값 변경
   */
  const handleChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {

    const {
      name,
      value
    } = event.target;

    if (
      name === "gradeId"
    ) {

      setForm((prev) => ({
        ...prev,
        gradeId:
          Number(value),
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        value,
    }));

    /**
     * 닉네임이 변경되면
     * 다시 중복검사를 해야 함
     */
    if (
      name === "nickname"
    ) {

      if (
        value ===
        member?.nickname
      ) {
        setNicknameChecked(
          true
        );
      } else {
        setNicknameChecked(
          false
        );
      }
    }
  };

  /**
   * 닉네임 중복 검사
   */
  const checkNickname = async () => {

    if (!memberId) {
      return;
    }

    const nickname =
      form.nickname.trim();

    if (!nickname) {

      alert(
        "닉네임을 입력해주세요."
      );

      return;
    }

    /**
     * 기존 닉네임을
     * 그대로 사용하는 경우
     */
    if (
      nickname ===
      member?.nickname
    ) {

      alert(
        "현재 사용 중인 닉네임입니다."
      );

      setNicknameChecked(
        true
      );

      return;
    }

    try {

      const response =
        await axiosInstance.get<boolean>(
          "/member/check_nickname_update",
          {
            params: {
              memberId:
                Number(memberId),

              nickname:
                nickname,
            },
          }
        );

      /**
       * true = 중복
       */
      if (
        response.data === true
      ) {

        alert(
          "이미 사용 중인 닉네임입니다."
        );

        setNicknameChecked(
          false
        );

      } else {

        alert(
          "사용 가능한 닉네임입니다."
        );

        setNicknameChecked(
          true
        );
      }

    } catch (error) {

      console.error(
        "닉네임 중복 확인 오류:",
        error
      );

      alert(
        "닉네임 중복 확인 중 오류가 발생했습니다."
      );
    }
  };

  /**
   * 회원 정보 수정
   */
  const handleSubmit = async (
    event:
      React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    if (!memberId) {
      return;
    }

    if (
      !form.nickname.trim()
    ) {

      alert(
        "닉네임을 입력해주세요."
      );

      return;
    }

    if (
      !nicknameChecked
    ) {

      alert(
        "닉네임 중복 확인을 해주세요."
      );

      return;
    }

    if (
      !form.email.trim()
    ) {

      alert(
        "이메일을 입력해주세요."
      );

      return;
    }

    if (
      form.gradeId < 1 ||
      form.gradeId > 4
    ) {

      alert(
        "회원 등급은 1부터 4까지만 입력할 수 있습니다."
      );

      return;
    }

    try {

      setSubmitting(
        true
      );

      await axiosInstance.put(
        `/member/${memberId}`,
        {
          nickname:
            form.nickname.trim(),

          password:
            form.password,

          email:
            form.email.trim(),

          gradeId:
            form.gradeId,

          zipcode:
            form.zipcode.trim(),

          address1:
            form.address1.trim(),

          address2:
            form.address2.trim(),
        }
      );

      alert(
        "회원 정보가 수정되었습니다."
      );

      navigate(
        "/admin/members"
      );

    } catch (error) {

      console.error(
        "회원 수정 오류:",
        error
      );

      alert(
        "회원 정보 수정 중 오류가 발생했습니다."
      );

    } finally {

      setSubmitting(
        false
      );
    }
  };

  if (loading) {

    return (
      <main className="admin-member-update-page">

        <div className="admin-member-update-message">
          회원 정보를 불러오는 중입니다.
        </div>

      </main>
    );
  }

  if (!member) {

    return null;
  }

  return (
    <main className="admin-member-update-page">

      <div className="admin-member-update-header">

        <div>

          <p>
            MEMBER MANAGEMENT
          </p>

          <h1>
            회원 정보 수정
          </h1>

          <span>
            회원 정보를 확인하고
            필요한 항목을 수정합니다.
          </span>

        </div>

        <button
          type="button"
          className="admin-member-update-back"
          onClick={() =>
            navigate(
              "/admin/members"
            )
          }
        >
          목록으로
        </button>

      </div>

      <form
        onSubmit={
          handleSubmit
        }
      >

        <section className="admin-member-update-section">

          <div className="admin-member-update-section-title">

            <span>
              01
            </span>

            <div>

              <h2>
                기본 회원 정보
              </h2>

              <p>
                아이디와 이름은
                관리자 화면에서 수정하지 않습니다.
              </p>

            </div>

          </div>

          <div className="admin-member-update-grid">

            <div className="admin-member-update-field">

              <label>
                회원 번호
              </label>

              <input
                type="text"
                value={
                  member.id
                }
                readOnly
              />

            </div>

            <div className="admin-member-update-field">

              <label>
                아이디
              </label>

              <input
                type="text"
                value={
                  member.loginId
                }
                readOnly
              />

            </div>

            <div className="admin-member-update-field">

              <label>
                이름
              </label>

              <input
                type="text"
                value={
                  member.name
                }
                readOnly
              />

            </div>

            <div className="admin-member-update-field">

              <label>
                현재 상태
              </label>

              <input
                type="text"
                value={
                  member.status
                }
                readOnly
              />

            </div>

          </div>

        </section>

        <section className="admin-member-update-section">

          <div className="admin-member-update-section-title">

            <span>
              02
            </span>

            <div>

              <h2>
                회원 정보 수정
              </h2>

              <p>
                닉네임, 비밀번호,
                이메일과 회원 등급을 수정합니다.
              </p>

            </div>

          </div>

          <div className="admin-member-update-grid">

            <div className="admin-member-update-field full">

              <label>
                닉네임
              </label>

              <div className="admin-member-update-inline">

                <input
                  type="text"
                  name="nickname"
                  value={
                    form.nickname
                  }
                  onChange={
                    handleChange
                  }
                />

                <button
                  type="button"
                  onClick={
                    checkNickname
                  }
                >
                  중복 확인
                </button>

              </div>

            </div>

            <div className="admin-member-update-field">

              <label>
                비밀번호
              </label>

              <input
                type="password"
                name="password"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                placeholder="변경할 경우에만 입력"
              />

            </div>

            <div className="admin-member-update-field">

              <label>
                이메일
              </label>

              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
              />

            </div>

            <div className="admin-member-update-field">

              <label>
                회원 등급
              </label>

              <input
                type="number"
                name="gradeId"
                min={1}
                max={4}
                step={1}
                value={
                  form.gradeId
                }
                onChange={
                  handleChange
                }
              />

              <small>
                1 USER / 2 GOLD /
                3 VIP / 4 ADMIN
              </small>

            </div>

          </div>

        </section>

        <section className="admin-member-update-section">

          <div className="admin-member-update-section-title">

            <span>
              03
            </span>

            <div>

              <h2>
                주소 정보
              </h2>

              <p>
                회원의 배송지 주소 정보를 수정합니다.
              </p>

            </div>

          </div>

          <div className="admin-member-update-grid">

            <div className="admin-member-update-field">

              <label>
                우편번호
              </label>

              <input
                type="text"
                name="zipcode"
                value={
                  form.zipcode
                }
                onChange={
                  handleChange
                }
              />

            </div>

            <div className="admin-member-update-field full">

              <label>
                주소
              </label>

              <input
                type="text"
                name="address1"
                value={
                  form.address1
                }
                onChange={
                  handleChange
                }
              />

            </div>

            <div className="admin-member-update-field full">

              <label>
                상세 주소
              </label>

              <input
                type="text"
                name="address2"
                value={
                  form.address2
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>

        </section>

        <div className="admin-member-update-actions">

          <button
            type="button"
            className="admin-member-update-cancel"
            onClick={() =>
              navigate(
                "/admin/members"
              )
            }
          >
            취소
          </button>

          <button
            type="submit"
            className="admin-member-update-submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? "수정 중..."
              : "수정 처리"}
          </button>

        </div>

      </form>

    </main>
  );
};

export default AdminMemberUpdate;