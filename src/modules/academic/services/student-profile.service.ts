/**
 * Student Profile service — tenant-scoped student records.
 */

import { supabase } from "@/integrations/supabase/client";
import { toAcademicError, unwrap } from "@/modules/academic/services/academic-client";
import type { StudentProfile } from "@/modules/academic/types";
import {
  studentProfileInputSchema,
  type StudentProfileInput,
} from "@/modules/academic/validation/schemas";

const COLUMNS =
  "id, tenant_id, user_id, student_number, full_name, avatar_url, birth_date, phone, email, notes";

interface Row {
  id: string;
  tenant_id: string;
  user_id: string | null;
  student_number: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

const toProfile = (row: Row): StudentProfile => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  studentNumber: row.student_number,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  birthDate: row.birth_date,
  phone: row.phone,
  email: row.email,
  notes: row.notes,
});

export async function listStudentProfiles(
  tenantId: string,
  search = "",
): Promise<readonly StudentProfile[]> {
  let query = supabase.from("student_profiles").select(COLUMNS).eq("tenant_id", tenantId);
  const term = search.trim();
  if (term.length > 0) {
    const safe = term.replace(/[%,()]/g, "");
    query = query.or(`full_name.ilike.%${safe}%,student_number.ilike.%${safe}%`);
  }

  const result = await query.order("full_name", { ascending: true });
  return unwrap(result, "academic.studentProfile.list").map((row) => toProfile(row as Row));
}

export async function getStudentProfile(profileId: string): Promise<StudentProfile> {
  const result = await supabase.from("student_profiles").select(COLUMNS).eq("id", profileId).single();
  return toProfile(unwrap(result, "academic.studentProfile.get") as Row);
}

export async function createStudentProfile(
  tenantId: string,
  input: StudentProfileInput,
): Promise<StudentProfile> {
  const values = studentProfileInputSchema.parse(input);
  const result = await supabase
    .from("student_profiles")
    .insert({
      tenant_id: tenantId,
      student_number: values.studentNumber,
      full_name: values.fullName,
      birth_date: values.birthDate,
      phone: values.phone,
      email: values.email,
      notes: values.notes,
    })
    .select(COLUMNS)
    .single();

  return toProfile(unwrap(result, "academic.studentProfile.create") as Row);
}

export async function updateStudentProfile(
  profileId: string,
  input: StudentProfileInput,
): Promise<StudentProfile> {
  const values = studentProfileInputSchema.parse(input);
  const result = await supabase
    .from("student_profiles")
    .update({
      student_number: values.studentNumber,
      full_name: values.fullName,
      birth_date: values.birthDate,
      phone: values.phone,
      email: values.email,
      notes: values.notes,
    })
    .eq("id", profileId)
    .select(COLUMNS)
    .single();

  return toProfile(unwrap(result, "academic.studentProfile.update") as Row);
}

export async function deleteStudentProfile(profileId: string): Promise<void> {
  const { error } = await supabase.from("student_profiles").delete().eq("id", profileId);
  if (error) throw toAcademicError(error, "academic.studentProfile.delete");
}

/** Suggests the next student number for a tenant, e.g. `2026-0007`. */
export async function suggestStudentNumber(tenantId: string): Promise<string> {
  const prefix = String(new Date().getFullYear());
  const result = await supabase
    .from("student_profiles")
    .select("student_number")
    .eq("tenant_id", tenantId)
    .like("student_number", `${prefix}-%`)
    .order("student_number", { ascending: false })
    .limit(1);

  const rows = unwrap(result, "academic.studentProfile.suggestNumber") as {
    student_number: string;
  }[];
  const last = rows[0]?.student_number.split("-")[1];
  const next = Number.parseInt(last ?? "0", 10) + 1;
  return `${prefix}-${String(Number.isFinite(next) ? next : 1).padStart(4, "0")}`;
}
