import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalStore } from "../../store/store";
import "../../styles/diagnosis/PersonalColorDiagnosis.css";

/* =========================================================
   퍼스널 컬러 진단
========================================================= */

type PersonalColorType =
  | "SPRING_WARM"
  | "SUMMER_COOL"
  | "AUTUMN_WARM"
  | "WINTER_COOL";

type PersonalColorScore = Record<PersonalColorType, number>;

type PersonalColorAnswerOption = {
  label: string;
  scores: Partial<PersonalColorScore>;
};

type PersonalColorQuestion = {
  id: number;
  title: string;
  description?: string;
  options: PersonalColorAnswerOption[];
};

type ColorSwatch = {
  name: string;
  hex: string;
};

type PersonalColorResult = {
  type: PersonalColorType;
  name: string;
  englishName: string;
  summary: string;
  description: string;
  keywords: string[];
  colors: ColorSwatch[];
  guideTips: string[];
};

const personalColorQuestions: PersonalColorQuestion[] = [
  {
    id: 1,
    title: "햇빛을 오래 받았을 때 피부는 어떻게 변하는 편인가요?",
    description: "평소 야외 활동 후 피부가 어떻게 보였는지 떠올려보세요.",
    options: [
      {
        label: "쉽게 붉어지고 밝은 느낌이 난다.",
        scores: { SUMMER_COOL: 3 }
      },
      {
        label: "금방 노릇하게 타고 건강한 느낌이 난다.",
        scores: { AUTUMN_WARM: 3 }
      },
      {
        label: "밝고 따뜻한 복숭아빛 느낌이 난다.",
        scores: { SPRING_WARM: 3 }
      },
      {
        label: "붉어지거나 피부와 이목구비의 대비가 더 선명해 보이는 편이다.",
        scores: { WINTER_COOL: 3 }
      }
    ]
  },
  {
    id: 2,
    title: "평소 잘 어울린다고 느끼는 액세서리 색상은 무엇인가요?",
    options: [
      {
        label: "진한 골드, 브론즈",
        scores: { AUTUMN_WARM: 3 }
      },
      {
        label: "밝은 골드, 샴페인 골드",
        scores: { SPRING_WARM: 3 }
      },
      {
        label: "선명한 실버, 플래티넘",
        scores: { WINTER_COOL: 3 }
      },
      {
        label: "부드러운 실버, 화이트 골드",
        scores: { SUMMER_COOL: 3 }
      }
    ]
  },
  {
    id: 3,
    title: "입었을 때 얼굴이 가장 화사해 보인다고 느끼는 옷 색은 무엇인가요?",
    options: [
      {
        label: "블랙, 화이트, 로열블루",
        scores: { WINTER_COOL: 3 }
      },
      {
        label: "코랄, 피치, 아이보리",
        scores: { SPRING_WARM: 3 }
      },
      {
        label: "라벤더, 소프트 핑크, 연한 블루",
        scores: { SUMMER_COOL: 3 }
      },
      {
        label: "카멜, 카키, 브라운",
        scores: { AUTUMN_WARM: 3 }
      }
    ]
  },
  {
    id: 4,
    title: "립 컬러를 골랐을 때 가장 자연스럽게 어울린다고 느끼는 계열은 무엇인가요?",
    options: [
      {
        label: "로즈 핑크, 모브 핑크",
        scores: { SUMMER_COOL: 3 }
      },
      {
        label: "체리 레드, 푸시아, 와인",
        scores: { WINTER_COOL: 3 }
      },
      {
        label: "브릭, 칠리, 테라코타",
        scores: { AUTUMN_WARM: 3 }
      },
      {
        label: "코랄, 살구, 오렌지 핑크",
        scores: { SPRING_WARM: 3 }
      }
    ]
  },
  {
    id: 5,
    title: "평소 내 피부색과 가장 가까운 느낌은 어떤 편인가요?",
    description: "피부 밝기만으로 퍼스널컬러가 정해지는 것은 아니므로 가장 가까운 인상으로 골라주세요.",
    options: [
      {
        label: "비교적 밝고 아이보리빛이나 옅은 노란 기가 느껴지는 편이다.",
        scores: { SPRING_WARM: 2 }
      },
      {
        label: "베이지빛이나 노란 기가 비교적 또렷하게 느껴지는 편이다.",
        scores: { AUTUMN_WARM: 2 }
      },
      {
        label: "밝고 맑은 편이거나 피부와 이목구비의 대비가 또렷하게 느껴진다.",
        scores: { WINTER_COOL: 2 }
      },
      {
        label: "비교적 밝고 핑크빛이나 차분한 붉은 기가 느껴지는 편이다.",
        scores: { SUMMER_COOL: 2 }
      }
    ]
  },
  {
    id: 6,
    title: "머리색 중 얼굴이 가장 살아 보인다고 느끼는 색은 무엇인가요?",
    options: [
      {
        label: "블랙, 블루 블랙",
        scores: { WINTER_COOL: 3 }
      },
      {
        label: "애쉬 브라운, 그레이 브라운",
        scores: { SUMMER_COOL: 3 }
      },
      {
        label: "밝은 브라운, 허니 브라운",
        scores: { SPRING_WARM: 3 }
      },
      {
        label: "초코 브라운, 다크 브라운",
        scores: { AUTUMN_WARM: 3 }
      }
    ]
  },
  {
    id: 7,
    title: "메이크업 전체 분위기로 가장 잘 어울린다고 느끼는 것은 무엇인가요?",
    options: [
      {
        label: "차분하고 깊이 있는 음영 메이크업",
        scores: { AUTUMN_WARM: 3 }
      },
      {
        label: "밝고 생기 있는 맑은 메이크업",
        scores: { SPRING_WARM: 3 }
      },
      {
        label: "선명하고 대비감 있는 메이크업",
        scores: { WINTER_COOL: 3 }
      },
      {
        label: "부드럽고 은은한 파스텔 메이크업",
        scores: { SUMMER_COOL: 3 }
      }
    ]
  },
  {
    id: 8,
    title: "내 이미지와 가장 가까운 표현을 선택해주세요.",
    options: [
      {
        label: "부드럽고 청순하며 차분한 느낌",
        scores: { SUMMER_COOL: 3 }
      },
      {
        label: "성숙하고 고급스러우며 깊은 느낌",
        scores: { AUTUMN_WARM: 3 }
      },
      {
        label: "따뜻하고 발랄하며 생기 있는 느낌",
        scores: { SPRING_WARM: 3 }
      },
      {
        label: "또렷하고 시크하며 선명한 느낌",
        scores: { WINTER_COOL: 3 }
      }
    ]
  },
  {
    id: 9,
    title: "인터넷 쇼핑몰에서 옷을 살 때, 실패할까 봐 나도 모르게 자꾸 손이 가는 안전한 색은 무엇인가요?",
    options: [
      {
        label: "화이트, 블랙, 그레이, 네이비 계열",
        scores: {
          WINTER_COOL: 2,
          SUMMER_COOL: 1
        }
      },
      {
        label: "밝은 코랄, 피치, 라이트 옐로처럼 맑고 화사한 색 계열",
        scores: { SPRING_WARM: 2 }
      },
      {
        label: "아이보리, 베이지, 브라운, 카키 계열",
        scores: {
          AUTUMN_WARM: 2,
          SPRING_WARM: 1
        }
      },
      {
        label: "파스텔 톤의 소라색, 연핑크, 연보라 계열",
        scores: {
          SUMMER_COOL: 2,
          SPRING_WARM: 1
        }
      }
    ]
  },
  {
    id: 10,
    title: "큰맘 먹고 산 옷인데, 내가 입으면 왠지 얼굴이 칙칙해져서 잘 입지 않게 되는 '워스트 옷 색상'은 무엇인가요?",
    options: [
      {
        label: "힘없고 흐릿한 연살구, 베이지",
        scores: { WINTER_COOL: 2 }
      },
      {
        label: "블랙이나 묵직하고 어두운 다크 네이비",
        scores: { SPRING_WARM: 2 }
      },
      {
        label: "오렌지나 카키, 노란 기가 강한 브라운",
        scores: { SUMMER_COOL: 2 }
      },
      {
        label: "쨍한 핫핑크나 네온 컬러",
        scores: { AUTUMN_WARM: 2 }
      }
    ]
  }
];

