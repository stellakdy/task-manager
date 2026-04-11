'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  allTags?: string[];
}

export default function TagInput({ tags, onChange, allTags = [] }: Props) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = input.trim()
    ? allTags.filter((t) => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t))
    : [];

  function addTag(tag: string) {
    const t = tag.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput('');
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 items-center">
        {tags.map((tag) => (
          <span key={tag}
            className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 dark:bg-slate-600 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            #{tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={tags.length ? '' : '태그 입력 (Enter)...'}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
            if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="flex-1 min-w-[80px] bg-transparent text-xs text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none py-0.5"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-lg max-h-32 overflow-y-auto">
          {suggestions.map((tag) => (
            <button key={tag}
              onClick={() => addTag(tag)}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600">
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
