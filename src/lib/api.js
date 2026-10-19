import { supabase } from './supabase';

const PROFILE_FIELDS = ['name', 'role', 'year', 'tagline', 'idea', 'skills', 'needs', 'slots', 'pitch'];

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Idempotent write. Also repairs accounts created before the DB trigger existed. */
export async function upsertProfile(userId, patch) {
  const row = { id: userId, ...pick(patch, PROFILE_FIELDS) };
  const { data, error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

export async function fetchCommunityProfiles(excludeUserId) {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('discoverable', true)
    .order('updated_at', { ascending: false })
    .limit(40);
  if (excludeUserId) query = query.neq('id', excludeUserId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).filter((p) => (p.skills?.length ?? 0) > 0);
}

export async function fetchShortlist(userId) {
  const { data, error } = await supabase
    .from('squad_picks')
    .select('*')
    .eq('owner', userId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addPick(userId, match, position) {
  const { data, error } = await supabase
    .from('squad_picks')
    .upsert(
      {
        owner: userId,
        candidate_id: match.id,
        candidate: serializeCandidate(match),
        score: match.score,
        reasons: match.reasons,
        note: '',
        position,
      },
      { onConflict: 'owner,candidate_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePick(id, patch) {
  const { data, error } = await supabase.from('squad_picks').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function removePick(id) {
  const { error } = await supabase.from('squad_picks').delete().eq('id', id);
  if (error) throw error;
}

export async function setPickPositions(entries) {
  const { error } = await supabase
    .from('squad_picks')
    .upsert(entries.map((e) => ({ id: e.id, position: e.position })), { onConflict: 'id' });
  if (error) throw error;
}

function serializeCandidate(match) {
  return pick(match, ['name', 'role', 'year', 'tagline', 'idea', 'skills', 'needs', 'slots', 'pitch', 'lane']);
}

function pick(obj, keys) {
  return keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});
}

export function candidateFromPick(pick) {
  return { id: pick.candidate_id, ...pick.candidate, score: pick.score, reasons: pick.reasons ?? [] };
}
