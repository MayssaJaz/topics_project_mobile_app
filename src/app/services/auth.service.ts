import { NgZone, inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  user,
  User,
  UserCredential,
} from '@angular/fire/auth';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { Client, UserRole } from '../models/client';
import {
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Topic, TopicPermission } from '../models/topic';
import { ToastService } from './toast.service';
import { Post } from '../models/post';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private readonly toastService = inject(ToastService);
  usersCollection = collection(this.firestore, 'users');
  location = inject(Location);

  getAllUsers(): Observable<User[]> {
    return collectionData(this.usersCollection, {
      idField: 'id',
    }) as Observable<User[]>;
  }

  getConnectedUser(): Observable<User | null> {
    return user(this.auth);
  }

  async addUser(
    user: Omit<Client, 'users' | 'uid'>,
    uid: string
  ): Promise<void> {
    const safeUser: Client = {
      uid: uid,
      email: user.email ?? '',
      name: user.name ?? '',
      family_name: user.family_name ?? '',
      logo: user.logo ?? null,
    };

    await setDoc(doc(this.firestore, `users/${uid}`), safeUser);
  }

  getUserByEmail(email: string): Observable<Client | undefined> {
    return docData(doc(this.firestore, `users/${email}`), {
      idField: 'email',
    }) as Observable<Client | undefined>;
  }

  async register(
    email: string,
    name: string,
    family_name: string,
    password: string,
    isSuperAdmin = false
  ): Promise<void> {
    const result = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    if (result?.user?.email) {
      await sendEmailVerification(result?.user);
      const user = {
        email,
        name,
        family_name,
        logo: null,
        role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.USER,
      };
      await this.addUser(user, result.user.uid);
      return this.logout();
    }
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  sendResetPasswordLink(email: string) {
    return sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.toastService.presentToast(
          'Reset password link sent to your email',
          'success'
        );
        this.logout();
      })
      .catch((error) => {
        this.toastService.presentToast(
          'Error sending password reset email. Please verify your email address.',
          'danger'
        );
        console.error();
        return Promise.reject(error);
      });
  }

  getUsersByPartialNameOrEmail(
    search: string,
    topic: Topic | undefined
  ): Observable<Client[]> {
    if (!search.trim()) return of([]);

    const lowerCaseSearch = search.toLowerCase();
    const endSearch = lowerCaseSearch + '\uf8ff';

    const emailQuery = query(
      this.usersCollection,
      where('email', '>=', lowerCaseSearch),
      where('email', '<=', endSearch)
    );

    const nameQuery = query(
      this.usersCollection,
      where('name', '>=', lowerCaseSearch),
      where('name', '<=', endSearch)
    );

    return combineLatest([
      collectionData(nameQuery, { idField: 'uid' }) as Observable<Client[]>,
      collectionData(emailQuery, { idField: 'uid' }) as Observable<Client[]>,
      this.getConnectedUser(),
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
  canPerformAction(
    topic: Topic | null | undefined,
    permission: TopicPermission
  ): Observable<boolean | undefined> {
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
                  topic?.writers?.includes(user.uid)
                );

              case TopicPermission.WRITE:
                return (
                  topic?.owner === user.uid ||
                  topic?.writers?.includes(user.uid)
                );

              case TopicPermission.DELETE:
                return topic?.owner === user.uid;

              default:
                return false;
            }
          })
        );
      })
    );
  }

  canPerformPostAction(
    post: Post | null | undefined,
    topic: Topic | null | undefined,
    permission: TopicPermission
  ): Observable<boolean | undefined> {
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
                  topic?.writers?.includes(user.uid)
                );

              case TopicPermission.WRITE:
                return post?.authorId == user.uid;

              case TopicPermission.DELETE:
                return post?.authorId == user.uid || topic?.owner == user.uid;

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

  async editUser(
    uid: string,
    name: string,
    family_name: string
  ): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, { name, family_name });
      this.toastService.presentToast('Profile edited succesfully', 'success');
      this.location.back();
    } catch (error) {
      this.toastService.presentToast(
        'Error occured while editing your profile',
        'danger'
      );
    }
  }

  async editProfilePicture(uid: string, logo: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, { logo });
      this.toastService.presentToast(
        'Profile picture updated succesfully',
        'success'
      );
    } catch (error) {
      this.toastService.presentToast(
        'Error occured while updating your profile picture',
        'danger'
      );
    }
  }

  getUserId(): Observable<string | undefined> {
    return this.getConnectedUser().pipe(map((user) => user?.uid));
  }

  constructor() {}
}
