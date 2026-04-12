'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Users, MessageSquare, Clock, Flag, Trash2, TrendingUp, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

interface Message { id: string; alias: string; alias_color: string; content: string; is_staff: boolean; created_at: string; }
interface Report { id: string; message_id: string; message_content: string; message_alias: string; reported_by_alias: string; created_at: string; }
interface SessionRecord { id: string; opened_at: string; closed_at: string | null; participant_count: number; message_count: number; }

interface Props {
  room: any;
  session: any | null;
  initialMessages: Message[];
  reports: Report[];
  allSessions: SessionRecord[];
}

export function AdminRoomView({ room, session, initialMessages, reports, allSessions }: Props) {
  const supabase = createClient();
  const [messages, setMessages]     = useState<Message[]>(initialMessages);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [participantCount, setParticipantCount] = useState(session ? 0 : 0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(session ? timeLeft(session.closes_at) : null);
  const [activeTab, setActiveTab]   = useState<'live' | 'analytics' | 'reports'>('live');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setTimeRemaining(timeLeft(session.closes_at)), 1000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    // Get initial participant count
    supabase.from('participants').select('*', { count: 'exact', head: true }).eq('session_id', session.id).then(({ count }) => setParticipantCount(count ?? 0));

    const channel = supabase.channel(`admin-${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.id}` }, payload => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new as Message]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('participants').select('*', { count: 'exact', head: true }).eq('session_id', session.id).then(({ count }) => setParticipantCount(count ?? 0));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_indicators', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('typing_indicators').select('alias').eq('session_id', session.id).then(({ data }) => setTypingUsers((data ?? []).map((r: any) => r.alias)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, supabase]);

  const sendStaffMessage = async () => {
    if (!input.trim() || !session || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    await supabase.from('messages').insert({ session_id: session.id, alias: 'Staff', alias_color: '#059669', content, is_staff: true });
    setSending(false);
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from('messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleCloseSession = async () => {
    if (!session || !confirm('Close this session? All messages will be deleted.')) return;
    await fetch(`/api/sessions/${session.id}/close`, { method: 'POST' });
    window.location.reload();
  };

  const handleOpenSession = async () => {
    await fetch(`/api/rooms/${room.id}/open-session`, { method: 'POST' });
    window.location.reload();
  };

  const totalMessages  = allSessions.reduce((s, sess) => s + (sess.message_count ?? 0), 0);
  const totalParticipants = allSessions.reduce((s, sess) => s + (sess.participant_count ?? 0), 0);
  const totalSessionsRun  = allSessions.filter(s => s.closed_at).length;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${session ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-muted-foreground bg-muted border-border'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${session ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            {session ? 'Session Live' : 'No Active Session'}
          </div>
          {session && timeRemaining && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5">
              <Clock className="w-3 h-3" /> {timeRemaining} left
            </div>
          )}
          {session && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5">
              <Users className="w-3 h-3" /> {participantCount} online
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/r/${room.slug}`} target="_blank">View as participant</Link>
          </Button>
          {session ? (
            <Button variant="destructive" size="sm" onClick={handleCloseSession}>Close session</Button>
          ) : (
            <Button size="sm" onClick={handleOpenSession}>Open session</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['live', 'analytics', 'reports'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab}
            {tab === 'reports' && reports.length > 0 && (
              <span className="ml-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">{reports.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* LIVE TAB */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live messages */}
          <div className="lg:col-span-2 flex flex-col rounded-lg border border-border bg-card overflow-hidden" style={{ height: '520px' }}>
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Live messages</span>
              <span className="text-xs text-muted-foreground ml-auto">{messages.length} messages</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!session && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <Zap className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>Open a session to see live messages</p>
                </div>
              )}
              {session && messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No messages yet. Waiting for participants...</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2 group">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: msg.is_staff ? '#059669' : msg.alias_color }}>
                    {msg.is_staff ? <Shield className="w-3.5 h-3.5" /> : msg.alias.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium" style={{ color: msg.is_staff ? '#059669' : msg.alias_color }}>{msg.alias}</span>
                      {msg.is_staff && <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">Staff</span>}
                      <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-sm text-foreground break-words">{msg.content}</div>
                  </div>
                  <button onClick={() => deleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-1 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {typingUsers.length > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Staff reply input */}
            <div className="p-3 border-t border-border">
              {session ? (
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2 bg-muted border border-border">
                    <Shield className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <input value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendStaffMessage(); } }}
                      placeholder="Reply as Staff..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
                  </div>
                  <Button size="sm" onClick={sendStaffMessage} disabled={!input.trim() || sending}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground">Open a session to reply</p>
              )}
            </div>
          </div>

          {/* Sidebar — session info */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Room info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">URL</span><span className="text-xs">/r/{room.slug}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{room.session_duration_minutes}m</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max participants</span><span>{room.max_participants}</span></div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">All-time stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'Sessions', value: allSessions.length }, { label: 'Participants', value: totalParticipants }, { label: 'Messages', value: totalMessages }, { label: 'Completed', value: totalSessionsRun }].map(stat => (
                  <div key={stat.label} className="rounded-lg bg-muted p-3">
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <MessageSquare className="w-5 h-5" />, label: 'Total sessions', value: allSessions.length },
              { icon: <Users className="w-5 h-5" />, label: 'Total participants', value: totalParticipants },
              { icon: <TrendingUp className="w-5 h-5" />, label: 'Total messages', value: totalMessages },
              { icon: <Clock className="w-5 h-5" />, label: 'Sessions completed', value: totalSessionsRun },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
                <div className="text-muted-foreground mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold">Session history</h3></div>
            <div className="divide-y divide-border">
              {allSessions.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No sessions yet</div>}
              {allSessions.map(sess => (
                <div key={sess.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{new Date(sess.opened_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-xs text-muted-foreground">{new Date(sess.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {sess.participant_count ?? 0}</div>
                    <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {sess.message_count ?? 0}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${sess.closed_at ? 'text-muted-foreground border-border' : 'text-green-400 bg-green-500/10 border-green-500/30'}`}>
                      {sess.closed_at ? 'Completed' : 'Live'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold">Reported messages</h3>
          </div>
          {reports.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-12">
              <Flag className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No reports. All clean!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reports.map(report => (
                <div key={report.id} className="px-4 py-3">
                  <div className="flex items-start gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-foreground mb-0.5">"{report.message_content}"</div>
                      <div className="text-xs text-muted-foreground">By <span className="text-foreground">{report.message_alias}</span> · Reported by {report.reported_by_alias}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
