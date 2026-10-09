import { apiRequest } from "@/lib/api";

export type Screening = {
  id: number;
  cinema_id: number;
  cinema_name: string;
  mall_name: string;
  city: string;
  screen_name: string;
  start_time: string;
  end_time: string;
  status: string;
  available: boolean;
  ticket_price: number;
  available_seat_count: number;
};
export type CinemaSeat = {
  id: number;
  row_label: string;
  seat_number: number;
  seat_type: string;
  status: "available" | "held" | "occupied" | "unavailable";
};
export type SeatInventory = {
  screening: Screening;
  max_seats_per_order: number;
  seats: CinemaSeat[];
};
export type SeatHold = {
  hold_token: string;
  expires_at: string;
  seats: CinemaSeat[];
  total_amount: number;
};
export type BookingReview = {
  valid: true;
  expires_at?: string;
  screening: Screening;
  seats: CinemaSeat[];
  total_amount: number;
};

export function getMovieScreenings(slug: string) {
  return apiRequest<{
    movie: { slug: string; title: string };
    screenings: Screening[];
  }>(`/movies/${encodeURIComponent(slug)}/screenings`);
}
export function getScreeningSeats(screeningId: string | number) {
  return apiRequest<SeatInventory>(`/screenings/${screeningId}/seats`);
}
export function createSeatHold(
  screeningId: string | number,
  seatIds: number[],
  token: string,
) {
  return apiRequest<SeatHold>(`/screenings/${screeningId}/holds`, {
    method: "POST",
    token,
    body: JSON.stringify({ seat_ids: seatIds }),
  });
}
export function releaseSeatHold(
  screeningId: string | number,
  holdToken: string,
  token: string,
) {
  return apiRequest<{ message: string }>(
    `/screenings/${screeningId}/holds/${encodeURIComponent(holdToken)}`,
    { method: "DELETE", token },
  );
}
export function reviewSeatHold(
  screeningId: string | number,
  holdToken: string,
  token: string,
) {
  return apiRequest<BookingReview>(`/screenings/${screeningId}/review`, {
    method: "POST",
    token,
    body: JSON.stringify({ hold_token: holdToken }),
  });
}
