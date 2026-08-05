/**
 * Assessment Domain — permission catalogue.
 * Permission strings only; direct role checks are forbidden in this domain.
 */

import type { Permission } from "@/modules/identity";

export const ASSESSMENT_PERMISSIONS = {
  questionRead: "question.read",
  questionWrite: "question.write",
  assessmentRead: "assessment.read",
  assessmentWrite: "assessment.write",
} as const satisfies Record<string, Permission>;

export type AssessmentPermissionKey = keyof typeof ASSESSMENT_PERMISSIONS;
