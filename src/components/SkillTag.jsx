export const LANE_COLORS = {
  frontend: { bg: '#eceafe', fg: '#4f46e5' },
  mobile: { bg: '#e6f7f2', fg: '#0f9d76' },
  backend: { bg: '#eaf1ff', fg: '#2563c9' },
  ml: { bg: '#fdeef2', fg: '#c93a63' },
  design: { bg: '#fff4e0', fg: '#b57210' },
  web3: { bg: '#eeeafd', fg: '#7c3aed' },
  devops: { bg: '#e9f5ef', fg: '#2f855a' },
  product: { bg: '#f1f3f0', fg: '#4b5b3a' },
  other: { bg: '#f0f0ec', fg: '#4b5563' },
};

export function laneStyle(lane) {
  return LANE_COLORS[lane] || LANE_COLORS.other;
}

export default function SkillTag({ skill, state = 'own', title }) {
  const styles = {
    own: 'bg-ink/[0.06] text-ink-soft border-transparent',
    need: 'bg-transparent text-brand border-brand/40 border-dashed',
    match: 'bg-lime/45 text-ink border-lime',
    dim: 'bg-paper text-muted border-line',
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-medium leading-none ${styles[state]}`}
    >
      {state === 'match' && (
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {skill}
    </span>
  );
}
