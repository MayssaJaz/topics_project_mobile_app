import { NgZone, inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, user, User, UserCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Client } from '../models/client';
import { addDoc, collection, doc, docData, Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  usersCollection = collection(this.firestore, 'users');
  
  getAuth(): Observable<User | null> {
    return user(this.auth);
  }  

  getConnectedUser(): Observable<User | null>{
    return user(this.auth);
  }

  async addUser(user: Omit<Client, 'users'>): Promise<void> {
    const safeUser: Client = {
      email: user.email ?? "",
      name: user.name ?? "",
      family_name: user.family_name ?? "",
      logo: user.logo ?? null, 
    };
  
    await this.ngZone.run(() => addDoc(this.usersCollection, safeUser));
  }

  getUserByEmail(email: string): Observable<Client | undefined> {
    return docData(doc(this.firestore, `users/${email}`), { idField: 'email' }) as Observable<Client | undefined>;
  }

  
  async register(email: string, name: string, family_name: string, password: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    if(result?.user?.email) {
      await sendEmailVerification(result?.user);
      const user = {
        email,
        name,
        family_name,
        logo: null
      }
      await this.addUser(user);
      return this.logout();
    }
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }


  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login'])
  }

  sendResetPasswordLink(email: string) {
    return sendPasswordResetEmail(this.auth, email)
  }

  constructor() {}
}
