import { supabase } from "../../lib/supabase";

export async function fetchRoleCapabilities(roleId: string) {
  const { data, error } = await supabase.from("role_capabilities").select("capability_id").eq("role_id", roleId);
  if (error) throw error;
  return (data ?? []).map((row) => row.capability_id);
}

export async function saveRoleCapabilities(roleId: string, capabilityIds: string[]) {
  const { error: deleteError } = await supabase.from("role_capabilities").delete().eq("role_id", roleId);
  if (deleteError) throw deleteError;
  if (!capabilityIds.length) return;
  const { error } = await supabase.from("role_capabilities").insert(capabilityIds.map((capability_id) => ({ role_id: roleId, capability_id })));
  if (error) throw error;
}

export async function fetchParticipantRoles(participantId: string) {
  const { data, error } = await supabase.from("participant_roles").select("role_id").eq("participant_id", participantId);
  if (error) throw error;
  return (data ?? []).map((row) => row.role_id);
}

export async function saveParticipantRoles(participantId: string, roleIds: string[]) {
  const { error: deleteError } = await supabase.from("participant_roles").delete().eq("participant_id", participantId);
  if (deleteError) throw deleteError;
  if (!roleIds.length) return;
  const { error } = await supabase.from("participant_roles").insert(roleIds.map((role_id) => ({ participant_id: participantId, role_id })));
  if (error) throw error;
}
