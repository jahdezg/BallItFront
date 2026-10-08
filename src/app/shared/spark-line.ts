import { Component, computed, input } from '@angular/core';

const W = 240;
const H = 70;
const PAD = 8;

/** Mini gráfica de la evolución de los puntajes (escala fija 0–100). */
@Component({
  selector: 'app-spark-line',
  template: `
    @if (geo(); as g) {
      <svg class="spark" [attr.viewBox]="'0 0 ' + w + ' ' + h" preserveAspectRatio="none" aria-hidden="true">
        <polyline [attr.points]="g.area" class="spark-area" />
        <polyline [attr.points]="g.line" class="spark-line" fill="none" />
        <circle [attr.cx]="g.last.x" [attr.cy]="g.last.y" r="4" class="spark-dot" />
      </svg>
    }
  `,
})
export class SparkLine {
  values = input.required<number[]>();

  protected w = W;
  protected h = H;

  protected geo = computed(() => {
    const v = this.values();
    if (v.length < 2) return null;
    const pts = v.map((val, i) => ({
      x: PAD + (i / (v.length - 1)) * (W - PAD * 2),
      y: PAD + (1 - Math.max(0, Math.min(100, val)) / 100) * (H - PAD * 2),
    }));
    const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${pts[0].x.toFixed(1)},${H} ${line} ${pts[pts.length - 1].x.toFixed(1)},${H}`;
    return { line, area, last: pts[pts.length - 1] };
  });
}
