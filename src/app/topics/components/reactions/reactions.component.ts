import { Component, Input, OnInit } from '@angular/core';
import { IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { TopicService } from 'src/app/services/topic.service';
import { ReactionsType, Topic } from 'src/app/models/topic';
import { CommonModule } from '@angular/common';
import { heart, thumbsUp, thumbsUpOutline, thumbsDown, thumbsDownOutline, sad, heartOutline, sadOutline} from 'ionicons/icons';
import { addIcons } from 'ionicons';

addIcons({ heart, heartOutline, thumbsUp, thumbsDown, sad, thumbsUpOutline, thumbsDownOutline, sadOutline});

@Component({
  selector: 'app-reactions',
  imports: [IonButtons, IonButton, CommonModule, IonIcon],
  template: `
    <ion-buttons>
      <ion-button
        *ngFor="let reaction of reactionsTypes"
        (click)="react(topic, reaction, userId)"
        [class.filled]="hasReacted(topic, reaction, userId)"
      >
        <ion-icon 
          [name]="getIcon(reaction)"
          slot="icon-only"
        ></ion-icon>
        {{ getReactionCount(topic, reaction) }}
      </ion-button>
    </ion-buttons>
  `,
  standalone: true,
})
export class ReactionsComponent implements OnInit {

  @Input() topic!: Topic;
  @Input() userId!: string | undefined;
  reactionsTypes = Object.values(ReactionsType);

  constructor(private topicService: TopicService) { }

  ngOnInit() {}

  // Helper function to get the count of reactions
  getReactionCount(topic: Topic, reaction: ReactionsType): number {
    return topic.reactions?.[reaction]?.length || 0;
  }

  // Handle adding or removing reactions
  react(topic: Topic, reaction: ReactionsType, userId: string | undefined): void {
    // Clone reactions to avoid mutating the original object directly
    const reactions = { ...topic.reactions };

    this.initializeMissingReactions(reactions);

    if(userId) {
      const index = reactions[reaction].indexOf(userId);
      if (index > -1) {
        // Remove the user's reaction
        reactions[reaction].splice(index, 1);
      } else {
        // Add the user's reaction
        reactions[reaction].push(userId);
      }
    }

    // Update Firestore with new reactions
    this.updateReactions(topic, reactions);
  }

  private updateReactions(topic: Topic, reactions: Record<ReactionsType, string[]>): void {
    this.topicService.editTopicReactions(topic.id, reactions);
  }

  private initializeMissingReactions(reactions: Record<ReactionsType, string[]>) {
    Object.keys(ReactionsType).forEach((reactionKey) => {
      const reactionType = ReactionsType[reactionKey as keyof typeof ReactionsType];
      if (!reactions[reactionType]) {
        reactions[reactionType] = []; 
      }
    });  
  }

  // Check if the user has reacted to this reaction
  hasReacted(topic: Topic, reaction: ReactionsType, userId: string | undefined): boolean {
    return (userId && topic.reactions?.[reaction]?.includes(userId)) || false;
  }

  // Get the icon name based on reaction type
  getIcon(reaction: ReactionsType): string {
    switch (reaction) {
      case ReactionsType.LOVE:
        return this.hasReacted(this.topic, reaction, this.userId) ? 'heart' : 'heart-outline';
      case ReactionsType.THUMBS_UP:
        return this.hasReacted(this.topic, reaction, this.userId) ? 'thumbs-up' : 'thumbs-up-outline';
      case ReactionsType.THUMBS_DOWN:
        return this.hasReacted(this.topic, reaction, this.userId) ? 'thumbs-down' : 'thumbs-down-outline';
      case ReactionsType.SAD:
        return this.hasReacted(this.topic, reaction, this.userId) ? 'sad' : 'sad-outline';
      default:
        return 'help-circle-outline'; 
    }
  }
}
