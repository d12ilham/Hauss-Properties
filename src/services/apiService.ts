const API_BASE_URL = import.meta.env.VITE_API_VERSION_URL;

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
  contact_agent: string;
  sub_number: string | null;
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
  qr_code: string;
  created_at: string;
  updated_at: string;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();

    // Store the token in localStorage
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  }

  logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  }

  async getAllProperties(): Promise<Property[]> {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch properties");
    }

    const json = await response.json();
    return json.data.properties;
  }

  async getProperty(id: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch property");
    }

    const json = await response.json();

    return json.data.property;
  }

  async updateProperty(id: string, formData: FormData): Promise<void> {
    const token = localStorage.getItem("auth_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: "PATCH",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update property");
    }
  }

  async updatePropertyStatus(id: string, status: number): Promise<void> {
    console.log("id", id, "status", status);
    const token = localStorage.getItem("auth_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) {
      throw new Error("Failed to update property");
    }
  }
}

export const apiService = new ApiService();
