export interface Client {
    email: string;
    name: string;
    family_name: string;
    logo?: string | null;
  }
  
  export type Clients = Client[];
  