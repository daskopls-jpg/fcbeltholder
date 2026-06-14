import React from 'react';

interface Props {
  step: number;
  setStep: (n: number) => void;
  stepLabels: string[];
}

export default function StepNavigation({ step, setStep, stepLabels }: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 mb-6">
      <ol className="grid grid-cols-1 md:grid-cols-6 gap-2">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = step === stepNumber;
          const isDone = step > stepNumber;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(stepNumber)}
                className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-sm text-left transition ${
                  isActive
                    ? 'border-cyan-300/70 bg-cyan-400/15 text-white'
                    : isDone
                    ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
                    : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="font-semibold">{stepNumber}.</span> {label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
