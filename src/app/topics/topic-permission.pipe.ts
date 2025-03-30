import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Topic, TopicPermission } from '../models/topic';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
    name: 'hasTopicPermission',
    standalone: true, 
  })
  export class HasTopicPermissionPipe implements PipeTransform {
    private authService = inject(AuthService);
  
    transform(topic: Topic, permissionType: 'edit' | 'delete'): Observable<boolean | undefined> {
      if (permissionType === 'edit') {
        return this.authService.canPerformAction(topic, TopicPermission.WRITE);
      }
      if (permissionType === 'delete') {
        return this.authService.canPerformAction(topic, TopicPermission.FULL);
      }
      return new Observable<boolean>((observer) => observer.next(false));
    }
  }