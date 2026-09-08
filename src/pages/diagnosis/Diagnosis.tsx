import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGlobalStore } from "../../store/store";
import "../../styles/diagnosis/Diagnosis.css";

type SkinType =
  | "DRY"
  | "OILY"
  | "COMBINATION"
  | "SENSITIVE"
  | "NORMAL"
  | "DEHYDRATED";

type SkinScore = Record<SkinType, number>;

type AnswerOption = {
  label: string;
  scores: Partial<SkinScore>;
};

type Question = {
  id: number;
  title: string;
  description?: string;
  options: AnswerOption[];
};

type SkinResult = {
  type: SkinType;
  name: string;
  englishName: string;
  summary: string;
  description: string;
  keywords: string[];
  careTips: string[];
};

const questions: Question[] = [
  {
    id: 1,
    title: "세안 후 아무것도 바르지 않았을 때 피부는 어떤가요?",
    description: "세안 후 약 20~30분 정도 지난 상태를 떠올려보세요.",
    options: [
      { label: "얼굴 전체가 당기고 건조한 느낌이 든다.", scores: { DRY: 3, DEHYDRATED: 1 } },
      { label: "얼굴 전체에 유분기가 빠르게 올라온다.", scores: { OILY: 3 } },
      { label: "이마와 코는 번들거리지만 볼은 건조하다.", scores: { COMBINATION: 3 } },
      { label: "크게 당기거나 번들거리지 않고 편안하다.", scores: { NORMAL: 3 } },
      { label: "피부 속은 당기는데 겉에는 유분기가 올라온다.", scores: { DEHYDRATED: 3 } }
    ]
  },
  {
    id: 2,
    title: "평소 얼굴의 유분감은 어느 정도인가요?",
    options: [
      { label: "유분이 거의 없고 시간이 지나도 건조한 편이다.", scores: { DRY: 3 } },
      { label: "얼굴 전체가 쉽게 번들거린다.", scores: { OILY: 3 } },
      { label: "T존은 번들거리지만 볼과 턱은 비교적 건조하다.", scores: { COMBINATION: 3 } },
      { label: "적당한 유분감이 있고 크게 불편하지 않다.", scores: { NORMAL: 2 } },
      { label: "겉은 번들거리지만 속당김이 자주 느껴진다.", scores: { DEHYDRATED: 3 } }
    ]
  },
  {
    id: 3,
    title: "메이크업을 했을 때 가장 자주 나타나는 상태는 무엇인가요?",
    options: [
      { label: "베이스가 들뜨거나 각질이 잘 보인다.", scores: { DRY: 3, DEHYDRATED: 1 } },
      { label: "시간이 지나면 유분 때문에 메이크업이 쉽게 무너진다.", scores: { OILY: 3 } },
      { label: "코와 이마는 무너지지만 볼은 건조하다.", scores: { COMBINATION: 3 } },
      { label: "대체로 고르게 유지되는 편이다.", scores: { NORMAL: 3 } },
      { label: "겉은 번들거리는데 속건조 때문에 베이스가 뜬다.", scores: { DEHYDRATED: 3 } }
    ]
  },
  {
    id: 4,
    title: "피지와 모공 상태는 어떤 편인가요?",
    options: [
      { label: "피지가 적고 모공이 크게 눈에 띄지 않는다.", scores: { DRY: 2 } },
      { label: "피지가 많고 모공이 눈에 잘 띈다.", scores: { OILY: 3 } },
      { label: "코와 이마 주변에만 피지와 모공이 눈에 띈다.", scores: { COMBINATION: 3 } },
      { label: "피지와 모공이 평균적인 편이다.", scores: { NORMAL: 2 } },
      { label: "피지는 있는데 피부 속은 당기는 느낌이 있다.", scores: { DEHYDRATED: 3 } }
    ]
  },
  {
    id: 5,
    title: "새로운 화장품을 사용했을 때 피부 반응은 어떤가요?",
    options: [
      { label: "대부분 문제없이 사용하는 편이다.", scores: { NORMAL: 2 } },
      { label: "가끔 붉어지거나 따갑지만 금방 괜찮아진다.", scores: { SENSITIVE: 2 } },
      { label: "자주 붉어지거나 따갑고 쉽게 자극받는다.", scores: { SENSITIVE: 4 } },
      { label: "계절이나 컨디션에 따라 피부 반응이 크게 달라진다.", scores: { SENSITIVE: 3, DEHYDRATED: 1 } }
    ]
  },
  {
    id: 6,
    title: "피부가 가장 불편하게 느껴지는 순간은 언제인가요?",
    options: [
      { label: "세안 직후 피부가 많이 당길 때", scores: { DRY: 3 } },
      { label: "오후가 되면 얼굴 전체가 번들거릴 때", scores: { OILY: 3 } },
      { label: "부위마다 건조함과 유분감이 다르게 느껴질 때", scores: { COMBINATION: 3 } },
      { label: "피부가 쉽게 붉어지거나 따갑게 느껴질 때", scores: { SENSITIVE: 4 } },
      { label: "겉은 번들거리는데 피부 속은 당길 때", scores: { DEHYDRATED: 4 } },
      { label: "크게 불편한 점이 없다.", scores: { NORMAL: 3 } }
    ]
  },
  {
    id: 7,
    title: "계절이 바뀌면 피부는 어떻게 변하나요?",
    options: [
      { label: "특히 가을과 겨울에 많이 건조해진다.", scores: { DRY: 3 } },
      { label: "여름에는 유분과 피지가 크게 늘어난다.", scores: { OILY: 3 } },
      { label: "계절마다 얼굴 부위별 상태가 다르게 변한다.", scores: { COMBINATION: 2 } },
      { label: "온도 변화에 따라 쉽게 붉어지거나 예민해진다.", scores: { SENSITIVE: 3 } },
      { label: "계절과 관계없이 속당김이 자주 느껴진다.", scores: { DEHYDRATED: 3 } },
      { label: "계절이 바뀌어도 큰 변화가 없다.", scores: { NORMAL: 3 } }
    ]
  },
  {
    id: 8,
    title: "현재 내 피부와 가장 가까운 설명을 선택해주세요.",
    options: [
      { label: "건조하고 거칠며 보습이 가장 중요하게 느껴진다.", scores: { DRY: 4 } },
      { label: "유분과 피지가 많고 번들거림이 가장 고민이다.", scores: { OILY: 4 } },
      { label: "부위에 따라 유분과 건조함이 동시에 나타난다.", scores: { COMBINATION: 4 } },
      { label: "자극에 민감하고 붉어짐이나 따가움이 자주 나타난다.", scores: { SENSITIVE: 4 } },
      { label: "겉은 번들거리지만 피부 속은 건조하다.", scores: { DEHYDRATED: 4 } },
      { label: "유수분 균형이 비교적 안정적인 편이다.", scores: { NORMAL: 4 } }
    ]
  }
];

