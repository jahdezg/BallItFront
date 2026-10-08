import { Component, computed, input, output } from '@angular/core';
import { Shot } from '../../core/models';

@Component({
  selector: 'app-shot-progress',
  template: `
    <svg
      class="chart"
      viewBox="0 0 600 240"
      role="img"
      aria-label="Evolución del puntaje de los lanzamientos, de cero a cien"
    >
      @for (value of [0, 25, 50, 75, 100]; track value) {
        <line x1="40" x2="580" [attr.y1]="y(value)" [attr.y2]="y(value)" class="grid" />
        <text x="32" [attr.y]="y(value) + 4" class="tick" text-anchor="end">{{ value }}</text>
      }
      <path [attr.d]="path()" class="line" />
      @for (s of shots(); track s.n; let i = $index) {
        <circle [attr.cx]="x(i)" [attr.cy]="y(s.score)" r="6" [attr.fill]="color(s)" />
      }
      <text x="40" y="230" class="tick">Inicio</text>
      <text x="580" y="230" class="tick" text-anchor="end">Final</text>
    </svg>
    <p class="muted small">Puntaje / 100, en orden de lanzamiento.</p>
    <div class="progress-moments">
      @for (s of shots(); track s.n) {
        <button
          type="button"
          class="btn small"
          (click)="momentSelected.emit(s.times_s.release)"
          [attr.aria-label]="
            'Ver lanzamiento a los ' +
            s.times_s.release.toFixed(1) +
            ' segundos: ' +
            s.score +
            ' puntos'
          "
        >
          {{ s.times_s.release.toFixed(1) }} s · {{ s.score }} pts
        </button>
      }
    </div>
  `,
  styles: [
    `
      .progress-moments {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
    `,
  ],
})
export class ShotProgress {
  shots = input.required<Shot[]>();
  momentSelected = output<number>();
  protected x(index: number): number {
    return 40 + (index * 540) / Math.max(1, this.shots().length - 1);
  }
  protected y(score: number): number {
    return 200 - Math.max(0, Math.min(100, score)) * 1.8;
  }
  protected color(shot: Shot): string {
    return { bueno: '#22c55e', dudoso: '#eab308', malo: '#ef4444' }[shot.verdict];
  }
  protected path = computed(() =>
    this.shots()
      .map((s, i) => `${i ? 'L' : 'M'}${this.x(i)},${this.y(s.score)}`)
      .join(' '),
  );
}
