import { inject, Injectable } from '@angular/core';
import { ReactionsType, Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { combineLatest, firstValueFrom, map, Observable, of, switchMap } from 'rxjs';
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
  getDoc,
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
      });

      this.toastService.presentToast('Book added successfully!', 'success');
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

  async editTopic(topic: Topic,
    selectedFile?: File): Promise<void> {
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

      topic.cover = cover;

      await setDoc(doc(this.firestore, `topics/${topic.id}`), topic);

      this.toastService.presentToast('Book edited successfully!', 'success');

    } catch (error) {
      
      console.error('Error editing topic:', error);
      this.toastService.presentToast(
        'Failed to edit your book',
        'danger'
      );
    }
  }

  async editTopicReactions(topicId: string, reactions: Record<ReactionsType, string[]>): Promise<void> {
    try {
      const topicRef = doc(this.firestore, `topics/${topicId}`);
      await updateDoc(topicRef, { reactions });
      this.toastService.presentToast('Reactions updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating reactions:', error);
      this.toastService.presentToast(
        'Failed to edit reactions on your book',
        'danger'
      );
    }
  }

  async removeTopic(topic: Topic): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, `topics/${topic.id}`));
      this.toastService.presentToast('Book removed successfully!', 'success');
    } catch (error) {
      console.error('Error removing topic:', error);
      this.toastService.presentToast(
        'Failed to removing your book',
        'danger'
      );
    }
  }

  async addPost(topicId: string, post: Omit<Post, 'id'>): Promise<void> {
    try {
      const currentUser = await firstValueFrom(this._authService.getConnectedUser());
      
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }
  
      const userDoc = await getDoc(doc(this.firestore, `users/${currentUser.uid}`));
      const userName = userDoc.data()?.['name'] || userDoc.data()?.['email'] || 'Anonymous';
  
      const postsCollectionRef = collection(this.firestore, `topics/${topicId}/posts`);
      
      await addDoc(postsCollectionRef, {
        ...post,
        authorId: currentUser.uid,
        authorName: userName,
        createdAt: new Date(),
        lastModifiedBy: { 
          userId: currentUser?.uid,
          userName: userName
        },
        updatedAt: new Date(),
      });
   
      this.toastService.presentToast('Comment added successfully!', 'success');
    } catch (error) {
      console.error('Error adding post:', error);
      this.toastService.presentToast(
        'Failed to add your comment',
        'danger'
      );
    }
  }

  getPostById(topicId: string, postId: string): Observable<Post | undefined> {
    const postRef = doc(this.firestore, `topics/${topicId}/posts/${postId}`);
    return docData(postRef, { idField: 'id' }) as Observable<Post | undefined>;
  }

  getAllPostsByTopicId(topicId: string | undefined): Observable<Post[]> {
    if (!topicId) {
      return of([]);
    }
  
    const postsCollection = collection(this.firestore, `topics/${topicId}/posts`);
    return collectionData(postsCollection, { idField: 'id' }) as Observable<Post[]>;
  }

  async editPost(topicId: string, post: Post): Promise<void> {
    try {
      const currentUser = await firstValueFrom(this._authService.getConnectedUser());
      const userDoc = await getDoc(doc(this.firestore, `users/${currentUser?.uid}`));
      const userName = userDoc.data()?.['name'] || 'Anonymous';
  
      await setDoc(doc(this.firestore, `topics/${topicId}/posts/${post.id}`), {
        name: post.name,
        description: post.description,
        authorId: post.authorId,       
        authorName: post.authorName,  
        lastModifiedBy: {             
          userId: currentUser?.uid,
          userName: userName
        },
        createdAt: post.createdAt,     
        updatedAt: new Date()          
      });
      
      this.toastService.presentToast('Comment updated successfully!', 'success');
    } catch (error) {
      console.error('Error editing post:', error);
      this.toastService.presentToast(
        'Failed to edit your comment',
        'danger'
      );
    }
  }

  async removePost(topicId: string, post: Post): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, `topics/${topicId}/posts/${post.id}`));
      this.toastService.presentToast('Commment removed successfully!', 'success');
    } catch (error) {
      console.error('Error removing post:', error);
      this.toastService.presentToast(
        'Failed to remove your comment',
        'danger'
      );
    }
  }
  
}
