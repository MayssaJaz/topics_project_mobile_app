import { Post } from './post';


export enum Category {
  ScienceFiction = "Science Fiction",
  Horror = "Horror",
  Romance = "Romance",
  Biography = "Biography",
  Fantasy = "Fantasy",
  Mystery = "Mystery",
  Thriller = "Thriller",
  Historical = "Historical",
  Adventure = "Adventure",
  Poetry = "Poetry",
  SelfHelp = "Self-Help",
  Philosophy = "Philosophy",
  Psychology = "Psychology",
}


export interface Topic {
  id: string;
  name: string;
  readers?: string[]; 
  writers?: string[];
  owner?:string;
  cover?: string;
  master?: string;
  description: string;
  category: Category;
  reactions: Record<ReactionsType, string[]>; // Example: { '👍': ['user1', 'user2'], '❤️': ['user3'] }
}

export type Topics = Topic[];

export enum TopicPermission {
  READ = 'read',
  WRITE = 'write',
  FULL = 'full',
}
export enum ReactionsType {
  LOVE = '❤️',
  THUMBS_UP = '👍',
  THUMBS_DOWN = '👎', 
  SAD = '😢',
}