const personalColorResults: Record<PersonalColorType, PersonalColorResult> = {
  SPRING_WARM: {
    type: "SPRING_WARM",
    name: "봄웜",
    englishName: "SPRING WARM",
    summary: "밝고 따뜻하며 생기 있는 색감이 자연스럽게 어우러지는 퍼스널컬러예요.",
    description: "코랄, 피치, 아이보리처럼 맑고 따뜻한 색을 활용하면 전체적인 인상이 한층 화사하게 느껴질 수 있어요.",
    keywords: ["코랄", "피치", "아이보리", "라이트브라운"],
    colors: [
      { name: "코랄", hex: "#F28C8C" },
      { name: "피치", hex: "#F6B38E" },
      { name: "아이보리", hex: "#FFF4D6" },
      { name: "라이트브라운", hex: "#B98A67" }
    ],
    guideTips: [
      "립은 코랄, 살구, 오렌지 핑크처럼 맑고 따뜻한 계열을 활용해보세요.",
      "옷은 아이보리, 피치, 라이트 옐로처럼 밝고 부드러운 색을 매치해보세요.",
      "액세서리는 밝은 골드나 샴페인 골드 계열을 활용해보세요.",
      "헤어는 허니 브라운이나 밝은 브라운 계열을 참고해보세요."
    ]
  },
  SUMMER_COOL: {
    type: "SUMMER_COOL",
    name: "여름쿨",
    englishName: "SUMMER COOL",
    summary: "부드럽고 차분한 쿨톤 색감이 자연스럽게 어우러지는 퍼스널컬러예요.",
    description: "라벤더, 로즈 핑크, 소프트 블루처럼 채도가 부드러운 색을 활용하면 은은하고 맑은 분위기를 연출하기 좋아요.",
    keywords: ["라벤더", "로즈핑크", "소프트블루", "모브"],
    colors: [
      { name: "라벤더", hex: "#C7B6E6" },
      { name: "로즈핑크", hex: "#DFA6B7" },
      { name: "소프트블루", hex: "#AFCBE3" },
      { name: "모브", hex: "#B58AA5" }
    ],
    guideTips: [
      "립은 로즈 핑크, 모브 핑크처럼 부드럽고 차분한 계열을 활용해보세요.",
      "옷은 라벤더, 소프트 블루, 연한 그레이처럼 은은한 색을 매치해보세요.",
      "액세서리는 실버나 화이트 골드 계열을 활용해보세요.",
      "헤어는 애쉬 브라운이나 그레이 브라운 계열을 참고해보세요."
    ]
  },
  AUTUMN_WARM: {
    type: "AUTUMN_WARM",
    name: "가을웜",
    englishName: "AUTUMN WARM",
    summary: "깊고 따뜻하며 차분한 색감이 자연스럽게 어우러지는 퍼스널컬러예요.",
    description: "브릭, 카멜, 카키, 브라운처럼 깊이감 있는 웜 컬러를 활용하면 차분하고 고급스러운 분위기를 연출하기 좋아요.",
    keywords: ["브릭", "카멜", "카키", "브라운"],
    colors: [
      { name: "브릭", hex: "#A6533C" },
      { name: "카멜", hex: "#C18A52" },
      { name: "카키", hex: "#7E7A4F" },
      { name: "브라운", hex: "#6B4A36" }
    ],
    guideTips: [
      "립은 브릭, 칠리, 테라코타처럼 깊고 따뜻한 계열을 활용해보세요.",
      "옷은 카멜, 카키, 브라운처럼 차분한 자연색을 매치해보세요.",
      "액세서리는 진한 골드나 브론즈 계열을 활용해보세요.",
      "헤어는 초코 브라운이나 다크 브라운 계열을 참고해보세요."
    ]
  },
  WINTER_COOL: {
    type: "WINTER_COOL",
    name: "겨울쿨",
    englishName: "WINTER COOL",
    summary: "선명하고 또렷하며 대비감 있는 쿨톤 색감이 자연스럽게 어우러지는 퍼스널컬러예요.",
    description: "블랙, 화이트, 체리 레드, 로열 블루처럼 선명한 색을 활용하면 또렷하고 세련된 분위기를 연출하기 좋아요.",
    keywords: ["블랙", "화이트", "체리레드", "로열블루"],
    colors: [
      { name: "블랙", hex: "#111111" },
      { name: "화이트", hex: "#F7F7F7" },
      { name: "체리레드", hex: "#B1123B" },
      { name: "로열블루", hex: "#2F4FA8" }
    ],
    guideTips: [
      "립은 체리 레드, 푸시아, 와인처럼 선명한 계열을 활용해보세요.",
      "옷은 블랙, 화이트, 로열 블루처럼 대비가 분명한 색을 매치해보세요.",
      "액세서리는 선명한 실버나 플래티넘 계열을 활용해보세요.",
      "헤어는 블랙이나 블루 블랙 계열을 참고해보세요."
    ]
  }
};

