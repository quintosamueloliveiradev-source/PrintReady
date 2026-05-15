import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface CanvasPreviewRef {
  getPrintDataURL: () => string;
}

interface CanvasPreviewProps {
  image: HTMLImageElement | null;
  bleedSize: number; // in mm
  bleedType: 'color' | 'blur' | 'extend';
  layoutMode: 1 | 2 | 4;
  orientation: 'portrait' | 'landscape';
  showCutMarks: boolean;
  showTrimLine: boolean;
  showSafeMargin: boolean;
  showBleedMargin: boolean;
}

export default forwardRef<CanvasPreviewRef, CanvasPreviewProps>(function CanvasPreview({
  image,
  bleedSize,
  bleedType,
  layoutMode,
  orientation,
  showCutMarks,
  showTrimLine,
  showSafeMargin,
  showBleedMargin
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominantColor, setDominantColor] = useState('#ffffff');

  // Multiplier from mm to pixels at 300 DPI (for high quality export)
  const MM_TO_PX = 11.811; 

  useImperativeHandle(ref, () => ({
    getPrintDataURL: () => {
      const offscreen = document.createElement('canvas');
      const ctx = offscreen.getContext('2d');
      if (ctx && image) {
        renderCanvas(offscreen, ctx, true);
        return offscreen.toDataURL('image/jpeg', 1.0);
      }
      return '';
    }
  }));

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

  const renderCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isExport: boolean) => {
    if (!image) return;

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
      
      let x = col * cellWidth + cellWidth / 2;
      let y = row * cellHeight + cellHeight / 2;

      let finalMaxWidth = cellWidth * 0.8;
      let finalMaxHeight = cellHeight * 0.8;

      if (layoutMode === 4) {
        // Configure sizes to make them slightly smaller to balance the gap
        finalMaxWidth = cellWidth * 0.90;
        finalMaxHeight = cellHeight * 0.90;
      }
      
      renderArtWithBleed(ctx, x, y, image, bleedPx, finalMaxWidth, finalMaxHeight, isExport);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCanvas(canvas, ctx, false);
  }, [
    image, 
    bleedSize, 
    bleedType, 
    layoutMode, 
    orientation, 
    showCutMarks, 
    showTrimLine,
    showSafeMargin,
    showBleedMargin,
    dominantColor
  ]);

  const renderArtWithBleed = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    img: HTMLImageElement, 
    bleedPx: number,
    maxWidth: number,
    maxHeight: number,
    isExport: boolean
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

    // 2. Draw Original Image over bleed (the "trim" area)
    ctx.drawImage(img, x, y, w, h);

    // 3. Draw Crop Marks (Corner marks) - Exported & Previewed
    if (showCutMarks) {
      const markLen = 2 * MM_TO_PX; // 2mm Length of crop marks
      const offset = bleedPx + (1 * MM_TO_PX); // Start 1mm outside the bleed area
      
      // Professional lines, made thicker for better visibility
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5 * (MM_TO_PX / 3.78); // ~1.5pt width for better visibility
      ctx.setLineDash([]);

      const drawMark = (startX: number, startY: number, endX: number, endY: number) => {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      };

      // Top Left
      drawMark(x, y - offset, x, y - offset - markLen); // Top vertical
      drawMark(x - offset, y, x - offset - markLen, y); // Left horizontal

      // Top Right
      drawMark(x + w, y - offset, x + w, y - offset - markLen); // Top vertical
      drawMark(x + w + offset, y, x + w + offset + markLen, y); // Right horizontal

      // Bottom Left
      drawMark(x, y + h + offset, x, y + h + offset + markLen); // Bottom vertical
      drawMark(x - offset, y + h, x - offset - markLen, y + h); // Left horizontal

      // Bottom Right
      drawMark(x + w, y + h + offset, x + w, y + h + offset + markLen); // Bottom vertical
      drawMark(x + w + offset, y + h, x + w + offset + markLen, y + h); // Right horizontal
    }
    
    // 4. Draw Visual Guides (Preview Only)
    if (!isExport) {
      // Trim Line Box (Black, exact cut)
      if (showTrimLine) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1.5 * (MM_TO_PX / 3.78);
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(x, y, w, h);
      }

      // Bleed Margin Box (Red, outside trim)
      if (showBleedMargin) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // text-red-500
        ctx.lineWidth = 2 * (MM_TO_PX / 3.78);
        ctx.setLineDash([15, 10]);
        ctx.strokeRect(bleedRect.x, bleedRect.y, bleedRect.w, bleedRect.h);
      }

      // Safe Margin Box (Blue, 3mm inside trim)
      if (showSafeMargin) {
        const safeMarginPx = 3 * MM_TO_PX;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // text-blue-500
        ctx.lineWidth = 1.5 * (MM_TO_PX / 3.78);
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(x + safeMarginPx, y + safeMarginPx, w - safeMarginPx * 2, h - safeMarginPx * 2);
      }
      ctx.setLineDash([]); // Reset dash
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
});
