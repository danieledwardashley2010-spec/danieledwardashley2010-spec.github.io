import type {
  BuiltHunt,
  HuntConfig,
  HuntStop,
  HuntLocation,
  Theme,
  CustomFinish,
} from './types';
import { LOCATIONS, FINISH_LOCATION } from './locations';
import { distanceMeters } from '@/lib/geo';

const STOP_COUNT: Record<HuntConfig['length'], number> = {
  short: 4,
  medium: 6,
  long: 8,
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Resolve the finish as a HuntLocation-like object.
 * For preset locations, returns the matching entry from LOCATIONS.
 * For custom finishes, builds a synthetic HuntLocation with generic clues.
 */
export function getFinishLocation(config: HuntConfig): HuntLocation {
  if (config.finishId === 'custom' && config.customFinish) {
    return {
      id: 'custom-finish',
      name: config.customFinish.name,
      themes: [],
      lat: config.customFinish.lat,
      lng: config.customFinish.lng,
      distanceToFinish: 0,
      feature: 'Your custom finish point.',
      clues: {
        easy: `You've reached the finish: ${config.customFinish.name}.`,
        medium: `The final stop is ${config.customFinish.name}. Find the exact spot you agreed to meet at.`,
        hard: `The final stop is ${config.customFinish.name}. Find the exact meeting spot and note one distinctive detail about it.`,
      },
      reveal: `${config.customFinish.name} \u2014 your custom finish point.`,
    };
  }
  return LOCATIONS.find((l) => l.id === config.finishId) ?? FINISH_LOCATION;
}

/** Compute walking-distance proxy from a location to the finish. */
function distToFinish(loc: HuntLocation, finish: HuntLocation): number {
  if (finish.id === 'custom-finish') {
    return distanceMeters(loc.lat, loc.lng, finish.lat, finish.lng);
  }
  // For preset finishes, use the static field when available (relative to Albert Dock)
  // but adjust if the finish is not Albert Dock.
  if (finish.id === 'albert-dock') {
    return loc.distanceToFinish;
  }
  return distanceMeters(loc.lat, loc.lng, finish.lat, finish.lng);
}

function pickStopPool(config: HuntConfig): HuntLocation[] {
  const count = STOP_COUNT[config.length];
  const finish = getFinishLocation(config);

  const themed = LOCATIONS.filter(
    (l) => l.id !== finish.id && l.themes.includes(config.theme)
  );

  let pool = themed;
  if (pool.length < count - 1) {
    const extra = LOCATIONS.filter(
      (l) => l.id !== finish.id && !themed.includes(l)
    );
    pool = [...themed, ...shuffle(extra)];
  }

  // Sort by distance to the actual finish (dynamic), then pick spread-out stops
  const withDist = pool.map((l) => ({ loc: l, d: distToFinish(l, finish) }));
  withDist.sort((a, b) => b.d - a.d);

  // Pick stops spread across the distance range for variety
  const shuffled = shuffle(withDist).slice(0, count - 1);
  shuffled.sort((a, b) => b.d - a.d);

  return [...shuffled.map((s) => s.loc), finish];
}

/**
 * Generate N different orderings of the same set of stops.
 * Each ordering visits the same locations but in a different sequence,
 * keeping the finish location always last. Routes are kept similar in
 * total distance by using a greedy nearest-neighbour from different starts.
 */
export function generateTeamOrderings(
  stopPool: HuntLocation[],
  teamCount: number
): HuntLocation[][] {
  if (teamCount <= 1) return [stopPool];

  const finish = stopPool[stopPool.length - 1];
  const intermediates = stopPool.slice(0, -1);
  const orderings: HuntLocation[][] = [];

  const greedyFrom = (startIdx: number): HuntLocation[] => {
    const remaining = [...intermediates];
    const route: HuntLocation[] = [remaining.splice(startIdx, 1)[0]];

    while (remaining.length > 0) {
      const last = route[route.length - 1];
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = distanceMeters(last.lat, last.lng, remaining[i].lat, remaining[i].lng);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      route.push(remaining.splice(bestIdx, 1)[0]);
    }
    return [...route, finish];
  };

  const used = new Set<string>();
  for (let t = 0; t < teamCount; t++) {
    const startIdx = t % intermediates.length;
    const route = greedyFrom(startIdx);
    const key = route.map((r) => r.id).join(',');
    if (used.has(key) && intermediates.length > 2) {
      const shuffled = [...shuffle(intermediates), finish];
      const altKey = shuffled.map((r) => r.id).join(',');
      if (!used.has(altKey)) {
        used.add(altKey);
        orderings.push(shuffled);
        continue;
      }
    }
    used.add(key);
    orderings.push(route);
  }

  return orderings;
}

function occasionTwist(clue: string, config: HuntConfig): string {
  if (config.occasionType === 'birthday') {
    const twists = [
      `${clue} (${config.celebrantName} is watching \u2014 they turn ${config.occasionTitle.replace(/[^0-9]/g, '') || 'a year older'} today.)`,
      `A birthday clue for ${config.celebrantName}: ${clue}`,
    ];
    return twists[Math.floor(Math.random() * twists.length)];
  }
  return clue;
}

export function buildHunt(config: HuntConfig): BuiltHunt {
  const pool = pickStopPool(config);
  const stops: HuntStop[] = pool.map((location, index) => {
    const isFinal = index === pool.length - 1;
    let clue = location.clues[config.difficulty];
    if (!isFinal && Math.random() < 0.4) {
      clue = occasionTwist(clue, config);
    }
    return { index, location, clue, isFinal };
  });

  return {
    config,
    stops,
    finalMessage: config.finalMessage,
  };
}

/** Pick the shared stop pool for a hunt (used when persisting to DB). */
export function pickHuntStops(config: HuntConfig): HuntLocation[] {
  return pickStopPool(config);
}

export const THEME_LABELS: Record<Theme, string> = {
  urban: 'Urban Adventure',
  waterfront: 'Waterfront',
  music: 'Music & Culture',
  hidden: 'Hidden Corners',
};

export const OCCASION_LABELS: Record<HuntConfig['occasionType'], string> = {
  birthday: 'Birthday',
  celebration: 'Celebration',
  farewell: 'Farewell',
  reunion: 'Reunion',
  custom: 'Custom',
};

export function defaultFinalMessage(config: HuntConfig): string {
  switch (config.occasionType) {
    case 'birthday':
      return `You found it, ${config.celebrantName}! Happy ${config.occasionTitle}. You\u2019ve just walked across Liverpool solving clues like a true Scouser. Here\u2019s to a year of more adventures, more music, and more hidden corners worth finding.`;
    case 'farewell':
      return `You made it, ${config.celebrantName}! ${config.occasionTitle}. What a way to send you off \u2014 a proper Liverpool adventure. Go well, and come back soon.`;
    case 'reunion':
      return `You\u2019re all here! ${config.occasionTitle}. You\u2019ve roamed the city together and found every clue. Here\u2019s to old friends and new adventures.`;
    case 'celebration':
    case 'custom':
    default:
      return `You did it! ${config.occasionTitle}. You\u2019ve just walked across Liverpool solving clues like a true Scouser. Cheers to the occasion and the people who made it.`;
  }
}

export function generateHuntCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateHostId(): string {
  return Math.random().toString(36).slice(2, 12);
}

export type { CustomFinish };