const skinResults: Record<SkinType, SkinResult> = {
  DRY: {
    type: "DRY",
    name: "건성",
    englishName: "DRY SKIN",
    summary: "수분과 유분이 부족해 쉽게 당기고 건조함을 느끼는 피부 타입이에요.",
    description: "세안 후 당김이나 각질이 자주 느껴지고 메이크업이 들뜨기 쉬운 편이에요.",
    keywords: ["보습", "피부 장벽", "유수분 보충"],
    careTips: [
      "세안 후 보습 제품을 충분히 사용해보세요.",
      "수분을 지켜주는 보습 중심의 제품을 선택해보세요.",
      "세정력이 너무 강한 제품은 피부 상태를 보며 조절해주세요."
    ]
  },
  OILY: {
    type: "OILY",
    name: "지성",
    englishName: "OILY SKIN",
    summary: "피지 분비가 활발해 얼굴 전체에 유분과 번들거림이 쉽게 나타나는 피부 타입이에요.",
    description: "시간이 지나면 유분감이 올라오고 피지나 모공이 눈에 띄기 쉬운 편이에요.",
    keywords: ["피지 관리", "산뜻한 보습", "유수분 균형"],
    careTips: [
      "유분을 과하게 제거하기보다 가벼운 수분 보충을 함께 해주세요.",
      "필요 이상으로 자주 세안하지 않도록 해주세요.",
      "무겁지 않은 수분 제품을 활용해보세요."
    ]
  },
  COMBINATION: {
    type: "COMBINATION",
    name: "복합성",
    englishName: "COMBINATION SKIN",
    summary: "T존에는 유분이 많고 볼이나 턱 주변은 건조한 특징이 함께 나타나는 피부 타입이에요.",
    description: "얼굴 부위마다 피부 상태가 달라 부위별로 다른 관리가 도움이 될 수 있어요.",
    keywords: ["부위별 관리", "유수분 균형", "T존 케어"],
    careTips: [
      "유분이 많은 부위와 건조한 부위를 나누어 관리해보세요.",
      "전체적으로는 기본적인 수분 보충을 유지해주세요.",
      "T존에는 무거운 제형을 과하게 사용하지 않는 편이 좋아요."
    ]
  },
  SENSITIVE: {
    type: "SENSITIVE",
    name: "민감성",
    englishName: "SENSITIVE SKIN",
    summary: "외부 자극이나 새로운 제품에 피부가 비교적 쉽게 반응하는 피부 타입이에요.",
    description: "붉어짐이나 따가움처럼 자극 반응을 자주 느끼는 편일 수 있어요.",
    keywords: ["진정", "저자극", "피부 장벽"],
    careTips: [
      "새로운 제품은 한 번에 여러 개 바꾸기보다 하나씩 사용해보세요.",
      "피부가 예민한 날에는 단순한 관리 루틴을 유지해보세요.",
      "자극을 느끼는 제품은 사용을 중단하고 피부 상태를 살펴주세요."
    ]
  },
  NORMAL: {
    type: "NORMAL",
    name: "중성",
    englishName: "NORMAL SKIN",
    summary: "유분과 수분의 균형이 비교적 안정적인 피부 타입이에요.",
    description: "심한 건조함이나 번들거림이 적고 전반적으로 편안한 상태를 유지하는 편이에요.",
    keywords: ["균형 유지", "기본 보습", "컨디션 관리"],
    careTips: [
      "현재의 유수분 균형을 유지할 수 있도록 기본 보습을 꾸준히 해주세요.",
      "계절에 따라 사용하는 제품의 제형을 조절해보세요.",
      "평소 자외선 차단과 기본적인 피부 관리를 유지해주세요."
    ]
  },
  DEHYDRATED: {
    type: "DEHYDRATED",
    name: "수부지",
    englishName: "DEHYDRATED OILY SKIN",
    summary: "피부 겉에는 유분이 느껴지지만 속은 수분이 부족해 당김이 함께 나타나는 피부 타입이에요.",
    description: "번들거림 때문에 지성처럼 느껴질 수 있지만 속당김이나 건조함이 함께 나타나는 특징이 있어요.",
    keywords: ["수분 보충", "유수분 균형", "속건조 케어"],
    careTips: [
      "유분 제거에만 집중하기보다 수분 보충을 함께 신경 써주세요.",
      "가볍게 사용할 수 있는 수분 제품을 활용해보세요.",
      "강한 세안이나 과도한 피지 제거는 피부 상태를 보며 조절해주세요."
    ]
  }
};

