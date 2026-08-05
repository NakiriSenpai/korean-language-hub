/** Exam Domain — public surface (Sprint 6 Exam Engine). */

export { EXAM_PERMISSIONS } from "@/modules/exam/config/permissions";
export type { ExamPermissionKey } from "@/modules/exam/config/permissions";

export type {
  AttemptAnswer,
  AttemptAnswerInput,
  AttemptStatus,
  ExamAttempt,
  ExamGrade,
  ExamListItem,
  ExamPackage,
  ExamResult,
  ExamScore,
  QuestionOutcome,
  ScoredQuestion,
} from "@/modules/exam/types";

export { AssessmentLoader } from "@/modules/exam/services/loader.service";
export { AttemptService, isExpired } from "@/modules/exam/services/attempt.service";
export { ResultService } from "@/modules/exam/services/result.service";
export {
  evaluateQuestion,
  isAnswered,
  scoreAttempt,
  toGrade,
} from "@/modules/exam/services/scoring.service";

export * from "@/modules/exam/hooks/useExam";
export {
  useAutoSave,
  useExamTimer,
  useExitGuard,
  useFullscreen,
} from "@/modules/exam/hooks/useExamRuntime";
export { useAudioEngine } from "@/modules/exam/hooks/useAudioEngine";

export { ExamAudioPlayer } from "@/modules/exam/components/ExamAudioPlayer";
export { ExamQuestionView } from "@/modules/exam/components/ExamQuestionView";
export { ExamResultView } from "@/modules/exam/components/ExamResultView";
export { ExamReview } from "@/modules/exam/components/ExamReview";
export { ExamRuntime } from "@/modules/exam/components/ExamRuntime";
export { QuestionPalette } from "@/modules/exam/components/QuestionPalette";
