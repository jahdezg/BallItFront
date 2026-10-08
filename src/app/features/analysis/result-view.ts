import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScoreRing } from '../../shared/score-ring';
import { featureLabel, fmtValue } from '../../core/format';
import { AnalysisResult } from '../../core/models';
import { AngleChart } from './angle-chart';
import { AnalysisVideo } from './analysis-video';
import { ShotProgress } from './shot-progress';
import { ShotCarousel } from './shot-carousel';

@Component({
  selector: 'app-result-view',
  imports: [RouterLink, AngleChart, ScoreRing, AnalysisVideo, ShotProgress, ShotCarousel],
  templateUrl: './result-view.html',
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .feedback-fold summary {
        cursor: pointer;
        list-style: none;
      }
      .feedback-fold summary::-webkit-details-marker {
        display: none;
      }
      .fold-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .fold-heading strong {
        font-size: 1.05rem;
      }
      .fold-heading::after {
        content: '+';
        color: var(--accent);
        font-size: 1.2rem;
      }
      .feedback-fold[open] .fold-heading::after {
        content: '−';
      }
      .fold-preview {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 8px 0 0;
      }
      .fold-hint {
        display: block;
        color: var(--accent-2);
        font-size: 0.8rem;
        margin-top: 8px;
      }
      .fold-content {
        margin-top: 16px;
      }
      .feedback-fold[open] .fold-preview,
      .feedback-fold[open] .fold-hint {
        display: none;
      }
      summary:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 6px;
        border-radius: 4px;
      }
      .section-title {
        margin: 6px 0 14px;
      }
    `,
  ],
})
export class ResultView {
  result = input.required<AnalysisResult>();
  mediaPending = input(false);
  protected momentsOpen = signal(false);

  protected orderedShots = computed(() =>
    [...this.result().shots].sort((a, b) => a.times_s.release - b.times_s.release),
  );

  protected metric = computed(() => featureLabel(this.result().rule));
  protected topIssue = computed(() => this.result().coach.puedes_mejorar[0] ?? null);

  protected value(v: number | null | undefined): string {
    return fmtValue(v, this.result().rule);
  }
}
