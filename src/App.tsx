import { useState, useEffect, useCallback } from 'react';
import type { HuntConfig } from '@/hunt/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { pickHuntStops, generateHuntCode, generateHostId, defaultFinalMessage } from '@/hunt/builder';
import { seedSideQuests } from '@/lib/hostApi';
import {
  saveHostSession,
  loadHostSession,
  clearHostSession,
  savePlayerSession,
  loadPlayerSession,
  clearPlayerSession,
} from '@/lib/session';
import InstallPrompt from '@/components/InstallPrompt';
import AuthScreen from '@/components/AuthScreen';
import HomeScreen from '@/components/HomeScreen';
import CompetitionsScreen from '@/components/CompetitionsScreen';
import SetupScreen from '@/components/SetupScreen';
import LobbyScreen from '@/components/LobbyScreen';
import JoinScreen from '@/components/JoinScreen';
import HuntScreen from '@/components/HuntScreen';
import FinishScreen from '@/components/FinishScreen';
import TourMode from '@/components/TourMode';

type Screen = 'home' | 'setup' | 'lobby' | 'join' | 'hunt' | 'finish' | 'competitions';

interface HuntState {
  huntId: string;
  huntCode: string;
  hostId: string;
  config: HuntConfig;
}

interface JoinState {
  teamId: string;
  teamName: string;
  memberId: string;
  config: HuntConfig;
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [huntState, setHuntState] = useState<HuntState | null>(null);
  const [joinState, setJoinState] = useState<JoinState | null>(null);
  const [joinCode, setJoinCode] = useState<string>('');
  const [restoring, setRestoring] = useState(true);
  const [tourMode, setTourMode] = useState(false);

  // ---- Restore session on mount (reload / phone off / phone back on) ----
  useEffect(() => {
    const restore = async () => {
      // First check URL for join code
      const params = new URLSearchParams(window.location.search);
      const code = params.get('join');
      if (code) {
        setJoinCode(code.toUpperCase());
        setScreen('join');
        setRestoring(false);
        return;
      }

      // Try restoring a player session
      const playerSession = loadPlayerSession();
      if (playerSession) {
        const restored = await restoreHunt(
          playerSession.huntId,
          playerSession.huntCode,
          '',
          playerSession.teamId,
          playerSession.teamName,
          playerSession.memberId
        );
        if (restored) {
          setRestoring(false);
          return;
        }
        clearPlayerSession();
      }

      // Try restoring a host session
      const hostSession = loadHostSession();
      if (hostSession) {
        const restored = await restoreHunt(
          hostSession.huntId,
          hostSession.huntCode,
          hostSession.hostId,
          '',
          '',
          ''
        );
        if (restored) {
          setRestoring(false);
          return;
        }
        clearHostSession();
      }

      setRestoring(false);
    };
    restore();
  }, []);

  const restoreHunt = async (
    huntId: string,
    huntCode: string,
    hostId: string,
    teamId: string,
    teamName: string,
    memberId: string
  ): Promise<boolean> => {
    const { data: huntData, error } = await supabase
      .from('hunts')
      .select('config, status')
      .eq('id', huntId)
      .maybeSingle();

    if (error || !huntData) return false;

    const config = (huntData as { config: HuntConfig }).config;
    const status = (huntData as { status: string }).status;

    setHuntState({ huntId, huntCode, hostId, config });

    if (teamId) {
      setJoinState({ teamId, teamName, memberId, config });
    }

    if (status === 'active') {
      setScreen('hunt');
    } else if (status === 'finished') {
      setScreen('finish');
    } else {
      setScreen('lobby');
    }
    return true;
  };

  // ---- Host flow ----
  const handleCreate = () => setScreen('setup');

  const handleSetupComplete = async (config: HuntConfig) => {
    const code = generateHuntCode();
    const hostId = generateHostId();
    localStorage.setItem('huntHostId', hostId);

    const stopPool = pickHuntStops(config);
    const stopIds = stopPool.map((l) => l.id);

    const finalConfig: HuntConfig = {
      ...config,
      finalMessage: config.finalMessage || defaultFinalMessage(config),
      stop_ids: stopIds,
    };

    const { data, error } = await supabase
      .from('hunts')
      .insert({
        code,
        host_id: hostId,
        config: finalConfig as unknown as Record<string, unknown>,
        stop_ids: stopIds,
        status: 'lobby',
      })
      .select()
      .maybeSingle();

    if (error || !data) {
      console.error('Failed to create hunt:', error);
      return;
    }

    const newHuntId = (data as { id: string }).id;

    // Seed side quests for this hunt
    await seedSideQuests(newHuntId, finalConfig);

    saveHostSession({ huntId: newHuntId, huntCode: code, hostId, config: finalConfig });

    setHuntState({
      huntId: newHuntId,
      huntCode: code,
      hostId,
      config: finalConfig,
    });
    setScreen('lobby');
  };

