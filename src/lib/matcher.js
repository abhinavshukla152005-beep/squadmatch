import { laneOf } from './skills.js';
import { DAYS } from './availability.js';

const WEIGHTS = { gaps: 40, unique: 16, time: 30, mutual: 9, idea: 5 };

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'for', 'to', 'of', 'in', 'on', 'with', 'that', 'this', 'is', 'are',
  'app', 'idea', 'my', 'our', 'we', 'i', 'it', 'at', 'from', 'using', 'use', 'an ', 'project',
  'hackathon', 'help', 'need', 'want', 'build', 'make', 'something', 'which', 'who',
]);

function norm(list = []) {
  return [...new Set(list.map((s) => String(s).trim()).filter(Boolean))];
}

function key(list = []) {
  return norm(list).map((s) => s.toLowerCase());
}

function intersect(a = [], b = []) {
  const setB = new Set(key(b));
  return norm(a).filter((s) => setB.has(s.toLowerCase()));
}

function difference(a = [], b = []) {
  const setB = new Set(key(b));
  return norm(a).filter((s) => !setB.has(s.toLowerCase()));
}

function ratio(hits, total) {
  if (!total) return 0;
  return Math.min(1, hits / total);
}

export function tokenize(text = '') {
  return [...new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9+\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  )];
}

/**
 * Rank one candidate against what the student is asking for.
 * Rules are deliberately simple: skill-gap coverage, non-overlapping skills,
 * shared calendar blocks, mutual need fit and light keyword affinity on the idea.
 */
export function scoreCandidate(candidate, demand) {
  const mySkills = norm(demand.skills);
  const needs = norm(demand.needs);
  const mySlots = norm(demand.slots);

  const gapsCovered = intersect(needs, candidate.skills);
  const uniqueSkills = difference(candidate.skills, mySkills);
  const sharedSlots = intersect(mySlots, candidate.slots);
  const mutualSkills = intersect(candidate.needs, mySkills);

  const gapScore = needs.length
    ? ratio(gapsCovered.length, needs.length)
    : ratio(uniqueSkills.length, 3);
  const uniqueScore = ratio(uniqueSkills.length, 3);
  const timeScore = ratio(sharedSlots.length, Math.max(3, Math.ceil(mySlots.length / 2)));
  const mutualScore = mutualSkills.length ? ratio(mutualSkills.length, Math.max(2, candidate.needs.length)) : 0;

  const myTokens = tokenize(`${demand.idea} ${needs.join(' ')}`);
  const theirTokens = new Set(tokenize(`${candidate.idea} ${candidate.role} ${candidate.skills.join(' ')} ${candidate.tagline}`));
  const ideaHits = myTokens.filter((t) => theirTokens.has(t)).length;
  const ideaScore = ratio(ideaHits, Math.max(4, myTokens.length));

  const raw =
    WEIGHTS.gaps * gapScore +
    WEIGHTS.unique * uniqueScore +
    WEIGHTS.time * timeScore +
    WEIGHTS.mutual * mutualScore +
    WEIGHTS.idea * ideaScore;
  const total = Math.round((raw / Object.values(WEIGHTS).reduce((a, b) => a + b, 0)) * 100);

  return {
    score: Math.max(0, Math.min(100, total)),
    gapsCovered,
    uniqueSkills,
    sharedSlots,
    mutualSkills,
    ideaScore,
    meetsSchedule: sharedSlots.length >= 1,
    meetsSkills: gapsCovered.length >= 1 || uniqueSkills.length >= 2,
  };
}

export function buildReasons(candidate, m) {
  const reasons = [];
  const total = candidate.__needTotal || m.gapsCovered.length;

  if (m.gapsCovered.length) {
    reasons.push(
      `Fills ${m.gapsCovered.join(' + ')} (${m.gapsCovered.length} of the ${total} gap${total === 1 ? '' : 's'} on your list)`,
    );
  } else if (m.uniqueSkills.length >= 2) {
    reasons.push(`Adds skills you do not have yet: ${m.uniqueSkills.slice(0, 3).join(', ')}`);
  }

  if (m.sharedSlots.length) {
    reasons.push(`Free together on ${dayGrouped(m.sharedSlots)}`);
  } else {
    reasons.push('Heads up: no overlapping free block with your schedule — confirm timings first');
  }

  if (m.mutualSkills.length) {
    reasons.push(`They are looking for a ${m.mutualSkills.slice(0, 2).join(' / ')} too — a two-way fit`);
  }

  if (m.ideaScore >= 0.34) {
    reasons.push(`Their own project (“${shortIdea(candidate.idea)}”) pulls in your direction`);
  }

  if (reasons.length === 1 && m.gapsCovered.length === 0) {
    reasons.push(`Dependable ${candidate.role.toLowerCase()} depth: ${candidate.skills.slice(0, 2).join(', ')}`);
  }
  return reasons.slice(0, 3);
}

