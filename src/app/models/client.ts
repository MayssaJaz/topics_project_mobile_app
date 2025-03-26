export interface Client {
    email: string;
    name: string;
    family_name: string;
    logo?: string | null;
    uid?: string;
  }
  
  export type Clients = Client[];
  