import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import {
  cancelSubscription,
  getAiUsageStatus,
  getSubscriptionHistory,
  getSubscriptionStatus,
  subscribePremium,
} from '../../api/subscriptionApi';

import type {
  AiUsageStatusResponse,
  SubscriptionPlanType,
  SubscriptionResponse,
  SubscriptionStatusResponse,
} from '../../api/subscriptionApi';

import {
  useGlobalStore,
} from '../../store/store';

import '../../styles/beauty/BeautyMembership.css';


type PaymentMethod =
  | 'CARD'
  | 'KAKAOPAY'
  | 'NAVERPAY'
  | 'TOSSPAY'
  | 'TRANSFER';


type Plan = {
  type: SubscriptionPlanType;
  eyebrow: string;
  name: string;
  price: number;
  priceLabel: string;
  originalPrice?: number;
  description: string;
  badge?: string;
};


const PLANS: Plan[] = [
  {
    type: 'MONTHLY',
    eyebrow: 'MONTHLY',
    name: '월간 Premium',
    price: 5000,
    priceLabel: '월',
    description:
      '한 달 단위로 부담 없이 Premium 헤어 AI를 이용할 수 있어요.',
  },
  {
    type: 'YEARLY',
    eyebrow: 'YEARLY',
    name: '연간 Premium',
    price: 40000,
    priceLabel: '년',
    originalPrice: 60000,
    description:
      '1년 동안 Premium 헤어 AI를 이용하는 가장 합리적인 플랜이에요.',
    badge: 'BEST · 약 33% 할인',
  },
];


const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  title: string;
  description: string;
  logo?: string;
  logoAlt?: string;
  iconText?: string;
}> = [
  {
    value: 'CARD',
    title: '신용 / 체크카드',
    description: '국내 발급 카드',
    iconText: 'CARD',
  },
  {
    value: 'KAKAOPAY',
    title: '카카오페이',
    description: '간편결제',
    logo: '/images/payment/kakaopay.png',
    logoAlt: '카카오페이',
  },
  {
    value: 'NAVERPAY',
    title: '네이버페이',
    description: '간편결제',
    logo: '/images/payment/naverpay.svg',
    logoAlt: '네이버페이',
  },
  {
    value: 'TOSSPAY',
    title: '토스페이',
    description: '간편결제',
    logo: '/images/payment/tosspay.png',
    logoAlt: '토스페이',
  },
  {
    value: 'TRANSFER',
    title: '실시간 계좌이체',
    description: '계좌에서 바로 결제',
    iconText: 'BANK',
  },
];


const formatDate = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).format(date);
};


const getPlanName = (
  planType: SubscriptionPlanType | null | undefined,
) =>
  planType === 'YEARLY'
    ? '연간 Premium'
    : '월간 Premium';


const getErrorMessage = (
  error: unknown,
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (
      typeof data === 'string' &&
      data.trim()
    ) {
      return data;
    }

    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '구독 처리 중 오류가 발생했습니다.';
};


