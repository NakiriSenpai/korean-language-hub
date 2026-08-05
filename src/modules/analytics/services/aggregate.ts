/**
 * Engines 1–4 — pure aggregation. No I/O, no React, fully testable.
 */

import type {
  AnalyticsDataset,
  AnalyticsOverview,
  AssessmentAnalytics,
  ExamGradeLetter,
  GradeBucket,
  GroupPerformance,
  QuestionStat,
  ResultRecord,
  ScoreBucket,
  StudentAnalytics,
  StudentRiskEntry,
  TeacherInsights,
  TrendPoint,
} from "@/modules/analytics/types";

const GRADES: readonly ExamGradeLetter[] = ["A", "B", "C", "D", "E"];

const SCORE_BANDS: readonly {
  readonly label: string;
  readonly min: number;
  readonly max: number;
}[] = [
  { label: "0–39", min: 0, max: 39.999 },
  { label: "40–59", min: 40, max: 59.999 },
  { label: "60–74", min: 60, max: 74.999 },
  { label: "75–89", min: 75, max: 89.999 },
  { label: "90–100", min: 90, max: 100 },
];

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return round((part / total) * 100);
}

export function buildScoreDistribution(records: readonly ResultRecord[]): readonly ScoreBucket[] {
  return SCORE_BANDS.map((band) => ({
    label: band.label,
    count: records.filter((r) => r.percentage >= band.min && r.percentage <= band.max).length,
  }));
}

