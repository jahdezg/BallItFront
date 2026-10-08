import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const KEY = 'ballit_user_id';
let memoryId: string | null = null; // respaldo si localStorage no está disponible

/**
 * UUID v4. `crypto.randomUUID` solo existe en contextos seguros (HTTPS o localhost), por eso se
 * genera a mano con `getRandomValues` (que sí funciona por HTTP en la red local, p. ej. desde el celular).
 */
function uuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** UUID por instalación: se crea una vez y se conserva (la API lo exige en X-User-Id). */
export function getUserId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return (memoryId ??= uuid());
  }
}

export const userIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBase)) return next(req);
  return next(req.clone({ setHeaders: { 'X-User-Id': getUserId() } }));
};
