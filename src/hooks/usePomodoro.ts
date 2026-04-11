'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type PomodoroPhase = 'work' | 'break' | 'longBreak' | 'idle';

interface PomodoroState {
  phase: PomodoroPhase;
  secondsLeft: number;
  round: number;        // 현재 라운드 (1-4)
  totalRounds: number;
  isRunning: boolean;
  taskId: string | null;
}

const WORK_SEC      = 25 * 60;
const BREAK_SEC     = 5 * 60;
const LONG_BREAK_SEC = 15 * 60;
const TOTAL_ROUNDS   = 4;

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>({
    phase: 'idle',
    secondsLeft: WORK_SEC,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    isRunning: false,
    taskId: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 타이머 틱
  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.secondsLeft <= 1) {
          // 시간 종료 → 다음 단계
          playBeep();
          if (prev.phase === 'work') {
            if (prev.round >= TOTAL_ROUNDS) {
              return { ...prev, phase: 'longBreak', secondsLeft: LONG_BREAK_SEC, isRunning: true };
            }
            return { ...prev, phase: 'break', secondsLeft: BREAK_SEC, isRunning: true };
          } else if (prev.phase === 'break') {
            return { ...prev, phase: 'work', secondsLeft: WORK_SEC, round: prev.round + 1, isRunning: true };
          } else {
            // longBreak 종료
            return { ...prev, phase: 'idle', secondsLeft: WORK_SEC, round: 1, isRunning: false };
          }
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.isRunning]);

  const start = useCallback((taskId: string) => {
    setState({
      phase: 'work',
      secondsLeft: WORK_SEC,
      round: 1,
      totalRounds: TOTAL_ROUNDS,
      isRunning: true,
      taskId,
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => (prev.phase !== 'idle' ? { ...prev, isRunning: true } : prev));
  }, []);

  const stop = useCallback(() => {
    setState({
      phase: 'idle',
      secondsLeft: WORK_SEC,
      round: 1,
      totalRounds: TOTAL_ROUNDS,
      isRunning: false,
      taskId: null,
    });
  }, []);

  const skip = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'work') {
        if (prev.round >= TOTAL_ROUNDS) {
          return { ...prev, phase: 'longBreak', secondsLeft: LONG_BREAK_SEC };
        }
        return { ...prev, phase: 'break', secondsLeft: BREAK_SEC };
      } else if (prev.phase === 'break') {
        return { ...prev, phase: 'work', secondsLeft: WORK_SEC, round: prev.round + 1 };
      } else {
        return { ...prev, phase: 'idle', secondsLeft: WORK_SEC, round: 1, isRunning: false };
      }
    });
  }, []);

  return { ...state, start, pause, resume, stop, skip };
}

function playBeep() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* 무시 */ }
}
