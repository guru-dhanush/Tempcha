'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Zap, Clock, QrCode, WifiOff, SmilePlus, Flag, Volume2, VolumeX, Shield, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────
const ADJECTIVES = ['Teal','Amber','Silver','Coral','Jade','Crimson','Azure','Golden','Violet','Sage','Rose','Onyx','Cobalt','Ivory','Scarlet'];
const ANIMALS    = ['Falcon','Wolf','Fox','Hawk','Lynx','Bear','Eagle','Tiger','Owl','Crane','Raven','Stag','Panda','Viper','Bison'];
const COLORS     = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#9333EA','#0284C7','#16A34A','#B45309','#DC2626'];
const EMOJIS     = ['👍','❤️','😂','😮','🔥','👏','💯','🙌'];
const BAD_WORDS  = ['spam','scam'];

function filterProfanity(text: string) {
  return BAD_WORDS.reduce((t, w) => t.replace(new RegExp(w, 'gi'), '*'.repeat(w.length)), text);
}

function generateAlias() {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { alias: `${adj} ${animal}`, color };
}

function formatTime(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

// ── Types ──────────────────────────────────────────────────────────
interface Reaction { emoji: string; aliases: string[]; }
interface Message {
  id: string; alias: string; alias_color: string;
  content: string; is_staff: boolean; created_at: string;
  reactions?: Record<string, Reaction>;
  pinned?: boolean;
}
interface Props { room: any; session: any | null; initialMessages: Message[]; }

// ── Storage helpers (alias persistence) ───────────────────────────
function saveAlias(roomId: string, alias: { alias: string; color: string }, token: string) {
  try { localStorage.setItem(`fr_alias_${roomId}`, JSON.stringify({ alias, token })); } catch {}
}
function loadAlias(roomId: string) {
  try {
    const raw = localStorage.getItem(`fr_alias_${roomId}`);
    if (raw) return JSON.parse(raw) as { alias: { alias: string; color: string }; token: string };
  } catch {}
  return null;
}
function clearAlias(roomId: string) {
  try { localStorage.removeItem(`fr_alias_${roomId}`); } catch {}
}

// ── Main component ─────────────────────────────────────────────────
export function ChatRoomClient({ room, session, initialMessages }: Props) {
  const supabase = createClient();

  const [messages, setMessages]             = useState<Message[]>(initialMessages);
  const [input, setInput]                   = useState('');
  const [sending, setSending]               = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [timeRemaining, setTimeRemaining]   = useState<string | null>(session ? formatTime(session.closes_at) : null);
  const [sessionExpired, setSessionExpired] = useState(!session);
  const [joined, setJoined]                 = useState(false);
  const [myAlias, setMyAlias]               = useState<{ alias: string; color: string } | null>(null);
  const [myToken, setMyToken]               = useState<string | null>(null);
  const [typingUsers, setTypingUsers]       = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled]     = useState(true);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [reportedIds, setReportedIds]       = useState<Set<string>>(new Set());
  const [lastMsgTime, setLastMsgTime]       = useState(0);
  const [rateLimited, setRateLimited]       = useState(false);
  const [showScrollBtn, setShowScrollBtn]   = useState(false);
  const [newMsgCount, setNewMsgCount]       = useState(0);
  const [pinnedMessage, setPinnedMessage]   = useState<Message | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();
  const atBottom    = useRef(true);
  const firstLoad   = useRef(true);

  // ── Auto-rejoin from localStorage ─────────────────────────────
  useEffect(() => {
    if (!session) return;
    const saved = loadAlias(room.id);
    if (saved) {
      setMyAlias(saved.alias);
      setMyToken(saved.token);
      setJoined(true);
      // Re-register as participant in case session changed
      supabase.from('participants').upsert(
        { session_id: session.id, alias: saved.alias.alias, alias_color: saved.alias.color, token: saved.token },
        { onConflict: 'token' }
      );
    }
  }, [room.id, session]);

  // ── Scroll tracking ────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottom.current = nearBottom;
    setShowScrollBtn(!nearBottom);
    if (nearBottom) setNewMsgCount(0);
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || atBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: firstLoad.current ? 'instant' : 'smooth' });
      setNewMsgCount(0);
    } else {
      setNewMsgCount(n => n + 1);
    }
    firstLoad.current = false;
  }, []);

  // ── Countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const iv = setInterval(() => {
      const left = formatTime(session.closes_at);
      setTimeRemaining(left);
      if (!left) { setSessionExpired(true); clearAlias(room.id); clearInterval(iv); }
    }, 1000);
    return () => clearInterval(iv);
  }, [session, room.id]);

  // ── Realtime ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    // Initial participant count
    supabase.from('participants').select('*', { count: 'exact', head: true })
      .eq('session_id', session.id).then(({ count }) => setParticipantCount(count ?? 0));

    // Check for pinned message
    supabase.from('messages').select('*').eq('session_id', session.id).eq('pinned', true).maybeSingle()
      .then(({ data }) => { if (data) setPinnedMessage(data as Message); });

    const ch = supabase.channel(`room-${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` }, p => {
        const msg = p.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          if (soundEnabled && msg.alias !== myAlias?.alias) playPing();
          if (msg.pinned) setPinnedMessage(msg);
          return [...prev, msg];
        });
        scrollToBottom();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` }, p => {
        setMessages(prev => prev.filter(m => m.id !== (p.old as any).id));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` }, p => {
        const updated = p.new as Message;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        if (updated.pinned) setPinnedMessage(updated);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('participants').select('*', { count: 'exact', head: true })
          .eq('session_id', session.id).then(({ count }) => setParticipantCount(count ?? 0));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_indicators', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('typing_indicators').select('alias').eq('session_id', session.id)
          .then(({ data }) => setTypingUsers((data ?? []).map((r: any) => r.alias).filter((a: string) => a !== myAlias?.alias)));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('reactions').select('*').eq('session_id', session.id).then(({ data }) => {
          const map: Record<string, Record<string, Reaction>> = {};
          (data ?? []).forEach((r: any) => {
            if (!map[r.message_id]) map[r.message_id] = {};
            if (!map[r.message_id][r.emoji]) map[r.message_id][r.emoji] = { emoji: r.emoji, aliases: [] };
            map[r.message_id][r.emoji].aliases.push(r.alias);
          });
          setMessages(prev => prev.map(m => ({ ...m, reactions: map[m.id] ?? {} })));
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [session, supabase, myAlias?.alias, soundEnabled, scrollToBottom]);

  // ── Join ───────────────────────────────────────────────────────
  const handleJoin = async (displayName?: string) => {
    const generated = generateAlias();
    const aliasData = displayName ? { alias: displayName, color: generated.color } : generated;
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    if (session) {
      await supabase.from('participants').upsert(
        { session_id: session.id, alias: aliasData.alias, alias_color: aliasData.color, token },
        { onConflict: 'token' }
      );
    }
    saveAlias(room.id, aliasData, token);
    setMyAlias(aliasData); setMyToken(token); setJoined(true);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ── Typing ────────────────────────────────────────────────────
  const handleTyping = useCallback(() => {
    if (!session || !myAlias) return;
    supabase.from('typing_indicators').upsert({ session_id: session.id, alias: myAlias.alias, updated_at: new Date().toISOString() }, { onConflict: 'session_id,alias' });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      supabase.from('typing_indicators').delete().eq('session_id', session.id).eq('alias', myAlias.alias);
    }, 2500);
  }, [session, myAlias, supabase]);

  // ── Send ──────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !session || !myAlias || sending || sessionExpired) return;
    const now = Date.now();
    if (now - lastMsgTime < 1500) { setRateLimited(true); setTimeout(() => setRateLimited(false), 2000); return; }
    setLastMsgTime(now); setSending(true);
    const content = filterProfanity(input.trim());
    setInput('');
    clearTimeout(typingTimer.current);
    supabase.from('typing_indicators').delete().eq('session_id', session.id).eq('alias', myAlias.alias);
    await supabase.from('messages').insert({ session_id: session.id, alias: myAlias.alias, alias_color: myAlias.color, content, is_staff: false });
    setSending(false);
    inputRef.current?.focus();
  };

  // ── React ─────────────────────────────────────────────────────
  const handleReaction = async (msgId: string, emoji: string) => {
    if (!myAlias || !session) return;
    setEmojiPickerMsgId(null);
    const msg = messages.find(m => m.id === msgId);
    const alreadyReacted = msg?.reactions?.[emoji]?.aliases?.includes(myAlias.alias);
    if (alreadyReacted) {
      await supabase.from('reactions').delete().eq('message_id', msgId).eq('alias', myAlias.alias).eq('emoji', emoji);
    } else {
      await supabase.from('reactions').upsert({ message_id: msgId, session_id: session.id, emoji, alias: myAlias.alias }, { onConflict: 'message_id,alias,emoji' });
    }
  };

  // ── Report ────────────────────────────────────────────────────
  const handleReport = async (msg: Message) => {
    if (reportedIds.has(msg.id) || !session) return;
    await supabase.from('reported_messages').insert({ message_id: msg.id, session_id: session.id, reported_by_alias: myAlias?.alias ?? 'anonymous', message_content: msg.content, message_alias: msg.alias });
    setReportedIds(prev => new Set([...prev, msg.id]));
  };

  // ── NO SESSION STATE ──────────────────────────────────────────
  if (!session || sessionExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background gap-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-muted">
            <WifiOff className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {sessionExpired ? 'Session ended' : 'No session yet'}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-1 font-medium">{room.name}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {sessionExpired
              ? 'This chat session has closed. All messages have been permanently deleted — nothing was saved.'
              : 'The host hasn\'t opened this session yet. Scan again when it\'s live or check back soon.'}
          </p>
          {/* Privacy reassurance */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60 bg-muted rounded-lg px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
            FlashRoom never stores your messages permanently
          </div>
        </div>
      </div>
    );
  }

  // ── JOIN SCREEN ───────────────────────────────────────────────
  if (!joined) return <JoinScreen room={room} timeRemaining={timeRemaining} onJoin={handleJoin} />;

  // ── CHAT ──────────────────────────────────────────────────────
  const isWarning = timeRemaining && !timeRemaining.includes('h') && !timeRemaining.includes('m') ||
    (timeRemaining && timeRemaining.includes('m') && parseInt(timeRemaining) <= 5 && !timeRemaining.includes('h'));

  return (
    <div className="flex flex-col h-[100dvh] bg-background" onClick={() => setEmojiPickerMsgId(null)}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: room.brand_color }}>
            {room.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{room.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              {participantCount} online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {timeRemaining && (
            <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium border ${isWarning ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-border text-muted-foreground'}`}>
              <Clock className="w-3 h-3" /> {timeRemaining}
            </div>
          )}
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={soundEnabled ? 'Mute' : 'Unmute'}>
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-lg px-2 py-1 max-w-[120px]">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: myAlias?.color }} />
            <span className="truncate">{myAlias?.alias}</span>
          </div>
        </div>
      </div>

      {/* Warning banner — session expiring */}
      {isWarning && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 text-center flex-shrink-0">
          ⚠️ Session ending soon — messages will be permanently deleted
        </div>
      )}

      {/* Pinned message */}
      {pinnedMessage && (
        <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-start gap-2 flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-green-400 font-medium mb-0.5 flex items-center gap-1"><PinIcon className="w-3 h-3" /> Pinned by Staff</div>
            <div className="text-xs text-foreground truncate">{pinnedMessage.content}</div>
          </div>
        </div>
      )}

      {/* Welcome message */}
      {room.welcome_message && (
        <div className="mx-4 mt-2 rounded-lg px-3 py-2 text-xs text-center text-muted-foreground bg-muted border border-border flex-shrink-0">
          {room.welcome_message}
        </div>
      )}

      {/* Rate limit warning */}
      {rateLimited && (
        <div className="mx-4 mt-2 rounded-lg px-3 py-2 text-xs text-center text-amber-400 bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
          Sending too fast — wait a moment ⏱️
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 relative">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-16">
            <QrCode className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">No messages yet</p>
            <p className="text-xs mt-1 opacity-60">Be the first to say something!</p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.alias === myAlias?.alias;
          const reactions = msg.reactions ?? {};
          const hasReactions = Object.keys(reactions).length > 0;
          return (
            <div key={msg.id} className={`flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mb-1"
                  style={{ background: msg.is_staff ? '#059669' : msg.alias_color }}>
                  {msg.is_staff ? <Shield className="w-3.5 h-3.5" /> : msg.alias.charAt(0)}
                </div>
              )}

              <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Name */}
                {!isMe && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-xs font-semibold" style={{ color: msg.is_staff ? '#059669' : msg.alias_color }}>{msg.alias}</span>
                    {msg.is_staff && <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> Staff</span>}
                  </div>
                )}

                {/* Bubble */}
                <div className={`relative flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words max-w-full ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={isMe
                      ? { background: room.brand_color + '28', border: `1px solid ${room.brand_color}40` }
                      : { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }
                    }>
                    {msg.pinned && <PinIcon className="w-3 h-3 mr-1 inline text-muted-foreground" />}
                    {msg.content}
                  </div>

                  {/* Action buttons on hover */}
                  <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row-reverse' : ''}`}>
                    <button onClick={e => { e.stopPropagation(); setEmojiPickerMsgId(prev => prev === msg.id ? null : msg.id); }}
                      className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                      <SmilePlus className="w-3 h-3" />
                    </button>
                    {!isMe && (
                      <button onClick={() => handleReport(msg)}
                        className={`w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center transition-colors shadow-sm ${reportedIds.has(msg.id) ? 'text-red-400 border-red-500/30' : 'text-muted-foreground hover:text-red-400'}`}>
                        <Flag className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Emoji picker */}
                  {emojiPickerMsgId === msg.id && (
                    <div onClick={e => e.stopPropagation()}
                      className={`absolute bottom-full mb-2 z-50 flex gap-1 p-2 rounded-xl bg-card border border-border shadow-xl ${isMe ? 'right-8' : 'left-8'}`}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => handleReaction(msg.id, e)}
                          className="text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted hover:scale-125 transition-all">
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {hasReactions && (
                  <div className={`flex flex-wrap gap-1 px-1 ${isMe ? 'justify-end' : ''}`}>
                    {Object.values(reactions).map(r => (
                      <button key={r.emoji} onClick={() => handleReaction(msg.id, r.emoji)}
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-all hover:scale-105 active:scale-95 ${r.aliases.includes(myAlias?.alias ?? '') ? 'bg-primary/10 border-primary/30 font-medium' : 'bg-muted border-border'}`}>
                        {r.emoji} <span className="text-muted-foreground">{r.aliases.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-muted-foreground/40 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 ml-9">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people typing...`}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button onClick={() => { scrollToBottom(true); }}
          className="absolute bottom-24 right-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-white shadow-lg border border-border/50 transition-all"
          style={{ background: room.brand_color }}>
          <RefreshCw className="w-3 h-3" />
          {newMsgCount > 0 ? `${newMsgCount} new` : 'Scroll down'}
        </button>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t bg-card flex-shrink-0">
        {sessionExpired ? (
          <div className="text-center text-sm text-muted-foreground py-2">Session ended — messages deleted</div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-muted border border-border focus-within:border-primary transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Message the room..."
                maxLength={500}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 min-w-0"
              />
              {input.length > 400 && <span className="text-xs text-muted-foreground/50 flex-shrink-0">{500 - input.length}</span>}
              <button onClick={sendMessage}
                disabled={!input.trim() || sending || sessionExpired}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-80 active:scale-95 flex-shrink-0 text-white"
                style={{ background: room.brand_color }}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-muted-foreground/35">
              <ShieldCheck className="w-3 h-3" /> Messages auto-deleted when session ends · No account needed
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── JOIN SCREEN ────────────────────────────────────────────────────
function JoinScreen({ room, timeRemaining, onJoin }: { room: any; timeRemaining: string | null; onJoin: (name?: string) => void }) {
  const [customName, setCustomName] = useState('');
  const [mode, setMode]             = useState<'choose' | 'named'>('choose');
  const [loading, setLoading]       = useState(false);

  const join = async (name?: string) => {
    setLoading(true);
    await onJoin(name);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-5 bg-background">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
          {/* Color bar */}
          <div className="h-1.5" style={{ background: room.brand_color }} />

          <div className="p-7 text-center">
            {/* Room icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold"
              style={{ background: room.brand_color }}>
              {room.name.charAt(0).toUpperCase()}
            </div>

            <h1 className="text-xl font-bold mb-1">{room.name}</h1>
            {room.description && <p className="text-muted-foreground text-sm mb-3">{room.description}</p>}

            {/* Live indicator */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-3 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">
                Session live {timeRemaining && `· ${timeRemaining} left`}
              </span>
            </div>

            {/* Welcome message */}
            {room.welcome_message && (
              <div className="rounded-xl px-4 py-3 mb-5 text-sm text-muted-foreground bg-muted border border-border text-left">
                💬 {room.welcome_message}
              </div>
            )}

            {/* Privacy badges — key trust builders */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { icon: '🔒', label: 'No account needed' },
                { icon: '👤', label: 'Stay anonymous' },
                { icon: '🗑️', label: 'Auto-deleted' },
              ].map(badge => (
                <div key={badge.label} className="rounded-xl bg-muted border border-border px-2 py-2.5 text-center">
                  <div className="text-base mb-1">{badge.icon}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{badge.label}</div>
                </div>
              ))}
            </div>

            {/* Join options */}
            {mode === 'choose' && (
              <div className="space-y-2.5">
                <button onClick={() => join()}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] text-sm disabled:opacity-60"
                  style={{ background: room.brand_color }}>
                  {loading ? 'Joining...' : '⚡ Join anonymously'}
                </button>
                <button onClick={() => setMode('named')}
                  className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors border border-border hover:bg-muted active:scale-[0.98]">
                  Use a display name instead
                </button>
              </div>
            )}

            {mode === 'named' && (
              <div className="space-y-2.5">
                <input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Your name or nickname..."
                  maxLength={30}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && customName.trim() && join(customName.trim())}
                  className="w-full rounded-xl px-3.5 py-3 text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
                />
                <button onClick={() => join(customName.trim())} disabled={!customName.trim() || loading}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] text-sm disabled:opacity-50"
                  style={{ background: room.brand_color }}>
                  {loading ? 'Joining...' : 'Join as ' + (customName.trim() || '...')}
                </button>
                <button onClick={() => setMode('choose')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"><ChevronLeft className="w-3.5 h-3.5 inline" /> Back</button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-muted/40 border-t border-border flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            Powered by FlashRoom · Your messages disappear when this session ends
          </div>
        </div>
      </div>
    </div>
  );
}
