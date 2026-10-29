export type BookingStats = {
  total: number;
  pending: { count: number; percent: number };
  confirmed: { count: number; percent: number };
  cancelled: { count: number; percent: number };
};

export type DashboardData = {
  trips: number;
  announcements: number;
  teamMembers: number;
  publishedTrips: number;
  publishedAnnouncements: number;
  publishedTeamMembers: number;
  bookings: BookingStats;
};

export type TimelineRange = '30d' | '12m';

export type TimelinePoint = { label: string; count: number };

export type TopTrip = { tripId: string; title: string; bookings: number };

export type CancellationRate = {
  tripId: string;
  title: string;
  total: number;
  cancelled: number;
  rate: number;
};

export type DestinationBookings = { destination: string; count: number };

export type TravelersGroup = { bookings: number; travelers: number };

export type TravelersStats = {
  confirmed: TravelersGroup;
  pending: TravelersGroup;
  cancelled: TravelersGroup;
  totalActiveTravelers: number;
  avgGroupSize: number;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/api/dashboard${path}`, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${path || '/'}`);
  }

  return response.json();
}

export function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>('');
}

export function getBookingsTimeline(
  range: TimelineRange = '30d',
): Promise<TimelinePoint[]> {
  return request<TimelinePoint[]>(`/bookings-timeline?range=${range}`);
}

export function getTopTrips(limit = 5): Promise<TopTrip[]> {
  return request<TopTrip[]>(`/top-trips?limit=${limit}`);
}

export function getCancellationRates(
  minBookings = 3,
): Promise<CancellationRate[]> {
  return request<CancellationRate[]>(
    `/cancellation-rate?minBookings=${minBookings}`,
  );
}

export function getBookingsByDestination(): Promise<DestinationBookings[]> {
  return request<DestinationBookings[]>('/bookings-by-destination');
}

export function getTravelersStats(): Promise<TravelersStats> {
  return request<TravelersStats>('/travelers');
}