
export interface Admin {
  id: string;
  email: string;
}

export const authService = {
  async login(email: string, password: string): Promise<Admin> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'فشل تسجيل الدخول.');
    }

    return data.admin;
  },

  async logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('تعذر تسجيل الخروج.');
    }
  },
};
