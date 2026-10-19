import { useState } from 'react';
import { searchSkills } from '../lib/skills';
import SkillTag from './SkillTag';

export default function SkillInput({
  value = [],
  onChange,
  placeholder = 'Type a skill, press Enter',
  tone = 'own',
  max = 12,
}) {
  const [draft, setDraft] = useState('');
  const suggestions = searchSkills(draft).filter((s) => !value.includes(s));

  function add(skill) {
    const clean = skill.trim().replace(/,$/, '');
    if (!clean || value.includes(clean) || value.length >= max) {
      setDraft('');
      return;
    }
    onChange([...value, clean]);
    setDraft('');
  }

  function remove(skill) {
    onChange(value.filter((s) => s !== skill));
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => remove(skill)}
              title="Remove"
              className="group inline-flex items-center gap-1 cursor-pointer"
            >
              <SkillTag skill={skill} state={tone} />
              <span className="text-muted group-hover:text-rose text-xs">✕</span>
            </button>
          ))}
        </div>
      )}

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none transition focus:border-brand/60 focus:ring-4 focus:ring-brand/10"
      />

      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-line px-2.5 py-1 text-[12.5px] text-muted hover:border-brand/50 hover:text-brand cursor-pointer"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
