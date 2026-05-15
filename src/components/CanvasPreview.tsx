import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

interface CanvasPreviewProps {
  image: HTMLImageElement | null;
  bleedSize: number; // in mm
  bleedType: 'color' | 'blur' | 'extend';
  layoutMode: 1 | 2 | 4;
  orientation: 'portrait' | 'landscape';
  showCutMarks: boolean;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export default function CanvasPreview({
  image,
  bleedSize,
  bleedType,
  layoutMode,
  orientation,
  showCutMarks,
  onCanvasReady
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominantColor, setDominantColor] = useState('#ffffff');

  // Multiplier from mm to pixels at 300 DPI (for high quality export)
  const MM_TO_PX = 11.811; 

  useEffect(() => {
    if (image) {
      extractDominantColor(image);
    }
  }, [image]);

  const extractDominantColor = (img: HTMLImageElement) => {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    ctx.drawImage(img, 0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    const hex = `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`;
    setDominantColor(hex);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A4 Dimensions: 210 x 297 mm
    const a4Width = orientation === 'portrait' ? 210 : 297;
    const a4Height = orientation === 'portrait' ? 297 : 210;

    canvas.width = a4Width * MM_TO_PX;
    canvas.height = a4Height * MM_TO_PX;

    // Background white (the paper)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bleedPx = bleedSize * MM_TO_PX;
    
    // Calculate layout grid
    const cols = layoutMode === 1 ? 1 : 2;
    const rows = layoutMode === 4 ? 2 : 1;
    
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    for (let i = 0; i < layoutMode; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;

      // Use a higher fill factor for 4-up (A6) to fit better
      const fillFactor = layoutMode === 4 ? 0.95 : 0.8;
      renderArtWithBleed(ctx, x, y, image, bleedPx, cellWidth * fillFactor, cellHeight * fillFactor);
    }

    onCanvasReady(canvas);
  }, [image, bleedSize, bleedType, layoutMode, orientation, showCutMarks, dominantColor]);

  const renderArtWithBleed = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    img: HTMLImageElement, 
    bleedPx: number,
    maxWidth: number,
    maxHeight: number
  ) => {
    // Calculate scaling to fit cell
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const w = img.width * scale;
    const h = img.height * scale;

    const x = centerX - w / 2;
    const y = centerY - h / 2;

    // 1. Draw Bleed Area
    ctx.save();
    const bleedRect = {
      x: x - bleedPx,
      y: y - bleedPx,
      w: w + bleedPx * 2,
      h: h + bleedPx * 2
    };

    if (bleedType === 'color') {
      ctx.fillStyle = dominantColor;
      ctx.fillRect(bleedRect.x, bleedRect.y, bleedRect.w, bleedRect.h);
    } else if (bleedType === 'blur') {
      const blurAmount = 3 * MM_TO_PX; // dynamic blur taking into account resolution
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(img, bleedRect.x, bleedRect.y, bleedRect.w, bleedRect.h);
      ctx.filter = 'none';
      // Fill gap if any
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = dominantColor;
      ctx.fillRect(bleedRect.x, bleedRect.y, bleedRect.w, bleedRect.h);
      ctx.globalCompositeOperation = 'source-over';
    } else if (bleedType === 'extend') {
      // Repeat edges (simplified as edge-stretched background)
      ctx.fillStyle = dominantColor;
      ctx.fillRect(bleedRect.x, bleedRect.y, bleedRect.w, bleedRect.h);
      ctx.drawImage(img, bleedRect.x, bleedRect.y, bleedRect.w, bleedRect.h);
    }

    // 2. Draw Original Image over bleed (the "safe" area)
    ctx.drawImage(img, x, y, w, h);

    // 3. Draw Crop Marks (Corner marks)
    if (showCutMarks) {
      const markLen = 5 * MM_TO_PX; // 5mm Length of crop marks
      const offset = 2 * MM_TO_PX;   // 2mm Offset from the trim line
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 * (MM_TO_PX / 3.78);
      ctx.setLineDash([]);

      // Top Left
      ctx.beginPath();
      ctx.moveTo(x, y - offset);
      ctx.lineTo(x, y - offset - markLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - offset, y);
      ctx.lineTo(x - offset - markLen, y);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(x + w, y - offset);
      ctx.lineTo(x + w, y - offset - markLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w + offset, y);
      ctx.lineTo(x + w + offset + markLen, y);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(x, y + h + offset);
      ctx.lineTo(x, y + h + offset + markLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - offset, y + h);
      ctx.lineTo(x - offset - markLen, y + h);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(x + w, y + h + offset);
      ctx.lineTo(x + w, y + h + offset + markLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w + offset, y + h);
      ctx.lineTo(x + w + offset + markLen, y + h);
      ctx.stroke();
    }

    ctx.restore();
  };

  return (
    <div className="relative flex justify-center items-center bg-slate-200 rounded-xl p-8 overflow-hidden min-h-[500px]">
      <canvas 
        ref={canvasRef} 
        className="canvas-container max-w-full max-h-full object-contain bg-white"
        style={{ width: 'auto', height: '100%' }}
      />
    </div>
  );
}
