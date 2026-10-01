import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { axiosInstance } from "../../components/ToolBak";
import { useGlobalStore } from "../../store/store";
import "../../styles/beauty/BeautyRecommendation.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:9104";

const PERSONAL_COLOR_LABELS: Record<string, string> = {
  SPRING_WARM: "봄 웜",
  SUMMER_COOL: "여름 쿨",
  AUTUMN_WARM: "가을 웜",
  WINTER_COOL: "겨울 쿨",
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
  { value: "", label: "ALL", title: "전체", description: "모든 카테고리" },
  { value: "BASE", label: "BASE", title: "베이스", description: "쿠션 · 파운데이션" },
  { value: "LIP", label: "LIP", title: "립", description: "틴트 · 립스틱" },
  { value: "BLUSH", label: "BLUSH", title: "치크", description: "블러셔" },
  { value: "EYE", label: "EYE", title: "아이", description: "아이섀도 · 라이너" },
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

type HistoryDisplayItem = RecommendationResult & {
  displayKey: string;
  displayItemType: RecommendationItemType;
};

const getImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

const getLabel = (
  value: string | null | undefined,
  labels: Record<string, string>,
) => {
  if (!value) return "미등록";
  return labels[value] ?? value;
};

const getToneClassName = (value?: string | null) => {
  switch (value) {
    case "SPRING_WARM":
      return "spring-warm";
    case "SUMMER_COOL":
      return "summer-cool";
    case "AUTUMN_WARM":
      return "autumn-warm";
    case "WINTER_COOL":
      return "winter-cool";
    case "NEUTRAL":
      return "neutral-tone";
    default:
      return "unknown-tone";
  }
};

type RecommendationItemType = "" | "BASE" | "LIP" | "BLUSH" | "EYE";

const HISTORY_CATEGORY_LABELS: Record<RecommendationItemType, string> = {
  "": "전체 추천",
  BASE: "베이스 추천",
  LIP: "립 추천",
  BLUSH: "치크 추천",
  EYE: "아이 추천",
};

const getHistoryItemType = (
  item: RecommendationResult,
): RecommendationItemType => {
  const description = item.aiDescription ?? "";
  const matched = description.match(/상품타입\s+(BASE|LIP|BLUSH|EYE)/i);

  if (matched) {
    return matched[1].toUpperCase() as RecommendationItemType;
  }

  const itemTypes = Array.from(
    new Set(
      (item.products ?? [])
        .map((product) => product.itemType?.toUpperCase())
        .filter(
          (value): value is "BASE" | "LIP" | "BLUSH" | "EYE" =>
            value === "BASE" ||
            value === "LIP" ||
            value === "BLUSH" ||
            value === "EYE",
        ),
    ),
  );

  return itemTypes.length === 1 ? itemTypes[0] : "";
};

const formatHistoryDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function BeautyCategoryIcon({
  type,
}: {
  type: RecommendationItemType;
}) {
  if (type === "BASE") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="10" y="13" width="28" height="24" rx="8" />
        <path d="M14 20h20" />
        <circle cx="24" cy="29" r="5.5" />
      </svg>
    );
  }

  if (type === "LIP") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M19 35V18h10v17" />
        <path d="M20.5 18 24 10l3.5 8" />
        <path d="M16 35h16v5H16z" />
      </svg>
    );
  }

  if (type === "BLUSH") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="25" r="13" />
        <circle cx="24" cy="25" r="7" />
        <path d="M16 14c4-4 12-5 17-1" />
      </svg>
    );
  }

  if (type === "EYE") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M7 24s6-10 17-10 17 10 17 10-6 10-17 10S7 24 7 24Z" />
        <circle cx="24" cy="24" r="5" />
        <path d="M13 14 10 9M24 12V6M35 14l3-5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="m24 7 2.7 8.3L35 18l-8.3 2.7L24 29l-2.7-8.3L13 18l8.3-2.7L24 7Z" />
      <path d="m36 25 1.6 4.4L42 31l-4.4 1.6L36 37l-1.6-4.4L30 31l4.4-1.6L36 25Z" />
      <path d="m12 28 1.3 3.7L17 33l-3.7 1.3L12 38l-1.3-3.7L7 33l3.7-1.3L12 28Z" />
    </svg>
  );
}

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
  const [selectedHistory, setSelectedHistory] = useState<HistoryDisplayItem | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const profileReady = Boolean(profile?.personalColor || profile?.skinType);

  const latestHistory = useMemo<HistoryDisplayItem[]>(() => {
    // 최근 추천 기록 영역은 "가장 최근 전체 추천 1건"을 기준으로 구성한다.
    // 전체 추천에서 실제로 나온 상품 카테고리만 아래에 각각 표시한다.
    const latestOverall = history.find(
      (item) => getHistoryItemType(item) === "",
    );

    if (!latestOverall) {
      return [];
    }

    const items: HistoryDisplayItem[] = [
      {
        ...latestOverall,
        displayKey: `ALL-${latestOverall.recommendationId}`,
        displayItemType: "",
      },
    ];

    const categoryOrder: RecommendationItemType[] = [
      "BASE",
      "LIP",
      "BLUSH",
      "EYE",
    ];

    categoryOrder.forEach((itemType) => {
      const categoryProducts = latestOverall.products.filter(
        (product) => product.itemType?.toUpperCase() === itemType,
      );

      if (categoryProducts.length === 0) {
        return;
      }

      items.push({
        ...latestOverall,
        displayKey: `${itemType}-${latestOverall.recommendationId}`,
        displayItemType: itemType,
        products: categoryProducts,
      });
    });

    return items;
  }, [history]);

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
    if (!sw || memberId <= 0) return;

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
    if (!sw || memberId <= 0) return;

    loadProfile();
    loadHistory();
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
          <span>GODDESS AI BEAUTY</span>
          <h1>나만을 위한 뷰티 추천</h1>
          <p>
            저장된 퍼스널 컬러와 피부 타입을 바탕으로
            나에게 잘 맞는 상품을 추천해드려요.
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
        <div className="beauty-rec-hero-copy">
          <span>AI BEAUTY RECOMMENDATION</span>
          <h1>
            오늘의 나에게
            <br />
            가장 잘 어울리는 뷰티.
          </h1>
          <p>
            저장된 퍼스널 컬러와 피부 타입을 바탕으로
            GODDESS가 나에게 맞는 제품을 골라드려요.
          </p>
        </div>

        <div className="beauty-rec-hero-note">
          <span>PERSONAL CURATION</span>

          <div className="beauty-rec-face-icon" aria-hidden="true">
            <div className="beauty-rec-face-hair" />
            <div className="beauty-rec-face-head">
              <i className="eye left" />
              <i className="eye right" />
              <i className="blush left" />
              <i className="blush right" />
              <i className="mouth" />
            </div>
          </div>

          <div className="beauty-rec-tone-dots" aria-hidden="true">
            <i className="beauty-rec-tone-chip spring-warm" />
            <i className="beauty-rec-tone-chip summer-cool" />
            <i className="beauty-rec-tone-chip autumn-warm" />
            <i className="beauty-rec-tone-chip winter-cool" />
          </div>

          <strong>COLOR × SKIN</strong>
          <p>나의 정보로 완성하는 맞춤 뷰티 셀렉션</p>
        </div>
      </header>

      <section className="beauty-rec-profile-section">
        <div className="beauty-rec-section-title">
          <span>MY BEAUTY PROFILE</span>
          <h2>내 뷰티 정보</h2>
          <p>마이페이지에 저장한 정보를 추천 기준으로 사용합니다.</p>
        </div>

        <div className="beauty-rec-profile-card">
          <div className="beauty-rec-profile-name">
            <span>PROFILE</span>
            <strong>{profile?.nickname || profile?.name || "회원"}</strong>
          </div>

          <div className="beauty-rec-profile-value">
            <span>PERSONAL COLOR</span>
            <div className="beauty-rec-tone-value">
              <i
                className={`beauty-rec-tone-chip ${getToneClassName(
                  profile?.personalColor,
                )}`}
              />
              <strong>
                {getLabel(profile?.personalColor, PERSONAL_COLOR_LABELS)}
              </strong>
            </div>
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
            {profileLoading ? "불러오는 중..." : "정보 다시 불러오기"}
          </button>
        </div>

        {!profileLoading && !profileReady && (
          <div className="beauty-rec-profile-guide">
            <p>
              아직 퍼스널 컬러와 피부 타입이 등록되지 않았어요.
              진단 후 다시 불러오면 더 정확한 추천을 받을 수 있어요.
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
              <em>{item.description}</em>
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
            {recommendLoading ? "추천 상품을 찾고 있어요" : "나를 위한 상품 추천받기"}
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
              <h2>나를 위한 셀렉션</h2>
              <p>{result.aiDescription || "회원 정보에 맞는 상품을 골랐어요."}</p>
            </div>

            <div className="beauty-rec-result-tags">
              {result.personalColor && (
                <span className="beauty-rec-tag-tone">
                  <i
                    className={`beauty-rec-tone-chip ${getToneClassName(
                      result.personalColor,
                    )}`}
                  />
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
                    key={
                      product.recommendProductId ??
                      `${product.productId}-${product.productColorId ?? 0}`
                    }
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
          <div className="beauty-rec-history-empty">
            추천 기록을 불러오는 중입니다.
          </div>
        ) : latestHistory.length === 0 ? (
          <div className="beauty-rec-history-empty">
            아직 저장된 추천 기록이 없어요.
          </div>
        ) : (
          <div className="beauty-rec-history-list">
            {latestHistory.map((item, index) => {
              const opened =
                selectedHistory?.displayKey === item.displayKey;
              const historyItemType = item.displayItemType;
              const historyTitle = HISTORY_CATEGORY_LABELS[historyItemType];
              const historyDate = formatHistoryDate(item.createdAt);

              return (
                <div
                  className={`beauty-rec-history-item${opened ? " open" : ""}`}
                  key={item.displayKey}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedHistory(opened ? null : item)
                    }
                  >
                    <span className="beauty-rec-history-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span
                      className={`beauty-rec-history-icon ${historyItemType || "ALL"}`}
                    >
                      <BeautyCategoryIcon type={historyItemType} />
                    </span>

                    <div className="beauty-rec-history-summary">
                      <div className="beauty-rec-history-title-row">
                        <strong>{historyTitle}</strong>
                        {historyDate && <time>{historyDate}</time>}
                      </div>

                      <div className="beauty-rec-history-meta">
                        <span
                          className={`beauty-rec-tone-chip ${getToneClassName(
                            item.personalColor,
                          )}`}
                        />
                        <span>
                          {getLabel(item.personalColor, PERSONAL_COLOR_LABELS)}
                        </span>
                        <i />
                        <span>{getLabel(item.skinType, SKIN_TYPE_LABELS)}</span>
                        <i />
                        <span>{item.products.length}개 상품</span>
                      </div>

                      <p>
                        {historyItemType === ""
                          ? `전체 추천으로 ${item.products.length}개의 상품을 추천받았어요.`
                          : `전체 추천 결과 중 ${historyTitle.replace(" 추천", "")} 상품 ${item.products.length}개예요.`}
                      </p>
                    </div>

                    <b className="beauty-rec-history-toggle">
                      {opened ? "−" : "+"}
                    </b>
                  </button>

                  {opened && (
                    <div className="beauty-rec-history-detail">
                      <div className="beauty-rec-history-detail-head">
                        <div>
                          <span>PAST SELECTION</span>
                          <strong>{historyItemType === "" ? "이 추천에서 골라드린 상품" : `${historyTitle} 상품`}</strong>
                        </div>

                        <div className="beauty-rec-result-tags">
                          {item.personalColor && (
                            <span className="beauty-rec-tag-tone">
                              <i
                                className={`beauty-rec-tone-chip ${getToneClassName(
                                  item.personalColor,
                                )}`}
                              />
                              {getLabel(
                                item.personalColor,
                                PERSONAL_COLOR_LABELS,
                              )}
                            </span>
                          )}
                          {item.skinType && (
                            <span>
                              {getLabel(item.skinType, SKIN_TYPE_LABELS)}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.products.length === 0 ? (
                        <div className="beauty-rec-history-product-empty">
                          저장된 추천 상품이 없어요.
                        </div>
                      ) : (
                        <div className="beauty-rec-history-product-grid">
                          {item.products.map((product) => {
                            const discount = Number(product.discount || 0);
                            const salePrice = Math.round(
                              Number(product.price || 0) *
                                (1 - discount / 100),
                            );
                            const imageUrl = getImageUrl(product.imagePath);

                            return (
                              <article
                                className="beauty-rec-history-product"
                                key={
                                  product.recommendProductId ??
                                  `${item.recommendationId}-${product.productId}-${product.productColorId ?? 0}`
                                }
                              >
                                <button
                                  type="button"
                                  className="beauty-rec-history-product-image"
                                  onClick={() =>
                                    navigate(`/products/${product.productId}`)
                                  }
                                >
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={product.productName}
                                    />
                                  ) : (
                                    <span>NO IMAGE</span>
                                  )}
                                </button>

                                <div className="beauty-rec-history-product-info">
                                  <small>
                                    {product.brand || "GODDESS"}
                                  </small>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(`/products/${product.productId}`)
                                    }
                                  >
                                    {product.productName}
                                  </button>

                                  {product.colorName && (
                                    <p>{product.colorName}</p>
                                  )}

                                  <strong>
                                    {salePrice.toLocaleString()}원
                                  </strong>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
