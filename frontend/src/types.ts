export interface Auth {
  hash?: string;
  data?: {
    id: string;
    first_name: string;
    last_name?: string;
    username: string;
    photo_url?: string;
    auth_date: string;
  };
}
