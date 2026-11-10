import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // No title: the home page is titled with the site name alone (SiteTitleStrategy).
    path: '',
    loadComponent: () => import('@features/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: '' },
];
