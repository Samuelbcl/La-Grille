"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Nom affiché modifiable. Les espaces internes sont conservés (on ne fait que
 * réduire les espaces multiples et retirer ceux des extrémités), donc un nom
 * comme « Samuel S » s'affiche tel quel partout dans l'app.
 */
export function DisplayNameEditor({ current }: { current: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  async function save() {
    const clean = value.replace(/\s+/g, " ").trim();
    if (!clean || clean === current) {
      setValue(current);
      setEditing(false);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ display_name: clean }).eq("id", user.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          maxLength={30}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-lg font-bold outline-none focus:border-accent"
        />
        <button
          onClick={save}
          disabled={saving}
          aria-label="Enregistrer le nom"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-fg"
        >
          <Check size={16} />
        </button>
        <button
          onClick={() => {
            setValue(current);
            setEditing(false);
          }}
          aria-label="Annuler"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-left">
      <span className="truncate text-xl font-bold">{current}</span>
      <Pencil size={14} className="shrink-0 text-muted" />
    </button>
  );
}
