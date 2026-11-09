import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Factman',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: '' },
];
