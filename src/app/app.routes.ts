import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.HomePage),
  },
  {
    path: 'subir',
    loadComponent: () => import('./features/upload/upload').then((m) => m.UploadPage),
  },
  {
    path: 'analisis/:id',
    loadComponent: () => import('./features/analysis/analysis').then((m) => m.AnalysisPage),
  },
  {
    path: 'historial',
    loadComponent: () => import('./features/history/history').then((m) => m.HistoryPage),
  },
  {
    path: 'comparar',
    loadComponent: () => import('./features/compare/compare').then((m) => m.ComparePage),
  },
  {
    path: 'perfil',
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfilePage),
  },
  { path: '**', redirectTo: '' },
];
