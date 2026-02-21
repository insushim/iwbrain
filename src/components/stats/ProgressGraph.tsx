"use client";

import { useRef, useEffect, useState } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface ProgressGraphProps {
  data: DataPoint[];
  color: string;
  height?: number;
}

export default function ProgressGraph({
  data,
  color,
  height = 200,
}: ProgressGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0 || data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = containerWidth;
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    const paddingLeft = 10;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 30;
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

    const points = data.map((d, i) => ({
      x: paddingLeft + (data.length > 1 ? i * stepX : chartW / 2),
      y: paddingTop + chartH - (d.value / maxVal) * chartH,
    }));

    // Animation
    const progress = 0;
    let animFrame: number;

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const ctx2 = ctx!;

      // Grid lines
      for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (chartH / 4) * i;
        ctx2.beginPath();
        ctx2.moveTo(paddingLeft, y);
        ctx2.lineTo(w - paddingRight, y);
        ctx2.strokeStyle = "rgba(200, 200, 200, 0.3)";
        ctx2.lineWidth = 1;
        ctx2.stroke();
      }

      if (points.length < 2) {
        // Single point
        const p = points[0];
        const py = paddingTop + chartH - (paddingTop + chartH - p.y) * t;
        ctx2.beginPath();
        ctx2.arc(p.x, py, 4, 0, Math.PI * 2);
        ctx2.fillStyle = color;
        ctx2.fill();

        // X label
        ctx2.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx2.fillStyle = "#888";
        ctx2.textAlign = "center";
        ctx2.fillText(data[0].label, p.x, h - 8);
        if (t < 1) {
          animFrame = requestAnimationFrame(() => draw(Math.min(t + 0.04, 1)));
        }
        return;
      }

      // Animate points
      const animatedPoints = points.map((p) => ({
        x: p.x,
        y: paddingTop + chartH - (paddingTop + chartH - p.y) * t,
      }));

      // Filled area
      ctx2.beginPath();
      ctx2.moveTo(animatedPoints[0].x, paddingTop + chartH);
      for (let i = 0; i < animatedPoints.length; i++) {
        if (i === 0) {
          ctx2.lineTo(animatedPoints[i].x, animatedPoints[i].y);
        } else {
          const prev = animatedPoints[i - 1];
          const curr = animatedPoints[i];
          const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
          const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
          ctx2.bezierCurveTo(cpx1, prev.y, cpx2, curr.y, curr.x, curr.y);
        }
      }
      ctx2.lineTo(
        animatedPoints[animatedPoints.length - 1].x,
        paddingTop + chartH,
      );
      ctx2.closePath();
      ctx2.fillStyle = color + "20";
      ctx2.fill();

      // Line
      ctx2.beginPath();
      ctx2.moveTo(animatedPoints[0].x, animatedPoints[0].y);
      for (let i = 1; i < animatedPoints.length; i++) {
        const prev = animatedPoints[i - 1];
        const curr = animatedPoints[i];
        const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
        const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
        ctx2.bezierCurveTo(cpx1, prev.y, cpx2, curr.y, curr.x, curr.y);
      }
      ctx2.strokeStyle = color;
      ctx2.lineWidth = 2.5;
      ctx2.stroke();

      // Dots
      for (const p of animatedPoints) {
        ctx2.beginPath();
        ctx2.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx2.fillStyle = "#fff";
        ctx2.fill();
        ctx2.strokeStyle = color;
        ctx2.lineWidth = 2;
        ctx2.stroke();
      }

      // X labels
      ctx2.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx2.fillStyle = "#888";
      ctx2.textAlign = "center";
      for (let i = 0; i < data.length; i++) {
        ctx2.fillText(data[i].label, points[i].x, h - 8);
      }

      if (t < 1) {
        animFrame = requestAnimationFrame(() => draw(Math.min(t + 0.04, 1)));
      }
    }

    draw(0);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [data, color, height, containerWidth]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
