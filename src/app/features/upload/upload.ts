import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BallitApi } from '../../core/ballit-api.service';
import { toApiError } from '../../core/error.util';
import { Arm, Camera, Focus } from '../../core/models';
import { ProfileService } from '../../core/profile.service';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';

const MAX_BYTES = 200 * 1024 * 1024; // mismo límite por defecto que la API

@Component({
  selector: 'app-upload',
  imports: [PageHeader, Icon],
  templateUrl: './upload.html',
})
export class UploadPage {
  private api = inject(BallitApi);
  private router = inject(Router);
  private profile = inject(ProfileService);

  file = signal<File | null>(null);
  arm = signal<Arm>(this.profile.arm());
  camera = signal<Camera>('frente');
  focus = signal<Focus>('completo');
  goal = signal('');
  busy = signal(false);
  error = signal<string | null>(null);

  onFile(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.error.set(null);
    if (f && f.size > MAX_BYTES) {
      this.file.set(null);
      this.error.set('El video pesa más de 200 MB. Recórtalo o grábalo más corto.');
      return;
    }
    this.file.set(f);
  }

  sizeMb(f: File): string {
    return (f.size / 1024 / 1024).toFixed(1);
  }

  submit() {
    const video = this.file();
    if (!video || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api
      .analyze({
        video,
        arm: this.arm(),
        camera: this.camera(),
        focus: this.focus(),
        goal: this.goal().trim() || undefined,
      })
      .subscribe({
        next: (r) => this.router.navigate(['/analisis', r.analysis_id]),
        error: (e) => {
          this.busy.set(false);
          this.error.set(toApiError(e).message);
        },
      });
  }
}
