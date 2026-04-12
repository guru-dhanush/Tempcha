'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Zap, Clock, QrCode, WifiOff, SmilePlus, Flag, Volume2, VolumeX, Shield } from 'lucide-react';

// ── Alias generation ────────────────────────────────────────────────
const ADJECTIVES = ['Teal','Amber','Silver','Coral','Jade','Crimson','Azure','Golden','Violet','Sage','Rose','Onyx','Cobalt','Ivory','Scarlet'];
const ANIMALS    = ['Falcon','Wolf','Fox','Hawk','Lynx','Bear','Eagle','Tiger','Owl','Crane','Raven','Stag','Panda','Cobra','Lynx'];
const COLORS     = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#9333EA','#0284C7','#16A34A','#B45309','#DC2626'];
const EMOJIS     = ['👍','❤️','😂','😮','🔥','👏','💯','🙌'];

// ── Profanity filter (basic) ────────────────────────────────────────
const BAD_WORDS = ['spam','scam','abuse'];
function filterProfanity(text: string) {
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
}

function generateAlias() {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
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

function playNotification() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {}
}

interface Reaction { emoji: string; aliases: string[] }
interface Message {
  id: string;
  alias: string;
  alias_color: string;
  content: string;
  is_staff: boolean;
  created_at: string;
  reactions?: Record<string, Reaction>;
}

interface Props {
  room: any;
  session: any | null;
  initialMessages: Message[];
}

