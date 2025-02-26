import { inject, Injectable } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  getAuth(): Observable<User | null> {
    return user(this.auth);
  }

  getConnectedUser(): Observable<User | null>{
    return user(this.auth);
  }

  constructor() {}
}
