import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopicService } from 'src/app/services/topic.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  chevronBackOutline,
  chevronForward,
  createOutline,
  ellipsisVertical,
  personCircleOutline,
} from 'ionicons/icons';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderComponent } from '../components/header/header.component';
import { FirestoreDatePipe } from '../topic-permission.pipe';
import {
  ModalController,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonChip,
} from '@ionic/angular/standalone';

addIcons({
  addOutline,
  chevronForward,
  ellipsisVertical,
  chevronBackOutline,
  createOutline,
  personCircleOutline,
  calendarOutline,
});

@Component({
  selector: 'app-topic-details',
  template: `
    <header-component />
    <ion-content [fullscreen]="true">
      <ion-item
        lines="none"
        class="back-button"
        [routerLink]="['/topics/' + topicId]"
      >
        <ion-icon slot="start" name="chevron-back-outline"></ion-icon>
        <ion-label>Back to Book</ion-label>
      </ion-item>

      <div class="post-container">
        <h1 class="post-title">{{ post()?.name }}</h1>

        <div class="post-meta">
          <ion-chip color="primary" *ngIf="post()?.authorName">
            <ion-icon name="person-circle-outline"></ion-icon>
            <ion-label>Author: {{ post()?.authorName }}</ion-label>
          </ion-chip>

          <ion-chip *ngIf="post()?.lastModifiedBy" color="secondary">
            <ion-icon name="create-outline"></ion-icon>
            <ion-label
              >Last edited by: {{ post()?.lastModifiedBy?.userName }}</ion-label
            >
          </ion-chip>

          <ion-chip color="tertiary" *ngIf="post()?.createdAt">
            <ion-icon name="calendar-outline"></ion-icon>
            <ion-label>
              {{ post()?.createdAt | firestoreDate | date : 'mediumDate' }}
              <span *ngIf="post()?.updatedAt"
                >(updated:
                {{ post()?.updatedAt | firestoreDate | date : 'short' }})</span
              >
            </ion-label>
          </ion-chip>
        </div>

        <div class="post-content">
          <p>{{ post()?.description }}</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-item.bg-gradient {
        background: transparent;
        border-color: transparent;
        margin: 12px 8px;
        &::part(native) {
          background: linear-gradient(135deg, #9f7aea 0%, #b3dbff 100%);
          border-radius: 12px;
          padding: 8px 16px;
        }

        ion-label {
          color: #2d3748;
        }

        ion-card-title,
        ion-card-subtitle {
          color: inherit;
        }
      }
      .image::part(image) {
        width: 50%;
        margin: auto;
      }
      .loading-spinner {
        display: block;
        margin: auto;
        margin-top: 50px;
      }
      .post-title {
        margin-left: 12px;
      }

      .post-container {
        padding: 16px;
      }

      .post-title {
        margin-bottom: 16px;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .post-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;

        ion-chip {
          ion-icon {
            margin-right: 6px;
          }
        }
      }

      .post-content {
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;

        p {
          margin: 0;
          line-height: 1.6;
          white-space: pre-line;
        }
      }

      .back-button {
        --min-height: 56px;
        --padding-start: 16px;

        ion-icon {
          font-size: 1.5em;
          margin-right: 12px;
        }

        &::part(native) {
          --detail-icon-opacity: 0;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    RouterLink,
    FirestoreDatePipe,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonChip,
  ],
})
export class PostDetailsPage {
  private route = inject(ActivatedRoute);
  private topicService = inject(TopicService);
  constructor(private modalCtrl: ModalController) {
    addIcons({ createOutline });
  }
  postId = this.route.snapshot.params['postId'];
  topicId = this.route.snapshot.params['topicId'];
  post = toSignal(this.topicService.getPostById(this.topicId, this.postId), {
    initialValue: null,
  });
}
