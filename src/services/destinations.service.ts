
const BASE_URL = '/api/destinations';

export type PublicDestinationsParams = {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  sort?: 'default' | 'name' | 'oldest';
};

async function request<T>(
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

    throw new Error(
      data?.message || `API error: ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const destinationsService = {
  // Published destinations for visitors, with search, filters and pagination
  getPublicDestinations: (
    params: PublicDestinationsParams = {},
  ) => {
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

    if (params.country?.trim()) {
      searchParams.set('country', params.country.trim());
    }

    if (params.sort && params.sort !== 'default') {
      searchParams.set('sort', params.sort);
    }

    const query = searchParams.toString();

    return request(query ? `/?${query}` : '/');
  },

  // Admin panel functions
  getDestinations: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    published?: boolean;
    sort?: 'default' | 'name' | 'oldest';
  }) => {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) {
      searchParams.set('page', String(params.page));
    }

    if (params?.limit !== undefined) {
      searchParams.set('limit', String(params.limit));
    }

    if (params?.search?.trim()) {
      searchParams.set('search', params.search.trim());
    }

    if (params?.country?.trim()) {
      searchParams.set('country', params.country.trim());
    }

    if (params?.published !== undefined) {
      searchParams.set('published', String(params.published));
    }

    if (params?.sort && params.sort !== 'default') {
      searchParams.set('sort', params.sort);
    }

    const query = searchParams.toString();

    return request(
      query ? `/admin/all?${query}` : '/admin/all',
    );
  },

  getDestination: (id: string) =>
    request(`/admin/${encodeURIComponent(id)}`),

  // Public destination by slug
  getPublicDestination: (slug: string) =>
    request(`/slug/${encodeURIComponent(slug)}`),

  createDestination: (data: unknown) =>
    request('', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDestination: (id: string, data: unknown) =>
    request(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateDestinationStatus: (id: string, isPublished: boolean) =>
    request(`/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    }),

  deleteDestination: (id: string) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
