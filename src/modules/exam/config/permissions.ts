/**
 * Exam Domain — permission catalogue.
 * Permission strings only; role checks are forbidden in this domain.
 */

import type { Permission } from "@/modules/identity";

export const EXAM_PERMISSIONS = {
  examStart: "exam.start",
  examSubmit: "exam.submit",
  examReview: "exam.review",
  resultRead: "result.read",
} as const satisfies Record<string, Permission>;

export type ExamPermissionKey = keyof typeof EXAM_PERMISSIONS;
