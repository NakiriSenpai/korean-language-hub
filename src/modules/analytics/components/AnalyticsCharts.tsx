import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppCard } from "@/shared/components/layout";
import type { GradeBucket, ScoreBucket, TrendPoint } from "@/modules/analytics/types";

const AXIS = { fontSize: 12, fill: "var(--text-secondary)" } as const;

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  fontSize: "0.8125rem",
} as const;

function ChartFrame({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <AppCard>
      <h3 className="text-title text-text-primary">{title}</h3>
      <div className="mt-md h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </AppCard>
  );
}

export function ScoreDistributionChart({ data }: { data: readonly ScoreBucket[] }) {
  return (
    <ChartFrame title="Distribusi nilai">
      <BarChart data={[...data]}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" name="Peserta" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
      </BarChart>
    </ChartFrame>
  );
}

const GRADE_COLORS = [
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function GradeDistributionChart({ data }: { data: readonly GradeBucket[] }) {
  return (
    <ChartFrame title="Sebaran grade">
      <BarChart data={[...data]}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="grade" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" name="Peserta" radius={[6, 6, 0, 0]}>
          {data.map((bucket, index) => (
            <Cell key={bucket.grade} fill={GRADE_COLORS[index % GRADE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export function TrendChart({
  data,
  title = "Tren rata-rata nilai",
}: {
  readonly data: readonly TrendPoint[];
  readonly title?: string;
}) {
  return (
    <ChartFrame title={title}>
      <LineChart data={[...data]}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey="value"
          name="Rata-rata"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartFrame>
  );
}
