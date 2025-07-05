
const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface User {
  id: number;
  email: string;
}

export interface LoginResponse {
  status: string;
  token: string;
  user: User;
}

export interface Property {
  id: number;
  property_id: string;
  property_name: string;
  description: string;
  lifestyle_assets: any[];
  active: boolean;
  qr_url: string;
  listing_agent: string;
  street_number: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  land_area: number;
  land_area_unit: string;
  inspection_times: any[];
  features: any[];
  eco_friendly: any[];
  gallery: any[];
  property_documents: any[];
  created_at: string;
  updated_at: string;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Store the token in localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  async getAllProperties(): Promise<Property[]> {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }

    return response.json();
  }

  async getProperty(id: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch property');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
