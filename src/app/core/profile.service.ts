import { Injectable, effect, signal } from '@angular/core';
import { Arm } from './models';

const KEY = 'ballit_profile';

/** Preferencias locales del jugador (solo en este navegador). */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  name = signal('');
  arm = signal<Arm>('right');

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.name === 'string') this.name.set(p.name);
        if (p.arm === 'left' || p.arm === 'right') this.arm.set(p.arm);
      }
    } catch {
      /* localStorage no disponible o JSON inválido: se usan los valores por defecto */
    }
    effect(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ name: this.name(), arm: this.arm() }));
      } catch {
        /* ignorar */
      }
    });
  }
}
