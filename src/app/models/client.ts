export interface Client {
    email: string;
    name: string;
    family_name: string;
    logo?: string | null;
    uid?: string;
    role?: UserRole;
  }

  export enum UserRole {
    USER = 'USER',
    SUPER_ADMIN = 'SUPER_ADMIN',
  }
  
  
  export type Clients = Client[];
  