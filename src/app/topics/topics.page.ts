import { Component, inject, OnInit, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TopicService } from '../services/topic.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ToastController } from '@ionic/angular';
import { ModalController, PopoverController } from '@ionic/angular/standalone';
import { UserPopoverComponent } from './components/popover/user-management/user-management.component';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { ItemManagementPopover } from './components/popover/item-management/item-management.component';
import { Topic, TopicPermission } from '../models/topic';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReactionsComponent } from './components/reactions/reactions.component';
import { HasTopicPermissionPipe } from './topic-permission.pipe';

addIcons({
  addOutline,
  chevronForward,
  ellipsisVertical,
});

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-img
            src="assets/img/logo.png"
            alt="Book's Club"
            class="header-logo"
          ></ion-img>
        </ion-buttons>
        <ion-title>Book's Club</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="presentUserPopover($event)">
            <ion-icon slot="icon-only" name="person-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-list *ngIf="!loading(); else loadingTemplate">
        @for(topic of topics(); track topic.id) {
        <ion-card class="book-card">
          <ion-item lines="none" class="bg-gradient">
            <ion-label>
              <ion-card-title>{{ topic.name }}</ion-card-title>
              <ion-card-subtitle>{{ topic.category }}</ion-card-subtitle>
            </ion-label>
            <ion-button
              *ngIf="
                (topic | hasTopicPermission : 'edit' | async) ||
                (topic | hasTopicPermission : 'delete' | async)
              "
              fill="clear"
              (click)="
                presentTopicManagementPopover($event, topic);
                $event.stopPropagation()
              "
              aria-label="Manage topic"
            >
              <ion-icon slot="icon-only" name="ellipsis-vertical"></ion-icon>
            </ion-button>
          </ion-item>

          <img
            *ngIf="topic.cover"
            [src]="topic.cover"
            alt="Book Cover"
            class="book-cover"
          />
          <ion-item>
            <ion-row
              style="width: 100%; display: flex; justify-content: space-between;"
            >
              <ion-col size="auto">
                <app-reactions
                  [topic]="topic"
                  [userId]="userId"
                ></app-reactions>
              </ion-col>
              <ion-col size="auto" class="writers-readers-avatars">
                <ion-row class="writers-row">
                  <ion-col size="auto">
                    <strong>Writers:</strong>
                  </ion-col>
                  <ion-col size="auto" class="avatars-row">
                    <ng-container
                      *ngIf="
                        topic.writers && topic.writers.length > 0;
                        else noWriters
                      "
                    >
                      <ion-avatar
                        *ngFor="let writer of topic.writers.slice(0, 2)"
                        class="small-avatar"
                      >
                        <img src="assets/img/no_logo.jpg" alt="Writer Avatar" />
                      </ion-avatar>
                      <ng-container *ngIf="topic.writers.length > 2">
                        <span>+{{ topic.writers.length - 2 }}</span>
                      </ng-container>
                    </ng-container>
                    <ng-template #noWriters>
                      <span>0</span>
                    </ng-template>
                  </ion-col>
                </ion-row>
                <ion-row class="readers-row">
                  <ion-col size="auto">
                    <strong>Readers:</strong>
                  </ion-col>
                  <ion-col size="auto" class="avatars-row">
                    <ng-container
                      *ngIf="
                        topic.readers && topic.readers.length > 0;
                        else noReaders
                      "
                    >
                      <ion-avatar
                        *ngFor="let reader of topic.readers.slice(0, 2)"
                        class="small-avatar"
                      >
                        <img
                          src="assets/img/no_logo.jpg"
                          alt="Readers Avatar"
                        />
                      </ion-avatar>
                      <ng-container *ngIf="topic.readers.length > 2">
                        <span>+{{ topic.readers.length - 2 }}</span>
                      </ng-container>
                    </ng-container>
                    <ng-template #noReaders>
                      <span>0</span>
                    </ng-template>
                  </ion-col>
                </ion-row>
              </ion-col>
            </ion-row>
          </ion-item>
          <ion-item
            lines="none"
            [routerLink]="['/topics/' + topic.id]"
            class="summary-item"
          >
            <ion-grid>
              <h3>Summary:</h3>
              {{ topic.description }}
            </ion-grid>
          </ion-item>
        </ion-card>
        } @empty {
        <div class="empty-state">
          <ion-img src="assets/img/no_data.svg" alt="No books found"></ion-img>
          <ion-text color="medium">No books added yet</ion-text>
        </div>
        }
      </ion-list>

      <ng-template #loadingTemplate>
        <ion-list>
          <ion-list-header>
            <ion-skeleton-text
              [animated]="true"
              style="width: 80px"
            ></ion-skeleton-text>
          </ion-list-header>
          <ion-item>
            <ion-thumbnail slot="start">
              <ion-skeleton-text [animated]="true"></ion-skeleton-text>
            </ion-thumbnail>
            <ion-label>
              <h3>
                <ion-skeleton-text
                  [animated]="true"
                  style="width: 80%;"
                ></ion-skeleton-text>
              </h3>
              <p>
                <ion-skeleton-text
                  [animated]="true"
                  style="width: 60%;"
                ></ion-skeleton-text>
              </p>
              <p>
                <ion-skeleton-text
                  [animated]="true"
                  style="width: 30%;"
                ></ion-skeleton-text>
              </p>
            </ion-label>
          </ion-item>
        </ion-list>
      </ng-template>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button aria-label="Add new book" (click)="openModal()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      /* Header adjustments */
      ion-header {
        ion-toolbar {
          &:first-child {
            padding-top: var(--ion-safe-area-top);
          }
        }
      }

      ion-item.bg-gradient {

        &::part(native) {
          background: linear-gradient(135deg, #b3dbff 0%, #9f7aea 100%);
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

      /* Book card styles */
      .book-card {
        margin: 16px;
        border: 1px solid var(--ion-border-color);
      }

      /* Rest of your existing styles... */
      .header-logo {
        width: 30px;
        height: 30px;
        margin-right: 8px;
      }

      .book-cover {
        background: none !important;
        width: 100%;
      }

      .summary-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --inner-padding-end: 0;

        ion-card-content {
          white-space: pre-line;
          line-height: 1.5;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60vh;
        text-align: center;

        ion-img {
          width: 50%;
          max-width: 200px;
          opacity: 0.7;
          margin-bottom: 16px;
        }
      }

      /* Responsive adjustments */
      @media (max-width: 576px) {
        .book-card {
          margin: 8px;
        }
      }

      .writers-readers-avatars {
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }

      .avatars-row {
        display: flex;
        justify-content: flex-end;
      }

      .small-avatar {
        margin-left: 6px;
        width: 20px;
        height: 20px;
      }

      .writers-row,
      .readers-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
      ion-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    `,
  ],
  imports: [
    IonicModule,
    CommonModule,
    RouterLink,
    ReactionsComponent,
    HasTopicPermissionPipe,
  ],
  standalone: true,
})
export class TopicsPage implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly toastCtrl = inject(ToastController);
  private readonly authService = inject(AuthService);
  userId: string | undefined;
  loading = signal<boolean>(true);
  topics = toSignal<Topic[]>(
    this.topicService.getAll().pipe(tap(() => this.loading.set(false)))
  );

  async ngOnInit() {
    this.userId = await firstValueFrom(this.authService.getUserId());
  }

  async openModal(topic?: Topic): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreateTopicModal,
      componentProps: { topic },
    });
    modal.present();

    await modal.onDidDismiss();
  }

  async presentUserPopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: UserPopoverComponent,
      event,
      showBackdrop: true,
      translucent: true,
    });

    await popover.present();
  }

  async presentTopicManagementPopover(event: Event, topic: Topic) {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
      componentProps: { topic },
    });

    await popover.present();

    const {
      data: { action },
    } = await popover.onDidDismiss();

    if (action === 'remove') this.topicService.removeTopic(topic);
    else if (action === 'edit') this.openModal(topic);
  }
}
