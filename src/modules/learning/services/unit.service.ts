/**
 * UnitService — units of a lesson together with their content blocks.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrap } from "@/modules/learning/services/learning-client";
import type { BlockContent, BlockType, LessonBlock, LessonUnit } from "@/modules/learning/types";
import {
  lessonBlockInputSchema,
  lessonUnitInputSchema,
  type LessonBlockInput,
  type LessonUnitInput,
} from "@/modules/learning/validation/schemas";

interface BlockRow {
  id: string;
  tenant_id: string;
  unit_id: string;
  type: BlockType;
  content: unknown;
  position: number;
}

interface UnitRow {
  id: string;
  tenant_id: string;
  lesson_id: string;
  title: string;
  position: number;
  lesson_blocks?: BlockRow[] | null;
}

const toBlock = (row: BlockRow): LessonBlock => ({
  id: row.id,
  tenantId: row.tenant_id,
  unitId: row.unit_id,
  type: row.type,
  content: (row.content ?? {}) as BlockContent,
  position: row.position,
});

const toUnit = (row: UnitRow): LessonUnit => ({
  id: row.id,
  tenantId: row.tenant_id,
  lessonId: row.lesson_id,
  title: row.title,
  position: row.position,
  blocks: (row.lesson_blocks ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toBlock),
});

const COLUMNS =
  "id, tenant_id, lesson_id, title, position, lesson_blocks(id, tenant_id, unit_id, type, content, position)";

export async function listUnits(
  tenantId: string,
  lessonId: string,
): Promise<readonly LessonUnit[]> {
  assertTenant(tenantId, "learning.unit.list");
  const result = await supabase
    .from("lesson_units")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("lesson_id", lessonId)
    .order("position", { ascending: true });
  return unwrap(result, "learning.unit.list").map((row) => toUnit(row as unknown as UnitRow));
}

export async function createUnit(tenantId: string, input: LessonUnitInput): Promise<LessonUnit> {
  assertTenant(tenantId, "learning.unit.create");
  const values = lessonUnitInputSchema.parse(input);
  const result = await supabase
    .from("lesson_units")
    .insert({
      tenant_id: tenantId,
      lesson_id: values.lessonId,
      title: values.title,
      position: values.position,
    })
    .select(COLUMNS)
    .single();
  return toUnit(unwrap(result, "learning.unit.create") as unknown as UnitRow);
}

export async function deleteUnit(tenantId: string, unitId: string): Promise<void> {
  assertTenant(tenantId, "learning.unit.delete");
  const { error } = await supabase
    .from("lesson_units")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", unitId);
  if (error) unwrap({ data: null, error }, "learning.unit.delete");
}

export async function createBlock(tenantId: string, input: LessonBlockInput): Promise<LessonBlock> {
  assertTenant(tenantId, "learning.block.create");
  const values = lessonBlockInputSchema.parse(input);
  const result = await supabase
    .from("lesson_blocks")
    .insert({
      tenant_id: tenantId,
      unit_id: values.unitId,
      type: values.type,
      content: values.content as never,
      position: values.position,
    })
    .select("id, tenant_id, unit_id, type, content, position")
    .single();
  return toBlock(unwrap(result, "learning.block.create") as unknown as BlockRow);
}

export async function deleteBlock(tenantId: string, blockId: string): Promise<void> {
  assertTenant(tenantId, "learning.block.delete");
  const { error } = await supabase
    .from("lesson_blocks")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", blockId);
  if (error) unwrap({ data: null, error }, "learning.block.delete");
}
