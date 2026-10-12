import { useEffect, useState } from "react";
import "../../styles/chat/ChatLoadingShowcase.css";

type LoadingScene = "MAKEUP" | "RUN";

const MAKEUP_STEPS = ["준비", "눈 화장", "볼터치", "립", "헤어스타일"] as const;
const SCENE_DURATION = 6000;

const ChatLoadingShowcase = () => {
  const [scene, setScene] = useState<LoadingScene>("MAKEUP");
  const [makeupStep, setMakeupStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setScene((prev) => (prev === "MAKEUP" ? "RUN" : "MAKEUP"));
    }, SCENE_DURATION);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scene !== "MAKEUP") return;

    setMakeupStep(0);

    const timers: number[] = [];

    timers.push(window.setTimeout(() => setMakeupStep(1), 800));
    timers.push(window.setTimeout(() => setMakeupStep(2), 1800));
    timers.push(window.setTimeout(() => setMakeupStep(3), 2800));
    timers.push(window.setTimeout(() => setMakeupStep(4), 3900));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [scene]);

  const getMakeupMessage = () => {
    if (makeupStep === 0) return "메이크업을 시작할 준비를 하고 있어요.";
    if (makeupStep === 1) return "아이 메이크업으로 눈매를 또렷하게 만드는 중이에요.";
    if (makeupStep === 2) return "볼에 생기 있는 컬러를 더하고 있어요.";
    if (makeupStep === 3) return "립 컬러까지 더해 메이크업이 완성되어 가고 있어요.";
    return "갈색 뽀글 헤어스타일까지 완성하고 있어요!";
  };

  return (
    <section className="gd-showcase">
      {/* HEADER */}
      <div className="gd-showcase-header">
        <div className="gd-showcase-header-icon">✦</div>
        <div>
          <strong>여신강림 도우미가 답변을 준비하고 있어요</strong>
        </div>
      </div>

      {/* MAKEUP */}
      {scene === "MAKEUP" && (
        <div key="makeup" className="gd-showcase-card gd-showcase-enter">
          <div className="gd-showcase-card-title">{getMakeupMessage()}</div>

          <div className="gd-showcase-makeup">
            {/* BEFORE */}
            <div className="gd-showcase-person">
              <span className="gd-showcase-person-label">BEFORE</span>

              <div className="gd-showcase-face before">
                <div className="gd-showcase-before-hair">
                  <span className="side left" />
                  <span className="side right" />
                </div>

                <span className="gd-showcase-brow left" />
                <span className="gd-showcase-brow right" />

                {/* 눈 뜬 상태 */}
                <span className="gd-showcase-eye-open left" />
                <span className="gd-showcase-eye-open right" />
                <span className="gd-showcase-eye-highlight left" />
                <span className="gd-showcase-eye-highlight right" />

                <span className="gd-showcase-nose" />
                <span className="gd-showcase-mouth-basic" />
              </div>
            </div>

            {/* ARROW */}
            <div className="gd-showcase-transform-arrow">
              <span>✦</span>
              <b>→</b>
            </div>

            {/* AFTER */}
            <div className="gd-showcase-person">
              <span className="gd-showcase-person-label after">AFTER</span>

              <div className={`gd-showcase-face after step-${makeupStep}`}>
                <div className="gd-showcase-after-hair">
                  <span className="side left" />
                  <span className="side right" />
                </div>

                {/* 빨간 뽀글 헤어 */}
                <div className="gd-showcase-hair-complete-red">
                  <span className="curl curl-1" />
                  <span className="curl curl-2" />
                  <span className="curl curl-3" />
                  <span className="curl curl-4" />
                  <span className="curl curl-5" />
                  <span className="curl curl-6" />
                  <span className="curl curl-7" />
                  <span className="curl curl-8" />
                  <span className="bang bang-1" />
                  <span className="bang bang-2" />
                  <span className="bang bang-3" />
                </div>

                <span className="gd-showcase-brow left" />
                <span className="gd-showcase-brow right" />

                {/* 눈 뜬 상태 */}
                <span className="gd-showcase-eye-open left" />
                <span className="gd-showcase-eye-open right" />
                <span className="gd-showcase-eye-highlight left" />
                <span className="gd-showcase-eye-highlight right" />

                <span className="gd-showcase-eye-shadow left" />
                <span className="gd-showcase-eye-shadow right" />

                <span className="gd-showcase-eyeliner left" />
                <span className="gd-showcase-eyeliner right" />

                <span className="gd-showcase-lash left lash-1" />
                <span className="gd-showcase-lash left lash-2" />
                <span className="gd-showcase-lash right lash-1" />
                <span className="gd-showcase-lash right lash-2" />

                <span className="gd-showcase-nose" />

                <span className="gd-showcase-blush left" />
                <span className="gd-showcase-blush right" />

                <span className="gd-showcase-mouth-basic" />

                <div className="gd-showcase-lips">
                  <span className="upper" />
                  <span className="lower" />
                </div>

                <span className="gd-showcase-finish-sparkle sparkle-a">✦</span>
                <span className="gd-showcase-finish-sparkle sparkle-b">✦</span>
                <span className="gd-showcase-finish-sparkle sparkle-c">✦</span>
              </div>
            </div>
          </div>

          <div className="gd-showcase-makeup-steps">
            {MAKEUP_STEPS.slice(1).map((label, index) => {
              const step = index + 1;

              return (
                <span
                  key={label}
                  className={[
                    "gd-showcase-step",
                    makeupStep >= step ? "done" : "",
                    makeupStep === step ? "current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <i>{makeupStep > step ? "✓" : step}</i>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* RUN */}
      {scene === "RUN" && (
        <div key="run" className="gd-showcase-card gd-showcase-enter">
          <div className="gd-showcase-card-title">
            답변을 가지러 달리는 중이에요!
          </div>

          <div className="gd-showcase-run-area">
            <div className="gd-showcase-run-sky">
              <span className="cloud cloud-1" />
              <span className="cloud cloud-2" />
            </div>

            <div className="gd-showcase-road" />

            <div className="gd-showcase-obstacle obstacle-1">
              <span />
            </div>

            <div className="gd-showcase-obstacle obstacle-2">
              <span />
            </div>

            <div className="gd-showcase-obstacle obstacle-3">
              <span />
            </div>

            <div className="gd-showcase-runner">
              <span className="gd-showcase-runner-hair" />
              <span className="gd-showcase-runner-head" />
              <span className="gd-showcase-runner-body" />
              <span className="gd-showcase-runner-arm arm-left" />
              <span className="gd-showcase-runner-arm arm-right" />
              <span className="gd-showcase-runner-leg leg-left" />
              <span className="gd-showcase-runner-leg leg-right" />
              <span className="gd-showcase-runner-shadow" />
            </div>

            <div className="gd-showcase-finish">
              <span className="pole" />
              <span className="flag">
                <i>✦</i>
              </span>
            </div>
          </div>

          <div className="gd-showcase-run-status">
            <span>출발</span>
            <span>목적지에 도착 !</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default ChatLoadingShowcase;