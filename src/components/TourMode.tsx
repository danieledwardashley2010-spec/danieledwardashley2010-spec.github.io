import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Compass,
  Users,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Play,
  Copy,
  Check,
  Share2,
  Star,
  Eye,
  Navigation,
  CheckCircle2,
  Crosshair,
  Trophy,
  Clock,
  Camera,
  Sparkles,
  Waves,
  Music,
  Footprints,
  Flag,
  PartyPopper,
  Plus,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Pencil,
  AlertCircle,
  Home,
  RotateCcw,
} from 'lucide-react';
import type { HuntConfig } from '@/hunt/types';
import { THEME_LABELS } from '@/hunt/builder';

/* ------------------------------------------------------------------ */
/*  Types & mock data                                                  */
/* ------------------------------------------------------------------ */

type TourStepId =
  | 'home'
  | 'setup'
  | 'lobby'
  | 'join'
  | 'hunt-clue'
  | 'hunt-gps'
  | 'hunt-quests'
  | 'finish';

interface TourStep {
  id: TourStepId;
  title: string;
  narration: string;
  duration: number;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'home',
    title: 'Welcome',
    narration: 'One person creates a hunt, teams join with a link, and GPS verifies every stop along the way.',
    duration: 5000,
  },
  {
    id: 'setup',
    title: 'Create your hunt',
    narration: 'Choose a length, a theme, how tricky the clues should be, where it finishes, and the occasion you are celebrating.',
    duration: 6500,
  },
  {
    id: 'lobby',
    title: 'Invite teams',
    narration: 'Share the invite link. Teams join from their own phones and everyone waits in the lobby until you press start.',
    duration: 6000,
  },
  {
    id: 'join',
    title: 'Teams join',
    narration: 'Players enter their name, pick or create a team, and they are in. Every team visits the same stops in a different order.',
    duration: 5500,
  },
  {
    id: 'hunt-clue',
    title: 'Follow the clues',
    narration: 'Each stop starts with a riddle. Stuck? Reveal where you are headed. The live leaderboard shows how every team is doing.',
    duration: 6500,
  },
  {
    id: 'hunt-gps',
    title: 'GPS verification',
    narration: 'When a team arrives, their phone confirms they are within range of the spot. No QR codes, no check-ins — just location.',
    duration: 5500,
  },
  {
    id: 'hunt-quests',
    title: 'Side quests',
    narration: 'Bonus challenges run alongside the hunt. Teams earn extra points by taking photos, spotting things, and being creative.',
    duration: 5500,
  },
  {
    id: 'finish',
    title: 'Results',
    narration: 'Everyone meets at the finish. The final standings show who came first, and a personalised message celebrates the occasion.',
    duration: 6000,
  },
];

const DEMO_CONFIG: HuntConfig = {
  length: 'medium',
  theme: 'urban',
  difficulty: 'medium',
  finishId: 'albert-dock',
  occasionType: 'birthday',
  celebrantName: 'Sam',
  occasionTitle: '30th',
  finalMessage:
    'You found it, Sam! Happy 30th. You have just walked across Liverpool solving clues like a true Scouser. Here is to a year of more adventures, more music, and more hidden corners worth finding.',
};

const DEMO_TEAMS = [
  { name: 'The Explorers', color: '#dc2626', players: ['Alex', 'Jordan', 'Sam'], verified: 3, total: 6, bonus: 15 },
  { name: 'City Roamers', color: '#2563eb', players: ['Priya', 'Tom'], verified: 2, total: 6, bonus: 0 },
  { name: 'Lost & Found', color: '#16a34a', players: ['Nia', 'Chris', 'Lee'], verified: 4, total: 6, bonus: 25 },
];

const DEMO_QUESTS = [
  { title: 'The Team Selfie', category: 'photo', points: 15, prompt: 'Take a selfie with every team member in it at one of your stops.', done: true, answer: 'Got it at stop 3!' },
  { title: 'Street Art Hunter', category: 'photo', points: 15, prompt: 'Find a mural or graffiti piece. Note the artist tag if signed.', done: false, answer: '' },
  { title: 'Dog Census', category: 'trivia', points: 10, prompt: 'Count every dog you spot during the whole hunt. Write the final tally.', done: false, answer: '' },
  { title: 'Funny Sign Spotter', category: 'creative', points: 15, prompt: 'Find a sign that makes your team laugh. Write what it says.', done: false, answer: '' },
];

