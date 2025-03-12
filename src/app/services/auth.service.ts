import { Inject, inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, user, User, UserCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  getAuth(): Observable<User | null> {
    return user(this.auth);
  }

  getConnectedUser(): Observable<User | null>{
    return user(this.auth);
  }

  async register(email: string, password: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    if(result?.user?.email) {
      await sendEmailVerification(result?.user);
      return this.logout();
    }
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }


  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/'])

  }

  sendResetPasswordLink(email: string) {
    return sendPasswordResetEmail(this.auth, email)
  }

  constructor() {}
}
