import { supabase } from "./supabase";

export type LookupOption = { value: string; label: string };

export async function fetchLookupOptions(table: "roles" | "capabilities" | "participants"): Promise<LookupOption[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select("id, name").order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({ value: row.id, label: row.name }));
}

export async function fetchParticipantTypes(): Promise<LookupOption[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("participant_types").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({ value: row.id, label: row.name }));
}

export async function ensureParticipantType(name: string): Promise<LookupOption> {
  if (!supabase) throw new Error("Supabase is not configured");
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Participant type is required");
  const { data: existing, error: lookupError } = await supabase.from("participant_types").select("id, name").ilike("name", cleanName).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return { value: existing.id, label: existing.name };
  const { data, error } = await supabase.from("participant_types").insert({ name: cleanName }).select("id, name").single();
  if (error) throw error;
  return { value: data.id, label: data.name };
}

export async function fetchRoles() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("roles").select("id, name, status").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCapabilities() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("capabilities").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchParticipants() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("participants").select("id, name, description, status, archived_at, archived_by, archive_reason, participant_type_id").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function saveRole(id: string | null, name: string, status: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const payload = { name: name.trim(), status: status.toLowerCase() };
  const result = id ? await supabase.from("roles").update(payload).eq("id", id).select("id, name, status").single() : await supabase.from("roles").insert(payload).select("id, name, status").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function saveCapability(id: string | null, name: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const result = id ? await supabase.from("capabilities").update({ name: name.trim() }).eq("id", id).select("id, name").single() : await supabase.from("capabilities").insert({ name: name.trim() }).select("id, name").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function saveParticipant(id: string | null, name: string, status: string, participantTypeId: string, description?: string, archiveReason?: string | null) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!participantTypeId) throw new Error("Participant type is required");
  const payload = { name: name.trim(), status: status.toLowerCase(), participant_type_id: participantTypeId, description: description?.trim() || null, archive_reason: archiveReason?.trim() || null };
  const result = id ? await supabase.from("participants").update(payload).eq("id", id).select("id, name, description, status, archived_at, archived_by, archive_reason, participant_type_id").single() : await supabase.from("participants").insert(payload).select("id, name, description, status, archived_at, archived_by, archive_reason, participant_type_id").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function deleteRecord(table: "roles" | "capabilities" | "participants", id: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
