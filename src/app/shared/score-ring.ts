import { Component, computed, input } from '@angular/core';

const R = 44;
const CIRC = 2 * Math.PI * R;

/** Anillo de progreso con el puntaje (0–100). Verde ≥70, amarillo ≥40, rojo por debajo. */
@Component({
  selector: 'app-score-ring',
  template: `
    <div class="ring" [style.width.px]="size()" [style.height.px]="size()">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="track" cx="50" cy="50" r="44" />
        <circle
          class="arc"
          [class]="tone()"
          cx="50"
          cy="50"
          r="44"
          [attr.stroke-dasharray]="dash()"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div class="ring-label">
        <span class="n" [style.font-size.px]="size() * 0.3">{{ score() }}</span>
        @if (size() >= 80) {
          <span class="s">/ 100</span>
        }
      </div>
    </div>
  `,
  host: { style: 'display:inline-block' },
})
export class ScoreRing {
  score = input.required<number>();
  size = input(96);

  protected tone = computed(() => (this.score() >= 70 ? 'good' : this.score() >= 40 ? 'mid' : 'bad'));
  protected dash = computed(() => {
    const filled = (Math.max(0, Math.min(100, this.score())) / 100) * CIRC;
    return `${filled.toFixed(1)} ${CIRC.toFixed(1)}`;
  });
}
