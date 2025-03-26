import { NgZone, inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, user, User, UserCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, of } from 'rxjs';
import { Client } from '../models/client';
import { addDoc, collection, collectionData, doc, docData, endAt, Firestore, orderBy, query, setDoc, startAt, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  usersCollection = collection(this.firestore, 'users');
  
  getAllUsers(): Observable<User[]> {
    return collectionData(this.usersCollection, {
      idField: 'id',
    }) as Observable<User[]>;
  }
  
  getAuth(): Observable<User | null> {
    return user(this.auth);
  }  

  getConnectedUser(): Observable<User | null>{
    return user(this.auth);
  }

  async addUser(user: Omit<Client, 'users'| 'uid'>, uid: string): Promise<void> {
    const safeUser: Client = {
      uid: uid,
      email: user.email ?? "",
      name: user.name ?? "",
      family_name: user.family_name ?? "",
      logo: user.logo ?? null, 
    };
  
    await setDoc(doc(this.firestore, `users/${uid}`), safeUser);

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
      await this.addUser(user, result.user.uid);
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

  getUsersByPartialNameOrEmail(search: string): Observable<Client[]> {
    if (!search.trim()) return of([]);
  
    const lowerCaseSearch = search.toLowerCase();
    const endSearch = lowerCaseSearch + '\uf8ff';
  
    const emailQuery = query(
      this.usersCollection,
      where("email", ">=", lowerCaseSearch),
      where("email", "<=", endSearch)
    );
  
    const nameQuery = query(
      this.usersCollection,
      where("name", ">=", lowerCaseSearch),
      where("name", "<=", endSearch)
    );
  
    return combineLatest([
      collectionData(nameQuery, { idField: 'uid' }) as Observable<Client[]>,
      collectionData(emailQuery, { idField: 'uid' }) as Observable<Client[]>,
    ]).pipe(
      map(([nameResults, emailResults]) => {
        const mergedResults = [...nameResults, ...emailResults];
  
        return mergedResults.filter(
          (user, index, self) =>
            index === self.findIndex((u) => u.uid === user.uid) &&
            (user.name.toLowerCase().includes(lowerCaseSearch) ||
             user.email.toLowerCase().includes(lowerCaseSearch))
        );
      })
    );
  }
  
  
  
  
  getUserById(userId: string): Observable<Client | null> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return docData(userDocRef, { idField: 'uid' }) as Observable<Client | null>;
  }

  constructor() {}
}


