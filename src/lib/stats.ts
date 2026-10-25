import type { Fixture, MatchStatus, TableRow } from "./types";

export function scoreFromStatus(status: MatchStatus): [number, number] | null {
  if (!status.scoreStr) return null;
  const parts = status.scoreStr.split(" - ");
  if (parts.length !== 2) return null;
  const home = Number(parts[0]);
  const away = Number(parts[1]);
  if (Number.isNaN(home) || Number.isNaN(away)) return null;
  return [home, away];
}

export function computeForm(fixtures: Fixture[] = [], limit = 5) {
  const form: Record<number, number[]> = {};
  const finished = fixtures
    .filter((fixture) => fixture.status.finished && fixture.status.scoreStr)
    .sort(
      (a, b) =>
        new Date(b.status.utcTime).getTime() - new Date(a.status.utcTime).getTime(),
    );

  for (const fixture of finished) {
    const score = scoreFromStatus(fixture.status);
    if (!score) continue;
    const homeId = Number(fixture.home.id);
    const awayId = Number(fixture.away.id);
    if (Number.isNaN(homeId) || Number.isNaN(awayId)) continue;

    const homeResult = score[0] > score[1] ? 1 : score[0] === score[1] ? 0 : -1;
    const awayResult = score[1] > score[0] ? 1 : score[0] === score[1] ? 0 : -1;

    (form[homeId] ??= []).push(homeResult);
    (form[awayId] ??= []).push(awayResult);
  }

  for (const key of Object.keys(form)) {
    form[Number(key)] = form[Number(key)].slice(0, limit);
  }
  return form;
}

export function findTeamRow(table: TableRow[] | undefined, teamId: number | string) {
  return table?.find((row) => String(row.id) === String(teamId));
}

export function tablePositionLabel(rows: TableRow[] | undefined, teamId: number | string) {
  const index = rows?.findIndex((row) => String(row.id) === String(teamId)) ?? -1;
  return index >= 0 ? index + 1 : undefined;
}

export function streak(rows: number[] = []) {
  return rows;
}
