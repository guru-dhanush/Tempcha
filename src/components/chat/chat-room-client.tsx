'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Zap, Users, Clock, QrCode, WifiOff } from 'lucide-react';

const ADJECTIVES = ['Teal','Amber','Silver','Coral','Jade','Crimson','Azure','Golden','Violet','Sage','Rose','Onyx'];
const ANIMALS    = ['Falcon','Wolf','Fox','Hawk','Lynx','Bear','Eagle','Tiger','Owl','Crane','Raven','Stag'];
const COLORS     = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#DC2626','#7C3AED','#9333EA','#0284C7','#16A34A'];

function generateAlias() {
  const adj   = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { alias: `${adj} ${animal}`, color };
}

function timeLeft(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface Message {
  id: string;
  alias: string;
  alias_color: string;
  content: string;
  is_staff: boolean;
  created_at: string;
}

interface Props {
  room: any;
  session: any | null;
  initialMessages: Message[];
}

export function ChatRoomClient({ room, session, initialMessages }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(session ? timeLeft(session.closes_at) : null);
  const [sessionExpired, setSessionExpired] = useState(!session);
  const [joined, setJoined] = useState(false);
  const [myAlias, setMyAlias] = useState<{ alias: string; color: string } | null>(null);
  const [myToken, setMyToken] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const left = timeLeft(session.closes_at);
      setTimeRemaining(left);
      if (!left) {
        setSessionExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Supabase realtime subscription
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`room-${session.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${session.id}`,
      }, () => {
        // Refresh participant count
        supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)
          .then(({ count }) => setParticipantCount(count ?? 0));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, supabase]);

  const handleJoin = async (displayName?: string) => {
    const generated = generateAlias();
    const aliasData = displayName
      ? { alias: displayName, color: generated.color }
      : generated;

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    if (session) {
      await supabase.from('participants').insert({
        session_id: session.id,
        alias: aliasData.alias,
        alias_color: aliasData.color,
        token,
      });
    }

    setMyAlias(aliasData);
    setMyToken(token);
    setJoined(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || !myAlias || sending || sessionExpired) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    await supabase.from('messages').insert({
      session_id: session.id,
      alias: myAlias.alias,
      alias_color: myAlias.color,
      content,
      is_staff: false,
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── NO ACTIVE SESSION ───────────────────────────────────────────
  if (!session || sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(224 30% 5%)' }}>
        <div className="orb orb-purple w-96 h-96 top-0 left-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${room.brand_color}22`, border: `1px solid ${room.brand_color}44` }}>
            <WifiOff className="w-8 h-8" style={{ color: room.brand_color }} />
          </div>
          <h2 className="text-xl font-semibold mb-2">{sessionExpired ? 'Session ended' : 'No active session'}</h2>
          <p className="text-muted-foreground text-sm mb-1">{room.name}</p>
          <p className="text-muted-foreground text-sm">
            {sessionExpired
              ? 'This chat session has expired. All messages have been deleted.'
              : 'The room admin hasn\'t opened a session yet. Check back soon.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            Powered by FlashRoom
          </div>
        </div>
      </div>
    );
  }

  // ── JOIN SCREEN ──────────────────────────────────────────────────
  if (!joined) {
    return (
      <JoinScreen room={room} session={session} timeRemaining={timeRemaining} onJoin={handleJoin} />
    );
  }

  // ── CHAT ROOM ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen" style={{ background: 'hsl(224 30% 5%)' }}>
      <div className="orb orb-purple w-96 h-96 -top-20 -right-20 opacity-20 pointer-events-none fixed" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b relative z-10"
        style={{ background: 'hsl(224 25% 7% / 0.9)', borderColor: 'hsl(224 20% 12%)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${room.brand_color}22`, border: `1px solid ${room.brand_color}44` }}>
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <div className="font-semibold text-sm">{room.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>{participantCount} online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {timeRemaining && (
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs"
              style={{ background: 'hsl(224 25% 10%)', border: '1px solid hsl(224 20% 16%)' }}>
              <Clock className="w-3 h-3 text-purple-400" />
              <span className={Number(timeRemaining.replace(/[^0-9]/g,'')) < 300 && !timeRemaining.includes('h') ? 'text-red-400' : 'text-muted-foreground'}>
                {timeRemaining}
              </span>
            </div>
          )}
          <div className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
            style={{ background: 'hsl(224 25% 10%)', border: '1px solid hsl(224 20% 16%)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: myAlias?.color }} />
            <span className="text-muted-foreground">{myAlias?.alias}</span>
          </div>
        </div>
      </div>

      {/* Welcome banner */}
      {room.welcome_message && (
        <div className="mx-4 mt-3 rounded-xl px-4 py-2.5 text-sm text-center text-muted-foreground"
          style={{ background: `${room.brand_color}11`, border: `1px solid ${room.brand_color}22` }}>
          {room.welcome_message}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative z-10">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <QrCode className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.alias === myAlias?.alias;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: msg.alias_color }}>
                  {msg.alias.charAt(0)}
                </div>
              )}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMe && (
                  <span className="text-xs px-1" style={{ color: msg.alias_color }}>{msg.alias}</span>
                )}
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                  style={isMe
                    ? { background: `${room.brand_color}30`, border: `1px solid ${room.brand_color}40`, color: 'hsl(210 20% 92%)' }
                    : { background: 'hsl(224 25% 10%)', border: '1px solid hsl(224 20% 15%)', color: 'hsl(210 20% 88%)' }
                  }>
                  {msg.content}
                </div>
                <span className="text-xs text-muted-foreground/50 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t relative z-10"
        style={{ background: 'hsl(224 25% 7% / 0.9)', borderColor: 'hsl(224 20% 12%)', backdropFilter: 'blur(12px)' }}>
        {sessionExpired ? (
          <div className="text-center text-sm text-muted-foreground py-2">Session has ended — messages deleted</div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
            style={{ background: 'hsl(224 25% 10%)', border: '1px solid hsl(224 20% 16%)' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message the room..."
              maxLength={500}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${room.brand_color}, hsl(220 100% 60%))` }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground/40">
          <Zap className="w-3 h-3" />
          Powered by FlashRoom · Messages deleted when session ends
        </div>
      </div>
    </div>
  );
}

function JoinScreen({ room, session, timeRemaining, onJoin }: {
  room: any; session: any; timeRemaining: string | null; onJoin: (name?: string) => void;
}) {
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(224 30% 5%)' }}>
      <div className="orb orb-purple w-96 h-96 top-10 left-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="orb orb-blue w-64 h-64 bottom-20 right-10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 13%)', boxShadow: '0 0 60px hsl(258 100% 65% / 0.08)' }}>

          {/* Room badge */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: `${room.brand_color}22`, border: `1px solid ${room.brand_color}44` }}>
            <span className="text-3xl">⚡</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">{room.name}</h1>
          {room.description && (
            <p className="text-muted-foreground text-sm mb-2">{room.description}</p>
          )}

          {/* Session status */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Session active {timeRemaining && `· ${timeRemaining} remaining`}
            </span>
          </div>

          {/* Welcome message */}
          {room.welcome_message && (
            <div className="rounded-xl px-4 py-3 mb-6 text-sm text-muted-foreground"
              style={{ background: `${room.brand_color}11`, border: `1px solid ${room.brand_color}22` }}>
              {room.welcome_message}
            </div>
          )}

          {/* Join actions */}
          <div className="space-y-3">
            <button
              onClick={() => onJoin()}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 text-sm"
              style={{ background: `linear-gradient(135deg, ${room.brand_color}, hsl(220 100% 60%))` }}
            >
              Join anonymously
            </button>

            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors border border-white/10 hover:bg-white/5"
              >
                Use a display name instead
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Your name..."
                  maxLength={30}
                  onKeyDown={e => e.key === 'Enter' && customName.trim() && onJoin(customName.trim())}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-purple-500/50"
                  autoFocus
                />
                <button
                  onClick={() => customName.trim() && onJoin(customName.trim())}
                  disabled={!customName.trim()}
                  className="px-4 rounded-xl text-white text-sm font-medium disabled:opacity-30 hover:opacity-90"
                  style={{ background: `${room.brand_color}` }}
                >
                  Join
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-muted-foreground/50">
            <Zap className="w-3 h-3" />
            No account needed · Messages auto-delete
          </div>
        </div>
      </div>
    </div>
  );
}
