import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { firstValueFrom, map, Observable, switchMap } from 'rxjs';
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
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { GoogleStorageService } from './files.service';

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

  getAll(): Observable<Topics> {
    const user$ = this._authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        const whereUserIsownerTopics = query(
          this.topicsCollection,
          where('owner', '==', user?.uid)
        );

        return collectionData(whereUserIsownerTopics, {
          idField: 'id',
        }) as Observable<Topic[]>;
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
    setDoc(doc(this.firestore, `topics/${topic.id}`), topic);
    this.toastService.presentToast('Topic edited successfully!', 'warning');
  }

  removeTopic(topic: Topic): void {
    deleteDoc(doc(this.firestore, `topics/${topic.id}`));
    this.toastService.presentToast('Topic deleted successfully!', 'danger');
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
