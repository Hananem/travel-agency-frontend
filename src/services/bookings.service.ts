const BASE_URL = '/api/bookings';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type CreateBookingInput = {
  tripId: string;
  fullName: string;
  phone: string;
  companionsCount?: number;
  note?: string;
};

export type UpdateBookingInput = {
  status?: BookingStatus;
  adminNote?: string;
};

export type AdminBookingsParams = {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  tripId?: string;
  search?: string;
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
    const message = Array.isArray(data?.message)
      ? data.message.join('، ')
      : data?.message;

    throw new Error(message || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const bookingsService = {
  // للزوار: إرسال حجز جديد (بدون تسجيل دخول)
  createBooking: (data: CreateBookingInput) =>
    request('', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // دوال لوحة الإدارة
  getBookings: (params: AdminBookingsParams = {}) => {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
      searchParams.set('page', String(params.page));
    }

    if (params.limit !== undefined) {
      searchParams.set('limit', String(params.limit));
    }

    if (params.status) {
      searchParams.set('status', params.status);
    }

    if (params.tripId) {
      searchParams.set('tripId', params.tripId);
    }

    if (params.search?.trim()) {
      searchParams.set('search', params.search.trim());
    }

    const query = searchParams.toString();

    return request(
      query ? `/admin/all?${query}` : '/admin/all',
    );
  },

  getBooking: (id: string) =>
    request(`/admin/${encodeURIComponent(id)}`),

  updateBooking: (id: string, data: UpdateBookingInput) =>
    request(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  confirmBooking: (id: string, adminNote?: string) =>
    request(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONFIRMED', adminNote }),
    }),

  cancelBooking: (id: string, adminNote?: string) =>
    request(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED', adminNote }),
    }),

  deleteBooking: (id: string) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
