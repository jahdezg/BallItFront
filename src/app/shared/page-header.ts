import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, Icon],
  template: `
    <header class="page-header">
      @if (back(); as to) {
        <a class="icon-btn" [routerLink]="to" aria-label="Volver"><app-icon name="chevron-left" [size]="24" /></a>
      } @else {
        <span class="icon-btn ghost"></span>
      }
      <h1>{{ title() }}</h1>
      <span class="icon-btn ghost"></span>
    </header>
  `,
})
export class PageHeader {
  title = input.required<string>();
  back = input<string | null>(null);
}
