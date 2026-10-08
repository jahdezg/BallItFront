import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { PoseFrame, Rule, Shot } from '../../core/models';
import { VERDICT_LABEL, featureLabel, fmtValue } from '../../core/format';
import { SecureMedia } from '../../shared/secure-media';
import { AngleChart } from './angle-chart';

@Component({
  selector: 'app-shot-carousel',
  imports: [SecureMedia, AngleChart],
  template: `
    @if (shots().length) {
      <div class="moment-picker" aria-label="Seleccionar lanzamiento">
        @for (s of shots(); track s.n; let i = $index) {
          <button
            type="button"
            class="btn small"
            [class.picked]="activeIndex() === i"
            [attr.aria-pressed]="activeIndex() === i"
            (click)="select(i)"
            [attr.aria-label]="
              'Seleccionar lanzamiento a los ' + s.times_s.release.toFixed(1) + ' segundos'
            "
          >
            {{ s.times_s.release.toFixed(1) }} s
          </button>
        }
      </div>
      <div
        #track
        class="moment-track"
        (scroll)="onScroll()"
        role="region"
        aria-label="Carrusel de lanzamientos"
        tabindex="0"
        (keydown.arrowright)="select(activeIndex() + 1); $event.preventDefault()"
        (keydown.arrowleft)="select(activeIndex() - 1); $event.preventDefault()"
      >
        @for (s of shots(); track s.n; let i = $index) {
          <article
            class="moment-slide"
            [attr.aria-label]="'Lanzamiento a los ' + s.times_s.release.toFixed(1) + ' segundos'"
            [attr.inert]="activeIndex() === i ? null : ''"
          >
            @if (activeIndex() === i) {
              @if (s.clip_url || s.frame_url) {
                <div class="shot-media">
                  @if (s.clip_url) {
                    <app-secure-media [path]="s.clip_url" kind="video" />
                  } @else {
                    <app-secure-media
                      [path]="s.frame_url"
                      kind="img"
                      [alt]="'Lanzamiento a los ' + s.times_s.release.toFixed(1) + ' segundos'"
                    />
                    @if (mediaPending()) {
                      <span class="media-tag">Generando clip…</span>
                    }
                  }
                </div>
              } @else if (mediaPending()) {
                <p class="muted small">Generando clip…</p>
              }
              <div class="shot-head">
                <button
                  type="button"
                  class="btn small"
                  (click)="momentSelected.emit(s.times_s.release)"
                >
                  Ver en el video ↗
                </button>
                <span class="badge" [class]="s.verdict">{{ verdictLabel[s.verdict] }}</span>
              </div>
              <dl>
                <div>
                  <dt>Puntaje</dt>
                  <dd>{{ s.score }}/100</dd>
                </div>
                <div>
                  <dt>{{ metric() }}</dt>
                  <dd>{{ value(s.value) }}</dd>
                </div>
                <div>
                  <dt>Pausa antes del tiro</dt>
                  <dd>
                    {{
                      s.has_pause
                        ? 'Sí' + (s.pause_s != null ? ' (' + s.pause_s.toFixed(2) + ' s)' : '')
                        : 'No detectada'
                    }}
                  </dd>
                </div>
              </dl>
              <h4 class="moment-chart-title">Ángulo de este lanzamiento</h4>
              <app-angle-chart
                [frames]="framesByShot().get(s.n) ?? []"
                [shots]="[s]"
                [rule]="rule()"
              />
            }
          </article>
        }
      </div>
      <div class="moment-nav">
        <button
          class="btn small"
          type="button"
          aria-label="Lanzamiento anterior"
          [disabled]="activeIndex() === 0"
          (click)="select(activeIndex() - 1)"
        >
          ←
        </button>
        <span class="muted small" aria-live="polite"
          >{{ activeIndex() + 1 }} / {{ shots().length }}</span
        >
        <button
          class="btn small"
          type="button"
          aria-label="Lanzamiento siguiente"
          [disabled]="activeIndex() === shots().length - 1"
          (click)="select(activeIndex() + 1)"
        >
          →
        </button>
      </div>
      @if (shots().length > 1) {
        <p class="muted small swipe-hint">Desliza para revisar el siguiente lanzamiento</p>
      }
    } @else {
      <p class="muted small">No hay lanzamientos para mostrar.</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .moment-picker {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 10px;
      }
      .moment-picker button {
        flex: none;
      }
      .picked {
        border-color: var(--accent);
        color: var(--accent-2);
      }
      .moment-track {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        position: relative;
        align-items: flex-start;
      }
      .moment-track::-webkit-scrollbar {
        display: none;
      }
      .moment-slide {
        flex: 0 0 100%;
        min-width: 0;
        scroll-snap-align: start;
      }
      .moment-slide[inert] {
        min-height: 180px;
      }
      .moment-chart-title {
        margin: 16px 0 6px;
        font-size: 0.9rem;
      }
      .moment-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 12px;
      }
      .swipe-hint {
        margin: 8px 0 0;
        text-align: center;
      }
      .moment-track:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
      @media (prefers-reduced-motion: reduce) {
        .moment-track {
          scroll-behavior: auto;
        }
      }
    `,
  ],
})
export class ShotCarousel {
  analysisId = input.required<string>();
  shots = input.required<Shot[]>();
  frames = input.required<PoseFrame[]>();
  rule = input.required<Rule>();
  mediaPending = input(false);
  momentSelected = output<number>();
  private track = viewChild<ElementRef<HTMLDivElement>>('track');
  private selected = signal(0);
  protected activeIndex = computed(() =>
    Math.max(0, Math.min(this.selected(), this.shots().length - 1)),
  );
  protected verdictLabel = VERDICT_LABEL;
  protected metric = computed(() => featureLabel(this.rule()));
  protected framesByShot = computed(() => {
    const all = this.frames();
    const framesByIndex = new Map(all.map((frame) => [frame.i, frame]));
    return new Map(
      this.shots().map((shot, index) => {
        const start =
          framesByIndex.get(shot.frames.start)?.t ?? Math.max(0, shot.times_s.set - 0.5);
        const next = this.shots()[index + 1];
        const nextStart = next
          ? (framesByIndex.get(next.frames.start)?.t ?? next.times_s.set)
          : Infinity;
        const end = Math.max(shot.times_s.release, Math.min(shot.times_s.release + 0.5, nextStart));
        return [shot.n, all.filter((frame) => frame.t >= start && frame.t <= end)] as const;
      }),
    );
  });

  constructor() {
    effect(() => {
      this.analysisId();
      this.selected.set(0);
      untracked(() => this.track()?.nativeElement.scrollTo({ left: 0, behavior: 'instant' }));
    });
    afterRenderEffect((onCleanup) => {
      const element = this.track()?.nativeElement;
      if (!element) return;
      const observer = new ResizeObserver(() => {
        element.scrollLeft = this.activeIndex() * (element.clientWidth + 12);
      });
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });
  }

  protected value(value: number): string {
    return fmtValue(value, this.rule());
  }

  protected select(index: number): void {
    const i = Math.max(0, Math.min(index, this.shots().length - 1));
    this.selected.set(i);
    const element = this.track()?.nativeElement;
    if (element) element.scrollTo({ left: i * (element.clientWidth + 12), behavior: 'instant' });
  }

  protected onScroll(): void {
    const element = this.track()?.nativeElement;
    if (element) this.selected.set(Math.round(element.scrollLeft / (element.clientWidth + 12)));
  }
}
