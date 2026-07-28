import { useState } from 'react';
import { MapPin, Compass, Waves, Music, Eye, Footprints, Sparkles, PartyPopper, ArrowLeft, Flag, Plus, Check } from 'lucide-react';
import type { Difficulty, HuntConfig, Length, OccasionType, Theme, CustomFinish } from '@/hunt/types';
import { THEME_LABELS, OCCASION_LABELS, defaultFinalMessage } from '@/hunt/builder';
import { LOCATIONS } from '@/hunt/locations';

interface Props {
  onCreate: (config: HuntConfig) => void;
  onBack: () => void;
}

const LENGTHS: { id: Length; label: string; stops: string }[] = [
  { id: 'short', label: 'Short', stops: '4 stops' },
  { id: 'medium', label: 'Medium', stops: '6 stops' },
  { id: 'long', label: 'Long', stops: '8 stops' },
];

const THEMES: { id: Theme; icon: typeof Compass; blurb: string }[] = [
  { id: 'urban', icon: Compass, blurb: 'Streets, squares and civic landmarks.' },
  { id: 'waterfront', icon: Waves, blurb: 'The Mersey, docks and Pier Head.' },
  { id: 'music', icon: Music, blurb: 'Beatles, venues and the city\u2019s sound.' },
  { id: 'hidden', icon: Eye, blurb: 'Quiet corners most people walk past.' },
];

const DIFFICULTIES: { id: Difficulty; label: string; blurb: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Direct clues, hard to miss.' },
  { id: 'medium', label: 'Medium', blurb: 'Observational hints, a bit of thought.' },
  { id: 'hard', label: 'Hard', blurb: 'Multi-step, detail-hunting clues.' },
];

const OCCASIONS: { id: OccasionType; label: string; placeholder: string }[] = [
  { id: 'birthday', label: 'Birthday', placeholder: '16th' },
  { id: 'celebration', label: 'Celebration', placeholder: 'New job' },
  { id: 'farewell', label: 'Farewell', placeholder: 'Goodbye' },
  { id: 'reunion', label: 'Reunion', placeholder: 'School reunion' },
  { id: 'custom', label: 'Custom', placeholder: 'Just for fun' },
];

