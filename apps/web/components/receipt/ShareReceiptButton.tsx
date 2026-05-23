'use client';

import { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ShareReceiptButtonProps {
  orderNo?: string;
  shopName?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

function addWatermark(dataUrl: string, text: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(16, Math.floor(width / 14));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const angle = -Math.PI / 6;
      const textWidth = ctx.measureText(text).width;
      const stepX = textWidth + fontSize * 3;
      const stepY = fontSize * 5;

      ctx.save();
      ctx.rotate(angle);
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Blob creation failed'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

export default function ShareReceiptButton({
  orderNo,
  shopName,
  variant = 'secondary',
  className = '',
}: ShareReceiptButtonProps) {
  const [capturing, setCapturing] = useState(false);

  const handleShare = async () => {
    setCapturing(true);
    try {
      const el = document.getElementById('receipt-container');
      if (!el) return;

      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const blob = shopName
        ? await addWatermark(dataUrl, shopName)
        : await (await fetch(dataUrl)).blob();

      const fileName = `小票-${orderNo || 'receipt'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: '消费小票',
            files: [file],
          });
          return;
        } catch {
          // User cancelled share sheet
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to share receipt:', err);
    } finally {
      setCapturing(false);
    }
  };

  const baseClass =
    variant === 'primary'
      ? 'flex items-center justify-center gap-1.5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50'
      : 'flex items-center justify-center gap-1.5 py-2.5 border rounded-md text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50';

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={capturing}
      className={`${baseClass} ${className}`}
    >
      {capturing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      {capturing ? '生成中...' : '分享'}
    </button>
  );
}
