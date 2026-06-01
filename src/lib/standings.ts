/** Calcul des classements de poules (vrais points football 3/1/0) à partir des résultats. */

export type TeamStanding = {
  team: string;
  code: string | null;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export type MatchForStanding = {
  group_label: string | null;
  team_a: string;
  team_a_code: string | null;
  team_b: string;
  team_b_code: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
};

export function computeStandings(matches: MatchForStanding[]): Record<string, TeamStanding[]> {
  const groups: Record<string, Map<string, TeamStanding>> = {};

  const ensure = (g: string, team: string, code: string | null) => {
    groups[g] ??= new Map();
    if (!groups[g].has(team)) {
      groups[g].set(team, {
        team, code, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, gd: 0, pts: 0,
      });
    }
    return groups[g].get(team)!;
  };

  for (const m of matches) {
    if (!m.group_label) continue;
    const A = ensure(m.group_label, m.team_a, m.team_a_code);
    const B = ensure(m.group_label, m.team_b, m.team_b_code);
    if (m.status !== "finished" || m.score_a == null || m.score_b == null) continue;
    A.played++; B.played++;
    A.gf += m.score_a; A.ga += m.score_b;
    B.gf += m.score_b; B.ga += m.score_a;
    if (m.score_a > m.score_b) { A.win++; A.pts += 3; B.loss++; }
    else if (m.score_a < m.score_b) { B.win++; B.pts += 3; A.loss++; }
    else { A.draw++; B.draw++; A.pts++; B.pts++; }
  }

  const out: Record<string, TeamStanding[]> = {};
  for (const [g, map] of Object.entries(groups)) {
    const arr = [...map.values()];
    arr.forEach((t) => (t.gd = t.gf - t.ga));
    arr.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
    out[g] = arr;
  }
  return out;
}
