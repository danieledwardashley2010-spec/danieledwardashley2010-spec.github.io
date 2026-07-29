import type { Theme } from './types';

export type SideQuestCategory = 'photo' | 'trivia' | 'action' | 'creative' | 'social';

export interface SideQuestTemplate {
  key: string;
  title: string;
  description: string;
  prompt: string;
  category: SideQuestCategory;
  points: number;
  themes: Theme[];
}

/**
 * Pool of optional side quests. When a hunt is created, a handful are selected
 * (matching the hunt theme where possible) and stored on the hunt so every team
 * sees the same set. These are general scavenger hunt challenges that work in
 * any city or town.
 */
export const SIDE_QUEST_TEMPLATES: SideQuestTemplate[] = [
  {
    key: 'group-selfie',
    title: 'The Team Selfie',
    description: 'Get the whole team in frame at any stop.',
    prompt: 'Take a selfie with every team member in it at one of your stops. Show it at the finish for bonus points.',
    category: 'photo',
    points: 15,
    themes: ['urban', 'waterfront', 'music', 'hidden'],
  },
  {
    key: 'local-question',
    title: 'Ask a Local',
    description: 'Chat to a stranger and learn something new.',
    prompt: 'Ask a local a question about the area and write down their answer. Bring it to the finish.',
    category: 'social',
    points: 20,
    themes: ['urban', 'waterfront', 'music', 'hidden'],
  },
  {
    key: 'street-music',
    title: 'Find Live Music',
    description: 'Spot a busker or street musician.',
    prompt: 'Find someone playing music in the street. Note the song (or make a guess) and where you heard them.',
    category: 'action',
    points: 15,
    themes: ['music', 'urban'],
  },
  {
    key: 'oldest-building',
    title: 'Oldest Building',
    description: 'Find the oldest building you can.',
    prompt: 'Find the oldest building you pass on the route. Write its name or address and the date if you can spot one.',
    category: 'trivia',
    points: 20,
    themes: ['urban', 'hidden', 'music'],
  },
  {
    key: 'pub-sign',
    title: 'Animal Sign Hunt',
    description: 'Find a sign with an animal on it.',
    prompt: 'Find a shop, pub, or business sign that features an animal. Note the name of the place and the animal.',
    category: 'photo',
    points: 10,
    themes: ['urban', 'hidden'],
  },
  {
    key: 'water-reflection',
    title: 'Water Reflection',
    description: 'Capture water and sky in one shot.',
    prompt: 'Take a photo where water (river, lake, canal, fountain) and the sky both appear, with a reflection if you can.',
    category: 'photo',
    points: 15,
    themes: ['waterfront'],
  },
  {
    key: 'bird-spot',
    title: 'Bird Watcher',
    description: 'Spot and identify three different birds.',
    prompt: 'Spot three different types of birds during the hunt. Write down each one (or your best guess).',
    category: 'trivia',
    points: 10,
    themes: ['waterfront', 'urban', 'hidden'],
  },
  {
    key: 'street-art',
    title: 'Street Art Hunter',
    description: 'Find a piece of street art or a mural.',
    prompt: 'Find a mural, graffiti piece, or street art installation. Note the artist tag if signed.',
    category: 'photo',
    points: 15,
    themes: ['hidden', 'urban'],
  },
  {
    key: 'oldest-thing',
    title: 'Oldest Thing You Can Find',
    description: 'Spot the oldest dated thing you pass.',
    prompt: 'Find the oldest dated object you can (a cornerstone, a date on a building, a plaque, a statue). Write the date.',
    category: 'trivia',
    points: 20,
    themes: ['urban', 'hidden'],
  },
  {
    key: 'team-anthem',
    title: 'Team Anthem',
    description: 'Sing a line of a song together.',
    prompt: 'As a team, sing one line of any song out loud at a stop. Write the song and the line.',
    category: 'creative',
    points: 15,
    themes: ['music'],
  },
  {
    key: 'secret-handshake',
    title: 'Invent a Team Handshake',
    description: 'Make up a team greeting.',
    prompt: 'Invent a short team handshake or salute. Demonstrate it at the finish for bonus points.',
    category: 'creative',
    points: 10,
    themes: ['urban', 'waterfront', 'music', 'hidden'],
  },
  {
    key: 'dog-count',
    title: 'Dog Census',
    description: 'Count every dog you see on the route.',
    prompt: 'Count every dog you spot during the whole hunt. Write the final tally at the finish.',
    category: 'trivia',
    points: 10,
    themes: ['urban', 'waterfront', 'music', 'hidden'],
  },
  {
    key: 'statue-selfie',
    title: 'Statue Selfie',
    description: 'Take a selfie with a statue.',
    prompt: 'Find a statue or sculpture and take a team selfie with it. Note who or what the statue is of.',
    category: 'photo',
    points: 15,
    themes: ['urban', 'hidden'],
  },
  {
    key: 'flower-find',
    title: 'Flower Power',
    description: 'Photograph the most colourful flowers you find.',
    prompt: 'Find the most colourful flowers or garden you pass. Take a photo and note the colour.',
    category: 'photo',
    points: 10,
    themes: ['urban', 'waterfront', 'hidden'],
  },
  {
    key: 'bench-view',
    title: 'Best Bench View',
    description: 'Find the bench with the best view.',
    prompt: 'Find a public bench with a great view. Take a photo from the bench and describe what you can see.',
    category: 'photo',
    points: 10,
    themes: ['waterfront', 'urban', 'hidden'],
  },
  {
    key: 'team-cheer',
    title: 'Team War Cry',
    description: 'Invent a team chant.',
    prompt: 'Make up a short team chant or cheer (2-4 lines). Perform it at the finish for bonus points.',
    category: 'creative',
    points: 15,
    themes: ['urban', 'waterfront', 'music', 'hidden'],
  },
  {
    key: 'clock-find',
    title: 'Clock Watcher',
    description: 'Find a public clock and note the time.',
    prompt: 'Find a public clock (on a building, a tower, a stand). Note the time it shows and where you found it.',
    category: 'trivia',
    points: 10,
    themes: ['urban', 'hidden'],
  },
  {
    key: 'kindness-act',
    title: 'Random Act of Kindness',
    description: 'Do something nice for a stranger.',
    prompt: 'Do a small act of kindness for someone during the hunt (hold a door, give directions, pick up litter). Write what you did.',
    category: 'social',
    points: 20,
    themes: ['urban', 'waterfront', 'music', 'hidden'],
  },
  {
    key: 'bridge-photo',
    title: 'Bridge Crossing',
    description: 'Photograph a bridge from below.',
    prompt: 'Find a bridge and take a photo from underneath it. Note the name of the bridge if there is one.',
    category: 'photo',
    points: 15,
    themes: ['waterfront', 'urban'],
  },
  {
    key: 'funny-sign',
    title: 'Funny Sign Spotter',
    description: 'Find the funniest sign you can.',
    prompt: 'Find a sign that makes your team laugh (a shop name, a warning, a poster). Write what it says.',
    category: 'creative',
    points: 15,
    themes: ['urban', 'hidden', 'music'],
  },
];

/**
 * Pick a set of side quests for a hunt. Prefers themed quests, fills with general.
 */
export function pickSideQuests(theme: Theme, count = 4): SideQuestTemplate[] {
  const themed = SIDE_QUEST_TEMPLATES.filter((q) => q.themes.includes(theme));
  const general = SIDE_QUEST_TEMPLATES.filter((q) => !q.themes.includes(theme));
  const pool = [...themed, ...general];

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