const DEMO_CLUE =
  'A Roman-temple facade looms over the city\u2019s main rail station. Stand under its colonnade and listen for the echo under the vaulted ceiling.';
const DEMO_REVEAL_NAME = "St George's Hall";
const DEMO_REVEAL_TEXT = 'St George\u2019s Hall \u2014 one of the finest neo-classical buildings in Europe.';

/* ------------------------------------------------------------------ */
/*  Progress dots                                                      */
/* ------------------------------------------------------------------ */

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-6 bg-white' : i < current ? 'w-1.5 bg-white/60' : 'w-1.5 bg-white/25'
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Narration bar                                                      */
/* ------------------------------------------------------------------ */

function NarrationBar({
  step,
  isPaused,
  onTogglePause,
  onPrev,
  onNext,
  onSkip,
  progress,
}: {
  step: TourStep;
  isPaused: boolean;
  onTogglePause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  progress: number;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-stone-900/95 backdrop-blur">
      <div className="mx-auto max-w-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            title="Previous"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onTogglePause}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-stone-900 transition hover:bg-amber-300"
            title={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <div className="flex gap-1"><div className="h-3.5 w-1 rounded-sm bg-stone-900" /><div className="h-3.5 w-1 rounded-sm bg-stone-900" /></div>}
          </button>
          <button
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            title="Next"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">{step.title}</span>
              <button onClick={onSkip} className="text-xs font-medium text-stone-400 hover:text-white">
                Exit tour
              </button>
            </div>
            <p className="mt-0.5 text-sm text-stone-200">{step.narration}</p>
          </div>
        </div>

        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock phone frame                                                   */
/* ------------------------------------------------------------------ */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 px-4 py-8">
      <div className="relative w-full max-w-sm">
        <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-stone-700 bg-stone-50 shadow-2xl">
          <div className="absolute left-1/2 top-0 z-30 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-stone-700" />
          <div className="h-[600px] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Home                                                   */
/* ------------------------------------------------------------------ */

function MockHome() {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900">
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative px-6 py-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            Liverpool City Centre
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            The Liverpool Scavenger Hunt
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-stone-300">
            Build a multiplayer adventure across the city. One person sets it up, teams join with a link, and GPS verifies every stop.
          </p>
        </div>
      </div>

      <div className="px-5 py-8">
        <div className="grid gap-4">
          <div className="rounded-2xl border-2 border-stone-900 bg-white p-6 shadow-lg">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Compass className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold">Create a hunt</h2>
            <p className="mt-1.5 text-xs text-stone-600">
              Set up a scavenger hunt: choose a theme, difficulty, custom finish point, and occasion. Then invite teams to join.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-stone-900">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-stone-200 bg-white p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-stone-900">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold">Join a hunt</h2>
            <p className="mt-1.5 text-xs text-stone-600">
              Got an invite code from a friend? Enter it below to join their hunt as a team.
            </p>
            <div className="mt-3 rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-base font-bold tracking-widest text-stone-300">
              e.g. HUNT5
            </div>
            <div className="mt-3 rounded-xl bg-stone-900 py-3 text-center text-sm font-semibold text-white">
              Join
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Setup                                                  */
/* ------------------------------------------------------------------ */

function MockSetup() {
  const [length] = useState<HuntConfig['length']>('medium');
  const [theme] = useState<HuntConfig['theme']>('urban');
  const [difficulty] = useState<HuntConfig['difficulty']>('medium');
  const [occasion] = useState<HuntConfig['occasionType']>('birthday');

  const THEMES_UI = [
    { id: 'urban' as const, icon: Compass, label: 'Urban Adventure' },
    { id: 'waterfront' as const, icon: Waves, label: 'Waterfront' },
    { id: 'music' as const, icon: Music, label: 'Music & Culture' },
    { id: 'hidden' as const, icon: Eye, label: 'Hidden Corners' },
  ];

  return (
    <div className="min-h-full bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="flex items-center gap-1 text-xs font-medium text-stone-600">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </span>
          <h1 className="text-sm font-bold">Create your hunt</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Footprints className="h-3.5 w-3.5" />
            How long?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'short', label: 'Short', sub: '4 stops' },
              { id: 'medium', label: 'Medium', sub: '6 stops' },
              { id: 'long', label: 'Long', sub: '8 stops' },
            ].map((l) => (
              <div
                key={l.id}
                className={`rounded-xl border-2 p-3 text-center ${
                  length === l.id ? 'border-stone-900 bg-stone-900 text-white shadow' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="text-sm font-semibold">{l.label}</div>
                <div className={`text-[10px] ${length === l.id ? 'text-stone-300' : 'text-stone-500'}`}>{l.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Compass className="h-3.5 w-3.5" />
            What flavour of hunt?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {THEMES_UI.map((t) => (
              <div
                key={t.id}
                className={`rounded-xl border-2 p-3 ${
                  theme === t.id ? 'border-stone-900 bg-stone-900 text-white shadow' : 'border-stone-200 bg-white'
                }`}
              >
                <t.icon className="mb-1.5 h-5 w-5" />
                <div className="text-xs font-semibold">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Sparkles className="h-3.5 w-3.5" />
            How tricky?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'easy', label: 'Easy' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard', label: 'Hard' },
            ].map((d) => (
              <div
                key={d.id}
                className={`rounded-xl border-2 p-3 text-center ${
                  difficulty === d.id ? 'border-stone-900 bg-stone-900 text-white shadow' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="text-sm font-semibold">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Flag className="h-3.5 w-3.5" />
            Where should it finish?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border-2 border-stone-900 bg-stone-900 p-2.5 text-white shadow">
              <div className="text-xs font-semibold">Albert Dock</div>
            </div>
            <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-2.5 text-center">
              <Plus className="mx-auto mb-0.5 h-4 w-4" />
              <div className="text-xs font-semibold">Custom finish</div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <PartyPopper className="h-3.5 w-3.5" />
            What's the occasion?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'birthday', label: 'Birthday' },
              { id: 'celebration', label: 'Celebration' },
              { id: 'farewell', label: 'Farewell' },
            ].map((o) => (
              <div
                key={o.id}
                className={`rounded-xl border-2 p-2.5 text-center ${
                  occasion === o.id ? 'border-stone-900 bg-stone-900 text-white shadow' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="text-xs font-semibold">{o.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border-2 border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900">
              Sam
            </div>
            <div className="rounded-lg border-2 border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900">
              30th
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-stone-900 py-3.5 text-center text-sm font-semibold text-white shadow-lg">
          Create hunt &amp; open lobby
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Lobby                                                   */
/* ------------------------------------------------------------------ */

function MockLobby() {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="flex items-center gap-1 text-xs font-medium text-stone-600">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </span>
          <h1 className="text-sm font-bold">Hunt lobby</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-stone-300">Hunt code</div>
              <div className="mt-1 text-3xl font-bold tracking-widest">HUNT5</div>
            </div>
            <div className="text-right text-xs text-stone-300">
              <div>{THEME_LABELS.urban}</div>
              <div>medium · medium</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2.5 text-xs font-medium backdrop-blur">
              <Share2 className="h-3.5 w-3.5" />
              Share invite link
            </div>
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2.5 text-xs font-medium backdrop-blur">
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-stone-900">
            <Star className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-900">4 side quests included</div>
            <div className="text-[10px] text-stone-600">Bonus challenges teams can complete during the hunt for extra points.</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Users className="h-3.5 w-3.5" />
            Teams (3)
          </h2>
          <RefreshCw className="h-3.5 w-3.5 text-stone-400" />
        </div>

        <div className="mt-3 space-y-2.5">
          {DEMO_TEAMS.map((team) => (
            <div key={team.name} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-sm font-semibold">{team.name}</span>
                </div>
                <span className="text-xs text-stone-500">
                  {team.players.length} {team.players.length === 1 ? 'player' : 'players'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {team.players.map((p) => (
                  <span key={p} className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] text-stone-600">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-stone-100 p-3 text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              Finish: <strong className="text-stone-900">Albert Dock</strong> · Occasion: Birthday for Sam
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white shadow-lg">
          <Play className="h-4 w-4" />
          Start hunt (3 teams)
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Join                                                    */
/* ------------------------------------------------------------------ */

function MockJoin() {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="flex items-center gap-1 text-xs font-medium text-stone-600">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </span>
          <h1 className="text-sm font-bold">Join hunt HUNT5</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        <div>
          <span className="text-xs font-medium text-stone-700">Your name</span>
          <div className="mt-1 rounded-lg border-2 border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900">
            Priya
          </div>
        </div>

        <h2 className="mt-6 mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Users className="h-3.5 w-3.5" />
          Join an existing team
        </h2>
        <div className="space-y-2.5">
          {DEMO_TEAMS.slice(0, 2).map((team) => (
            <div
              key={team.name}
              className="flex w-full items-center justify-between rounded-xl border-2 border-stone-200 bg-white p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: team.color }} />
                <span className="text-sm font-semibold">{team.name}</span>
              </div>
              <span className="text-xs text-stone-500">
                {team.players.length} {team.players.length === 1 ? 'player' : 'players'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-stone-900 bg-white py-3.5 text-sm font-semibold text-stone-900">
          <Plus className="h-4 w-4" />
          Create a new team
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Hunt — clue                                            */
/* ------------------------------------------------------------------ */

function MockHuntClue() {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Compass className="h-4 w-4 text-stone-700" />
            The Explorers
          </div>
          <span className="text-[10px] font-medium text-stone-500">Leave</span>
        </div>
        <div className="px-4 pb-2.5">
          <div className="flex items-center justify-between text-[10px] text-stone-500">
            <span>Stop 4 of 6</span>
            <span>{THEME_LABELS.urban}</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-stone-900" style={{ width: '50%' }} />
          </div>
        </div>
      </header>

      <main className="px-4 py-5">
        <div className="mb-5 rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            <Users className="h-3 w-3" />
            Live standings
          </h3>
          <div className="space-y-1.5">
            {[
              { name: 'Lost & Found', color: '#16a34a', verified: 4, total: 6, bonus: 25, you: false },
              { name: 'The Explorers', color: '#dc2626', verified: 3, total: 6, bonus: 15, you: true },
              { name: 'City Roamers', color: '#2563eb', verified: 2, total: 6, bonus: 0, you: false },
            ].map((t, i) => (
              <div key={t.name} className="flex items-center gap-2.5">
                <span className={`w-4 text-xs font-bold ${i === 0 ? 'text-amber-500' : 'text-stone-400'}`}>{i + 1}</span>
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className={`flex-1 text-xs ${t.you ? 'font-bold' : 'text-stone-600'}`}>
                  {t.name} {t.you && '(you)'}
                </span>
                {t.bonus > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                    <Star className="h-2.5 w-2.5" />
                    {t.bonus}
                  </span>
                )}
                <span className="text-xs text-stone-500">{t.verified}/{t.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-5 text-white">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-stone-300">
              <MapPin className="h-3.5 w-3.5" />
              Clue 4
            </div>
            <p className="mt-2.5 text-base leading-relaxed">{DEMO_CLUE}</p>
          </div>
          <div className="p-5">
            <div className="animate-fadeIn">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">You're looking for</div>
              <div className="mt-1 text-xl font-bold text-stone-900">{DEMO_REVEAL_NAME}</div>
              <p className="mt-1.5 text-xs text-stone-600">{DEMO_REVEAL_TEXT}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border-2 border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
            <Crosshair className="h-4 w-4" />
            GPS verification
          </h3>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-stone-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <Navigation className="h-3.5 w-3.5" />
              Distance to target
            </div>
            <div className="text-base font-bold text-stone-900">320m</div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            We've found it
          </div>
          <p className="mt-2.5 text-center text-[10px] text-stone-400">
            Your phone's GPS checks you're within 50m of the spot.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Hunt — GPS success                                      */
/* ------------------------------------------------------------------ */

function MockHuntGps() {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Compass className="h-4 w-4 text-stone-700" />
            The Explorers
          </div>
          <span className="text-[10px] font-medium text-stone-500">Leave</span>
        </div>
        <div className="px-4 pb-2.5">
          <div className="flex items-center justify-between text-[10px] text-stone-500">
            <span>Stop 4 of 6</span>
            <span>{THEME_LABELS.urban}</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-stone-900" style={{ width: '50%' }} />
          </div>
        </div>
      </header>

      <main className="px-4 py-5">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-5 text-white">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-stone-300">
              <MapPin className="h-3.5 w-3.5" />
              Clue 4
            </div>
            <p className="mt-2.5 text-base leading-relaxed">{DEMO_CLUE}</p>
          </div>
          <div className="p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">You're looking for</div>
            <div className="mt-1 text-xl font-bold text-stone-900">{DEMO_REVEAL_NAME}</div>
            <p className="mt-1.5 text-xs text-stone-600">{DEMO_REVEAL_TEXT}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border-2 border-green-300 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
            <Crosshair className="h-4 w-4" />
            GPS verification
          </h3>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <Navigation className="h-3.5 w-3.5" />
              Distance to target
            </div>
            <div className="text-base font-bold text-green-600">28m</div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-green-50 p-2.5 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            You're at the spot! Tap verify to confirm.
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            Verify location
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Hunt — side quests                                     */
/* ------------------------------------------------------------------ */

function MockHuntQuests() {
  const [expanded] = useState(true);
  const CATEGORY_ICONS: Record<string, typeof Star> = {
    photo: Camera,
    trivia: Star,
    action: Compass,
    creative: Sparkles,
    social: Users,
  };

  return (
    <div className="min-h-full bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Compass className="h-4 w-4 text-stone-700" />
            The Explorers
          </div>
          <span className="text-[10px] font-medium text-stone-500">Leave</span>
        </div>
        <div className="px-4 pb-2.5">
          <div className="flex items-center justify-between text-[10px] text-stone-500">
            <span>Stop 4 of 6</span>
            <span>{THEME_LABELS.urban}</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-stone-900" style={{ width: '50%' }} />
          </div>
        </div>
      </header>

      <main className="px-4 py-5">
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
          <div className="flex w-full items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-stone-900">
                <Star className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-900">Side quests</div>
                <div className="text-[10px] text-stone-500">1/4 done · earn bonus points</div>
              </div>
            </div>
            <ChevronUp className="h-4 w-4 text-stone-400" />
          </div>

          {expanded && (
            <div className="space-y-2.5 px-4 pb-4">
              {DEMO_QUESTS.map((quest) => {
                const Icon = CATEGORY_ICONS[quest.category] ?? Star;
                return (
                  <div
                    key={quest.title}
                    className={`rounded-xl border-2 p-3 ${
                      quest.done ? 'border-green-300 bg-green-50' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                          quest.done ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-900">{quest.title}</span>
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              +{quest.points} pts
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-stone-600">{quest.prompt}</p>
                        </div>
                      </div>
                      {quest.done && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />}
                    </div>

                    {!quest.done && (
                      <div className="mt-2.5 flex gap-1.5">
                        <div className="flex-1 rounded-lg border-2 border-stone-200 bg-white px-2.5 py-1.5 text-[11px] text-stone-400">
                          Write your answer...
                        </div>
                        <div className="rounded-lg bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white">
                          Done
                        </div>
                      </div>
                    )}

                    {quest.done && quest.answer && (
                      <div className="mt-2 rounded-lg bg-green-50 px-2.5 py-1.5 text-[11px] text-green-800">
                        <span className="font-medium">Your answer:</span> {quest.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-xl bg-stone-100 p-3 text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>Finish: <strong className="text-stone-900">Albert Dock</strong></span>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock screen: Finish                                                  */
/* ------------------------------------------------------------------ */

function MockFinish() {
  const results = [
    { name: 'Lost & Found', color: '#16a34a', verified: 6, total: 6, finished: true, time: '15:42', rank: 1, you: false },
    { name: 'The Explorers', color: '#dc2626', verified: 6, total: 6, finished: true, time: '16:08', rank: 2, you: true },
    { name: 'City Roamers', color: '#2563eb', verified: 5, total: 6, finished: false, time: '', rank: 3, you: false },
  ];

  const rankSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
      <div className="px-5 py-10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-stone-900 shadow-2xl">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            30th for Sam!
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-stone-200">
            You found it, Sam! Happy 30th. You have just walked across Liverpool solving clues like a true Scouser.
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-white/5 p-5 text-center backdrop-blur">
          <div className="text-xs text-stone-300">Your team finished</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{rankSuffix(2)}</div>
          <div className="mt-1 text-xs text-stone-300">6 of 6 stops verified</div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/5 p-5 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-300">
            <Trophy className="h-3.5 w-3.5" />
            Final standings
          </h2>
          <div className="space-y-2.5">
            {results.map((r) => (
              <div
                key={r.name}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  r.you ? 'bg-white/15 ring-2 ring-amber-400' : 'bg-white/5'
                }`}
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  r.rank === 1 ? 'bg-amber-400 text-stone-900' : r.rank === 2 ? 'bg-stone-300 text-stone-900' : 'bg-amber-700 text-white'
                }`}>
                  {r.rank}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-sm font-semibold">{r.name}</span>
                    {r.you && <span className="text-[10px] text-amber-400">(you)</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2.5 text-xs text-stone-300">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {r.verified}/{r.total}
                    </span>
                    {r.finished && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.time}
                      </span>
                    )}
                  </div>
                </div>
                {r.finished && <CheckCircle2 className="h-4 w-4 text-green-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-400">
          <MapPin className="h-3.5 w-3.5" />
          Finished at Albert Dock · Liverpool City Centre
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-3 text-sm font-semibold text-stone-900">
            <RotateCcw className="h-4 w-4" />
            New hunt
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 py-3 text-sm font-semibold text-white backdrop-blur">
            <Home className="h-4 w-4" />
            Home
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main TourMode component                                             */
/* ------------------------------------------------------------------ */

interface Props {
  onExit: () => void;
}

export default function TourMode({ onExit }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const step = TOUR_STEPS[stepIndex];

  const advance = useCallback(() => {
    setStepIndex((prev) => {
      if (prev + 1 >= TOUR_STEPS.length) {
        onExit();
        return prev;
      }
      return prev + 1;
    });
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = performance.now();
  }, [onExit]);

  const goPrev = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = performance.now();
  }, []);

  const goNext = useCallback(() => {
    setStepIndex((prev) => {
      if (prev + 1 >= TOUR_STEPS.length) {
        onExit();
        return prev;
      }
      return prev + 1;
    });
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = performance.now();
  }, [onExit]);

  // Timer / progress loop
  useEffect(() => {
    if (isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = performance.now() - elapsedRef.current;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      elapsedRef.current = elapsed;
      const p = Math.min(elapsed / step.duration, 1);
      setProgress(p);

      if (p >= 1) {
        advance();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stepIndex, isPaused, step.duration, advance]);

  const renderScreen = () => {
    switch (step.id) {
      case 'home': return <MockHome />;
      case 'setup': return <MockSetup />;
      case 'lobby': return <MockLobby />;
      case 'join': return <MockJoin />;
      case 'hunt-clue': return <MockHuntClue />;
      case 'hunt-gps': return <MockHuntGps />;
      case 'hunt-quests': return <MockHuntQuests />;
      case 'finish': return <MockFinish />;
      default: return <MockHome />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-stone-900">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-stone-900">
            <Compass className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-white">Guided Tour</span>
        </div>
        <ProgressDots current={stepIndex} total={TOUR_STEPS.length} />
      </div>

      {/* Phone mock */}
      <div className="pt-12">
        <PhoneFrame>{renderScreen()}</PhoneFrame>
      </div>

      {/* Narration controls */}
      <NarrationBar
        step={step}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
        onPrev={goPrev}
        onNext={goNext}
        onSkip={onExit}
        progress={progress}
      />
    </div>
  );
}
