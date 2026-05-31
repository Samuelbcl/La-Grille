"use client";

import { Minus, Plus } from "lucide-react";
import { flag } from "@/lib/utils";

function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={disabled || value >= 20}
        onClick={() => onChange(value + 1)}
        className="grid place-items-center h-11 w-11 rounded-full bg-surface-2 border border-border active:scale-90 transition disabled:opacity-30"
        aria-label="Plus"
      >
        <Plus size={20} />
      </button>
      <span className="tabular-nums text-5xl font-bold w-16 text-center">{value}</span>
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="grid place-items-center h-11 w-11 rounded-full bg-surface-2 border border-border active:scale-90 transition disabled:opacity-30"
        aria-label="Moins"
      >
        <Minus size={20} />
      </button>
    </div>
  );
}

export function ScorePicker({
  teamA,
  codeA,
  teamB,
  codeB,
  a,
  b,
  onA,
  onB,
  disabled,
}: {
  teamA: string;
  codeA: string | null;
  teamB: string;
  codeB: string | null;
  a: number;
  b: number;
  onA: (v: number) => void;
  onB: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Side name={teamA} code={codeA}>
        <Stepper value={a} onChange={onA} disabled={disabled} />
      </Side>
      <Side name={teamB} code={codeB}>
        <Stepper value={b} onChange={onB} disabled={disabled} />
      </Side>
    </div>
  );
}

function Side({
  name,
  code,
  children,
}: {
  name: string;
  code: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-4xl leading-none">{flag(code)}</span>
        <span className="text-sm font-semibold text-center leading-tight">{name}</span>
      </div>
      {children}
    </div>
  );
}
