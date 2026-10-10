import React from 'react';

type Gender = 'hombre' | 'mujer' | 'otro';

interface PreferencesFormGroupProps {
  gender: Gender;
  onChangeGender: (gender: Gender) => void;
}

export function PreferencesFormGroup({ gender, onChangeGender }: PreferencesFormGroupProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-300">Soy:</label>
      <div className="grid grid-cols-3 gap-2">
        {(['hombre', 'mujer', 'otro'] as Gender[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChangeGender(g)}
            className={`py-2 text-sm rounded-lg border capitalize transition ${
              gender === g
                ? "bg-rose-600 border-rose-500 text-white"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}