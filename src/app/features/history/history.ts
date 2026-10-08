import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BallitApi } from '../../core/ballit-api.service';
import { toApiError } from '../../core/error.util';
import { fmtDate } from '../../core/format';
import { HistoryItem } from '../../core/models';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';
import { ScoreRing } from '../../shared/score-ring';

@Component({
  selector: 'app-history',
  imports: [RouterLink, PageHeader, ScoreRing, Icon],
  templateUrl: './history.html',
})
export class HistoryPage {
  private api = inject(BallitApi);
  private router = inject(Router);

  items = signal<HistoryItem[] | null>(null);
  selected = signal<string[]>([]);
  error = signal<string | null>(null);
  canCompare = computed(() => this.selected().length === 2);

  protected fmtDate = fmtDate;

  constructor() {
    this.load();
  }

  load() {
    this.api.history().subscribe({
      next: (h) => {
        this.items.set(h);
        this.selected.set([]);
      },
      error: (e) => this.error.set(toApiError(e).message),
    });
  }

  toggle(id: string) {
    const cur = this.selected();
    if (cur.includes(id)) this.selected.set(cur.filter((x) => x !== id));
    else if (cur.length < 2) this.selected.set([...cur, id]);
  }

  compare() {
    const list = this.items() ?? [];
    const picked = list
      .filter((i) => this.selected().includes(i.analysis_id))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)); // el más antiguo = "antes"
    if (picked.length !== 2) return;
    this.router.navigate(['/comparar'], {
      queryParams: { before: picked[0].analysis_id, after: picked[1].analysis_id },
    });
  }

  remove(id: string) {
    if (!confirm('¿Eliminar este análisis? No se puede deshacer.')) return;
    this.api.remove(id).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(toApiError(e).message),
    });
  }
}
