import { NgZone, inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, user, User, UserCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { Client, UserRole } from '../models/client';
import { collection, collectionData, doc, docData, Firestore, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { Topic, TopicPermission } from '../models/topic';

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

  
  async register(email: string, name: string, family_name: string, password: string, isSuperAdmin = false): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    if(result?.user?.email) {
      await sendEmailVerification(result?.user);
      const user = {
        email,
        name,
        family_name,
        logo: null,
        role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.USER,
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

  getUsersByPartialNameOrEmail(search: string, topic: Topic | undefined): Observable<Client[]> {
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
      this.getConnectedUser()
    ]).pipe(
      map(([nameResults, emailResults, currentUser]) => {
        const mergedResults = [...nameResults, ...emailResults];

        //remove user from search and owner
        const currentUserId = currentUser?.uid;
        const ownerId = topic?.owner;
  
        return mergedResults.filter(
          (user, index, self) =>
            index === self.findIndex((u) => u.uid === user.uid) &&
            (user.name.toLowerCase().includes(lowerCaseSearch) ||
             user.email.toLowerCase().includes(lowerCaseSearch)) &&
             user.uid !== currentUserId &&
             user.uid !== ownerId
        );
      })
    );
  }
  
  getUserById(userId: string): Observable<Client | null> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return docData(userDocRef, { idField: 'uid' }) as Observable<Client | null>;
  }
  canPerformAction(topic: Topic | null | undefined, permission: TopicPermission): Observable<boolean | undefined> {
    return this.getConnectedUser().pipe(
      switchMap((user) => {
        if (!user?.uid) return of(false); 

        const userDocRef = doc(this.firestore, `users/${user.uid}`);

        return docData(userDocRef).pipe(
          map((userData: any) => {
            const isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;
            if (isSuperAdmin) return true; 
  
            switch (permission) {
              case TopicPermission.READ:
                return (
                  topic?.owner === user.uid ||
                  topic?.readers?.includes(user.uid) ||
                  topic?.writers?.includes(user.uid) ||
                  topic?.master?.includes(user.uid)
                );
  
              case TopicPermission.WRITE:
                return (
                  topic?.owner === user.uid ||
                  topic?.writers?.includes(user.uid) ||
                  topic?.master?.includes(user.uid)
                );
  
              case TopicPermission.FULL:
                return topic?.owner === user.uid || topic?.master?.includes(user.uid);
  
              default:
                return false;
            }
          })
        );
      })
    );
  }
  
  

  async setUserRole(uid: string, role: UserRole): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(userRef, { role });
  }
  
  constructor() {}
}


