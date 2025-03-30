import { inject, Injectable } from '@angular/core';
import { ReactionsType, Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  setDoc,
  doc,
  docData,
  deleteDoc,
  where,
  query,
  updateDoc,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { GoogleStorageService } from './files.service';
import { UserRole } from '../models/client';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private firestore = inject(Firestore);
  private _authService = inject(AuthService);
  topicsCollection = collection(this.firestore, 'topics');
  private readonly toastService = inject(ToastService);
  storageService = inject(GoogleStorageService);
  downloadURL = '';

  getAll(): Observable<Topic[]> {
    return this._authService.getConnectedUser().pipe(
      switchMap((user) => {
        if (!user?.uid) return of([]);
  
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        return docData(userDocRef).pipe(
          switchMap((userData: any) => {
            const isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;
            if (isSuperAdmin) {
              return collectionData(this.topicsCollection, { idField: 'id' }) as Observable<Topic[]>;
            }
  
            const ownerQuery = query(this.topicsCollection, where('owner', '==', user.uid));
            const writerQuery = query(this.topicsCollection, where('writers', 'array-contains', user.uid));
            const readerQuery = query(this.topicsCollection, where('readers', 'array-contains', user.uid));
  
            return combineLatest([
              collectionData(ownerQuery, { idField: 'id' }) as Observable<Topic[]>,
              collectionData(writerQuery, { idField: 'id' }) as Observable<Topic[]>,
              collectionData(readerQuery, { idField: 'id' }) as Observable<Topic[]>,
            ]).pipe(
              map(([owner, writers, readers]) => {
                return [...owner, ...writers, ...readers].filter(
                  (topic, index, self) => index === self.findIndex((t) => t.id === topic.id)
                );
              })
            );
          })
        );
      })
    );
  }
  
  
  getById(topicId: string): Observable<Topic | undefined> {
    return docData(doc(this.firestore, `topics/${topicId}`), {
      idField: 'id',
    }) as Observable<Topic | undefined>;
  }

  async uploadFile(file: File): Promise<string | Error> {
    if (file) {
      try {
        const fileUrl = await this.storageService.uploadFile(file); 
        return fileUrl;
      } catch (error) {
        this.toastService.presentToast('Error uploading file', 'danger');
        return new Error('File upload failed');
      }
    }
    this.toastService.presentToast('No image selected', 'danger');
    return new Error('No file selected');
  }
  

  async addTopic(
    topic: Omit<Topic, 'id' | 'posts' | 'imageUrl'>,
    selectedFile?: File
  ): Promise<void> {
    try {
      let cover = '';
      if (selectedFile) {
        const fileUploadResult = await this.uploadFile(selectedFile);

        if (fileUploadResult instanceof Error) {
          throw fileUploadResult;
        } else {
          cover = fileUploadResult;
        }
      }

      await addDoc(this.topicsCollection, <Topic>{
        ...topic,
        id: generateUUID(),
        cover,
        posts: [],
      });

      this.toastService.presentToast('Topic added successfully!', 'success');
    } catch (error) {
      console.error('Error adding topic:', error);
      this.toastService.presentToast(
        'Failed to add your new book',
        'danger'
      );
    }
  }

  getUserId(): Observable<string | undefined> {
    return this._authService.getConnectedUser().pipe(map((user) => user?.uid));
  }

  editTopic(topic: Topic): void {
    setDoc(doc(this.firestore, `topics/${topic.id}`), topic)
    .then(() => {
      this.toastService.presentToast('Topic edited successfully!', 'warning');
    })
    .catch((error) => {
      this.toastService.presentToast('Error updating topic: ' + error.message, 'danger');
    });
  }

  editTopicReactions(topicId: string, reactions: Record<ReactionsType, string[]>): void {
    const topicRef = doc(this.firestore, `topics/${topicId}`);
    updateDoc(topicRef, {
      reactions: reactions
    })
      .then(() => {
        this.toastService.presentToast('Reactions updated successfully!', 'success');
      })
      .catch((error) => {
        this.toastService.presentToast('Error updating reactions: ' + error.message, 'danger');
      });
  }

  removeTopic(topic: Topic): void {
    deleteDoc(doc(this.firestore, `topics/${topic.id}`));
    this.toastService.presentToast('Topic deleted successfully!', 'danger').then(() => {
      this.toastService.presentToast('Topic removed successfully!', 'warning');
    })
    .catch((error) => {
      this.toastService.presentToast('Error removing topic: ' + error.message, 'danger');
    });
  }

  async addPost(topicId: string, post: Omit<Post, 'id'>): Promise<void> {
    const postsCollectionRef = collection(
      this.firestore,
      `topics/${topicId}/posts`
    );
    await addDoc(postsCollectionRef, post);
  }

  async editPost(topicId: string, post: Post): Promise<void> {
    await setDoc(
      doc(this.firestore, `topics/${topicId}/posts/${post.id}`),
      post
    );
  }

  removePost(topicId: string, post: Post): void {
    deleteDoc(doc(this.firestore, `topics/${topicId}/posts/${post.id}`));
  }
  
}