  const handleHuntStarted = useCallback(() => {
    setScreen('hunt');
  }, []);

  // ---- Join flow ----
  const handleJoin = (code: string) => {
    setJoinCode(code);
    setScreen('join');
  };

  const handleJoined = async (teamId: string, teamName: string, memberId: string) => {
    const { data: teamData } = await supabase
      .from('teams')
      .select('hunt_id')
      .eq('id', teamId)
      .maybeSingle();
    if (!teamData) return;
    const huntId = (teamData as { hunt_id: string }).hunt_id;

    const { data: huntData } = await supabase
      .from('hunts')
      .select('config, status')
      .eq('id', huntId)
      .maybeSingle();
    if (!huntData) return;

    const config = (huntData as { config: HuntConfig }).config;
    const status = (huntData as { status: string }).status;

    setJoinState({ teamId, teamName, memberId, config });
    setHuntState({
      huntId,
      huntCode: joinCode,
      hostId: '',
      config,
    });

    savePlayerSession({ teamId, teamName, memberId, huntId, huntCode: joinCode });

    if (status === 'active') {
      setScreen('hunt');
    } else if (status === 'finished') {
      setScreen('finish');
    } else {
      setScreen('lobby');
    }
  };

  // ---- Player in lobby (non-host) ----
  const handleLobbyStart = useCallback(() => {
    setScreen('hunt');
  }, []);

  // ---- Hunt finished ----
  const handleFinish = useCallback(() => {
    setScreen('finish');
  }, []);

  // ---- Navigation helpers ----
  const goHome = () => {
    clearHostSession();
    clearPlayerSession();
    setHuntState(null);
    setJoinState(null);
    setJoinCode('');
    setScreen(user ? 'competitions' : 'home');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const goSetup = () => setScreen('setup');

  // ---- Render ----
  if (authLoading || restoring) {
    return (
      <div className="min-h-safe bg-stone-50 text-stone-900">
        <div className="flex min-h-screen items-center justify-center text-stone-400">Loading...</div>
      </div>
    );
  }

  // Not signed in: show auth screen, but still allow join-by-code
  if (!user && screen === 'join') {
    return <JoinScreen huntCode={joinCode} onJoined={handleJoined} onBack={goHome} />;
  }

  if (!user && screen !== 'home' && screen !== 'competitions') {
    if (screen === 'setup') {
      // Allow setup without auth (single hunt mode)
    } else if (screen === 'lobby' || screen === 'hunt' || screen === 'finish') {
      // Allow playing without auth (join-by-code flow)
    } else {
      setScreen('home');
    }
  }

  if (screen === 'finish' && huntState) {
    return (
      <FinishScreen
        huntId={huntState.huntId}
        config={huntState.config}
        teamId={joinState?.teamId ?? ''}
        onRestart={goSetup}
        onHome={goHome}
      />
    );
  }

  if (screen === 'hunt' && huntState) {
    return (
      <HuntScreen
        huntId={huntState.huntId}
        teamId={joinState?.teamId ?? ''}
        teamName={joinState?.teamName ?? 'Team'}
        memberId={joinState?.memberId ?? ''}
        config={huntState.config}
        onFinish={handleFinish}
        onLeave={goHome}
      />
    );
  }

  if (screen === 'lobby' && huntState) {
    const isHost = huntState.hostId === localStorage.getItem('huntHostId');
    return (
      <LobbyScreen
        huntId={huntState.huntId}
        huntCode={huntState.huntCode}
        hostId={huntState.hostId}
        config={huntState.config}
        isHost={isHost}
        onBack={goHome}
        onStart={isHost ? handleHuntStarted : handleLobbyStart}
      />
    );
  }

  if (screen === 'join') {
    return <JoinScreen huntCode={joinCode} onJoined={handleJoined} onBack={goHome} />;
  }

  if (screen === 'setup') {
    return <SetupScreen onCreate={handleSetupComplete} onBack={goHome} />;
  }

  if (tourMode) {
    return <TourMode onExit={() => setTourMode(false)} />;
  }

  // Signed in: show competitions dashboard
  if (user) {
    return (
      <>
        <CompetitionsScreen
          onCreateHunt={handleCreate}
          onJoinHunt={handleJoin}
          onStartTour={() => setTourMode(true)}
        />
        <InstallPrompt />
      </>
    );
  }

  // Not signed in: show home screen with sign-in option
  return (
    <>
      {screen === ('competitions' as Screen) ? (
        <AuthScreen onBack={goHome} />
      ) : (
        <HomeScreen
          onCreate={handleCreate}
          onJoin={handleJoin}
          onStartTour={() => setTourMode(true)}
          onSignIn={() => setScreen('competitions' as Screen)}
        />
      )}
      <InstallPrompt />
    </>
  );
}

export default App;
