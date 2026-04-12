'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Message, Participant, Room, Session } from '@/lib/types';
import { playNotificationSound } from '@/lib/utils';

interface UseRoomOptions {
  session: Session | null;
  room: Room;
  myAlias: string | null;
  soundEnabled: boolean;
}

export function useRoom({ session, room, myAlias, soundEnabled }: UseRoomOptions) {
  const supabase = createClient();
  const [messages, setMessages]           = useState<Message[]>([]);
  const [participants, setParticipants]   = useState<Participant[]>([]);
  const [typingUsers, setTypingUsers]     = useState<string[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [isConnected, setIsConnected]     = useState(false);

  const loadParticipantCount = useCallback(async () => {
    if (!session) return;
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);
    setParticipantCount(count ?? 0);
  }, [session, supabase]);

  const loadTypingUsers = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('typing_indicators')
      .select('alias')
      .eq('session_id', session.id);
    setTypingUsers(
      (data ?? []).map((r) => r.alias as string).filter((a) => a !== myAlias)
    );
  }, [session, myAlias, supabase]);

  const loadReactions = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .eq('session_id', session.id);

    const map: Record<string, Record<string, { emoji: string; aliases: string[] }>> = {};
    (data ?? []).forEach((r) => {
      if (!map[r.message_id]) map[r.message_id] = {};
      if (!map[r.message_id][r.emoji]) map[r.message_id][r.emoji] = { emoji: r.emoji, aliases: [] };
      map[r.message_id][r.emoji].aliases.push(r.alias as string);
    });

    setMessages((prev) => prev.map((m) => ({ ...m, reactions: map[m.id] ?? {} })));
  }, [session, supabase]);

  useEffect(() => {
    if (!session) return;

    loadParticipantCount();

    const channel = supabase
      .channel(`room-${session.id}`, { config: { broadcast: { ack: true } } })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          if (soundEnabled && msg.alias !== myAlias) playNotificationSound();
          return [...prev, msg];
        });
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'messages',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as { id: string }).id));
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sessions',
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        const updated = payload.new as Session;
        if (updated.closed_at) setSessionClosed(true);
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'participants',
        filter: `session_id=eq.${session.id}`,
      }, loadParticipantCount)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'typing_indicators',
        filter: `session_id=eq.${session.id}`,
      }, loadTypingUsers)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'reactions',
        filter: `session_id=eq.${session.id}`,
      }, loadReactions)
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [session, supabase, myAlias, soundEnabled, loadParticipantCount, loadTypingUsers, loadReactions]);

  return { messages, setMessages, participants, participantCount, typingUsers, sessionClosed, isConnected };
}
