export const SKILL_CATALOG = [
  {
    group: 'Frontend',
    lane: 'frontend',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Vue', 'Three.js', 'Accessibility'],
  },
  {
    group: 'Mobile',
    lane: 'mobile',
    skills: ['Flutter', 'Dart', 'Swift', 'Kotlin', 'React Native', 'Firebase'],
  },
  {
    group: 'Backend',
    lane: 'backend',
    skills: ['Node.js', 'Python', 'Django', 'FastAPI', 'Postgres', 'Supabase', 'GraphQL', 'REST'],
  },
  {
    group: 'Data & ML',
    lane: 'ml',
    skills: ['PyTorch', 'scikit-learn', 'Pandas', 'NLP', 'Computer Vision', 'Data Viz', 'SQL'],
  },
  {
    group: 'Design',
    lane: 'design',
    skills: ['Figma', 'UI Design', 'Design Systems', 'Prototyping', 'Illustration', 'Motion'],
  },
  {
    group: 'Web3',
    lane: 'web3',
    skills: ['Solidity', 'Hardhat', 'ethers.js', 'Smart Contracts', 'DeFi'],
  },
  {
    group: 'Infra',
    lane: 'devops',
    skills: ['Docker', 'AWS', 'CI/CD', 'Terraform', 'Vercel', 'Monitoring'],
  },
  {
    group: 'Product',
    lane: 'product',
    skills: ['Pitch Deck', 'Market Research', 'Product Strategy', 'Copywriting', 'User Interviews'],
  },
];

export const ALL_SKILLS = SKILL_CATALOG.flatMap((g) => g.skills);

export function laneOf(skill) {
  const hit = SKILL_CATALOG.find((g) => g.skills.includes(skill));
  return hit ? hit.lane : 'other';
}

export function searchSkills(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_SKILLS.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q).slice(0, 7);
}
