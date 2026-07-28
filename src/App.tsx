import { useState, useEffect, useCallback } from 'react';
import type { HuntConfig } from '@/hunt/types';
import { supabase } from '@/lib/supabase';
import { pickHuntStops, generateHuntCode, generateHostId, defaultFinalMessage } from '@/hunt/builder';
import HomeScreen from '@/components/HomeScreen';
import SetupScreen from '@/components/SetupScreen';
import LobbyScreen from '@/components/LobbyScreen';
import JoinScreen from '@/components/JoinScreen';
import HuntScreen from '@/components/HuntScreen';
import FinishScreen from '@/components/FinishScreen';

type Screen = 'home' | 'setup' | 'lobby' | 'join' | 'hunt' | 'finish';

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
  const [screen, setScreen] = useState<Screen>('home');
  const [huntState, setHuntState] = useState<HuntState | null>(null);
  const [joinState, setJoinState] = useState<JoinState | null>(null);
  const [joinCode, setJoinCode] = useState<string>('');

  // Check URL for join code on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) {
      setJoinCode(code.toUpperCase());
      setScreen('join');
    }
  }, []);

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

    setHuntState({
      huntId: (data as { id: string }).id,
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
    // Fetch the hunt config for this team's hunt
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
    setHuntState(null);
    setJoinState(null);
    setJoinCode('');
    setScreen('home');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const goSetup = () => setScreen('setup');

  // ---- Render ----
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

  return <HomeScreen onCreate={handleCreate} onJoin={handleJoin} />;
}

export default App;
