export type AdminOverview = {
  customers: number;
  bookings: number;
  pending: number;
  confirmed: number;
  confirmed_amount: number;
};
export type AdminRecord = {
  id: number;
  name?: string;
  email: string;
  is_admin?: boolean;
  customer?: string;
  booking_reference?: string;
  event_title?: string;
  status?: string;
  total_amount?: number | string;
  created_at: string;
};
export type AdminPage = {
  data: AdminRecord[];
  current_page: number;
  last_page: number;
  total: number;
};
