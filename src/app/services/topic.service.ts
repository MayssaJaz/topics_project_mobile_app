import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { BehaviorSubject, map, Observable, of, tap, firstValueFrom} from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  setDoc,
  doc,
  docData,
  deleteDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private firestore = inject(Firestore);
  topicsCollection = collection(this.firestore, 'topics');
  postsCollection = collection(this.firestore, 'posts');
  //doc(topicsCollection);

  getAll(): Observable<Topics> {
    return (collectionData(this.topicsCollection, {idField: 'id'}) as Observable<Topic[]>)
  }

  getById(topicId: string): Observable<Topic | undefined> {
    return docData(doc(this.firestore, `topics/${topicId}`), { idField: 'id' }) as Observable<Topic | undefined>;
  }

  addTopic(topic: Omit<Topic, 'id' | 'posts'>): void {
    /* const _topic: Topic = {
      ...topic,
      id: generateUUID(),
      posts: [],
    };*/
    //this._topics.next([...this._topics.value, _topic]);

    addDoc(this.topicsCollection, <Topic>{
      ...topic,
      id: generateUUID(),
      posts: [],
    });
  }

  editTopic(topic: Topic): void {
    setDoc(doc(this.firestore, `topics/${topic.id}`), topic);
    //setDoc(this.topicsCollection, topic)
    /*this._topics.next(
      this._topics.value.map((_topic) =>
        _topic.id === topic.id ? topic : _topic
      )
    );*/
  }

  removeTopic(topic: Topic): void {
    deleteDoc(doc(this.firestore, `topics/${topic.id}`));
    /*this._topics.next(
      this._topics.value.filter((_topic) => _topic.id !== topic.id)
    );*/
  }

  async addPost(topicId: string, post: Omit<Post, 'id'>): Promise<void> {
    const postsCollectionRef = collection(this.firestore, `topics/${topicId}/posts`);
    await addDoc(postsCollectionRef, post);
}
  

  async editPost(topicId: string, post: Post): Promise<void> {
    await setDoc(doc(this.firestore, `topics/${topicId}/posts`), post);

   /*
    // Update the post in Firestore
    await setDoc(doc(this.firestore, `posts/${post.id}`), post);
  
    // Get the topic (resolve the Observable)
    const topic = await firstValueFrom(this.getById(topicId));
  
    if (topic) {
      // Ensure posts exist and update only the relevant post
      const updatedPosts = (topic.posts || []).map((_post) =>
        _post.id === post.id ? post : _post
      );
  
      // Save the updated topic
      await this.editTopic({
        id: topicId,
        name: topic.name,
        posts: updatedPosts, // Ensuring proper update
      });
    }
      */
  }
  
  removePost(topicId: string, post: Post): void {
    /*this._topics.next(
      this._topics.value.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              posts: topic.posts.filter((_post) => _post.id !== post.id),
            }
          : topic
      )
    );*/
  }
}
