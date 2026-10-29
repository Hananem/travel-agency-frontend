const BASE_URL = '/api/team';
const PUBLIC_BASE_URL = '/api/team';

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    const message = Array.isArray(result?.message)
      ? result.message.join(', ')
      : result?.message;

    throw new Error(message || `API error: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}

export type TeamMember = {
  id: string;
  name: string;
  position: string;
  bio: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMembersResponse = {
  data: TeamMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type CreateTeamMemberData = {
  name: string;
  position: string;
  bio?: string;
  imageUrl?: string;
  sortOrder?: number;
  isPublished?: boolean;
};

export const teamService = {
  // Public website: no admin authentication required
  getPublicTeam: async (): Promise<TeamMember[]> => {
    const result = await request<
      TeamMember[] | TeamMembersResponse
    >(PUBLIC_BASE_URL, '');

    return Array.isArray(result) ? result : result.data;
  },

  // Admin dashboard: get all team members
  getMembers: () =>
    request<TeamMembersResponse>(
      BASE_URL,
      '/admin/all?limit=100',
    ),

  // Admin dashboard: get one team member
  getMember: (id: string) =>
    request<TeamMember>(
      BASE_URL,
      `/admin/${encodeURIComponent(id)}`,
    ),

  // Create a team member
  createMember: (data: CreateTeamMemberData) =>
    request<TeamMember>(BASE_URL, '', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update a team member
  updateMember: (
    id: string,
    data: Partial<CreateTeamMemberData>,
  ) =>
    request<TeamMember>(
      BASE_URL,
      `/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),

  // Publish or unpublish a team member
  updateMemberStatus: (
    id: string,
    isPublished: boolean,
  ) =>
    request<TeamMember>(
      BASE_URL,
      `/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isPublished }),
      },
    ),

  // Delete a team member
  deleteMember: (id: string) =>
    request<TeamMember>(
      BASE_URL,
      `/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    ),
};