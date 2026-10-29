const BASE_URL = '/api/trips';

export type PublicTripsParams = {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'default' | 'price-asc' | 'price-desc';
};

export type TripCompanion = {
  role?: string | null;
  teamMember: {
    id: string;
    name: string;
    position?: string | null;
    imageUrl?: string | null;
  };
};

export type Trip = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  description: string;
  price: number | string;
  duration: string | number;
  imageUrl: string;
  isPublished: boolean;
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  bookedSeats?: number;
  remainingSeats?: number | null;
  isFull?: boolean;
  images?: string[] | null;
  features?: string[];
  companions?: TripCompanion[];
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TripsResponse = {
  data: Trip[];
  pagination: Pagination;
};

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const tripsService = {
  // الرحلات المنشورة للزوار مع البحث والفلترة و pagination
  getPublicTrips: (params: PublicTripsParams = {}) => {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
      searchParams.set('page', String(params.page));
    }

    if (params.limit !== undefined) {
      searchParams.set('limit', String(params.limit));
    }

    if (params.search?.trim()) {
      searchParams.set('search', params.search.trim());
    }

    if (params.minPrice !== undefined) {
      searchParams.set('minPrice', String(params.minPrice));
    }

    if (params.maxPrice !== undefined) {
      searchParams.set('maxPrice', String(params.maxPrice));
    }

    if (params.sort && params.sort !== 'default') {
      searchParams.set('sort', params.sort);
    }

    const query = searchParams.toString();

    return request<TripsResponse>(query ? `/?${query}` : '/');
  },

  // دوال لوحة الإدارة
  getTrips: () => request<TripsResponse>('/admin/all'),

  getTrip: (id: string) => request<Trip>(`/admin/${encodeURIComponent(id)}`),

  createTrip: (data: unknown) =>
    request<Trip>('', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTrip: (id: string, data: unknown) =>
    request<Trip>(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // تغيير حالة نشر الرحلة
  updateTripStatus: (id: string, isPublished: boolean) =>
    request<Trip>(`/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    }),

  deleteTrip: (id: string) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};