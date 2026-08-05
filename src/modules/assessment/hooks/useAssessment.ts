/**
 * Assessment Domain — React Query bindings.
 * Tenant scoped through Identity; every mutation invalidates the domain root key.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth, useTenant } from "@/modules/identity";
import { AssessmentService } from "@/modules/assessment/services/assessment.service";
import { QuestionService } from "@/modules/assessment/services/question.service";
import { SnapshotService } from "@/modules/assessment/services/snapshot.service";
import type { AssessmentType, ContentStatus, QuestionFilters } from "@/modules/assessment/types";
import type {
  AssessmentInput,
  AssessmentQuestionInput,
  QuestionInput,
} from "@/modules/assessment/validation/schemas";

export const assessmentKeys = {
  all: (tenantId: string) => ["assessment", tenantId] as const,
  questions: (tenantId: string, filters: QuestionFilters) =>
    ["assessment", tenantId, "questions", filters] as const,
  question: (tenantId: string, questionId: string) =>
    ["assessment", tenantId, "question", questionId] as const,
  questionVersions: (tenantId: string, questionId: string) =>
    ["assessment", tenantId, "question", questionId, "versions"] as const,
  questionCategories: (tenantId: string) =>
    ["assessment", tenantId, "question-categories"] as const,
  assessments: (
    tenantId: string,
    filters: { type?: AssessmentType | ""; status?: ContentStatus | "" },
  ) => ["assessment", tenantId, "assessments", filters] as const,
  assessment: (tenantId: string, assessmentId: string) =>
    ["assessment", tenantId, "assessment", assessmentId] as const,
  assessmentQuestions: (tenantId: string, assessmentId: string) =>
    ["assessment", tenantId, "assessment", assessmentId, "questions"] as const,
  snapshots: (tenantId: string, assessmentId: string) =>
    ["assessment", tenantId, "assessment", assessmentId, "snapshots"] as const,
};

export function useAssessmentScope(): { tenantId: string; userId: string; ready: boolean } {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const tenantId = tenant?.id ?? "";
  const userId = user?.id ?? "";
  return { tenantId, userId, ready: Boolean(tenantId && userId) };
}

function useInvalidateAssessment(tenantId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: assessmentKeys.all(tenantId) });
}

/* ------------------------------------------------------------------ */
/* Question Bank                                                       */
/* ------------------------------------------------------------------ */

export function useQuestions(filters: QuestionFilters = {}) {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.questions(tenantId, filters),
    queryFn: () => QuestionService.list(tenantId, filters),
    enabled: Boolean(tenantId),
  });
}

export function useQuestion(questionId: string) {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.question(tenantId, questionId),
    queryFn: () => QuestionService.get(tenantId, questionId),
    enabled: Boolean(tenantId && questionId),
  });
}

export function useQuestionVersions(questionId: string) {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.questionVersions(tenantId, questionId),
    queryFn: () => QuestionService.versions(tenantId, questionId),
    enabled: Boolean(tenantId && questionId),
  });
}

export function useQuestionCategories() {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.questionCategories(tenantId),
    queryFn: () => QuestionService.categories(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useCreateQuestion() {
  const { tenantId, userId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (input: QuestionInput) => QuestionService.create({ tenantId, userId }, input),
    onSuccess: invalidate,
  });
}

/** Saving an edit creates a new version instead of overwriting. */
export function useUpdateQuestion() {
  const { tenantId, userId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (args: { questionId: string; input: QuestionInput }) =>
      QuestionService.update({ tenantId, userId }, args.questionId, args.input),
    onSuccess: invalidate,
  });
}

export function useUpdateQuestionStatus() {
  const { tenantId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (args: { questionId: string; status: ContentStatus }) =>
      QuestionService.setStatus(tenantId, args.questionId, args.status),
    onSuccess: invalidate,
  });
}

export function useDeleteQuestion() {
  const { tenantId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (questionId: string) => QuestionService.remove(tenantId, questionId),
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Assessments                                                         */
/* ------------------------------------------------------------------ */

export function useAssessments(
  filters: { type?: AssessmentType | ""; status?: ContentStatus | "" } = {},
) {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.assessments(tenantId, filters),
    queryFn: () => AssessmentService.list(tenantId, filters),
    enabled: Boolean(tenantId),
  });
}

export function useAssessment(assessmentId: string) {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.assessment(tenantId, assessmentId),
    queryFn: () => AssessmentService.get(tenantId, assessmentId),
    enabled: Boolean(tenantId && assessmentId),
  });
}

export function useAssessmentQuestions(assessmentId: string) {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.assessmentQuestions(tenantId, assessmentId),
    queryFn: () => AssessmentService.questions(tenantId, assessmentId),
    enabled: Boolean(tenantId && assessmentId),
  });
}

export function useCreateAssessment() {
  const { tenantId, userId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (input: AssessmentInput) => AssessmentService.create({ tenantId, userId }, input),
    onSuccess: invalidate,
  });
}

export function useUpdateAssessment() {
  const { tenantId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (args: { assessmentId: string; input: AssessmentInput }) =>
      AssessmentService.update(tenantId, args.assessmentId, args.input),
    onSuccess: invalidate,
  });
}

export function useDeleteAssessment() {
  const { tenantId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (assessmentId: string) => AssessmentService.remove(tenantId, assessmentId),
    onSuccess: invalidate,
  });
}

export function useAddAssessmentQuestion(assessmentId: string) {
  const { tenantId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (input: AssessmentQuestionInput) =>
      AssessmentService.addQuestion(tenantId, assessmentId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateAssessmentQuestion() {
  const { tenantId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (args: {
      id: string;
      patch: { position?: number; points?: number; questionVersionId?: string };
    }) => AssessmentService.updateQuestion(tenantId, args.id, args.patch),
    onSuccess: invalidate,
  });
}

export function useRemoveAssessmentQuestion() {
  const { tenantId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (id: string) => AssessmentService.removeQuestion(tenantId, id),
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Snapshots                                                           */
/* ------------------------------------------------------------------ */

export function useAssessmentSnapshots(assessmentId: string) {
  const { tenantId } = useAssessmentScope();
  return useQuery({
    queryKey: assessmentKeys.snapshots(tenantId, assessmentId),
    queryFn: () => SnapshotService.list(tenantId, assessmentId),
    enabled: Boolean(tenantId && assessmentId),
  });
}

export function usePublishAssessment() {
  const { tenantId, userId } = useAssessmentScope();
  const invalidate = useInvalidateAssessment(tenantId);
  return useMutation({
    mutationFn: (assessmentId: string) =>
      SnapshotService.publish({ tenantId, userId }, assessmentId),
    onSuccess: invalidate,
  });
}
