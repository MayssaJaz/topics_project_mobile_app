import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterModule,
} from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { Post } from 'src/app/models/post';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronForward,
  chevronForwardOutline,
  chevronBackOutline,
  ellipsisVertical,
} from 'ionicons/icons';
import { ItemManagementPopover } from '../components/popover/item-management/item-management.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { Observable, of, switchMap, tap } from 'rxjs';
import { Topic, TopicPermission } from 'src/app/models/topic';
import { AuthService } from 'src/app/services/auth.service';
import { HeaderComponent } from '../components/header/header.component';

addIcons({
  addOutline,
  chevronForward,
  ellipsisVertical,
  chevronForwardOutline,
  chevronBackOutline,
});

@Component({
  selector: 'app-topic-details',
  template: `
    <header-component />

    <ion-content [fullscreen]="true">
      <ion-item
        lines="none"
        class="summary-item"
        [routerLink]="['/topics']"
        class="back-button"
      >
        <ion-icon slot="start" name="chevron-back-outline"></ion-icon>
        <ion-label>Back to Book List</ion-label>
      </ion-item>
      <h1 class="title-book">Book: {{ topic()?.name }}</h1>

      <ion-list *ngIf="!loading(); else loadingTemplate">
        @for(post of posts(); track post.id) {
        <ion-item lines="none" class="bg-gradient">
          <ion-button
            *ngIf="canEdit$ | async"
            slot="start"
            fill="clear"
            id="click-trigger"
            (click)="presentPostManagementPopover($event, post, topic())"
            aria-label="open post management popover"
            data-cy="open-post-management-popover"
            ><ion-icon
              slot="icon-only"
              color="medium"
              name="ellipsis-vertical"
            ></ion-icon
          ></ion-button>

          <ion-label (click)="navigateToPost(post.id, topicId)" class="clickable-label">
            {{ post.name }}
          </ion-label>

          <ion-icon
            slot="end"
            name="chevron-forward-outline"
            (click)="navigateToPost(post.id, topicId)"
          >
          </ion-icon>
        </ion-item>
        } @empty {
        <ion-img
          class="image"
          src="assets/img/no_data.svg"
          alt="No data"
        ></ion-img>
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

      <ion-fab
        *ngIf="canEdit$ | async"
        slot="fixed"
        vertical="bottom"
        horizontal="end"
      >
        <ion-fab-button
          data-cy="open-create-post-modal-button"
          aria-label="open add post modal"
          (click)="openModal()"
        >
          <ion-icon class="add-outline-icon" name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
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

      .title-book {
        margin-left: 12px;
      }
    `,
  ],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    HeaderComponent,
    RouterLink,
  ],
})
export class TopicDetailsPage implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  constructor(private router: Router) {}

  canEdit$: Observable<boolean | undefined> | undefined;

  topicId = this.route.snapshot.params['id'];
  topic = toSignal(this.topicService.getById(this.topicId), {
    initialValue: null,
  });
  loading = signal<boolean>(true);
  postsCollection = collection(this.firestore, `topics/${this.topicId}/posts`);
  posts = toSignal<Post[]>(
    this.getAllPosts().pipe(tap(() => this.loading.set(false)))
  );

  ngOnInit(): void {
    this.canEdit$ = this.topicService
      .getById(this.topicId)
      .pipe(
        switchMap((topic) =>
          topic
            ? this.authService.canPerformAction(topic, TopicPermission.WRITE)
            : of(false)
        )
      );
  }

  getAllPosts(): Observable<Post[]> {
    this.loading.set(true);
    const $posts = collectionData(this.postsCollection, {
      idField: 'id',
    }) as Observable<Post[]>;
    return $posts;
  }

  async openModal(post?: Post): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreatePostModal,
      componentProps: { topicId: this.topicId, post },
    });
    await modal.present();
    await modal.onDidDismiss();
  }

  async presentPostManagementPopover(
    event: Event,
    post: Post,
    topic: Topic | undefined | null
  ): Promise<void> {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
      componentProps: { topic },
    });
    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data?.action === 'remove')
      this.topicService.removePost(this.topicId, post);
    else if (data?.action === 'edit') this.openModal(post);
  }

  navigateToPost(postId: string, topicId: string) {
    this.router.navigate(['/topics', topicId, 'posts', postId]);
  }
}
