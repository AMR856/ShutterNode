import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const authService = {
  async login(email: string, password: string): Promise<any> {
    try {
      const loadingToast = toast.loading('Logging in...');

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      toast.success('Logged in successfully!');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem('token');
      toast.success('Logged out successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      toast.error(message);
      throw error;
    }
  },

  async register(email: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      throw error;
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default authService;