function shortIdea(idea = '') {
  const text = idea.replace(/\.$/, '');
  return text.length > 46 ? `${text.slice(0, 46)}…` : text;
}

function dayGrouped(slots = []) {
  const byDay = {};
  slots.forEach((slot) => {
    const [day, block] = slot.split('-');
    const nice = day.charAt(0).toUpperCase() + day.slice(1);
    byDay[nice] = byDay[nice] || [];
    byDay[nice].push(block === 'am' ? 'AM' : block === 'mid' ? 'PM' : 'EVE');
  });
  const parts = DAYS.filter((d) => byDay[d]).map((d) => `${d} ${byDay[d].join('/')}`);
  if (parts.length <= 2) return parts.join(' and ');
  return `${parts.slice(0, 2).join(', ')} and ${parts.length - 2} more`;
}

/**
 * Up to `limit` teammates: filtered by the two hard rules (some shared time, and either
 * a covered gap or real complementary depth), then de-duplicated by lane so a squad is not
 * three copies of the same role. If the pool is thin we relax and say why.
 */
export function findSquad(demand, pool = [], { limit = 3 } = {}) {
  const needs = norm(demand.needs);
  const scored = pool
    .filter((c) => c.id !== demand.userId)
    .map((candidate) => {
      const m = scoreCandidate({ ...candidate, needs: candidate.needs || [] }, demand);
      return { ...candidate, __needTotal: needs.length, ...m, reasons: buildReasons({ ...candidate, __needTotal: needs.length }, m) };
    })
    .map((c) => ({ ...c, __needTotal: undefined }));

  const eligible = scored
    .filter((c) => c.meetsSchedule && c.meetsSkills)
    .sort((a, b) => b.score - a.score);
  const picked = [];
  const usedLanes = new Set();

  for (const c of eligible) {
    if (picked.length >= limit) break;
    const lane = c.lane || laneOf(c.skills[0]);
    if (usedLanes.has(lane)) continue;
    usedLanes.add(lane);
    picked.push(c);
  }

  let relaxed = false;
  if (picked.length < limit) {
    const rest = scored
      .filter((c) => c.score > 0 && !picked.some((p) => p.id === c.id))
      .sort((a, b) => b.score - a.score);
    while (picked.length < limit && rest.length) {
      picked.push(rest.shift());
      relaxed = true;
    }
  }

  return picked
    .sort((a, b) => b.score - a.score)
    .map((c) => ({
      ...c,
      lane: c.lane || laneOf(c.skills[0]),
      reasons: relaxed && !c.meetsSkills ? [...c.reasons, 'Fallback pick — thin pool, least-bad fit'] : c.reasons,
    }));
}

/** Aggregated view of "me + shortlist": coverage, remaining holes and shared time. */
export function squadSummary(demand, squad = []) {
  const needs = norm(demand.needs);
  const mySkills = norm(demand.skills);
  const covered = intersect(needs, squad.flatMap((s) => s.skills));
  const remaining = difference(needs, squad.flatMap((s) => s.skills));

  const bySlot = {};
  squad.forEach((s) => norm(s.slots).forEach((slot) => (bySlot[slot] = (bySlot[slot] || 0) + 1)));
  const mySlots = norm(demand.slots);
  const commonWithMe = mySlots.filter((slot) => bySlot[slot] >= Math.max(1, squad.length) && squad.length > 0);
  const busiest = mySlots
    .map((slot) => ({ slot, count: bySlot[slot] || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    lanes: [...new Set([laneOf(mySkills[0] || ''), ...squad.map((s) => s.lane || laneOf(s.skills[0]))])].filter((l) => l && l !== 'other'),
    combinedSkills: [...new Set([...mySkills, ...squad.flatMap((s) => s.skills)])],
    coveredGaps: covered,
    remainingGaps: remaining,
    commonWithMe,
    busiest,
    avgScore: squad.length ? Math.round(squad.reduce((a, s) => a + s.score, 0) / squad.length) : 0,
  };
}
