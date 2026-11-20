
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

const toBody = (data: unknown) =>
  data instanceof FormData ? data : JSON.stringify(data);

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'same-origin',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      const message = Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message;

      const error = new Error(message || `API error: ${response.status}`);

      console.error('[API ERROR]', {
        url,
        method: options.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        response: data,
        error,
      });

      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    console.error('[REQUEST FAILED]', {
      url,
      method: options.method || 'GET',
      error,
    });

    throw error;
  }
}

// Logs errors for individual service methods
async function logError<T>(
  functionName: string,
  callback: () => Promise<T>,
): Promise<T> {
  try {
    return await callback();
  } catch (error) {
    console.error(`[tripsService.${functionName}] Failed:`, error);
    throw error;
  }
}

export const tripsService = {
  getPublicTrips: (params: PublicTripsParams = {}) =>
    logError('getPublicTrips', () => {
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
    }),

  getTrips: () =>
    logError('getTrips', () =>
      request<TripsResponse>('/admin/all'),
    ),

  getTrip: (id: string) =>
    logError('getTrip', () =>
      request<Trip>(`/admin/${encodeURIComponent(id)}`),
    ),

  createTrip: (data: unknown) =>
    logError('createTrip', () =>
      request<Trip>('', {
        method: 'POST',
        body: toBody(data),
      }),
    ),

  updateTrip: (id: string, data: unknown) =>
    logError('updateTrip', () =>
      request<Trip>(`/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: toBody(data),
      }),
    ),

  updateTripStatus: (id: string, isPublished: boolean) =>
    logError('updateTripStatus', () =>
      request<Trip>(`/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished }),
      }),
    ),

  deleteTrip: (id: string) =>
    logError('deleteTrip', () =>
      request<void>(`/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    ),
};
