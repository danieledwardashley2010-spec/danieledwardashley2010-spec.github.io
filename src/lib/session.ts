import type { HuntConfig } from '@/hunt/types';

const HOST_KEY = 'huntHostSession';
const PLAYER_KEY = 'huntPlayerSession';

export interface HostSession {
  huntId: string;
  huntCode: string;
  hostId: string;
  config: HuntConfig;
}

export interface PlayerSession {
  teamId: string;
  teamName: string;
  memberId: string;
  huntId: string;
  huntCode: string;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveHostSession(s: HostSession): void {
  localStorage.setItem(HOST_KEY, JSON.stringify(s));
}

export function loadHostSession(): HostSession | null {
  return safeParse<HostSession>(localStorage.getItem(HOST_KEY));
}

export function clearHostSession(): void {
  localStorage.removeItem(HOST_KEY);
}

export function savePlayerSession(s: PlayerSession): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(s));
}

export function loadPlayerSession(): PlayerSession | null {
  return safeParse<PlayerSession>(localStorage.getItem(PLAYER_KEY));
}

export function clearPlayerSession(): void {
  localStorage.removeItem(PLAYER_KEY);
}
