export type Theme = 'urban' | 'waterfront' | 'music' | 'hidden';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Length = 'short' | 'medium' | 'long';
export type OccasionType = 'birthday' | 'celebration' | 'farewell' | 'reunion' | 'custom';

export interface LocationClues {
  easy: string;
  medium: string;
  hard: string;
}

export interface HuntLocation {
  id: string;
  name: string;
  themes: Theme[];
  /** GPS coordinates for verification. */
  lat: number;
  lng: number;
  /** Approximate walking distance (meters) to Albert Dock, used for route ordering. */
  distanceToFinish: number;
  /** Short descriptor of what's there, used for clue flavour. */
  feature: string;
  /** Curated non-cheesy observational clues by difficulty. */
  clues: LocationClues;
  /** Optional reveal line shown after the player finds the spot. */
  reveal: string;
}

export interface HuntStop {
  index: number;
  location: HuntLocation;
  clue: string;
  isFinal: boolean;
}

export interface CustomFinish {
  name: string;
  lat: number;
  lng: number;
}

export interface HuntConfig {
  length: Length;
  theme: Theme;
  difficulty: Difficulty;
  /** ID of a preset location, or "custom" when using customFinish. */
  finishId: string;
  /** Present only when finishId === "custom". */
  customFinish?: CustomFinish;
  occasionType: OccasionType;
  celebrantName: string;
  occasionTitle: string;
  finalMessage: string;
  /** Set when loading from DB; not part of the setup form. */
  stop_ids?: string[];
}

export interface BuiltHunt {
  config: HuntConfig;
  stops: HuntStop[];
  finalMessage: string;
}

export type HuntStatus = 'lobby' | 'active' | 'finished';

export interface Team {
  id: string;
  hunt_id: string;
  name: string;
  color: string;
  created_at: string;
  finished_at: string | null;
  finish_time_ms: number | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  display_name: string;
  created_at: string;
}

export interface TeamStop {
  id: string;
  team_id: string;
  location_id: string;
  order_index: number;
  verified: boolean;
  verified_at: string | null;
}

export interface SideQuest {
  id: string;
  hunt_id: string;
  quest_key: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  points: number;
}

export interface TeamSideQuest {
  id: string;
  team_id: string;
  side_quest_id: string;
  completed: boolean;
  answer: string | null;
  completed_at: string | null;
}

export interface TeamWithMembers extends Team {
  team_members: TeamMember[];
  team_stops: TeamStop[];
  team_side_quests?: TeamSideQuest[];
}