const createInitialPersonalColorScores = (): PersonalColorScore => ({
  SPRING_WARM: 0,
  SUMMER_COOL: 0,
  AUTUMN_WARM: 0,
  WINTER_COOL: 0
});


/* =========================================================
   퍼스널 컬러 진단 화면
========================================================= */

const PersonalColorDiagnosis = () => {
  const navigate = useNavigate();
  const { sw, memberId } = useGlobalStore();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<PersonalColorScore>(
    createInitialPersonalColorScores()
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [saving, setSaving] = useState(false);

  const progress = useMemo(
    () => ((currentQuestion + 1) / personalColorQuestions.length) * 100,
    [currentQuestion]
  );

  useEffect(() => {
    window.scrollTo({
      top: 230,
      behavior: "smooth"
    });
  }, []);

  useEffect(() => {
    if (!result) {
      window.scrollTo({
        top: 280,
        behavior: "smooth"
      });
    }
  }, [currentQuestion, result]);

  const calculateResult = (finalScores: PersonalColorScore) => {
    const sorted = Object.entries(finalScores).sort(([, a], [, b]) => b - a);
    const topType = sorted[0][0] as PersonalColorType;
    setResult(personalColorResults[topType]);
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(optionIndex);

    const option = personalColorQuestions[currentQuestion].options[optionIndex];
    const nextScores = { ...scores };

    Object.entries(option.scores).forEach(([type, score]) => {
      nextScores[type as PersonalColorType] += score ?? 0;
    });

    setScores(nextScores);

    window.setTimeout(() => {
      if (currentQuestion === personalColorQuestions.length - 1) {
        calculateResult(nextScores);
      } else {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
      }
    }, 220);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScores(createInitialPersonalColorScores());
    setSelectedAnswer(null);
    setResult(null);
    setSaving(false);
  };

  const handleSaveResult = async () => {
    if (!result || saving) return;

    if (sw !== true) {
      alert("진단 결과를 저장하려면 로그인해주세요.");
      navigate("/login");
      return;
    }

    if (!memberId || memberId <= 0) {
      alert("회원 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      navigate("/login");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "http://localhost:9104/personal_color",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            memberId,
            personalColor: result.type,
            springScore: scores.SPRING_WARM,
            summerScore: scores.SUMMER_COOL,
            autumnScore: scores.AUTUMN_WARM,
            winterScore: scores.WINTER_COOL,
            resultDescription: result.summary
          })
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success !== true) {
        throw new Error(
          data?.message || "퍼스널컬러 저장에 실패했습니다."
        );
      }

      alert(
        `퍼스널컬러 진단 결과가 저장되었습니다.\n내 퍼스널컬러가 ${result.name}(으)로 변경되었습니다.`
      );
    } catch (error) {
      console.error(
        "퍼스널컬러 진단 결과 저장 오류",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "퍼스널컬러 저장 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <main className="diagnosis-page personal-color-diagnosis-page">
        <section className="diagnosis-result">
          <div className="diagnosis-result-top">
            <div>
              <p className="diagnosis-eyebrow">PERSONAL COLOR · RESULT</p>
              <h1>
                YOUR PERSONAL<br />COLOR IS <strong>{result.name}</strong>
              </h1>
              <span className="diagnosis-result-en">{result.englishName}</span>
            </div>

            <div
              className={`diagnosis-result-circle personal-color-result-circle ${result.type.toLowerCase()}`}
            >
              <span>{result.name}</span>
            </div>
          </div>

          <div className="diagnosis-result-card personal-color-result-card">
            <span className="diagnosis-result-card-label">YOUR RESULT</span>
            <h2>{result.name} 퍼스널컬러</h2>
            <p>{result.summary}</p>
            <p>{result.description}</p>

            <div className="diagnosis-keywords">
              {result.keywords.map((keyword) => (
                <span key={keyword}>#{keyword}</span>
              ))}
            </div>

            <div className="personal-color-swatches">
              {result.colors.map((color) => (
                <div className="personal-color-swatch-item" key={color.name}>
                  <span
                    className="personal-color-swatch"
                    style={{ backgroundColor: color.hex }}
                    aria-label={`${color.name} ${color.hex}`}
                  />
                  <strong>{color.name}</strong>
                  <small>{color.hex}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="diagnosis-care">
            <p>COLOR GUIDE</p>
            <h3>이런 색감을 활용해보세요.</h3>
            <ul>
              {result.guideTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="diagnosis-profile-preview personal-color-profile-preview">
            <div>
              <span>PERSONAL BEAUTY PROFILE</span>
              <h3>진단 결과를 내 퍼스널컬러로 사용할까요?</h3>
              <p>
                저장된 퍼스널컬러는 이후 상품 추천, AI BEAUTY,
                챗봇 개인화에 활용할 예정이에요.
              </p>
            </div>
            <strong>{result.name}</strong>
          </div>

          <p className="diagnosis-notice">
            퍼스널컬러 자가진단은 색 선택을 돕기 위한 참고용 결과이며,
            조명이나 화면 설정, 개인의 선호에 따라 다르게 느껴질 수 있습니다.
          </p>

          <div className="diagnosis-result-actions">
            <button type="button" onClick={handleRestart}>다시 진단하기</button>

            <button
              type="button"
              className="primary"
              onClick={handleSaveResult}
              disabled={saving}
            >
              {saving
                ? "저장 중..."
                : sw === true
                  ? `내 퍼스널컬러를 ${result.name}으로 저장`
                  : "로그인하고 결과 저장"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const question = personalColorQuestions[currentQuestion];

  return (
    <main className="diagnosis-page personal-color-diagnosis-page">
      <section className="diagnosis-container">
        <header className="diagnosis-header">
          <div>
            <p>PERSONAL COLOR ANALYSIS</p>
            <h1>퍼스널컬러 자가진단</h1>
          </div>

          <span>
            {String(currentQuestion + 1).padStart(2, "0")} / {String(personalColorQuestions.length).padStart(2, "0")}
          </span>
        </header>

        <div className="diagnosis-progress personal-color-progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="diagnosis-question">
          <p className="diagnosis-question-number personal-color-question-number">
            QUESTION {String(currentQuestion + 1).padStart(2, "0")}
          </p>

          <h2>{question.title}</h2>

          {question.description && (
            <p className="diagnosis-question-description">
              {question.description}
            </p>
          )}

          <div className="diagnosis-options personal-color-options">
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
          <span>자가진단은 나에게 어울리는 색을 찾기 위한 참고용으로 활용해주세요.</span>
        </footer>
      </section>
    </main>
  );
};


export default PersonalColorDiagnosis;
