import { Component, computed, input } from '@angular/core';
import { PoseFrame, Rule, Shot } from '../../core/models';

const W = 600;
const H = 220;
const PAD = { l: 40, r: 12, t: 14, b: 26 };

/** Gráfica del ángulo del brazo a lo largo del video, con marcas por tiro y el límite de la regla. */
@Component({
  selector: 'app-angle-chart',
  template: `
    @if (chart(); as c) {
      <svg
        class="chart"
        [attr.viewBox]="'0 0 ' + w + ' ' + h"
        role="img"
        aria-label="Ángulo del brazo en el tiempo"
      >
        @for (t of c.yTicks; track t.v) {
          <line
            [attr.x1]="pad.l"
            [attr.x2]="w - pad.r"
            [attr.y1]="t.y"
            [attr.y2]="t.y"
            class="grid"
          />
          <text [attr.x]="pad.l - 6" [attr.y]="t.y + 4" class="tick" text-anchor="end">
            {{ t.v }}°
          </text>
        }
        @for (t of c.xTicks; track t.v) {
          <text [attr.x]="t.x" [attr.y]="h - 8" class="tick" text-anchor="middle">{{ t.v }}s</text>
        }
        @if (c.threshold; as th) {
          <line
            [attr.x1]="pad.l"
            [attr.x2]="w - pad.r"
            [attr.y1]="th.y"
            [attr.y2]="th.y"
            class="thr"
          />
          <text [attr.x]="w - pad.r" [attr.y]="th.y - 5" class="thr-label" text-anchor="end">
            límite {{ th.v }}°
          </text>
        }
        @for (m of c.marks; track m.n) {
          <line
            [attr.x1]="m.x"
            [attr.x2]="m.x"
            [attr.y1]="pad.t"
            [attr.y2]="h - pad.b"
            [attr.stroke]="m.color"
            class="mark"
          />
          <text [attr.x]="m.x + 3" [attr.y]="pad.t + 10" class="mark-label" [attr.fill]="m.color">
            {{ m.t.toFixed(1) }}s
          </text>
        }
        <path [attr.d]="c.path" class="line" />
      </svg>
    } @else {
      <p class="muted small">No hay datos de ángulo para graficar.</p>
    }
  `,
})
export class AngleChart {
  frames = input.required<PoseFrame[]>();
  shots = input.required<Shot[]>();
  rule = input.required<Rule>();

  protected w = W;
  protected h = H;
  protected pad = PAD;

  protected chart = computed(() => {
    const pts = this.frames()
      .filter((f) => f.ok && f.angle != null)
      .map((f) => ({ t: f.t, a: f.angle as number }));
    if (pts.length < 2) return null;

    const showThr = this.rule().feature.startsWith('abduction');
    const tMin = pts[0].t;
    const tMax = pts[pts.length - 1].t || 1;
    const aMax = Math.max(10, ...pts.map((p) => p.a), showThr ? this.rule().t * 1.15 : 0);
    const yMax = Math.ceil(aMax / 10) * 10;

    const x = (t: number) =>
      PAD.l + ((t - tMin) / Math.max(tMax - tMin, 0.001)) * (W - PAD.l - PAD.r);
    const y = (a: number) => PAD.t + (1 - a / yMax) * (H - PAD.t - PAD.b);

    const path = pts
      .map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.a).toFixed(1)}`)
      .join(' ');

    const yTicks = [0, 0.5, 1].map((k) => ({ v: Math.round(yMax * k), y: y(yMax * k) }));
    const step = Math.max(1, Math.round((tMax - tMin) / 5));
    const xTicks: { v: number; x: number }[] = [];
    for (let t = Math.ceil(tMin); t <= tMax; t += step) xTicks.push({ v: t, x: x(t) });

    const palette: Record<string, string> = {
      bueno: '#22c55e',
      dudoso: '#eab308',
      malo: '#ef4444',
    };
    const marks = this.shots().map((s) => ({
      n: s.n,
      t: s.times_s.release,
      x: x(s.times_s.release),
      color: palette[s.verdict] ?? '#94a3b8',
    }));

    return {
      path,
      yTicks,
      xTicks,
      marks,
      threshold: showThr ? { y: y(this.rule().t), v: Math.round(this.rule().t) } : null,
    };
  });
}
