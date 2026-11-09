import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Odunayo Mohammed',
    loadComponent: () => import('@features/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: '' },
];