const createInitialScores = (): SkinScore => ({
  DRY: 0,
  OILY: 0,
  COMBINATION: 0,
  SENSITIVE: 0,
  NORMAL: 0,
  DEHYDRATED: 0
});

const Diagnosis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sw } = useGlobalStore();

  const diagnosisType = searchParams.get("type");

  /**
   * 진단 페이지 처음 들어왔을 때
   * 질문을 보기 좋은 위치로 스크롤한다.
   */
  useEffect(() => {
    window.scrollTo({
      top: 230,
      behavior: "smooth"
    });
  }, [diagnosisType]);


  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<SkinScore>(createInitialScores());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<SkinResult | null>(null);

  const progress = useMemo(
    () => ((currentQuestion + 1) / questions.length) * 100,
    [currentQuestion]
  );


  /** */
  /**
   * 다음 질문으로 넘어갈 때마다
   * 질문 영역이 잘 보이는 위치로 다시 이동한다.
   */
  useEffect(() => {
    if (!result) {
      window.scrollTo({
        top: 280,
        behavior: "smooth"
      });
    }
  }, [currentQuestion, result]);


  const calculateResult = (finalScores: SkinScore) => {
    const sorted = Object.entries(finalScores).sort(([, a], [, b]) => b - a);
    const topType = sorted[0][0] as SkinType;
    setResult(skinResults[topType]);
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(optionIndex);

    const option = questions[currentQuestion].options[optionIndex];
    const nextScores = { ...scores };

    Object.entries(option.scores).forEach(([type, score]) => {
      nextScores[type as SkinType] += score ?? 0;
    });

    setScores(nextScores);

    window.setTimeout(() => {
      if (currentQuestion === questions.length - 1) {
        calculateResult(nextScores);
      } else {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
      }
    }, 220);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScores(createInitialScores());
    setSelectedAnswer(null);
    setResult(null);
  };

  const handleSaveResult = () => {
    if (!result) return;

    if (sw !== true) {
      alert("진단 결과를 저장하려면 로그인해주세요.");
      navigate("/login");
      return;
    }

    alert(
      `${result.name} 피부 결과가 확인되었습니다.\n저장 기능은 다음 단계에서 회원 정보 API와 연결합니다.`
    );
  };

  if (diagnosisType !== "skin") {
    return (
      <main className="diagnosis-page">
        <div className="diagnosis-message">
          <p>아직 준비 중인 진단입니다.</p>
          <button type="button" onClick={() => navigate("/")}>돌아가기</button>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="diagnosis-page">
        <section className="diagnosis-result">
          <div className="diagnosis-result-top">
            <div>
              <p className="diagnosis-eyebrow">SKIN ANALYSIS · RESULT</p>
              <h1>
                YOUR SKIN<br />TYPE IS <strong>{result.name}</strong>
              </h1>
              <span className="diagnosis-result-en">{result.englishName}</span>
            </div>

            <div className="diagnosis-result-circle">
              <span>{result.name}</span>
            </div>
          </div>

          <div className="diagnosis-result-card">
            <span className="diagnosis-result-card-label">YOUR RESULT</span>
            <h2>{result.name} 피부</h2>
            <p>{result.summary}</p>
            <p>{result.description}</p>

            <div className="diagnosis-keywords">
              {result.keywords.map((keyword) => (
                <span key={keyword}>#{keyword}</span>
              ))}
            </div>
          </div>

          <div className="diagnosis-care">
            <p>CARE GUIDE</p>
            <h3>현재 피부에 맞춰 이렇게 관리해보세요.</h3>
            <ul>
              {result.careTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="diagnosis-profile-preview">
            <div>
              <span>PERSONAL BEAUTY PROFILE</span>
              <h3>진단 결과를 내 피부 타입으로 사용할까요?</h3>
              <p>
                저장된 피부 타입은 이후 상품 추천, AI BEAUTY,
                챗봇 개인화에 활용할 예정이에요.
              </p>
            </div>
            <strong>{result.name}</strong>
          </div>

          <p className="diagnosis-notice">
            자가진단 결과는 현재 피부 상태를 이해하기 위한 참고용이며,
            계절이나 생활 환경에 따라 달라질 수 있습니다.
          </p>

          <div className="diagnosis-result-actions">
            <button type="button" onClick={handleRestart}>다시 진단하기</button>
            <button type="button" className="primary" onClick={handleSaveResult}>
              {sw === true
                ? `내 피부 타입을 ${result.name}으로 저장`
                : "로그인하고 결과 저장"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const question = questions[currentQuestion];

  return (
    <main className="diagnosis-page">
      <section className="diagnosis-container">
        <header className="diagnosis-header">
          <div>
            <p>SKIN ANALYSIS</p>
            <h1>피부 타입 자가진단</h1>
          </div>
          <span>
            {String(currentQuestion + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
          </span>
        </header>

        <div className="diagnosis-progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="diagnosis-question">
          <p className="diagnosis-question-number">
            QUESTION {String(currentQuestion + 1).padStart(2, "0")}
          </p>
          <h2>{question.title}</h2>
          {question.description && (
            <p className="diagnosis-question-description">{question.description}</p>
          )}

          <div className="diagnosis-options">
            {question.options.map((option, index) => (
              <button
                type="button"
                key={option.label}
                className={selectedAnswer === index ? "selected" : ""}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{option.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <footer className="diagnosis-footer">
          <button type="button" onClick={() => navigate("/")}>진단 종료</button>
          <span>피부 상태는 계절과 생활 환경에 따라 달라질 수 있어요.</span>
        </footer>
      </section>
    </main>
  );
};

export default Diagnosis;
