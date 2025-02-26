import { Router, Routes } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';

const isAuthenticated = () => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  return _authService.getConnectedUser().pipe(
    map((user) => {
      if (!user) _router.navigateByUrl('/login');
      return !!user;
    })
  );
};
export const routes: Routes = [
  {
    path: 'topics',
    //canActivate: [isAuthenticated],

    loadComponent: () =>
      import('./topics/topics.page').then((m) => m.TopicsPage),
  },
  {
    path: 'topics/:id',
    loadComponent: () =>
      import('./topics/topic-details/topic-details.page').then(
        (m) => m.TopicDetailsPage
      ),
  },
  {
    path: '',
    redirectTo: 'topics',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.page').then((m) => m.LoginPage),
  },
];
