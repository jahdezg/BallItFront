import { Component, inject, signal } from '@angular/core';
import { BallitApi } from '../../core/ballit-api.service';
import { ProfileService } from '../../core/profile.service';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'app-profile',
  imports: [PageHeader, Icon],
  templateUrl: './profile.html',
})
export class ProfilePage {
  protected profile = inject(ProfileService);
  private api = inject(BallitApi);

  copied = signal(false);

  get initial(): string {
    return (this.profile.name().trim()[0] ?? '🏀').toUpperCase();
  }

  get userId(): string {
    return this.api.userId;
  }

  async copyId() {
    try {
      await navigator.clipboard.writeText(this.api.userId);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      /* el portapapeles puede no estar disponible sin HTTPS */
    }
  }
}
