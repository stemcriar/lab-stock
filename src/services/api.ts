import { Item, Category, LabLocation, Movement, MovementType } from '../types/inventory';

// Base API URL: In dev with Vite proxy, '/api' is proxied to http://localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Health & Server info
  checkHealth: () => request<{ status: string; serverTime: string; lab: string; database: string }>('/health'),

  // Items
  getItems: () => request<Item[]>('/itens'),
  getItem: (id: string) => request<Item>(`/itens/${id}`),
  createItem: (itemData: Omit<Item, 'id' | 'dataCadastro' | 'dataUltimaAtualizacao'>) =>
    request<Item>('/itens', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
  updateItem: (id: string, updates: Partial<Item>) =>
    request<Item>(`/itens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteItem: (id: string) =>
    request<{ success: boolean; message: string }>(`/itens/${id}`, {
      method: 'DELETE',
    }),

  // Movements
  getMovements: () => request<Movement[]>('/movimentacoes'),
  createMovement: (params: {
    itemId: string;
    tipo: MovementType;
    quantidade: number;
    motivo: string;
    responsavel?: string;
  }) =>
    request<{ success: boolean; message: string; movement: Movement; item: Item }>('/movimentacoes', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Categories
  getCategories: () => request<Category[]>('/categorias'),
  createCategory: (categoryData: Omit<Category, 'id'>) =>
    request<Category>('/categorias', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }),
  updateCategory: (id: string, updates: Partial<Category>) =>
    request<Category>(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCategory: (id: string) =>
    request<{ success: boolean; message: string }>(`/categorias/${id}`, {
      method: 'DELETE',
    }),

  // Locations
  getLocations: () => request<LabLocation[]>('/localizacoes'),
  createLocation: (locationData: Omit<LabLocation, 'id'>) =>
    request<LabLocation>('/localizacoes', {
      method: 'POST',
      body: JSON.stringify(locationData),
    }),
  updateLocation: (id: string, updates: Partial<LabLocation>) =>
    request<LabLocation>(`/localizacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteLocation: (id: string) =>
    request<{ success: boolean; message: string }>(`/localizacoes/${id}`, {
      method: 'DELETE',
    }),

  // Admin / Reset
  clearDatabase: () =>
    request<{ success: boolean; message: string }>('/admin/zerar', {
      method: 'POST',
    }),
};
