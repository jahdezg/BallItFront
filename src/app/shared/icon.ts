import { Component, input } from '@angular/core';

export type IconName =
  | 'home' | 'clock' | 'plus' | 'trending-up' | 'user' | 'chevron-left' | 'chevron-right'
  | 'video' | 'upload' | 'trash' | 'check' | 'alert' | 'target' | 'copy';

/** Iconos SVG en línea (estilo Feather), sin dependencias. */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size()"
      [attr.height]="size()"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('home') { <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /> }
        @case ('clock') { <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /> }
        @case ('plus') { <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /> }
        @case ('trending-up') { <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /> }
        @case ('user') { <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /> }
        @case ('chevron-left') { <polyline points="15 18 9 12 15 6" /> }
        @case ('chevron-right') { <polyline points="9 18 15 12 9 6" /> }
        @case ('video') { <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /> }
        @case ('upload') { <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /> }
        @case ('trash') { <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /> }
        @case ('check') { <polyline points="20 6 9 17 4 12" /> }
        @case ('alert') { <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /> }
        @case ('target') { <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /> }
        @case ('copy') { <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /> }
      }
    </svg>
  `,
  host: { style: 'display:inline-flex;line-height:0' },
})
export class Icon {
  name = input.required<IconName>();
  size = input(22);
}
