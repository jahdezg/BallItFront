import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

/** Convierte cualquier error HTTP en un mensaje legible para mostrar en pantalla. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return {
        code: 'NETWORK',
        message:
          'No hay conexión con el servidor. Revisa que la API esté corriendo en el puerto 8000 y que tenga CORS para http://localhost:4200.',
      };
    }
    const body = err.error;
    if (body && typeof body === 'object' && 'message' in body) {
      return { code: String(body.code ?? 'ERROR'), message: String(body.message) };
    }
    return { code: 'ERROR', message: `Error ${err.status} del servidor` };
  }
  const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
  return { code: 'ERROR', message: `Ocurrió un error inesperado${detail}` };
}
