import { Post } from './post';

export interface Topic {
  id: string;
  name: string;
  readers?: string[]; 
  writers?: string[];
  owner?:string;
}

export type Topics = Topic[];
