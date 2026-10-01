import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { axiosInstance } from "../../components/ToolBak";
import { useGlobalStore } from "../../store/store";
import "../../styles/beauty/BeautyRecommendation.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:9104";

const PERSONAL_COLOR_LABELS: Record<string, string> = {
  SPRING_WARM: "봄웜",
  SUMMER_COOL: "여름쿨",
  AUTUMN_WARM: "가을웜",
  WINTER_COOL: "겨울쿨",
  NEUTRAL: "뉴트럴",
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  DRY: "건성",
  OILY: "지성",
  COMBINATION: "복합성",
  SENSITIVE: "민감성",
  NORMAL: "중성",
  DEHYDRATED: "수부지",
};

const ITEM_TYPES = [
  { value: "", label: "ALL", title: "전체" },
  { value: "BASE", label: "BASE", title: "베이스" },
  { value: "LIP", label: "LIP", title: "립" },
  { value: "BLUSH", label: "BLUSH", title: "치크" },
  { value: "EYE", label: "EYE", title: "아이" },
] as const;

type ApiResponse<T> = {
  success?: boolean;
  code?: string;
  message?: string;
  data: T;
};

type RecommendationProfile = {
  memberId: number;
  name?: string;
  nickname?: string;
  skinType?: string | null;
  personalColor?: string | null;
};

type RecommendationProduct = {
  recommendProductId?: number;
  productId: number;
  productColorId?: number | null;
  productName: string;
  brand?: string | null;
  productType?: string | null;
  price: number;
  discount?: number | null;
  colorName?: string | null;
  colorCode?: string | null;
  baseColorGroup?: string | null;
  imagePath?: string | null;
  itemType?: string | null;
  sortOrder?: number | null;
  reason?: string | null;
};

type RecommendationResult = {
  recommendationId: number;
  memberId: number;
  recommendationType?: string | null;
  mood?: string | null;
  skinType?: string | null;
  personalColor?: string | null;
  aiDescription?: string | null;
  createdAt?: string | null;
  products: RecommendationProduct[];
};

const getImageUrl = (path?: string | null) => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

const getLabel = (
  value: string | null | undefined,
  labels: Record<string, string>,
) => {
  if (!value) {
    return "미등록";
  }

  return labels[value] ?? value;
};

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as {
      response?: { data?: { message?: string } };
    }).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return "요청 처리 중 오류가 발생했습니다.";
};

