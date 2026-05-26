import React from "react";
import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  current: number; // 1-based
  onStepClick?: (step: number) => void;
}

export default function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <nav className="w-full">
      <ol className="flex items-center justify-between w-full">
        {steps.map((label, idx) => {
          const step = idx + 1;
          const completed = step < current;
          const active = step === current;

          return (
            <li
              key={label}
              className="flex-1 flex flex-col items-center group relative"
            >
              <div className="flex items-center w-full z-10">
                {/* left connector: shown except for first step */}
                {idx !== 0 && (
                  <div
                    aria-hidden
                    className={`h-0.5 flex-1 rounded transition-all duration-200 ${
                      step - 1 < current ? "bg-emerald-600" : "bg-slate-200"
                    } `}
                  />
                )}

                <button
                  type="button"
                  onClick={() => onStepClick?.(step)}
                  title={label}
                  aria-label={label}
                  className={`relative z-20 flex items-center justify-center h-9 w-9 rounded-full border-2 transition-transform duration-200 ease-in-out transform hover:scale-110 ${
                    completed
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                      : active
                        ? "bg-white border-slate-900 text-slate-900 shadow"
                        : "bg-white border-slate-200 text-slate-700"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  {completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </button>

                {/* right connector: shown except for last step */}
                {idx < steps.length - 1 && (
                  <div
                    aria-hidden
                    className={`h-0.5 flex-1 rounded transition-all duration-200 ${
                      step < current ? "bg-emerald-600" : "bg-slate-200"
                    } `}
                  />
                )}
              </div>

              <div className="mt-3 text-center text-xs text-slate-600 w-full z-10">
                <div className="mx-auto w-full max-w-[80px]">{label}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
