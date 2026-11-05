import type { MatchLineup } from "./types";

type RawStat = {
  key?: string | null;
  stat?: { value?: number | string | null; total?: number | null; type?: string };
};

type RawPlayer = {
  id: number;
  name: string;
  teamId: number;
  isGoalkeeper?: boolean;
  isPotm?: boolean;
  shirtNumber?: string;
  stats?: { title: string; key: string; stats: Record<string, RawStat> }[];
};

export type StatCell = { label: string; display: string; value: number };

export type MatchPlayerRow = {
  id: number;
  name: string;
  teamId: number;
  side: "home" | "away";
  shirt?: string;
  position?: string;
  starter: boolean;
  isGoalkeeper: boolean;
  isPotm: boolean;
  rating: number | null;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  shots: number;
  keyPasses: number;
  passes: string;
  passPct: number;
  touches: number;
  defActions: number;
  duelsWon: number;
  distance: number;
  topSpeed: number;
  groups: { title: string; stats: StatCell[] }[];
};

const HIDDEN = new Set(["Shotmap", "FotMob rating", "Fantasy points"]);

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatStat(stat: RawStat["stat"]): string {
  if (!stat) return "—";
  const value = stat.value;
  if (value === null || value === undefined) return "—";
  switch (stat.type) {
    case "fractionWithPercentage": {
      const total = num(stat.total);
      const pct = total ? Math.round((num(value) / total) * 100) : 0;
      return `${value}/${total} (${pct}%)`;
    }
    case "double":
      return num(value).toFixed(2);
    case "distance":
      return `${(num(value) / 1000).toFixed(2)} km`;
    case "speed":
      return `${num(value).toFixed(1)} km/h`;
    default:
      return String(value);
  }
}

function positionMap(lineup?: MatchLineup) {
  const map = new Map<number, { starter: boolean; position?: string }>();
  for (const team of [lineup?.homeTeam, lineup?.awayTeam]) {
    for (const p of team?.starters ?? []) map.set(p.id, { starter: true, position: positionLabel(p.usualPlayingPositionId, p.positionId) });
    for (const p of team?.subs ?? []) map.set(p.id, { starter: false, position: positionLabel(p.usualPlayingPositionId, p.positionId) });
  }
  return map;
}

function positionLabel(usual?: number, positionId?: number) {
  if (positionId === 11 || usual === 0) return "GK";
  if (usual === 1) return "DEF";
  if (usual === 2) return "MID";
  if (usual === 3) return "FWD";
  return undefined;
}

export function normalizeMatchPlayers(
  raw: Record<string, unknown> | undefined,
  homeId: number,
  lineup?: MatchLineup,
): MatchPlayerRow[] {
  if (!raw) return [];
  const positions = positionMap(lineup);
  const rows: MatchPlayerRow[] = [];

  for (const value of Object.values(raw)) {
    const player = value as RawPlayer;
    if (!player?.id || !player.stats?.length) continue;

    const flat = new Map<string, RawStat["stat"]>();
    const groups = player.stats.map((group) => ({
      title: group.title,
      stats: Object.entries(group.stats ?? {})
        .filter(([label]) => !HIDDEN.has(label))
        .map(([label, entry]) => {
          if (entry.key) flat.set(entry.key, entry.stat);
          flat.set(label, entry.stat);
          return { label, display: formatStat(entry.stat), value: num(entry.stat?.value) };
        }),
    }));
    for (const group of player.stats) {
      const rating = group.stats?.["FotMob rating"];
      if (rating) flat.set("rating", rating.stat);
    }

    const get = (key: string) => num(flat.get(key)?.value);
    const passes = flat.get("accurate_passes");
    const minutes = get("minutes_played");
    const rating = num(flat.get("rating")?.value) || null;
    if (!minutes && !rating) continue;

    const pos = positions.get(player.id);
    rows.push({
      id: player.id,
      name: player.name,
      teamId: player.teamId,
      side: player.teamId === homeId ? "home" : "away",
      shirt: player.shirtNumber,
      position: pos?.position ?? (player.isGoalkeeper ? "GK" : undefined),
      starter: pos?.starter ?? true,
      isGoalkeeper: Boolean(player.isGoalkeeper),
      isPotm: Boolean(player.isPotm),
      rating,
      minutes,
      goals: get("goals"),
      assists: get("assists"),
      xg: get("expected_goals"),
      xa: get("expected_assists"),
      shots: get("total_shots"),
      keyPasses: get("chances_created"),
      passes: passes ? `${num(passes.value)}/${num(passes.total)}` : "—",
      passPct: passes && num(passes.total) ? Math.round((num(passes.value) / num(passes.total)) * 100) : 0,
      touches: get("touches"),
      defActions: get("defensive_actions"),
      duelsWon: get("duel_won"),
      distance: get("physical_metrics_distance_covered"),
      topSpeed: get("physical_metrics_topspeed"),
      groups: groups.filter((group) => group.stats.length),
    });
  }

  return rows.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

export function youtubeId(url?: string) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match?.[1] ?? null;
}
