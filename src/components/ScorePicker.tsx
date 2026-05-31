"use client";

import { cn, flag } from "@/lib/utils";

const CHIPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function TeamPicker({
  name,
  code,
  value,
  onChange,
  disabled,
}: {
  name: string;
  code: string | null;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none">{flag(code)}</span>
        <span className="flex-1 min-w-0 truncate font-semibold text-[15px]">{name}</span>
        <span className="tabular-nums text-3xl font-bold w-9 text-center text-accent">{value}</span>
      </div>
      {!disabled && (
        <div className="grid grid-cols-5 gap-2">
          {CHIPS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${name} : ${n} but${n > 1 ? "s" : ""}`}
              aria-pressed={value === n}
              className={cn(
                "h-11 rounded-xl border text-[15px] font-semibold tabular-nums transition active:scale-95",
                value === n
                  ? "bg-accent text-accent-fg border-accent shadow-card"
                  : "bg-surface-2 border-border text-text"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}
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
    <div className="space-y-5">
      <TeamPicker name={teamA} code={codeA} value={a} onChange={onA} disabled={disabled} />
      <div className="h-px bg-border" />
      <TeamPicker name={teamB} code={codeB} value={b} onChange={onB} disabled={disabled} />
    </div>
  );
}
