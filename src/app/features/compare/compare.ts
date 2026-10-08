import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BallitApi } from '../../core/ballit-api.service';
import { toApiError } from '../../core/error.util';
import { featureLabel, fmtDate, fmtValue } from '../../core/format';
import { Comparison, HistoryItem, Rule } from '../../core/models';
import { PageHeader } from '../../shared/page-header';
import { SecureMedia } from '../../shared/secure-media';

@Component({
  selector: 'app-compare',
  imports: [SecureMedia, PageHeader],
  templateUrl: './compare.html',
})
export class ComparePage {
  private api = inject(BallitApi);
  private route = inject(ActivatedRoute);

  items = signal<HistoryItem[]>([]);
  before = signal('');
  after = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<{ cmp: Comparison; rule: Rule } | null>(null);

  protected fmtDate = fmtDate;
  protected featureLabel = featureLabel;

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    this.before.set(q.get('before') ?? '');
    this.after.set(q.get('after') ?? '');

    this.api.history().subscribe({
      next: (h) => {
        this.items.set(h);
        if (this.before() && this.after()) this.run();
      },
      error: (e) => this.error.set(toApiError(e).message),
    });
  }

  run() {
    if (!this.before() || !this.after() || this.before() === this.after()) {
      this.error.set('Elige dos análisis distintos: uno "antes" y uno "después".');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);
    forkJoin({
      cmp: this.api.compare(this.before(), this.after()),
      first: this.api.historyItem(this.before()),
    }).subscribe({
      next: ({ cmp, first }) => {
        this.data.set({ cmp, rule: first.rule });
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(toApiError(e).message);
        this.loading.set(false);
      },
    });
  }

  label(it: HistoryItem): string {
    return `${fmtDate(it.created_at)} · ${it.score}/100`;
  }

  value(v: number, rule: Rule): string {
    return fmtValue(v, rule);
  }

  sign(v: number): string {
    return (v > 0 ? '+' : '') + v.toFixed(1);
  }

  verdictText(v: Comparison['verdict']): string {
    return v === 'mejoro' ? '¡Mejoraste!' : v === 'empeoro' ? 'Empeoraste' : 'Sin cambios claros';
  }

  verdictIcon(v: Comparison['verdict']): string {
    return v === 'mejoro' ? '📈' : v === 'empeoro' ? '📉' : '➖';
  }
}
