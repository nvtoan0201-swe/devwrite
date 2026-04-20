"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "vi" | "en";

const STORAGE_KEY = "devwrite-lang-v1";

const DICT = {
  en: {
    header_tagline: "Technical English coach for developers",
    header_chip: "powered by Claude Code",
    domain_title: "Domain",
    level_title: "Level",
    progress_title: "Progress",
    stat_sessions: "Sessions",
    stat_vocab: "Vocab",
    stat_avg_score: "Avg score",
    stat_current: "Current",
    review_title: "Today's review",
    review_empty: "Nothing due right now. Finish an exercise to earn new cards.",
    review_more_waiting: "more waiting",
    exercise_title: "Exercise",
    new_exercise: "New exercise",
    generating: "Generating…",
    exercise_preparing: "Preparing an exercise for you…",
    exercise_click_prefix: "Click",
    exercise_click_suffix: "above to get started.",
    your_writing: "Your writing",
    word_singular: "word",
    word_plural: "words",
    min_5_suffix: " · min 5",
    editor_placeholder:
      "Write here. Focus on being clear and specific — the agent will grade structure, grammar, word choice, and style.",
    submit: "Submit for feedback",
    grading: "Grading…",
    clarity_score: "Clarity score",
    clarity_grading: "Grading your writing…",
    clarity_empty: "Submit a writing sample to see your score.",
    tab_grammar: "Grammar",
    tab_vocab: "Vocabulary",
    tab_tips: "Writing Tips",
    feedback_empty: "Feedback will appear here after you submit.",
    diagram_title: "Architecture diagram (Mermaid)",
    diagram_hint: "Paste this into a Mermaid renderer to visualize the system you described.",
    score_exceptional: "Exceptional",
    score_strong: "Strong",
    score_decent: "Decent — room to sharpen",
    score_unclear: "Unclear in places",
    score_rewrite: "Needs rewrite",
    no_grammar_issues: "No grammar issues detected.",
    no_grammar_sub: "That's the bar we're aiming for. Nice work.",
    type_sva: "Subject–verb agreement",
    type_tense: "Tense",
    type_article: "Article",
    type_preposition: "Preposition",
    type_word_order: "Word order",
    type_pluralization: "Pluralization",
    type_capitalization: "Capitalization",
    type_other: "Other",
    vocab_better: "Better word choices",
    vocab_better_empty: "No weak word choices flagged. Your vocabulary held up on this one.",
    vocab_new: "New vocabulary earned",
    vocab_new_empty: "No new cards this round. Try a slightly harder exercise.",
    vocab_srs: "Spaced repetition queue",
    vocab_srs_empty: "You're caught up on reviews.",
    vocab_srs_more_suffix: "more due today",
    tip_of_session: "Tip of the session",
    tip_recurring_prefix: "You've repeated",
    tip_recurring_mid: "errors",
    tip_recurring_suffix:
      "times. Slow down on this one — it's becoming a pattern.",
    tip_none: "No tips returned this round.",
    tip_clarity: "Clarity",
    tip_structure: "Structure",
    tip_style: "Style",
    further_reading: "Further reading",
    vocab_search_more: "Search this to learn more",
    lang_toggle_to_vi: "Tiếng Việt",
    lang_toggle_to_en: "English",
  },
  vi: {
    header_tagline: "Huấn luyện viên tiếng Anh kỹ thuật cho dev",
    header_chip: "chạy bằng Claude Code",
    domain_title: "Lĩnh vực",
    level_title: "Cấp độ",
    progress_title: "Tiến độ",
    stat_sessions: "Phiên",
    stat_vocab: "Từ vựng",
    stat_avg_score: "Điểm TB",
    stat_current: "Hiện tại",
    review_title: "Ôn tập hôm nay",
    review_empty: "Chưa có gì cần ôn. Hoàn thành bài tập để nhận thẻ mới.",
    review_more_waiting: "thẻ đang chờ",
    exercise_title: "Bài tập",
    new_exercise: "Bài mới",
    generating: "Đang tạo…",
    exercise_preparing: "Đang chuẩn bị bài tập…",
    exercise_click_prefix: "Bấm",
    exercise_click_suffix: "phía trên để bắt đầu.",
    your_writing: "Bài viết của bạn",
    word_singular: "từ",
    word_plural: "từ",
    min_5_suffix: " · tối thiểu 5",
    editor_placeholder:
      "Viết ở đây bằng tiếng Anh. Tập trung rõ ràng và cụ thể — agent sẽ chấm cấu trúc, ngữ pháp, từ vựng, và phong cách.",
    submit: "Nộp để nhận feedback",
    grading: "Đang chấm…",
    clarity_score: "Điểm rõ ràng",
    clarity_grading: "Đang chấm bài của bạn…",
    clarity_empty: "Nộp một bài viết để xem điểm.",
    tab_grammar: "Ngữ pháp",
    tab_vocab: "Từ vựng",
    tab_tips: "Gợi ý viết",
    feedback_empty: "Feedback sẽ hiện ở đây sau khi bạn nộp bài.",
    diagram_title: "Sơ đồ kiến trúc (Mermaid)",
    diagram_hint:
      "Dán đoạn này vào trình render Mermaid để thấy hệ thống bạn mô tả.",
    score_exceptional: "Xuất sắc",
    score_strong: "Tốt",
    score_decent: "Ổn — còn chỗ cải thiện",
    score_unclear: "Chưa rõ ở một vài chỗ",
    score_rewrite: "Cần viết lại",
    no_grammar_issues: "Không phát hiện lỗi ngữ pháp.",
    no_grammar_sub: "Đây là mức cần hướng tới. Làm tốt lắm.",
    type_sva: "Chủ ngữ – động từ",
    type_tense: "Thì",
    type_article: "Mạo từ",
    type_preposition: "Giới từ",
    type_word_order: "Trật tự từ",
    type_pluralization: "Số nhiều",
    type_capitalization: "Viết hoa",
    type_other: "Khác",
    vocab_better: "Dùng từ chính xác hơn",
    vocab_better_empty: "Không có từ nào cần đổi. Vốn từ của bạn ổn trong bài này.",
    vocab_new: "Từ vựng mới kiếm được",
    vocab_new_empty: "Không có thẻ mới lần này. Thử bài khó hơn một chút.",
    vocab_srs: "Hàng đợi ôn tập",
    vocab_srs_empty: "Bạn đã ôn hết phần hôm nay.",
    vocab_srs_more_suffix: "thẻ nữa cần ôn hôm nay",
    tip_of_session: "Gợi ý phiên này",
    tip_recurring_prefix: "Bạn đã lặp lỗi",
    tip_recurring_mid: "",
    tip_recurring_suffix: "lần. Chậm lại ở chỗ này — đang thành thói quen.",
    tip_none: "Không có gợi ý nào lần này.",
    tip_clarity: "Rõ ràng",
    tip_structure: "Cấu trúc",
    tip_style: "Phong cách",
    further_reading: "Đọc thêm",
    vocab_search_more: "Tra Google để học thêm",
    lang_toggle_to_vi: "Tiếng Việt",
    lang_toggle_to_en: "English",
  },
} as const;

export type I18nKey = keyof (typeof DICT)["en"];

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: I18nKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: "vi",
  setLang: () => {},
  toggle: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "vi") setLangState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "vi" ? "en" : "vi");
  }, [lang, setLang]);

  const t = useCallback((key: I18nKey) => DICT[lang][key] ?? key, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
