"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/Flag";
import { BONUS, normalizeAns, looseMatch } from "@/lib/bonus";

type Team = { code: string; name: string };

export function BonusForm({
  poolId,
  userId,
  teams,
  initial,
  locked,
  deadlineLabel,
  results,
}: {
  poolId: string;
  userId: string | null;
  teams: Team[];
  initial: Record<string, string>;
  locked: boolean;
  deadlineLabel: string;
  results: Record<string, string>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const nameOf = (code: string) => teams.find((t) => t.code === code)?.name ?? code;

  async function save() {
    if (BONUS.some((b) => !answers[b.key]?.trim())) {
      setMsg("Réponds à toutes les questions.");
      return;
    }
    if (!userId) return router.push("/login");
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const rows = BONUS.map((b) => ({
      pool_id: poolId,
      user_id: userId,
      question_key: b.key,
      answer: answers[b.key].trim(),
    }));
    const { error } = await supabase.from("bonus_answers").upsert(rows, { onConflict: "pool_id,user_id,question_key" });
    setSaving(false);
    if (error) {
      setMsg("Échec de l'enregistrement (deadline peut-être passée).");
      return;
    }
    setMsg("Enregistré ✅ — modifiable jusqu'à la deadline.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-2 p-3 text-center text-[13px]">
        {locked ? (
          <span className="text-muted">🔒 Pronos bonus clôturés (deadline passée).</span>
        ) : (
          <span>
            ✍️ Modifiable jusqu&apos;au <b className="capitalize">{deadlineLabel}</b>
          </span>
        )}
      </div>

      {BONUS.map((b) => {
        const ans = answers[b.key] ?? "";
        const correct = results[b.key];
        const resolved = !!correct;
        const isRight =
          resolved && (b.kind === "text" ? looseMatch(ans, correct) : normalizeAns(ans) === normalizeAns(correct));
        return (
          <div key={b.key} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold">{b.label}</p>
              <span className="shrink-0 text-[12px] font-bold text-accent">+{b.points}</span>
            </div>
            <p className="mb-2.5 text-[12px] text-muted">{b.hint}</p>

            {locked ? (
              <div className="flex items-center gap-2 text-[15px] font-semibold">
                {b.kind === "team" && ans && <Flag code={ans} size={18} />}
                <span>{b.kind === "team" ? nameOf(ans) : ans || "—"}</span>
                {resolved && (
                  <span className={`ml-auto shrink-0 text-[12px] font-bold ${isRight ? "text-success" : "text-muted"}`}>
                    {isRight ? `+${b.points} ✓` : "✗"}
                  </span>
                )}
              </div>
            ) : b.kind === "team" ? (
              <select
                value={ans}
                onChange={(e) => setAnswers((a) => ({ ...a, [b.key]: e.target.value }))}
                className="h-12 w-full rounded-2xl border border-border bg-surface-2 px-3 outline-none focus:border-accent"
              >
                <option value="">— Choisis une équipe —</option>
                {teams.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  value={ans}
                  onChange={(e) => setAnswers((a) => ({ ...a, [b.key]: e.target.value }))}
                  placeholder="Ex : Mbappé"
                  className="h-12 w-full rounded-2xl border border-border bg-surface-2 px-4 outline-none focus:border-accent"
                />
                <p className="mt-1 text-[11px] text-muted">Pas besoin d&apos;une orthographe parfaite 👍</p>
              </>
            )}

            {locked && resolved && !isRight && (
              <p className="mt-1 text-[11px] text-muted">
                Bonne réponse : {b.kind === "team" ? nameOf(correct) : correct}
              </p>
            )}
          </div>
        );
      })}

      {locked ? (
        <p className="text-center text-[13px] text-muted">Les pronos bonus sont clôturés.</p>
      ) : (
        <>
          {msg && <p className="px-1 text-center text-sm text-accent">{msg}</p>}
          <Button size="lg" onClick={save} disabled={saving}>
            {saving ? "…" : "Enregistrer mes pronos bonus"}
          </Button>
          <p className="text-center text-[11px] text-muted">
            Tu peux revenir les modifier autant que tu veux avant la deadline.
          </p>
        </>
      )}
    </div>
  );
}
