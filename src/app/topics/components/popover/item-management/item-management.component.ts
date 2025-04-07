import { Component, inject, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencil, trash } from 'ionicons/icons';
import {
  IonContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { Topic, TopicPermission } from 'src/app/models/topic';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AlertComponent } from '../../alert/alert.component';
import { ToastService } from 'src/app/services/toast.service';
import { HasTopicPermissionPipe, HasPostPermissionPipe } from "../../../topic-permission.pipe";
import { Post } from 'src/app/models/post';

addIcons({ trash, pencil });

@Component({
  selector: 'app-manage-item',
  imports: [IonContent, IonIcon, IonList, IonItem, IonLabel, CommonModule, HasTopicPermissionPipe, HasPostPermissionPipe],
  template: `
    <ion-content>
      <ion-list>
        <ion-item
           *ngIf="post?.id ? ( post | hasPostPermission :'edit' : topic | async ) : (topic | hasTopicPermission:'edit' | async)"
          [button]="true"
          [detail]="false"
          (click)="edit()"
        >
          <ion-label>Edit</ion-label>
          <ion-icon slot="end" name="pencil"></ion-icon>
        </ion-item>
        <ion-item
          *ngIf="post?.id ? ( post | hasPostPermission :'delete' : topic | async ) : (topic | hasTopicPermission:'delete' | async)"
          [button]="true"
          [detail]="false"
          (click)="post?.id ? removePost() : removeTopic()"
        >
          <ion-label color="danger">Delete</ion-label>
          <ion-icon color="danger" slot="end" name="trash"></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class ItemManagementPopover {
  private readonly popoverCtrl = inject(PopoverController);
  private alertService = inject(AlertComponent);
  private toastService = inject(ToastService);

  @Input() topic!: Topic;
  @Input() post!: Post;

  edit() {
    this.popoverCtrl.dismiss({ action: 'edit' });
  }

  async removeTopic() {
    await this.alertService.presentAlert(
      `Are you sure you want to delete ${this.topic.name}?`,
      () => {
        this.popoverCtrl
          .dismiss({ action: 'remove' })
          .then(() => {
            this.toastService.presentToast(
              `You have successfully deleted your book: ${this.topic.name}`,
              'success'
            );
          })
          .catch((error) => {
            this.toastService.presentToast(
              'Removing book unsuccessful: ' + error.message,
              'danger'
            );
          });
      }
    );
  }

  async removePost() {
    await this.alertService.presentAlert(
      `Are you sure you want to delete ${this.post.name}?`,
      () => {
        this.popoverCtrl
          .dismiss({ action: 'remove' })
          .then(() => {
            this.toastService.presentToast(
              `You have successfully deleted your book: ${this.post.name}`,
              'success'
            );
          })
          .catch((error) => {
            this.toastService.presentToast(
              'Removing book unsuccessful: ' + error.message,
              'danger'
            );
          });
      }
    );
  }
}
