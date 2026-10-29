
const BASE_URL = '/api/announcements';

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
    let message = 'حدث خطأ أثناء تنفيذ الطلب.';

    try {
      const result = await response.json();
      message = result.message ?? message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(
      Array.isArray(message) ? message.join(', ') : message,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementInput = {
  title: string;
  content: string;
  type: string;
  imageUrl?: string | null;
  isPublished: boolean;
};

export type AnnouncementsResponse = {
  data: Announcement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type PublicAnnouncementsParams = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  sort?: 'newest' | 'oldest';
};

export const announcementsService = {
  // Public: fetch published announcements for visitors.
  getPublicAnnouncements(
    params: PublicAnnouncementsParams = {},
  ): Promise<AnnouncementsResponse> {
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

    if (params.type?.trim()) {
      searchParams.set('type', params.type.trim());
    }

    if (params.sort === 'oldest') {
      searchParams.set('sort', 'oldest');
    }

    const query = searchParams.toString();

    return request<AnnouncementsResponse>(
      query ? `/?${query}` : '/',
    );
  },

  // Admin: fetch all announcements.
  getAnnouncements(): Promise<AnnouncementsResponse> {
    return request<AnnouncementsResponse>('/admin/all?limit=100');
  },

  getAnnouncement(id: string): Promise<Announcement> {
    return request<Announcement>(
      `/admin/${encodeURIComponent(id)}`,
    );
  },

  createAnnouncement(
    data: AnnouncementInput,
  ): Promise<Announcement> {
    return request<Announcement>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAnnouncement(
    id: string,
    data: Partial<AnnouncementInput>,
  ): Promise<Announcement> {
    return request<Announcement>(
      `/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  },

  // Admin: change announcement publication status.
  updateAnnouncementStatus(
    id: string,
    isPublished: boolean,
  ): Promise<Announcement> {
    return request<Announcement>(
      `/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isPublished }),
      },
    );
  },

  deleteAnnouncement(id: string): Promise<void> {
    return request<void>(
      `/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );
  },
};