export default function SetupScreen({ onCreate, onBack }: Props) {
  const [length, setLength] = useState<Length>('medium');
  const [theme, setTheme] = useState<Theme>('urban');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [finishId, setFinishId] = useState<string>('albert-dock');
  const [customFinish, setCustomFinish] = useState<CustomFinish>({ name: '', lat: 53.4005, lng: -2.9995 });
  const [occasionType, setOccasionType] = useState<OccasionType>('birthday');
  const [celebrantName, setCelebrantName] = useState('Daniel');
  const [occasionTitle, setOccasionTitle] = useState('16th');
  const [finalMessage, setFinalMessage] = useState('');

  const isCustomFinish = finishId === 'custom';
  const finishName = isCustomFinish
    ? (customFinish.name.trim() || 'Custom finish')
    : (LOCATIONS.find((l) => l.id === finishId)?.name ?? 'Albert Dock');

  const config: HuntConfig = {
    length,
    theme,
    difficulty,
    finishId,
    customFinish: isCustomFinish ? customFinish : undefined,
    occasionType,
    celebrantName: celebrantName.trim() || 'friend',
    occasionTitle: occasionTitle.trim() || OCCASION_LABELS[occasionType],
    finalMessage:
      finalMessage.trim() ||
      defaultFinalMessage({
        length,
        theme,
        difficulty,
        finishId,
        customFinish: isCustomFinish ? customFinish : undefined,
        occasionType,
        celebrantName: celebrantName.trim() || 'friend',
        occasionTitle: occasionTitle.trim() || OCCASION_LABELS[occasionType],
        finalMessage: '',
      }),
  };

  const canStart =
    celebrantName.trim().length > 0 &&
    (!isCustomFinish || (customFinish.name.trim().length > 0 && customFinish.lat !== 0 && customFinish.lng !== 0));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-lg font-bold">Create your hunt</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Section title="How long?" icon={Footprints}>
          <div className="grid grid-cols-3 gap-3">
            {LENGTHS.map((l) => (
              <OptionCard key={l.id} selected={length === l.id} onClick={() => setLength(l.id)} title={l.label} subtitle={l.stops} />
            ))}
          </div>
        </Section>

        <Section title="What flavour of hunt?" icon={Compass}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  theme === t.id ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <t.icon className="mb-2 h-6 w-6" />
                <div className="text-sm font-semibold">{THEME_LABELS[t.id]}</div>
                <div className={`mt-1 text-xs ${theme === t.id ? 'text-stone-300' : 'text-stone-500'}`}>{t.blurb}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="How tricky?" icon={Sparkles}>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <OptionCard key={d.id} selected={difficulty === d.id} onClick={() => setDifficulty(d.id)} title={d.label} subtitle={d.blurb} />
            ))}
          </div>
        </Section>

        <Section title="Where should it finish?" icon={Flag}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LOCATIONS.map((l) => (
              <button
                key={l.id}
                onClick={() => setFinishId(l.id)}
                className={`rounded-2xl border-2 p-3 text-left text-sm transition-all ${
                  finishId === l.id ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div className="font-semibold">{l.name}</div>
                <div className={`mt-0.5 text-xs ${finishId === l.id ? 'text-stone-300' : 'text-stone-500'}`}>
                  {l.themes.join(', ')}
                </div>
              </button>
            ))}
            <button
              onClick={() => setFinishId('custom')}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-3 text-center text-sm transition-all ${
                isCustomFinish ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-300 bg-white hover:border-stone-500'
              }`}
            >
              <Plus className="mb-1 h-5 w-5" />
              <div className="font-semibold">Custom finish</div>
              <div className={`mt-0.5 text-xs ${isCustomFinish ? 'text-stone-300' : 'text-stone-500'}`}>Pick any spot on the map</div>
            </button>
          </div>

          {isCustomFinish && (
            <div className="mt-4 rounded-2xl border-2 border-stone-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
                <MapPin className="h-4 w-4" />
                Custom finish point
              </div>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Name of the place</span>
                <input
                  value={customFinish.name}
                  onChange={(e) => setCustomFinish({ ...customFinish, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                  placeholder="e.g. The Grapes Pub, or Daniel's house"
                />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Latitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={customFinish.lat}
                    onChange={(e) => setCustomFinish({ ...customFinish, lat: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-stone-700">Longitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={customFinish.lng}
                    onChange={(e) => setCustomFinish({ ...customFinish, lng: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                  />
                </label>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Tip: right-click a spot on Google Maps and copy the coordinates. Liverpool city centre is around 53.405, -2.980.
              </p>
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setCustomFinish({ ...customFinish, lat: pos.coords.latitude, lng: pos.coords.longitude }),
                      () => {}
                    );
                  }
                }}
                className="mt-3 flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
              >
                <MapPin className="h-4 w-4" />
                Use my current location
              </button>
            </div>
          )}
        </Section>

        <Section title="What's the occasion?" icon={PartyPopper}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {OCCASIONS.map((o) => (
              <OptionCard
                key={o.id}
                selected={occasionType === o.id}
                onClick={() => setOccasionType(o.id)}
                title={o.label}
                subtitle=""
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Who's it for?</span>
              <input
                value={celebrantName}
                onChange={(e) => setCelebrantName(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                placeholder="Daniel"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Occasion title</span>
              <input
                value={occasionTitle}
                onChange={(e) => setOccasionTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                placeholder={OCCASIONS.find((o) => o.id === occasionType)?.placeholder}
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-stone-700">Final message (optional)</span>
            <textarea
              value={finalMessage}
              onChange={(e) => setFinalMessage(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
              placeholder="Leave blank to use a default message based on your occasion."
            />
          </label>
        </Section>

        <div className="mt-8 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>
              Finish: <strong className="text-stone-900">{finishName}</strong>
              {isCustomFinish && customFinish.lat !== 0 && (
                <span className="text-stone-500"> ({customFinish.lat.toFixed(4)}, {customFinish.lng.toFixed(4)})</span>
              )}
            </span>
          </div>
        </div>

        <button
          disabled={!canStart}
          onClick={() => onCreate(config)}
          className="mt-6 w-full rounded-2xl bg-stone-900 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create hunt & open lobby
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Compass; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, title, subtitle }: { selected: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-center transition-all ${
        selected ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-200 bg-white hover:border-stone-400'
      }`}
    >
      <div className="font-semibold">{title}</div>
      {subtitle && <div className={`mt-1 text-xs ${selected ? 'text-stone-300' : 'text-stone-500'}`}>{subtitle}</div>}
    </button>
  );
}
