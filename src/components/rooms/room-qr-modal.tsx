'use client';

import { useEffect, useRef } from 'react';
import { X, Download, ExternalLink, Copy, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import QRCode from 'qrcode';

interface Room {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  welcome_message: string | null;
}

interface Props {
  room: Room;
  onClose: () => void;
}

export function RoomQRModal({ room, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/r/${room.slug}` : `https://flashroom.io/r/${room.slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 240,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#00000000',
        },
      });
    }
  }, [url]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas with background and branding
    const output = document.createElement('canvas');
    output.width = 320;
    output.height = 380;
    const ctx = output.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0d0f1a';
    ctx.roundRect(0, 0, 320, 380, 20);
    ctx.fill();

    // Color accent bar
    ctx.fillStyle = room.brand_color;
    ctx.fillRect(0, 0, 320, 4);

    // QR code
    ctx.drawImage(canvas, 40, 40, 240, 240);

    // Room name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, 160, 320);

    // URL
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    ctx.fillText(`flashroom.io/r/${room.slug}`, 160, 345);

    // FlashRoom branding
    ctx.fillStyle = room.brand_color;
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('⚡ FlashRoom', 160, 368);

    const link = document.createElement('a');
    link.download = `flashroom-${room.slug}-qr.png`;
    link.href = output.toDataURL();
    link.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(224 30% 5% / 0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 14%)', boxShadow: `0 0 60px ${room.brand_color}22` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-left">{room.name}</h2>
            <p className="text-xs text-muted-foreground text-left">Permanent QR — never changes</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR canvas */}
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-2xl p-4 relative"
            style={{ background: 'hsl(224 25% 6%)', border: `2px solid ${room.brand_color}44` }}>
            <canvas ref={canvasRef} className="block" />
            {/* Center logo overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: room.brand_color }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* URL */}
        <div className="flex items-center gap-2 mb-5 rounded-xl px-3 py-2.5"
          style={{ background: 'hsl(224 25% 10%)', border: '1px solid hsl(224 20% 16%)' }}>
          <span className="text-sm text-muted-foreground truncate flex-1 text-left">
            flashroom.io/r/{room.slug}
          </span>
          <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="gap-2 border-white/10 hover:bg-white/5 text-sm"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
          <Button
            asChild
            className="gap-2 text-white border-0 text-sm hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}
          >
            <a href={`/r/${room.slug}`} target="_blank">
              <ExternalLink className="w-3.5 h-3.5" /> Open room
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Print this QR once. It always opens a fresh chat session.
        </p>
      </div>
    </div>
  );
}
