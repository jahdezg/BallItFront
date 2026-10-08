import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';
import { BallitApi } from '../../core/ballit-api.service';
import { toApiError } from '../../core/error.util';
import { ApiError, JobState } from '../../core/models';
import { PageHeader } from '../../shared/page-header';
import { ResultView } from './result-view';

@Component({
  selector: 'app-analysis',
  imports: [RouterLink, ResultView, PageHeader],
  templateUrl: './analysis.html',
})
export class AnalysisPage {
  private route = inject(ActivatedRoute);
  private api = inject(BallitApi);

  job = signal<JobState | null>(null);
  httpError = signal<ApiError | null>(null);

  /** Error del job (NO_PERSON, NO_SHOT...) o de la red/HTTP. */
  error = computed<ApiError | null>(() => this.httpError() ?? this.job()?.error ?? null);
  percent = computed(() => Math.round((this.job()?.progress ?? 0) * 100));

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id') ?? ''),
        tap(() => {
          this.job.set(null);
          this.httpError.set(null);
        }),
        switchMap((id) =>
          this.api.watch(id).pipe(
            catchError((e) => {
              this.httpError.set(toApiError(e));
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((j) => this.job.set(j));
  }

  protected tips = [
    'Mantén el codo debajo del balón y apuntando al aro.',
    'El tiro empieza en las piernas: flexiona y extiende con fluidez.',
    'Termina el movimiento con el brazo extendido hacia el aro.',
    'Repetir la misma rutina antes de cada tiro te hace más consistente.',
  ];
  tip = computed(() => this.tips[Math.min(this.tips.length - 1, Math.floor(this.percent() / 26))]);

  isRecordingIssue(code: string): boolean {
    return code === 'NO_PERSON' || code === 'NO_SHOT';
  }
}
