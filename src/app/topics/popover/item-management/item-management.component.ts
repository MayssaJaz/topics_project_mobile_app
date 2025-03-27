import { Component, inject, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencil, trash } from 'ionicons/icons';
import { IonContent, IonIcon, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { Topic, TopicPermission } from 'src/app/models/topic';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

addIcons({ trash, pencil });

@Component({
  selector: 'app-manage-item',
  imports: [IonContent, IonIcon, IonList, IonItem, IonLabel, CommonModule],
  template: `
    <ion-content>
      <ion-list>
        <ion-item *ngIf="canEdit$ | async" [button]="true" [detail]="false" (click)="edit()">
          <ion-label>Edit</ion-label>
          <ion-icon slot="end" name="pencil"></ion-icon>
        </ion-item>
        <ion-item *ngIf="canDelete$ | async" [button]="true" [detail]="false" (click)="remove()">
          <ion-label color="danger">Delete</ion-label>
          <ion-icon color="danger" slot="end" name="trash"></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class ItemManagementPopover {
  private readonly popoverCtrl = inject(PopoverController);
  private readonly authService = inject(AuthService);
  canEdit$: Observable<boolean | undefined> | undefined ;
  canDelete$: Observable<boolean | undefined> | undefined;

  @Input() topic!: Topic;

  ngOnInit() {
    this.canEdit$ = this.authService.canPerformAction(this.topic, TopicPermission.WRITE);
    this.canDelete$ = this.authService.canPerformAction(this.topic, TopicPermission.FULL);
  }

  edit() {
    this.popoverCtrl.dismiss({ action: 'edit' });
  }

  remove() {
    this.popoverCtrl.dismiss({ action: 'remove' });
  }
}