export function ChatRoomClient({ room, session, initialMessages }: Props) {
  const supabase = createClient();
  const [messages, setMessages]           = useState<Message[]>(initialMessages);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(session ? timeLeft(session.closes_at) : null);
  const [sessionExpired, setSessionExpired] = useState(!session);
  const [joined, setJoined]               = useState(false);
  const [myAlias, setMyAlias]             = useState<{ alias: string; color: string } | null>(null);
  const [typingUsers, setTypingUsers]     = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled]   = useState(true);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [reportedIds, setReportedIds]     = useState<Set<string>>(new Set());
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [rateLimited, setRateLimited]     = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isFirstRender.current ? 'instant' : 'smooth' });
    isFirstRender.current = false;
  }, [messages]);

  // Countdown
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const left = timeLeft(session.closes_at);
      setTimeRemaining(left);
      if (!left) { setSessionExpired(true); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Realtime subscriptions
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`room-${session.id}`)
      // Messages
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` }, payload => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          if (soundEnabled && newMsg.alias !== myAlias?.alias) playNotification();
          return [...prev, newMsg];
        });
      })
      // Participants
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('participants').select('*', { count: 'exact', head: true }).eq('session_id', session.id)
          .then(({ count }) => setParticipantCount(count ?? 0));
      })
      // Typing indicators
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_indicators', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('typing_indicators').select('alias').eq('session_id', session.id)
          .then(({ data }) => {
            const others = (data ?? []).map((r: any) => r.alias).filter((a: string) => a !== myAlias?.alias);
            setTypingUsers(others);
          });
      })
      // Reactions
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('reactions').select('*').eq('session_id', session.id).then(({ data }) => {
          const reactionMap: Record<string, Record<string, Reaction>> = {};
          (data ?? []).forEach((r: any) => {
            if (!reactionMap[r.message_id]) reactionMap[r.message_id] = {};
            if (!reactionMap[r.message_id][r.emoji]) reactionMap[r.message_id][r.emoji] = { emoji: r.emoji, aliases: [] };
            reactionMap[r.message_id][r.emoji].aliases.push(r.alias);
          });
          setMessages(prev => prev.map(m => ({ ...m, reactions: reactionMap[m.id] ?? {} })));
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, supabase, myAlias?.alias, soundEnabled]);

  const handleJoin = async (displayName?: string) => {
    const generated = generateAlias();
    const aliasData = displayName ? { alias: displayName, color: generated.color } : generated;
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    if (session) {
      await supabase.from('participants').insert({ session_id: session.id, alias: aliasData.alias, alias_color: aliasData.color, token });
    }
    setMyAlias(aliasData);
    setJoined(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleTyping = useCallback(() => {
    if (!session || !myAlias) return;
    supabase.from('typing_indicators').upsert({ session_id: session.id, alias: myAlias.alias, updated_at: new Date().toISOString() }, { onConflict: 'session_id,alias' });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      supabase.from('typing_indicators').delete().eq('session_id', session.id).eq('alias', myAlias.alias);
    }, 2500);
  }, [session, myAlias, supabase]);

  const sendMessage = async () => {
    if (!input.trim() || !session || !myAlias || sending || sessionExpired) return;
    // Rate limit: 1 message per 1.5 seconds
    const now = Date.now();
    if (now - lastMessageTime < 1500) { setRateLimited(true); setTimeout(() => setRateLimited(false), 1500); return; }
    setLastMessageTime(now);
    setSending(true);
    const content = filterProfanity(input.trim());
    setInput('');
    // Clear typing
    clearTimeout(typingTimer.current);
    supabase.from('typing_indicators').delete().eq('session_id', session.id).eq('alias', myAlias.alias);
    await supabase.from('messages').insert({ session_id: session.id, alias: myAlias.alias, alias_color: myAlias.color, content, is_staff: false });
    setSending(false);
    inputRef.current?.focus();
  };

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

  const handleReport = async (msg: Message) => {
    if (reportedIds.has(msg.id)) return;
    await supabase.from('reported_messages').insert({ message_id: msg.id, session_id: session?.id, reported_by_alias: myAlias?.alias ?? 'anonymous', message_content: msg.content, message_alias: msg.alias });
    setReportedIds(prev => new Set([...prev, msg.id]));
  };

  // ── NO SESSION ────────────────────────────────────────────────────
  if (!session || sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-muted">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{sessionExpired ? 'Session ended' : 'No active session'}</h2>
          <p className="text-muted-foreground text-sm">{room.name}</p>
          <p className="text-muted-foreground text-sm mt-2">
            {sessionExpired ? 'This session has expired. All messages have been deleted.' : 'The host hasn\'t opened a session yet. Check back soon.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5" /> Powered by FlashRoom
          </div>
        </div>
      </div>
    );
  }

  // ── JOIN SCREEN ──────────────────────────────────────────────────
  if (!joined) return <JoinScreen room={room} timeRemaining={timeRemaining} onJoin={handleJoin} />;

  // ── CHAT ─────────────────────────────────────────────────────────
  const isNearExpiry = timeRemaining && !timeRemaining.includes('h') && parseInt(timeRemaining) < 5;

  return (
    <div className="flex flex-col h-screen bg-background" onClick={() => setEmojiPickerMsgId(null)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: room.brand_color }}>
            {room.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{room.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              {participantCount} online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {timeRemaining && (
            <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs border ${isNearExpiry ? 'border-red-500/30 text-red-400' : 'border-border text-muted-foreground'}`}>
              <Clock className="w-3 h-3" /> {timeRemaining}
            </div>
          )}
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: myAlias?.color }} />
            {myAlias?.alias}
          </div>
        </div>
      </div>

      {/* Welcome banner */}
      {room.welcome_message && (
        <div className="mx-4 mt-3 rounded-lg px-4 py-2 text-sm text-center text-muted-foreground bg-muted border border-border">
          {room.welcome_message}
        </div>
      )}

      {/* Rate limit warning */}
      {rateLimited && (
        <div className="mx-4 mt-2 rounded-lg px-4 py-2 text-xs text-center text-amber-400 bg-amber-500/10 border border-amber-500/20">
          Slow down a little! Wait a moment before sending again.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            <QrCode className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hello!</p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.alias === myAlias?.alias;
          const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
          return (
            <div key={msg.id} className={`flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: msg.is_staff ? '#059669' : msg.alias_color }}>
                  {msg.is_staff ? '👤' : msg.alias.charAt(0)}
                </div>
              )}

              <div className={`max-w-[78%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Name + staff badge */}
                {!isMe && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-xs font-medium" style={{ color: msg.is_staff ? '#059669' : msg.alias_color }}>
                      {msg.alias}
                    </span>
                    {msg.is_staff && (
                      <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Staff
                      </span>
                    )}
                  </div>
                )}

                {/* Bubble + actions */}
                <div className={`relative flex items-end gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={isMe
                      ? { background: room.brand_color + '33', border: `1px solid ${room.brand_color}55`, color: 'inherit' }
                      : { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }
                    }>
                    {msg.content}
                  </div>

                  {/* Hover actions */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={e => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                      className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      title="React">
                      <SmilePlus className="w-3.5 h-3.5" />
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => handleReport(msg)}
                        className={`w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center transition-colors ${reportedIds.has(msg.id) ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}
                        title={reportedIds.has(msg.id) ? 'Reported' : 'Report message'}>
                        <Flag className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Emoji picker */}
                  {emojiPickerMsgId === msg.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className={`absolute bottom-full mb-2 z-50 flex gap-1 p-2 rounded-xl bg-card border border-border shadow-lg ${isMe ? 'right-0' : 'left-0'}`}>
                      {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                          className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {hasReactions && (
                  <div className={`flex flex-wrap gap-1 px-1 ${isMe ? 'justify-end' : ''}`}>
                    {Object.values(msg.reactions!).map(r => (
                      <button key={r.emoji} onClick={() => handleReaction(msg.id, r.emoji)}
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-all hover:scale-105 ${r.aliases.includes(myAlias?.alias ?? '') ? 'bg-primary/10 border-primary/30' : 'bg-muted border-border'}`}>
                        {r.emoji} <span className="text-muted-foreground">{r.aliases.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Time */}
                <span className="text-xs text-muted-foreground/50 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-card">
        {sessionExpired ? (
          <div className="text-center text-sm text-muted-foreground py-2">Session has ended — all messages deleted</div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-muted border border-border">
            <input
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message the room..."
              maxLength={500}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <span className="text-xs text-muted-foreground/40">{input.length}/500</span>
            <button onClick={sendMessage} disabled={!input.trim() || sending || sessionExpired}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-80 flex-shrink-0 text-white"
              style={{ background: room.brand_color }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground/40">
          <Zap className="w-3 h-3" /> Powered by FlashRoom · Messages auto-deleted on session end
        </div>
      </div>
    </div>
  );
}

// ── JOIN SCREEN ──────────────────────────────────────────────────────
function JoinScreen({ room, timeRemaining, onJoin }: { room: any; timeRemaining: string | null; onJoin: (name?: string) => void }) {
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl p-8 text-center bg-card border border-border shadow-lg">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white text-2xl font-bold"
            style={{ background: room.brand_color }}>
            {room.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold mb-1">{room.name}</h1>
          {room.description && <p className="text-muted-foreground text-sm mb-3">{room.description}</p>}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            <span className="text-sm text-muted-foreground">Session live {timeRemaining && `· ${timeRemaining} left`}</span>
          </div>
          {room.welcome_message && (
            <div className="rounded-lg px-4 py-3 mb-5 text-sm text-muted-foreground bg-muted border border-border">
              {room.welcome_message}
            </div>
          )}
          <div className="space-y-3">
            <button onClick={() => onJoin()}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 text-sm"
              style={{ background: room.brand_color }}>
              Join anonymously
            </button>
            {!showCustom ? (
              <button onClick={() => setShowCustom(true)}
                className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors border border-border hover:bg-muted">
                Use a display name
              </button>
            ) : (
              <div className="flex gap-2">
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="Your name..." maxLength={30} autoFocus
                  onKeyDown={e => e.key === 'Enter' && customName.trim() && onJoin(customName.trim())}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm bg-muted border border-border outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50" />
                <button onClick={() => customName.trim() && onJoin(customName.trim())} disabled={!customName.trim()}
                  className="px-4 rounded-xl text-white text-sm font-medium disabled:opacity-30 hover:opacity-90"
                  style={{ background: room.brand_color }}>Go</button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-muted-foreground/50">
            <Zap className="w-3 h-3" /> No account · Messages auto-delete
          </div>
        </div>
      </div>
    </div>
  );
}
