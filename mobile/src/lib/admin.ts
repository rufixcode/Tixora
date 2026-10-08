export type AdminRecord = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
};
export type AdminPage = {
  data: AdminRecord[];
  current_page: number;
  last_page: number;
  total: number;
};
