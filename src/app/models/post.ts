export interface Post {
  createdAt?: Date;
  updatedAt?: Date;
  id: string;
  name: string;
  description?: string;
  authorId?: string;   
  authorName?: string;
  lastModifiedBy?: { 
    userId: string;
    userName: string;
  };
}

export type Posts = Post[];
