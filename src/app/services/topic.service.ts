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

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private firestore = inject(Firestore);
  private _authService = inject(AuthService);
  topicsCollection = collection(this.firestore, 'topics');

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
    )

  }

  getById(topicId: string): Observable<Topic | undefined> {
    return docData(doc(this.firestore, `topics/${topicId}`), {
      idField: 'id',
    }) as Observable<Topic | undefined>;
  }

  async addTopic(topic: Omit<Topic, 'id' | 'posts'>): Promise<void> {

    addDoc(this.topicsCollection, <Topic>{
      ...topic,
      id: generateUUID(),
      posts: [],
    });
  }
  
  getUserId(): Observable<string | undefined> {
    return this._authService.getConnectedUser().pipe(
      map((user) => user?.uid)
    );
  }

  editTopic(topic: Topic): void {
    setDoc(doc(this.firestore, `topics/${topic.id}`), topic);
  }

  removeTopic(topic: Topic): void {
    deleteDoc(doc(this.firestore, `topics/${topic.id}`));
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
