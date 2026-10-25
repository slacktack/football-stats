import type { MatchStatus, MatchSummary } from "./types";

const DAY_LONG = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const DAY_SHORT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const MONTH_SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateParam(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function todayParam() {
  return toDateParam(new Date());
}

export function parseDateParam(param?: string | null) {
  if (!param || !/^\d{8}$/.test(param)) return new Date();
  const year = Number(param.slice(0, 4));
  const month = Number(param.slice(4, 6)) - 1;
  const day = Number(param.slice(6, 8));
  const date = new Date(year, month, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dateToIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatLongDate(date: Date) {
  return DAY_LONG.format(date);
}

export function formatShortDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return DAY_SHORT.format(date);
}

export function formatMonthDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return MONTH_SHORT.format(date);
}

export function formatKickoff(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return TIME.format(date);
}

export function buildDateStrip(center: Date, radius = 5) {
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const today = todayParam();
  return Array.from({ length: radius * 2 + 1 }, (_, index) => {
    const date = addDays(center, index - radius);
    return {
      param: toDateParam(date),
      iso: dateToIso(date),
      weekday: weekday.format(date),
      day: String(date.getDate()),
      month: month.format(date),
      isToday: toDateParam(date) === today,
    };
  });
}

export function relativeDay(dateParam: string, today = todayParam()) {
  if (dateParam === today) return "Today";
  const yesterday = toDateParam(addDays(parseDateParam(today), -1));
  if (dateParam === yesterday) return "Yesterday";
  const tomorrow = toDateParam(addDays(parseDateParam(today), 1));
  if (dateParam === tomorrow) return "Tomorrow";
  return formatShortDate(parseDateParam(dateParam));
}

export function isLive(status: {
  started?: boolean;
  finished?: boolean;
  cancelled?: boolean;
}) {
  return Boolean(status.started && !status.finished && !status.cancelled);
}

export function statusLabel(status: MatchStatus) {
  if (status.cancelled) return status.reason?.short ?? "Canc.";
  if (status.finished) return status.reason?.short ?? "FT";
  if (status.started) {
    const live = status.liveTime?.short;
    if (live) return live.replace(/[\u200e\u200f]/g, "").trim();
    return status.reason?.short ?? "LIVE";
  }
  return formatKickoff(status.utcTime);
}

export type StatusTone = "live" | "finished" | "scheduled" | "cancelled";

export function statusTone(status: MatchStatus): StatusTone {
  if (status.cancelled) return "cancelled";
  if (status.started && !status.finished) return "live";
  if (status.finished) return "finished";
  return "scheduled";
}

export function scorePair(input: {
  home: { score?: number };
  away: { score?: number };
  status: MatchStatus;
}): [string, string] {
  if (input.status.scoreStr) {
    const parts = input.status.scoreStr.split(" - ");
    if (parts.length === 2) return [parts[0].trim(), parts[1].trim()];
  }
  return [String(input.home.score ?? 0), String(input.away.score ?? 0)];
}

export function isDraw(match: Pick<MatchSummary, "home" | "away" | "status">) {
  return match.home.score === match.away.score;
}

export function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function compactNumber(value: number | string | undefined | null) {
  if (value === undefined || value === null || value === "") return "—";
  const number = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(number)) return String(value);
  if (Math.abs(number) >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (Math.abs(number) >= 10_000) return `${Math.round(number / 1_000)}K`;
  return String(Math.round(number * 100) / 100);
}

export function formatMarketValue(value?: number | null) {
  if (!value) return "—";
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return `€${value}`;
}

export function formatFee(
  fee?: string | { value?: number; feeText?: string; localizedFeeText?: string } | null,
  estimated?: number | null,
) {
  if (typeof fee === "string" && fee) return fee;
  if (fee && typeof fee === "object") {
    if (fee.value) return formatMarketValue(fee.value);
    if (fee.feeText) return fee.feeText;
  }
  if (estimated) return formatMarketValue(estimated);
  return "Free";
}

export function ageFromDate(birthDate?: string) {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function formLetter(result?: number) {
  if (result === 1) return "W";
  if (result === 0) return "D";
  if (result === -1) return "L";
  return "–";
}

export function ordinalSeason(season?: string) {
  return season ?? "";
}

export function roundName(value?: string | number) {
  if (value === undefined || value === null || value === "") return "Matchday";
  const text = String(value);
  if (/^\d+$/.test(text)) return `Matchday ${text}`;
  return text;
}

export function playerName(
  name?: { firstName?: string; lastName?: string; fullName?: string } | string,
) {
  if (!name) return "Unknown player";
  if (typeof name === "string") return name;
  return name.fullName ?? [name.firstName, name.lastName].filter(Boolean).join(" ") ?? "Unknown player";
}

const COUNTRY_NAMES: Record<string, string> = {
  INT: "International",
  ENG: "England",
  ESP: "Spain",
  ITA: "Italy",
  GER: "Germany",
  FRA: "France",
  NED: "Netherlands",
  POR: "Portugal",
  BEL: "Belgium",
  SCO: "Scotland",
  WAL: "Wales",
  NIR: "Northern Ireland",
  IRL: "Ireland",
  USA: "United States",
  CAN: "Canada",
  MEX: "Mexico",
  BRA: "Brazil",
  ARG: "Argentina",
  URU: "Uruguay",
  COL: "Colombia",
  CHI: "Chile",
  PER: "Peru",
  ECU: "Ecuador",
  PAR: "Paraguay",
  JPN: "Japan",
  KOR: "South Korea",
  CHN: "China",
  AUS: "Australia",
  NZL: "New Zealand",
  RSA: "South Africa",
  EGY: "Egypt",
  MAR: "Morocco",
  TUR: "Turkey",
  GRE: "Greece",
  RUS: "Russia",
  UKR: "Ukraine",
  POL: "Poland",
  CRO: "Croatia",
  SRB: "Serbia",
  DEN: "Denmark",
  SWE: "Sweden",
  NOR: "Norway",
  FIN: "Finland",
  ISL: "Iceland",
  SUI: "Switzerland",
  AUT: "Austria",
  CZE: "Czech Republic",
  SVK: "Slovakia",
  HUN: "Hungary",
  ROU: "Romania",
  BUL: "Bulgaria",
  ISR: "Israel",
  KSA: "Saudi Arabia",
  UAE: "United Arab Emirates",
  QAT: "Qatar",
  IND: "India",
  IDN: "Indonesia",
  THA: "Thailand",
  VIE: "Vietnam",
  NGA: "Nigeria",
  GHA: "Ghana",
  SEN: "Senegal",
  CIV: "Ivory Coast",
  CMR: "Cameroon",
  ALG: "Algeria",
  TUN: "Tunisia",
};

export function countryName(ccode?: string) {
  if (!ccode) return "";
  return COUNTRY_NAMES[ccode] ?? ccode;
}

export function hexAlpha(hex: string | undefined, alpha: number) {
  if (!hex) return `rgba(200, 247, 81, ${alpha})`;
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  if ([red, green, blue].some(Number.isNaN)) return `rgba(200, 247, 81, ${alpha})`;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
