import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { Post } from 'src/app/models/post';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ItemManagementPopover } from '../popover/item-management/item-management.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { Observable, tap } from 'rxjs';

addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-topic-details',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-breadcrumbs>
          <ion-breadcrumb routerLink="">Topics</ion-breadcrumb>
          <ion-breadcrumb [routerLink]="'#topics/' + topic()?.id">{{
            topic()?.name
          }}</ion-breadcrumb>
        </ion-breadcrumbs>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ topic()?.name }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list *ngIf="!loading(); else loadingTemplate">
        @for(post of posts(); track post.id) {
        <ion-item>
          <ion-button
            slot="start"
            fill="clear"
            id="click-trigger"
            (click)="presentPostManagementPopover($event, post)"
            aria-label="open post management popover"
            data-cy="open-post-management-popover"
            ><ion-icon
              slot="icon-only"
              color="medium"
              name="ellipsis-vertical"
            ></ion-icon
          ></ion-button>
          <ion-label>{{ post.name }}</ion-label>
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
          </ion-item> </ion-list
        >src/app/topics/popover/user-management/user-management.component.ts
      </ng-template>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button
          data-cy="open-create-post-modal-button"
          aria-label="open add post modal"
          (click)="openModal()"
        >
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      .image::part(image) {
        width: 50%;
        margin: auto;
      }
      .loading-spinner {
        display: block;
        margin: auto;
        margin-top: 50px;
      }
    `,
  ],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
})
export class TopicDetailsPage implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly firestore = inject(Firestore);

  topicId = this.route.snapshot.params['id'];
  topic = toSignal(this.topicService.getById(this.topicId), {
    initialValue: null,
  });
  loading = signal<boolean>(true);
  postsCollection = collection(this.firestore, `topics/${this.topicId}/posts`);
  posts = toSignal<Post[]>(
    this.getAllPosts().pipe(tap(() => this.loading.set(false)))
  );

  ngOnInit(): void {}

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

  async presentPostManagementPopover(event: Event, post: Post): Promise<void> {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
    });
    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data?.action === 'remove')
      this.topicService.removePost(this.topicId, post);
    else if (data?.action === 'edit') this.openModal(post);
  }
}