export default function BeautyRecommendation() {
  const navigate = useNavigate();
  const { sw, memberId } = useGlobalStore();

  const [profile, setProfile] = useState<RecommendationProfile | null>(null);
  const [selectedItemType, setSelectedItemType] = useState("");
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [history, setHistory] = useState<RecommendationResult[]>([]);

  const [profileLoading, setProfileLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const profileReady = Boolean(profile?.personalColor || profile?.skinType);

  const latestHistory = useMemo(
    () => history.slice(0, 3),
    [history],
  );

  const loadProfile = async () => {
    if (!sw || memberId <= 0) {
      navigate("/login");
      return;
    }

    try {
      setProfileLoading(true);
      setError("");

      const response = await axiosInstance.get<
        ApiResponse<RecommendationProfile>
      >(`/beauty_recommendation/member/${memberId}/profile`);

      setProfile(response.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setProfileLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!sw || memberId <= 0) {
      return;
    }

    try {
      setHistoryLoading(true);

      const response = await axiosInstance.get<
        ApiResponse<RecommendationResult[]>
      >(`/beauty_recommendation/member/${memberId}`);

      setHistory(response.data.data ?? []);
    } catch (requestError) {
      console.error("뷰티 추천 이력 조회 오류", requestError);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!sw || memberId <= 0) {
      return;
    }

    loadProfile();
    loadHistory();
    // 로그인 회원이 바뀔 때만 다시 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sw, memberId]);

  const handleRecommend = async () => {
    if (!sw || memberId <= 0) {
      navigate("/login");
      return;
    }

    try {
      setRecommendLoading(true);
      setError("");

      const response = await axiosInstance.post<
        ApiResponse<RecommendationResult>
      >("/beauty_recommendation", {
        memberId,
        recommendationType: "COMBINED",
        mood: "DAILY",
        skinType: null,
        personalColor: null,
        itemType: selectedItemType || null,
        limit: 6,
      });

      setResult(response.data.data);
      await loadHistory();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setRecommendLoading(false);
    }
  };

  if (!sw || memberId <= 0) {
    return (
      <div className="beauty-rec-page">
        <section className="beauty-rec-login">
          <span>PERSONAL BEAUTY</span>
          <h1>맞춤 뷰티 추천</h1>
          <p>
            저장된 퍼스널 컬러와 피부 타입을 사용하려면 로그인이 필요해요.
          </p>
          <button type="button" onClick={() => navigate("/login")}>
            로그인하고 시작하기 <b>→</b>
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="beauty-rec-page">
      <header className="beauty-rec-hero">
        <span>AI BEAUTY RECOMMENDATION</span>
        <h1>나에게 맞는 뷰티를 찾아보세요.</h1>
        <p>
          회원 정보에 저장된 퍼스널 컬러와 피부 타입을 바탕으로
          GODDESS 상품을 추천해드려요.
        </p>
      </header>

      <section className="beauty-rec-profile-section">
        <div className="beauty-rec-section-title">
          <span>MY BEAUTY PROFILE</span>
          <h2>내 뷰티 정보</h2>
          <p>마이페이지에 저장한 정보를 불러와 추천 조건으로 사용합니다.</p>
        </div>

        <div className="beauty-rec-profile-card">
          <div className="beauty-rec-profile-name">
            <span>PROFILE</span>
            <strong>{profile?.nickname || profile?.name || "회원"}</strong>
          </div>

          <div className="beauty-rec-profile-value">
            <span>PERSONAL COLOR</span>
            <strong>
              {getLabel(profile?.personalColor, PERSONAL_COLOR_LABELS)}
            </strong>
          </div>

          <div className="beauty-rec-profile-value">
            <span>SKIN TYPE</span>
            <strong>{getLabel(profile?.skinType, SKIN_TYPE_LABELS)}</strong>
          </div>

          <button
            type="button"
            className="beauty-rec-profile-refresh"
            disabled={profileLoading}
            onClick={loadProfile}
          >
            {profileLoading ? "불러오는 중..." : "내 정보 다시 불러오기"}
          </button>
        </div>

        {!profileLoading && !profileReady && (
          <div className="beauty-rec-profile-guide">
            <p>
              아직 퍼스널 컬러와 피부 타입이 등록되지 않았어요. 진단 후 다시
              불러오면 더 정확한 추천을 받을 수 있어요.
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate("/personal-color-diagnosis")}
              >
                퍼스널 컬러 진단
              </button>
              <button
                type="button"
                onClick={() => navigate("/diagnosis?type=skin")}
              >
                피부 타입 진단
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="beauty-rec-select-section">
        <div className="beauty-rec-section-title compact">
          <span>SELECT CATEGORY</span>
          <h2>어떤 상품을 추천받을까요?</h2>
        </div>

        <div className="beauty-rec-category-grid">
          {ITEM_TYPES.map((item, index) => (
            <button
              key={item.value || "ALL"}
              type="button"
              className={selectedItemType === item.value ? "active" : ""}
              onClick={() => setSelectedItemType(item.value)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{item.label}</small>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="beauty-rec-submit"
          disabled={recommendLoading || profileLoading}
          onClick={handleRecommend}
        >
          <span>
            {recommendLoading ? "추천 상품을 찾고 있어요" : "맞춤 상품 추천받기"}
          </span>
          <b>{recommendLoading ? "…" : "→"}</b>
        </button>

        {error && <div className="beauty-rec-error">{error}</div>}
      </section>

      {result && (
        <section className="beauty-rec-result-section">
          <div className="beauty-rec-result-head">
            <div>
              <span>FOR YOU</span>
              <h2>나를 위한 추천</h2>
              <p>{result.aiDescription || "회원 정보에 맞는 상품을 골랐어요."}</p>
            </div>

            <div className="beauty-rec-result-tags">
              {result.personalColor && (
                <span>
                  {getLabel(result.personalColor, PERSONAL_COLOR_LABELS)}
                </span>
              )}
              {result.skinType && (
                <span>{getLabel(result.skinType, SKIN_TYPE_LABELS)}</span>
              )}
            </div>
          </div>

          {result.products.length === 0 ? (
            <div className="beauty-rec-empty">
              <strong>조건에 맞는 상품이 아직 없어요.</strong>
              <p>
                다른 카테고리를 선택하거나 상품의 퍼스널컬러/피부타입 매핑을
                확인해주세요.
              </p>
            </div>
          ) : (
            <div className="beauty-rec-product-grid">
              {result.products.map((product) => {
                const discount = Number(product.discount || 0);
                const salePrice = Math.round(
                  Number(product.price || 0) * (1 - discount / 100),
                );
                const imageUrl = getImageUrl(product.imagePath);

                return (
                  <article
                    key={product.recommendProductId ?? `${product.productId}-${product.productColorId ?? 0}`}
                    className="beauty-rec-product-card"
                  >
                    <button
                      type="button"
                      className="beauty-rec-product-image"
                      onClick={() => navigate(`/products/${product.productId}`)}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.productName} />
                      ) : (
                        <span>NO IMAGE</span>
                      )}
                    </button>

                    <div className="beauty-rec-product-info">
                      <span className="beauty-rec-product-brand">
                        {product.brand || "GODDESS"}
                      </span>

                      <button
                        type="button"
                        className="beauty-rec-product-name"
                        onClick={() => navigate(`/products/${product.productId}`)}
                      >
                        {product.productName}
                      </button>

                      {product.colorName && (
                        <div className="beauty-rec-shade">
                          {product.colorCode && (
                            <i style={{ background: product.colorCode }} />
                          )}
                          <span>{product.colorName}</span>
                        </div>
                      )}

                      <div className="beauty-rec-price">
                        <strong>{salePrice.toLocaleString()}원</strong>
                        {discount > 0 && (
                          <>
                            <span>{product.price.toLocaleString()}원</span>
                            <em>{discount}%</em>
                          </>
                        )}
                      </div>

                      {product.reason && (
                        <p className="beauty-rec-reason">{product.reason}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="beauty-rec-history-section">
        <div className="beauty-rec-section-title compact">
          <span>RECENT RECOMMENDATION</span>
          <h2>최근 추천 기록</h2>
        </div>

        {historyLoading ? (
          <div className="beauty-rec-history-empty">추천 기록을 불러오는 중입니다.</div>
        ) : latestHistory.length === 0 ? (
          <div className="beauty-rec-history-empty">
            아직 저장된 추천 기록이 없어요.
          </div>
        ) : (
          <div className="beauty-rec-history-list">
            {latestHistory.map((item, index) => (
              <button
                type="button"
                key={item.recommendationId}
                onClick={() => setResult(item)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>
                    {getLabel(item.personalColor, PERSONAL_COLOR_LABELS)} · {" "}
                    {getLabel(item.skinType, SKIN_TYPE_LABELS)}
                  </strong>
                  <p>{item.aiDescription || "맞춤 뷰티 추천"}</p>
                </div>
                <b>→</b>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
