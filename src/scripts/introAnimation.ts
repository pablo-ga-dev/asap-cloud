type IntroAnimationState = {
  cleanup: () => void;
};

const ANIMATION_DURATION = 1000;
const TEXT_EXIT_START = 0.25;
const TEXT_EXIT_END = 0.78;
const CARD_FADE_START = 0.86;
const STAGE_FADE_START = 0.92;
const CARD_EXIT_MULTIPLIER = 240;
const CARD_WIDTH_END = "100vw";
const CARD_HEIGHT_END = "100vh";
const INITIAL_STAGE_COLOR = "#000000";
const FINAL_STAGE_COLOR = "#edf1f7";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const normalize = (value: number, start: number, end: number): number => {
  const range = end - start;
  if (range <= 0) {
    return 1;
  }

  return clamp((value - start) / range, 0, 1);
};

export const initIntroAnimation = (): IntroAnimationState | null => {
  const shell = document.querySelector<HTMLElement>("#intro-shell");
  const spacer = document.querySelector<HTMLElement>("#scroll-spacer");
  const stage = document.querySelector<HTMLElement>("#stage");
  const cardContainer = document.querySelector<HTMLElement>("#card-container");
  const leftBottomWord =
    document.querySelector<HTMLElement>("#left-bottom-word");
  const rightBottomWord =
    document.querySelector<HTMLElement>("#right-bottom-word");
  const leftMainText = document.querySelector<HTMLElement>("#left-main-text");
  const rightMainText = document.querySelector<HTMLElement>("#right-main-text");

  if (
    shell === null ||
    spacer === null ||
    stage === null ||
    cardContainer === null ||
    leftBottomWord === null ||
    rightBottomWord === null ||
    leftMainText === null ||
    rightMainText === null
  ) {
    return null;
  }

  cardContainer.style.maxWidth = "none";

  const cardAnimation = cardContainer.animate(
    [
      {
        width: `${cardContainer.offsetWidth}px`,
        height: `${cardContainer.offsetHeight}px`,
      },
      { width: CARD_WIDTH_END, height: CARD_HEIGHT_END },
    ],
    {
      duration: ANIMATION_DURATION,
      easing: "linear",
      fill: "both",
    },
  );

  const stageAnimation = stage.animate(
    [
      { backgroundColor: INITIAL_STAGE_COLOR },
      { backgroundColor: FINAL_STAGE_COLOR },
    ],
    {
      duration: ANIMATION_DURATION,
      easing: "linear",
      fill: "both",
    },
  );

  cardAnimation.pause();
  stageAnimation.pause();

  let rafId = 0;

  const update = (): void => {
    rafId = 0;

    const shellTop = shell.getBoundingClientRect().top + window.scrollY;
    const scrollDistance = Math.max(
      spacer.offsetHeight - window.innerHeight,
      1,
    );
    const rawProgress = (window.scrollY - shellTop) / scrollDistance;
    const progress = clamp(rawProgress, 0, 1);
    const time = progress * ANIMATION_DURATION;
    const bottomWordsOpacity = Math.max(1 - progress * 1.25, 0);
    const textExitProgress = normalize(
      progress,
      TEXT_EXIT_START,
      TEXT_EXIT_END,
    );
    const mainTextOpacity = Math.max(1 - progress * 1.5, 0);
    const leftTextOffset = textExitProgress * CARD_EXIT_MULTIPLIER;
    const rightTextOffset = -textExitProgress * CARD_EXIT_MULTIPLIER;
    const cardFadeProgress = normalize(progress, CARD_FADE_START, 1);
    const stageFadeProgress = normalize(progress, STAGE_FADE_START, 1);
    const cardOpacity = 1 - cardFadeProgress;
    const stageOpacity = 1 - stageFadeProgress;

    cardAnimation.currentTime = time;
    stageAnimation.currentTime = time;
    leftBottomWord.style.opacity = `${bottomWordsOpacity}`;
    rightBottomWord.style.opacity = `${bottomWordsOpacity}`;
    leftMainText.style.opacity = `${mainTextOpacity}`;
    rightMainText.style.opacity = `${mainTextOpacity}`;
    leftMainText.style.transform = `translateY(${leftTextOffset}%)`;
    rightMainText.style.transform = `translateY(${rightTextOffset}%)`;
    cardContainer.style.opacity = `${cardOpacity}`;
    stage.style.opacity = `${stageOpacity}`;
    stage.style.visibility = stageOpacity <= 0.01 ? "hidden" : "visible";
    stage.style.pointerEvents = stageOpacity <= 0.01 ? "none" : "auto";
  };

  const scheduleUpdate = (): void => {
    if (rafId !== 0) {
      return;
    }

    rafId = window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  update();

  return {
    cleanup: () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      cardAnimation.cancel();
      stageAnimation.cancel();
    },
  };
};
