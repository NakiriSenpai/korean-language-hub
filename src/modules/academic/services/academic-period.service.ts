/**
 * Academic Period service — the calendar backbone of every academic activity.
 */

import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { toAcademicError, unwrap } from "@/modules/academic/services/academic-client";
import type { AcademicPeriod, AcademicPeriodStatus } from "@/modules/academic/types";
import {
  academicPeriodInputSchema,
  type AcademicPeriodInput,
} from "@/modules/academic/validation/schemas";

const COLUMNS = "id, tenant_id, name, code, starts_on, ends_on, status";

interface Row {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  starts_on: string;
  ends_on: string;
  status: AcademicPeriodStatus;
}

const toPeriod = (row: Row): AcademicPeriod => ({
  id: row.id,
  tenantId: row.tenant_id,
  name: row.name,
  code: row.code,
  startsOn: row.starts_on,
  endsOn: row.ends_on,
  status: row.status,
});

export async function listAcademicPeriods(tenantId: string): Promise<readonly AcademicPeriod[]> {
  const result = await supabase
    .from("academic_periods")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .order("starts_on", { ascending: false });

  return unwrap(result, "academic.period.list").map((row) => toPeriod(row as Row));
}

export async function getActiveAcademicPeriod(tenantId: string): Promise<AcademicPeriod | null> {
  const { data, error } = await supabase
    .from("academic_periods")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw toAcademicError(error, "academic.period.active");
  return data ? toPeriod(data as Row) : null;
}

export async function createAcademicPeriod(
  tenantId: string,
  input: AcademicPeriodInput,
): Promise<AcademicPeriod> {
  const values = academicPeriodInputSchema.parse(input);
  const result = await supabase
    .from("academic_periods")
    .insert({
      tenant_id: tenantId,
      name: values.name,
      code: values.code,
      starts_on: values.startsOn,
      ends_on: values.endsOn,
      status: values.status,
    })
    .select(COLUMNS)
    .single();

  return toPeriod(unwrap(result, "academic.period.create") as Row);
}

export async function updateAcademicPeriodStatus(
  periodId: string,
  status: AcademicPeriodStatus,
): Promise<AcademicPeriod> {
  const result = await supabase
    .from("academic_periods")
    .update({ status })
    .eq("id", periodId)
    .select(COLUMNS)
    .single();

  return toPeriod(unwrap(result, "academic.period.updateStatus") as Row);
}

export async function deleteAcademicPeriod(periodId: string): Promise<void> {
  const { error } = await supabase.from("academic_periods").delete().eq("id", periodId);
  if (error) throw toAcademicError(error as PostgrestError, "academic.period.delete");
}
