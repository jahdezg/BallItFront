import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BallitApi } from '../../core/ballit-api.service';
import { toApiError } from '../../core/error.util';
import { fmtDate } from '../../core/format';
import { HistoryItem } from '../../core/models';
import { ProfileService } from '../../core/profile.service';
import { Icon } from '../../shared/icon';
import { ScoreRing } from '../../shared/score-ring';
import { SparkLine } from '../../shared/spark-line';
import { trainingStreak } from '../../core/streak';

const TIPS = [
  {
    icon: '🎯',
    title: 'Codo alineado',
    text: 'Mantén el codo del brazo que lanza debajo del balón y apuntando al aro; evita que se abra hacia afuera.',
  },
  {
    icon: '🦵',
    title: 'Empieza por las piernas',
    text: 'Flexiona y extiende las piernas de forma fluida: de ahí sale la fuerza que sube por el cuerpo hasta el balón.',
  },
  {
    icon: '🖐️',
    title: 'Termina el movimiento',
    text: 'Deja el brazo extendido hacia el aro y la muñeca relajada hasta que el balón salga.',
  },
  {
    icon: '🔁',
    title: 'Misma rutina siempre',
    text: 'Repite la misma preparación antes de cada tiro; así tu cuerpo la automatiza y es más fácil comparar.',
  },
  {
    icon: '📹',
    title: 'Graba bien',
    text: 'Cámara fija, de frente, con el cuerpo completo y buena luz. Mejor video, mejor análisis.',
  },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, ScoreRing, SparkLine],
  templateUrl: './home.html',
})
export class HomePage {
  private api = inject(BallitApi);
  protected profile = inject(ProfileService);

  items = signal<HistoryItem[] | null>(null);
  error = signal<string | null>(null);

  protected tips = TIPS;
  protected fmtDate = fmtDate;

  private sorted = computed(() =>
    [...(this.items() ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  );
  last = computed(() => this.sorted().at(-1) ?? null);
  scores = computed(() =>
    this.sorted()
      .slice(-8)
      .map((i) => i.score),
  );
  delta = computed(() => {
    const s = this.sorted();
    return s.length >= 2 ? s[s.length - 1].score - s[s.length - 2].score : null;
  });
  totalShots = computed(() => this.sorted().reduce((acc, i) => acc + i.n, 0));
  streak = computed(() => trainingStreak((this.items() ?? []).map((item) => item.created_at)));
  avgGood = computed(() => {
    const s = this.sorted();
    return s.length ? Math.round(s.reduce((acc, i) => acc + i.pct_bueno, 0) / s.length) : 0;
  });

  greeting = computed(() => {
    const h = new Date().getHours();
    const base = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    const name = this.profile.name().trim();
    return name ? `${base}, ${name}` : base;
  });

  constructor() {
    this.api.history().subscribe({
      next: (h) => this.items.set(h),
      error: (e) => {
        this.items.set([]);
        this.error.set(toApiError(e).message);
      },
    });
  }
}
