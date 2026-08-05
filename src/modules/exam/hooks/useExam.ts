/**
 * Exam Domain — React Query bindings.
 * Tenant scoped through Identity; snapshot data is cached aggressively because
 * snapshots are immutable by contract.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth, useTenant } from "@/modules/identity";
import { AssessmentLoader } from "@/modules/exam/services/loader.service";
import { AttemptService } from "@/modules/exam/services/attempt.service";
import { ResultService } from "@/modules/exam/services/result.service";
import type { AttemptAnswerInput, ExamPackage } from "@/modules/exam/types";

export const examKeys = {
  all: (tenantId: string) => ["exam", tenantId] as const,
  exams: (tenantId: string) => ["exam", tenantId, "exams"] as const,
  snapshot: (tenantId: string, snapshotId: string) =>
    ["exam", tenantId, "snapshot", snapshotId] as const,
  latest: (tenantId: string, assessmentId: string) =>
    ["exam", tenantId, "latest", assessmentId] as const,
  attempt: (tenantId: string, attemptId: string) =>
    ["exam", tenantId, "attempt", attemptId] as const,
  attempts: (tenantId: string, assessmentId?: string) =>
    ["exam", tenantId, "attempts", assessmentId ?? "all"] as const,
  answers: (tenantId: string, attemptId: string) =>
    ["exam", tenantId, "attempt", attemptId, "answers"] as const,
  result: (tenantId: string, attemptId: string) =>
    ["exam", tenantId, "attempt", attemptId, "result"] as const,
  results: (tenantId: string) => ["exam", tenantId, "results"] as const,
};

export function useExamScope(): { tenantId: string; userId: string; ready: boolean } {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const tenantId = tenant?.id ?? "";
  const userId = user?.id ?? "";
  return { tenantId, userId, ready: Boolean(tenantId && userId) };
}

/* ------------------------------------------------------------------ */
/* Engine 1 — Loader                                                   */
/* ------------------------------------------------------------------ */

export function useExamList() {
  const { tenantId } = useExamScope();
  return useQuery({
    queryKey: examKeys.exams(tenantId),
    queryFn: () => AssessmentLoader.listExams(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useLatestExamPackage(assessmentId: string) {
  const { tenantId } = useExamScope();
  return useQuery({
    queryKey: examKeys.latest(tenantId, assessmentId),
    queryFn: () => AssessmentLoader.loadLatest(tenantId, assessmentId),
    enabled: Boolean(tenantId && assessmentId),
    staleTime: 5 * 60_000,
  });
}

/** Snapshot for an attempt, re-ordered to the order frozen at start time. */
export function useAttemptPackage(
  snapshotId: string,
  questionOrder: readonly string[] | undefined,
) {
  const { tenantId } = useExamScope();
  const orderKey = (questionOrder ?? []).join(",");
  return useQuery<ExamPackage>({
    queryKey: [...examKeys.snapshot(tenantId, snapshotId), orderKey],
    queryFn: async () => {
      const base = await AssessmentLoader.loadById(tenantId, snapshotId);
      return AssessmentLoader.applyOrder(base, questionOrder ?? []);
    },
    enabled: Boolean(tenantId && snapshotId),
    staleTime: 30 * 60_000,
  });
}

/* ------------------------------------------------------------------ */
/* Engine 2 — Attempts                                                 */
/* ------------------------------------------------------------------ */

export function useAttempt(attemptId: string) {
  const { tenantId } = useExamScope();
  return useQuery({
    queryKey: examKeys.attempt(tenantId, attemptId),
    queryFn: () => AttemptService.get(tenantId, attemptId),
    enabled: Boolean(tenantId && attemptId),
  });
}

export function useMyAttempts(assessmentId?: string) {
  const { tenantId, userId, ready } = useExamScope();
  return useQuery({
    queryKey: examKeys.attempts(tenantId, assessmentId),
    queryFn: () => AttemptService.listMine({ tenantId, userId }, assessmentId),
    enabled: ready,
  });
}

export function useAttemptAnswers(attemptId: string) {
  const { tenantId } = useExamScope();
  return useQuery({
    queryKey: examKeys.answers(tenantId, attemptId),
    queryFn: () => AttemptService.answers(tenantId, attemptId),
    enabled: Boolean(tenantId && attemptId),
  });
}

export function useStartAttempt() {
  const { tenantId, userId } = useExamScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) =>
      AttemptService.startOrResume({ tenantId, userId }, assessmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examKeys.all(tenantId) }),
  });
}

export function useSaveAnswer() {
  const { tenantId, userId } = useExamScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { attemptId: string; answer: AttemptAnswerInput }) =>
      AttemptService.saveAnswer({ tenantId, userId }, variables.attemptId, variables.answer),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: examKeys.answers(tenantId, variables.attemptId),
      }),
  });
}

export function useTouchAttempt() {
  const { tenantId, userId } = useExamScope();
  return useMutation({
    mutationFn: (attemptId: string) => AttemptService.touch({ tenantId, userId }, attemptId),
  });
}

export function useFinishAttempt() {
  const { tenantId, userId } = useExamScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      await AttemptService.finish({ tenantId, userId }, attemptId);
      return ResultService.finalize({ tenantId, userId }, attemptId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examKeys.all(tenantId) }),
  });
}

export function useAbandonAttempt() {
  const { tenantId, userId } = useExamScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => AttemptService.abandon({ tenantId, userId }, attemptId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examKeys.all(tenantId) }),
  });
}

export function useExpireAttempt() {
  const { tenantId, userId } = useExamScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      await AttemptService.expire({ tenantId, userId }, attemptId);
      return ResultService.finalize({ tenantId, userId }, attemptId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examKeys.all(tenantId) }),
  });
}

/* ------------------------------------------------------------------ */
/* Engine 6 — Result                                                   */
/* ------------------------------------------------------------------ */

export function useExamResult(attemptId: string) {
  const { tenantId } = useExamScope();
  return useQuery({
    queryKey: examKeys.result(tenantId, attemptId),
    queryFn: () => ResultService.findByAttempt(tenantId, attemptId),
    enabled: Boolean(tenantId && attemptId),
  });
}

export function useMyResults() {
  const { tenantId, userId, ready } = useExamScope();
  return useQuery({
    queryKey: examKeys.results(tenantId),
    queryFn: () => ResultService.listMine({ tenantId, userId }),
    enabled: ready,
  });
}
