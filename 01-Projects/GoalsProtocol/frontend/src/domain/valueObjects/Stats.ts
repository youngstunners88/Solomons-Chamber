/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - STATS VALUE OBJECT
 * ═══════════════════════════════════════════════════════════════
 */

export interface Stats {
  readonly pace: number;
  readonly shooting: number;
  readonly passing: number;
  readonly dribbling: number;
  readonly defense: number;
  readonly physical: number;
  readonly overall: number;
}

export const createStats = (
  pace: number,
  shooting: number,
  passing: number,
  dribbling: number,
  defense: number,
  physical: number
): Stats => {
  const overall = Math.round(
    (pace + shooting + passing + dribbling + defense + physical) / 6
  );

  return {
    pace: clamp(pace),
    shooting: clamp(shooting),
    passing: clamp(passing),
    dribbling: clamp(dribbling),
    defense: clamp(defense),
    physical: clamp(physical),
    overall,
  };
};

const clamp = (value: number): number => Math.max(0, Math.min(99, value));

export const calculateOverall = (stats: Omit<Stats, 'overall'>): number => {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};
