'use client';

import { useState, useEffect } from 'react';
import { formatTimeLeft } from '@/lib/utils';

export function useCountdown(closesAt: string | null) {
  const [timeLeft, setTimeLeft]     = useState<string | null>(closesAt ? formatTimeLeft(closesAt) : null);
  const [isExpired, setIsExpired]   = useState(false);
  const [isWarning, setIsWarning]   = useState(false);

  useEffect(() => {
    if (!closesAt) return;

    const tick = () => {
      const left = formatTimeLeft(closesAt);
      setTimeLeft(left);
      if (!left) {
        setIsExpired(true);
        return;
      }
      const diffMs = new Date(closesAt).getTime() - Date.now();
      setIsWarning(diffMs < 5 * 60 * 1000); // under 5 minutes
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  return { timeLeft, isExpired, isWarning };
}