export function buildGradeDistribution(records: readonly ResultRecord[]): readonly GradeBucket[] {
  return GRADES.map((grade) => ({
    grade,
    count: records.filter((r) => r.grade === grade).length,
  }));
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

export function buildTrend(records: readonly ResultRecord[]): readonly TrendPoint[] {
  const buckets = new Map<string, number[]>();
  for (const record of records) {
    const key = monthLabel(record.createdAt);
    const list = buckets.get(key) ?? [];
    list.push(record.percentage);
    buckets.set(key, list);
  }
  return [...buckets.entries()].map(([label, values]) => ({ label, value: average(values) }));
}

/* ---------------------------- Engine 1: student --------------------------- */

export function buildStudentAnalytics(dataset: AnalyticsDataset): readonly StudentAnalytics[] {
  const byUser = new Map<string, ResultRecord[]>();
  for (const record of dataset.records) {
    const list = byUser.get(record.userId) ?? [];
    list.push(record);
    byUser.set(record.userId, list);
  }

  return [...byUser.entries()]
    .map(([userId, records]) => {
      const scores = records.map((r) => r.percentage);
      const answered = records.reduce((sum, r) => sum + r.totalQuestions, 0);
      const correct = records.reduce((sum, r) => sum + r.correctCount, 0);
      const first = records[0];
      const last = records[records.length - 1];
      return {
        userId,
        studentName: first?.studentName ?? "Peserta",
        studentNumber: first?.studentNumber ?? null,
        studyGroupName: first?.studyGroupName ?? null,
        periodName: first?.periodName ?? null,
        examCount: records.length,
        averageScore: average(scores),
        bestScore: round(Math.max(...scores)),
        lowestScore: round(Math.min(...scores)),
        passRate: rate(records.filter((r) => r.passed).length, records.length),
        correctRate: rate(correct, answered),
        totalTimeSeconds: records.reduce((sum, r) => sum + r.timeUsedSeconds, 0),
        lastExamAt: last?.createdAt ?? null,
        trend: buildTrend(records),
      } satisfies StudentAnalytics;
    })
    .sort((a, b) => b.averageScore - a.averageScore);
}

/* -------------------------- Engine 2: assessment -------------------------- */

function buildQuestionStats(records: readonly ResultRecord[]): readonly QuestionStat[] {
  const stats = new Map<string, { correct: number; empty: number; total: number }>();
  for (const record of records) {
    for (const outcome of record.outcomes) {
      const current = stats.get(outcome.questionId) ?? { correct: 0, empty: 0, total: 0 };
      current.total += 1;
      if (outcome.outcome === "correct") current.correct += 1;
      if (outcome.outcome === "empty") current.empty += 1;
      stats.set(outcome.questionId, current);
    }
  }

  return [...stats.entries()]
    .map(([questionId, value]) => {
      const correctRate = rate(value.correct, value.total);
      return {
        questionId,
        attempts: value.total,
        correctRate,
        emptyRate: rate(value.empty, value.total),
        difficultyBand: correctRate >= 80 ? "mudah" : correctRate >= 50 ? "sedang" : "sulit",
      } satisfies QuestionStat;
    })
    .sort((a, b) => a.correctRate - b.correctRate);
}

export function buildAssessmentAnalytics(
  dataset: AnalyticsDataset,
): readonly AssessmentAnalytics[] {
  const byAssessment = new Map<string, ResultRecord[]>();
  for (const record of dataset.records) {
    const list = byAssessment.get(record.assessmentId) ?? [];
    list.push(record);
    byAssessment.set(record.assessmentId, list);
  }

  return [...byAssessment.entries()]
    .map(([assessmentId, records]) => {
      const scores = records.map((r) => r.percentage);
      const first = records[0];
      return {
        assessmentId,
        title: first?.assessmentTitle ?? "Asesmen",
        type: first?.assessmentType ?? "exam",
        participantCount: new Set(records.map((r) => r.userId)).size,
        attemptCount: records.length,
        averageScore: average(scores),
        highestScore: round(Math.max(...scores)),
        lowestScore: round(Math.min(...scores)),
        passRate: rate(records.filter((r) => r.passed).length, records.length),
        averageTimeSeconds: Math.round(
          records.reduce((sum, r) => sum + r.timeUsedSeconds, 0) / records.length,
        ),
        scoreDistribution: buildScoreDistribution(records),
        gradeDistribution: buildGradeDistribution(records),
        questionStats: buildQuestionStats(records),
      } satisfies AssessmentAnalytics;
    })
    .sort((a, b) => b.attemptCount - a.attemptCount);
}

/* --------------------------- Engine 3: teacher ---------------------------- */

export function buildGroupPerformance(dataset: AnalyticsDataset): readonly GroupPerformance[] {
  const groups = new Map<
    string,
    { name: string; periodName: string | null; students: Set<string> }
  >();
  for (const student of dataset.students) {
    if (!student.studyGroupId) continue;
    const entry = groups.get(student.studyGroupId) ?? {
      name: student.studyGroupName ?? "Kelas",
      periodName: student.periodName,
      students: new Set<string>(),
    };
    entry.students.add(student.userId);
    groups.set(student.studyGroupId, entry);
  }

  return [...groups.entries()]
    .map(([studyGroupId, group]) => {
      const records = dataset.records.filter((r) => r.studyGroupId === studyGroupId);
      const active = new Set(records.map((r) => r.userId));
      return {
        studyGroupId,
        studyGroupName: group.name,
        periodName: group.periodName,
        studentCount: group.students.size,
        activeStudentCount: active.size,
        examCount: records.length,
        averageScore: average(records.map((r) => r.percentage)),
        passRate: rate(records.filter((r) => r.passed).length, records.length),
        participationRate: rate(active.size, group.students.size),
      } satisfies GroupPerformance;
    })
    .sort((a, b) => b.averageScore - a.averageScore);
}

export function buildTeacherInsights(dataset: AnalyticsDataset): TeacherInsights {
  const students = buildStudentAnalytics(dataset);
  const activeIds = new Set(students.map((s) => s.userId));

  const atRisk: StudentRiskEntry[] = students
    .filter((student) => student.averageScore < 60 || student.passRate < 50)
    .map((student) => ({
      userId: student.userId,
      studentName: student.studentName,
      studyGroupName: student.studyGroupName,
      averageScore: student.averageScore,
      examCount: student.examCount,
      reason:
        student.averageScore < 60
          ? "Rata-rata nilai di bawah 60"
          : "Tingkat kelulusan di bawah 50%",
    }));

  for (const student of dataset.students) {
    if (activeIds.has(student.userId)) continue;
    atRisk.push({
      userId: student.userId,
      studentName: student.fullName,
      studyGroupName: student.studyGroupName,
      averageScore: 0,
      examCount: 0,
      reason: "Belum pernah mengikuti ujian",
    });
  }

  return {
    groups: buildGroupPerformance(dataset),
    topStudents: students.slice(0, 10),
    atRiskStudents: atRisk.sort((a, b) => a.averageScore - b.averageScore).slice(0, 20),
  };
}

/* --------------------------- Overview (shared) ---------------------------- */

export function buildOverview(dataset: AnalyticsDataset): AnalyticsOverview {
  const records = dataset.records;
  return {
    studentCount: dataset.students.length || new Set(records.map((r) => r.userId)).size,
    examCount: records.length,
    averageScore: average(records.map((r) => r.percentage)),
    passRate: rate(records.filter((r) => r.passed).length, records.length),
    completionRate: rate(dataset.submittedAttemptCount, dataset.attemptCount),
    averageTimeSeconds:
      records.length === 0
        ? 0
        : Math.round(records.reduce((sum, r) => sum + r.timeUsedSeconds, 0) / records.length),
    scoreDistribution: buildScoreDistribution(records),
    gradeDistribution: buildGradeDistribution(records),
    trend: buildTrend(records),
  };
}

export function lessonCompletionRate(dataset: AnalyticsDataset): number {
  return rate(dataset.lessonsCompleted, dataset.lessonsTracked);
}
