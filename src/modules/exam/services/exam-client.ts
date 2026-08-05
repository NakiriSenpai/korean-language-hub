/**
 * Exam Domain — shared service plumbing.
 * Re-uses the Assessment Domain plumbing so error mapping stays identical.
 */

export {
  assertTenant,
  assertUser,
  toAssessmentError as toExamError,
  unwrap,
  unwrapList,
} from "@/modules/assessment/services/assessment-client";

export interface ExamScope {
  readonly tenantId: string;
  readonly userId: string;
}
