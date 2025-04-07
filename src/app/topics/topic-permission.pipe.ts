import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Topic, TopicPermission } from '../models/topic';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { Post } from '../models/post';
import { TopicService } from '../services/topic.service';

@Pipe({
  name: 'hasTopicPermission',
  standalone: true,
})
export class HasTopicPermissionPipe implements PipeTransform {
  private authService = inject(AuthService);

  transform(
    topic: Topic,
    permissionType: 'edit' | 'delete'
  ): Observable<boolean | undefined> {
    if (permissionType === 'edit') {
      return this.authService.canPerformAction(topic, TopicPermission.WRITE);
    }
    if (permissionType === 'delete') {
      return this.authService.canPerformAction(topic, TopicPermission.DELETE);
    }
    return new Observable<boolean>((observer) => observer.next(false));
  }
}

@Pipe({
  name: 'hasPostPermission',
  standalone: true,
})
export class HasPostPermissionPipe implements PipeTransform {
  private authService = inject(AuthService);

  transform(
    post: Post,
    permissionType: 'edit' | 'delete',
    topic: Topic | undefined | null
  ): Observable<boolean | undefined> {
    if (permissionType === 'edit') {
      return this.authService.canPerformPostAction(post, topic, TopicPermission.WRITE);
    }
    if (permissionType === 'delete') {
      return this.authService.canPerformPostAction(post, topic, TopicPermission.DELETE);
    }
  
    return new Observable<boolean>((observer) => observer.next(false));
  }
}

@Pipe({
  name: 'getPostsLengthByTopic',
  standalone: true,
})
export class GetPostsLengthByTopic implements PipeTransform {
  private topicService = inject(TopicService);

  transform(topic: Topic | undefined | null): Observable<number> {
    if (!topic?.id) {
      return of(0);
    }

    return this.topicService.getAllPostsByTopicId(topic.id).pipe(
      map((posts) => {
        const count = posts?.length ?? 0;
        return count;
      }),
      catchError(() => of(0))
    );
  }
}

@Pipe({ name: 'firestoreDate' })
export class FirestoreDatePipe implements PipeTransform {
  transform(value: Timestamp | Date | undefined): Date | null {
    if (!value) return null;
    return value instanceof Date ? value : value.toDate();
  }
}