export default function BeautyMembership() {
  const {
    sw,
    memberId,
  } = useGlobalStore();

  const [
    subscriptionStatus,
    setSubscriptionStatus,
  ] = useState<SubscriptionStatusResponse | null>(null);

  const [
    usageStatus,
    setUsageStatus,
  ] = useState<AiUsageStatusResponse | null>(null);

  const [
    subscriptionHistory,
    setSubscriptionHistory,
  ] = useState<SubscriptionResponse[]>([]);

  const [
    selectedPlan,
    setSelectedPlan,
  ] = useState<SubscriptionPlanType>('MONTHLY');

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>('CARD');

  const [
    agreed,
    setAgreed,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    subscribing,
    setSubscribing,
  ] = useState(false);

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    manageMode,
    setManageMode,
  ] = useState<'summary' | 'change' | 'history'>('summary');


  const loadMembership =
    useCallback(
      async () => {
        if (
          !sw ||
          memberId <= 0
        ) {
          setSubscriptionStatus(null);
          setUsageStatus(null);
          setSubscriptionHistory([]);
          return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
          const [
            subscription,
            usage,
            history,
          ] = await Promise.all([
            getSubscriptionStatus(memberId),
            getAiUsageStatus(memberId),
            getSubscriptionHistory(memberId),
          ]);

          setSubscriptionStatus(subscription);
          setUsageStatus(usage);
          setSubscriptionHistory(history);

          if (subscription.planType) {
            setSelectedPlan(subscription.planType);
          }
        } catch (error) {
          setErrorMessage(
            getErrorMessage(error),
          );
        } finally {
          setLoading(false);
        }
      },
      [sw, memberId],
    );


  useEffect(
    () => {
      void loadMembership();
    },
    [loadMembership],
  );


  const premium =
    subscriptionStatus?.premium ?? false;

  const currentSubscription =
    useMemo(
      () =>
        subscriptionHistory.find(
          (item) =>
            item.status === 'ACTIVE',
        ) ?? null,
      [subscriptionHistory],
    );

  const usedCount =
    usageStatus?.usedCount ?? 0;

  const monthlyLimit =
    usageStatus?.monthlyLimit ?? 3;

  const remainingCount =
    usageStatus?.remainingCount ??
    Math.max(
      monthlyLimit - usedCount,
      0,
    );

  const selectedPlanInfo =
    PLANS.find(
      (item) =>
        item.type === selectedPlan,
    ) ?? PLANS[0];


  const handleSubscribe =
    async () => {
      if (
        !sw ||
        memberId <= 0
      ) {
        alert('로그인 후 이용해주세요.');
        return;
      }

      if (premium) {
        alert(
          '현재 Premium 이용 중입니다. 이용권 변경은 현재 구독을 종료한 뒤 새 이용권으로 가입할 수 있습니다.',
        );
        return;
      }

      if (!agreed) {
        alert('구독 결제 진행에 동의해주세요.');
        return;
      }

      const paymentTitle =
        PAYMENT_METHODS.find(
          (item) =>
            item.value === paymentMethod,
        )?.title ?? '선택한 결제수단';

      const confirmed =
        window.confirm(
          `[Premium 구독]\n${selectedPlanInfo.name}\n${selectedPlanInfo.price.toLocaleString()}원을 ${paymentTitle}(으)로 결제하시겠습니까?`,
        );

      if (!confirmed) {
        return;
      }

      setSubscribing(true);
      setErrorMessage('');

      try {
        await subscribePremium({
          memberId,
          planType: selectedPlan,
        });

        await loadMembership();
        setAgreed(false);
        setManageMode('summary');

        alert('Premium 구독이 시작되었습니다.');
      } catch (error) {
        const message =
          getErrorMessage(error);

        setErrorMessage(message);
        alert(message);
      } finally {
        setSubscribing(false);
      }
    };


  const handleCancelSubscription =
    async () => {
      if (!currentSubscription) {
        alert('현재 활성 구독 정보를 찾을 수 없습니다.');
        return;
      }

      const confirmed =
        window.confirm(
          '현재 Premium 구독을 해지하시겠습니까?\n해지 후에는 일반 회원의 월 3회 무료 정책이 적용됩니다.',
        );

      if (!confirmed) {
        return;
      }

      setCancelling(true);
      setErrorMessage('');

      try {
        await cancelSubscription(
          currentSubscription.subscriptionId,
        );

        await loadMembership();
        setManageMode('summary');

        alert('Premium 구독이 해지되었습니다.');
      } catch (error) {
        const message =
          getErrorMessage(error);

        setErrorMessage(message);
        alert(message);
      } finally {
        setCancelling(false);
      }
    };


  if (
    !sw ||
    memberId <= 0
  ) {
    return (
      <section className="gd-membership-page">
        <div className="gd-membership-heading">
          <span>MEMBERSHIP</span>
          <h2>이용권 · 구독</h2>
          <p>
            로그인 후 현재 이용권과 AI BEAUTY 헤어 이용 현황을 확인할 수 있습니다.
          </p>
        </div>

        <div className="gd-membership-login-box">
          <strong>로그인이 필요합니다.</strong>
          <p>
            Premium 구독과 무료 이용 횟수는 회원별로 관리됩니다.
          </p>
        </div>
      </section>
    );
  }


  if (loading) {
    return (
      <section className="gd-membership-page">
        <div className="gd-membership-state-box">
          이용권 정보를 불러오는 중입니다...
        </div>
      </section>
    );
  }


  return (
    <section className="gd-membership-page">
      <div className="gd-membership-heading">
        <span>MEMBERSHIP</span>
        <h2>이용권 · 구독</h2>
        <p>
          나의 AI BEAUTY 이용 현황과 Premium 이용권을 한 곳에서 관리하세요.
        </p>
      </div>

      {errorMessage && (
        <div className="gd-membership-error">
          {errorMessage}
        </div>
      )}

      <div className="gd-membership-status-grid">
        <article className="gd-membership-status-card">
          <div className="gd-membership-status-label">
            CURRENT PLAN
          </div>

          <div className="gd-membership-status-value">
            {premium ? 'PREMIUM' : 'FREE'}
          </div>

          <p>
            {premium
              ? '헤어스타일과 헤어컬러 AI를 횟수 제한 없이 이용하고 있어요.'
              : '메이크업은 무료 무제한, 헤어 AI는 매월 3회 무료로 이용할 수 있어요.'}
          </p>

          {premium && (
            <div className="gd-membership-current-meta">
              <div>
                <span>현재 이용권</span>
                <strong>
                  {getPlanName(
                    subscriptionStatus?.planType,
                  )}
                </strong>
              </div>

              <div>
                <span>이용 기간</span>
                <strong>
                  {formatDate(
                    subscriptionStatus?.startDate,
                  )}
                  {' ~ '}
                  {formatDate(
                    subscriptionStatus?.endDate,
                  )}
                </strong>
              </div>
            </div>
          )}
        </article>

        <article className="gd-membership-status-card usage">
          <div className="gd-membership-status-label">
            HAIR AI USAGE
          </div>

          <div className="gd-membership-status-value accent">
            {premium
              ? 'UNLIMITED'
              : `${remainingCount}회 남음`}
          </div>

          <p>
            {premium
              ? `Premium 이용 중 · 가입 전 이번 달 무료 사용 ${usedCount}회`
              : `이번 달 ${usedCount} / ${monthlyLimit}회 사용`}
          </p>

          {!premium && (
            <div className="gd-membership-progress-track">
              <span
                style={{
                  width:
                    `${Math.min(
                      (usedCount / monthlyLimit) * 100,
                      100,
                    )}%`,
                }}
              />
            </div>
          )}
        </article>
      </div>

      <div className="gd-membership-benefit-strip">
        <div>
          <span>MAKEUP</span>
          <strong>무료 무제한</strong>
          <small>메이크업 AI는 누구나 제한 없이</small>
        </div>

        <div>
          <span>HAIR · FREE</span>
          <strong>월 3회</strong>
          <small>헤어스타일·헤어컬러 합산</small>
        </div>

        <div>
          <span>HAIR · PREMIUM</span>
          <strong>무제한</strong>
          <small>Premium 기간 동안 횟수 제한 없음</small>
        </div>
      </div>

      {premium ? (
        <>
          <section className="gd-membership-current-plan-section">
            <div className="gd-membership-section-heading-row">
              <div>
                <span>MY PREMIUM</span>
                <h3>현재 이용 중인 Premium</h3>
                <p>
                  현재 이용권과 이용 기간을 확인하고 구독을 관리할 수 있습니다.
                </p>
              </div>

              <span className="gd-membership-active-badge">
                ACTIVE
              </span>
            </div>

            <div className="gd-membership-current-plan-card">
              <div className="gd-membership-current-plan-main">
                <span>
                  {subscriptionStatus?.planType ?? 'MONTHLY'}
                </span>

                <h4>
                  {getPlanName(
                    subscriptionStatus?.planType,
                  )}
                </h4>

                <strong>
                  {subscriptionStatus?.planType === 'YEARLY'
                    ? '40,000원 / 년'
                    : '5,000원 / 월'}
                </strong>

                <p>
                  헤어스타일과 헤어컬러 AI를 이용 기간 동안 횟수 제한 없이 이용할 수 있습니다.
                </p>
              </div>

              <div className="gd-membership-current-plan-detail">
                <div>
                  <span>구독 상태</span>
                  <strong>정상 이용 중</strong>
                </div>

                <div>
                  <span>시작일</span>
                  <strong>
                    {formatDate(
                      subscriptionStatus?.startDate,
                    )}
                  </strong>
                </div>

                <div>
                  <span>종료일</span>
                  <strong>
                    {formatDate(
                      subscriptionStatus?.endDate,
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="gd-membership-manage-actions">
              <button
                type="button"
                className="primary"
                onClick={() =>
                  setManageMode(
                    manageMode === 'change'
                      ? 'summary'
                      : 'change',
                  )
                }
              >
                이용권 변경
              </button>

              <button
                type="button"
                onClick={() =>
                  setManageMode(
                    manageMode === 'history'
                      ? 'summary'
                      : 'history',
                  )
                }
              >
                구독 · 결제 내역
              </button>

              <button
                type="button"
                className="danger"
                disabled={cancelling}
                onClick={handleCancelSubscription}
              >
                {cancelling
                  ? '처리 중...'
                  : '구독 해지'}
              </button>
            </div>
          </section>

          {manageMode === 'change' && (
            <section className="gd-membership-manage-panel">
              <div className="gd-membership-manage-panel-head">
                <span>CHANGE PLAN</span>
                <h3>이용권 변경</h3>
                <p>
                  현재 구독 중인 이용권을 확인할 수 있습니다. 현재 백엔드 정책상 활성 구독 중에는 새 구독을 중복 등록할 수 없어, 변경하려면 기존 구독을 먼저 해지한 뒤 원하는 이용권으로 다시 가입해주세요.
                </p>
              </div>

              <div className="gd-membership-plan-grid compact">
                {PLANS.map(
                  (plan) => {
                    const current =
                      subscriptionStatus?.planType === plan.type;

                    return (
                      <article
                        className={
                          `gd-membership-plan-card ${
                            current
                              ? 'current'
                              : ''
                          }`
                        }
                        key={plan.type}
                      >
                        <div className="gd-membership-plan-top">
                          <span>{plan.eyebrow}</span>
                          {current ? (
                            <b>CURRENT</b>
                          ) : plan.badge ? (
                            <b>{plan.badge}</b>
                          ) : null}
                        </div>

                        <h4>{plan.name}</h4>

                        <div className="gd-membership-price">
                          {plan.originalPrice && (
                            <del>
                              {plan.originalPrice.toLocaleString()}원
                            </del>
                          )}

                          <strong>
                            {plan.price.toLocaleString()}원
                          </strong>

                          <small>
                            / {plan.priceLabel}
                          </small>
                        </div>

                        <p>{plan.description}</p>

                        <div className="gd-membership-plan-state">
                          {current
                            ? '현재 이용 중'
                            : '변경 가능 이용권'}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </section>
          )}

          {manageMode === 'history' && (
            <section className="gd-membership-manage-panel">
              <div className="gd-membership-manage-panel-head">
                <span>SUBSCRIPTION HISTORY</span>
                <h3>구독 · 결제 내역</h3>
                <p>
                  Premium 가입 금액과 이용 기간을 최신순으로 확인할 수 있습니다.
                </p>
              </div>

              {subscriptionHistory.length === 0 ? (
                <div className="gd-membership-empty-history">
                  구독 내역이 없습니다.
                </div>
              ) : (
                <div className="gd-membership-history-list">
                  {subscriptionHistory.map(
                    (item) => (
                      <div
                        className="gd-membership-history-row"
                        key={item.subscriptionId}
                      >
                        <div>
                          <span>
                            {item.planType}
                          </span>
                          <strong>
                            {getPlanName(item.planType)}
                          </strong>
                        </div>

                        <div>
                          <span>결제 금액</span>
                          <strong>
                            {Number(item.price).toLocaleString()}원
                          </strong>
                        </div>

                        <div>
                          <span>이용 기간</span>
                          <strong>
                            {formatDate(item.startDate)} ~ {formatDate(item.endDate)}
                          </strong>
                        </div>

                        <div>
                          <span>상태</span>
                          <strong
                            className={
                              item.status === 'ACTIVE'
                                ? 'active'
                                : ''
                            }
                          >
                            {item.status}
                          </strong>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <div className="gd-membership-section-title">
            <span>01</span>
            <div>
              <h3>Premium 이용권 선택</h3>
              <p>
                일반 회원은 헤어 AI를 월 3회 무료로 이용할 수 있으며, Premium 가입 시 횟수 제한 없이 이용할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="gd-membership-plan-grid">
            {PLANS.map(
              (plan) => {
                const selected =
                  selectedPlan === plan.type;

                return (
                  <button
                    type="button"
                    className={
                      `gd-membership-plan-card ${
                        selected
                          ? 'selected'
                          : ''
                      }`
                    }
                    key={plan.type}
                    onClick={() =>
                      setSelectedPlan(plan.type)
                    }
                  >
                    <div className="gd-membership-plan-top">
                      <span>{plan.eyebrow}</span>
                      {plan.badge && (
                        <b>{plan.badge}</b>
                      )}
                    </div>

                    <h4>{plan.name}</h4>

                    <div className="gd-membership-price">
                      {plan.originalPrice && (
                        <del>
                          {plan.originalPrice.toLocaleString()}원
                        </del>
                      )}

                      <strong>
                        {plan.price.toLocaleString()}원
                      </strong>

                      <small>
                        / {plan.priceLabel}
                      </small>
                    </div>

                    <p>{plan.description}</p>

                    <ul>
                      <li>헤어스타일 AI 무제한</li>
                      <li>헤어컬러 AI 무제한</li>
                      <li>메이크업 AI 무료 무제한 유지</li>
                    </ul>

                    <span className="gd-membership-plan-select">
                      {selected
                        ? '선택된 이용권'
                        : '이용권 선택'}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div className="gd-membership-section-title payment-title">
            <span>02</span>
            <div>
              <h3>결제수단 선택</h3>
              <p>
                Premium 구독에 사용할 결제수단을 선택해주세요.
              </p>
            </div>
          </div>

          <div className="gd-membership-payment-grid">
            {PAYMENT_METHODS.map(
              (method) => (
                <button
                  type="button"
                  key={method.value}
                  className={
                    `gd-membership-payment-card ${
                      paymentMethod === method.value
                        ? 'selected'
                        : ''
                    }`
                  }
                  onClick={() =>
                    setPaymentMethod(method.value)
                  }
                >
                  <span className="gd-membership-payment-check">
                    ✓
                  </span>

                  <div className="gd-membership-payment-visual">
                    {method.logo ? (
                      <img
                        src={method.logo}
                        alt={
                          method.logoAlt ?? method.title
                        }
                      />
                    ) : (
                      <b>{method.iconText}</b>
                    )}
                  </div>

                  <strong>{method.title}</strong>
                  <small>{method.description}</small>
                </button>
              ),
            )}
          </div>

          <div className="gd-membership-checkout">
            <div className="gd-membership-order-summary">
              <div>
                <span>선택한 이용권</span>
                <strong>{selectedPlanInfo.name}</strong>
              </div>

              <div>
                <span>결제 금액</span>
                <strong className="price">
                  {selectedPlanInfo.price.toLocaleString()}원
                </strong>
              </div>
            </div>

            <label className="gd-membership-agree">
              <input
                type="checkbox"
                checked={agreed}
                onChange={
                  (event) =>
                    setAgreed(event.target.checked)
                }
              />
              <span>
                Premium 구독 결제 진행에 동의합니다.
              </span>
            </label>

            <button
              type="button"
              className="gd-membership-pay-button"
              onClick={handleSubscribe}
              disabled={
                subscribing ||
                !agreed
              }
            >
              {subscribing
                ? '구독 처리 중...'
                : `${selectedPlanInfo.price.toLocaleString()}원 결제하고 Premium 시작하기`}
            </button>

            <p className="gd-membership-payment-note">
              현재 프로젝트에서는 실제 PG 결제 대신 선택한 결제수단을 기준으로 Premium 구독 승인 시뮬레이션을 진행합니다.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
