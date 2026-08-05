/** Assessment Domain — public surface. */

export { ASSESSMENT_PERMISSIONS } from "@/modules/assessment/config/permissions";
export {
  ASSESSMENT_TYPES,
  QUESTION_SKILLS,
  QUESTION_TYPES,
  getAssessmentType,
  getQuestionSkill,
  getQuestionType,
} from "@/modules/assessment/config/registry";
export type {
  Assessment,
  AssessmentQuestion,
  AssessmentSnapshot,
  AssessmentSnapshotPayload,
  AssessmentType,
  Question,
  QuestionChoice,
  QuestionFilters as QuestionFilterValues,
  QuestionSkill,
  QuestionType,
  QuestionVersion,
  SnapshotChoice,
  SnapshotQuestion,
} from "@/modules/assessment/types";
export { randomizeQuestionSet, shuffle } from "@/modules/assessment/services/randomization";
export { AssessmentService } from "@/modules/assessment/services/assessment.service";
export { QuestionService } from "@/modules/assessment/services/question.service";
export { SnapshotService } from "@/modules/assessment/services/snapshot.service";
export * from "@/modules/assessment/hooks/useAssessment";
export { AssessmentForm } from "@/modules/assessment/components/AssessmentForm";
export { QuestionCard } from "@/modules/assessment/components/QuestionCard";
export { QuestionEditor } from "@/modules/assessment/components/QuestionEditor";
export { QuestionFilters } from "@/modules/assessment/components/QuestionFilters";
export { QuestionPicker } from "@/modules/assessment/components/QuestionPicker";
export { QuestionPreview } from "@/modules/assessment/components/QuestionPreview";
export {
  AssessmentTypeBadge,
  QuestionSkillBadge,
  QuestionTypeBadge,
  VersionBadge,
} from "@/modules/assessment/components/AssessmentBadges";
