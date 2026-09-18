import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Item, Category, LabLocation, Movement, MovementType } from '../types/inventory';
import { api } from '../services/api';

interface InventoryContextType {
  items: Item[];
  categories: Category[];
  locations: LabLocation[];
  movements: Movement[];
  isLoading: boolean;
  isOnline: boolean;
  refreshData: () => Promise<void>;
  getItem: (id: string) => Item | undefined;
  addItem: (itemData: Omit<Item, 'id' | 'dataCadastro' | 'dataUltimaAtualizacao'>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  registerMovement: (params: {
    itemId: string;
    tipo: MovementType;
    quantidade: number;
    motivo: string;
    responsavel?: string;
  }) => Promise<{ success: boolean; message: string }>;
  addCategory: (categoryData: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
  addLocation: (locationData: Omit<LabLocation, 'id'>) => Promise<LabLocation>;
  updateLocation: (id: string, updates: Partial<LabLocation>) => Promise<boolean>;
  deleteLocation: (id: string) => Promise<boolean>;
  clearInventoryAndMovements: () => Promise<void>;
  // Computed helpers
  lowStockItems: Item[];
  totalItemsCount: number;
  totalCategoriesCount: number;
  totalInventoryValue: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LabLocation[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Fetch all data from backend REST API
  const refreshData = useCallback(async () => {
    try {
      const [itemsRes, catRes, locRes, movRes] = await Promise.all([
        api.getItems(),
        api.getCategories(),
        api.getLocations(),
        api.getMovements(),
      ]);

      setItems(itemsRes);
      setCategories(catRes);
      setLocations(locRes);
      setMovements(movRes);
      setIsOnline(true);
    } catch (error) {
      console.error('[InventoryContext] Erro ao conectar com o servidor SQLite:', error);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount & periodic sync every 15s to keep all devices in sync
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Helpers
  const getItem = (id: string): Item | undefined => {
    return items.find((i) => i.id === id);
  };

  const addItem = async (
    itemData: Omit<Item, 'id' | 'dataCadastro' | 'dataUltimaAtualizacao'>
  ): Promise<Item> => {
    try {
      const createdItem = await api.createItem(itemData);
      setItems((prev) => [createdItem, ...prev]);

      // If initial stock was > 0, refresh movements
      if (createdItem.quantidadeAtual > 0) {
        const movs = await api.getMovements();
        setMovements(movs);
      }

      return createdItem;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao cadastrar item:', error);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>): Promise<boolean> => {
    try {
      const updatedItem = await api.updateItem(id, updates);
      setItems((prev) => prev.map((i) => (i.id === id ? updatedItem : i)));
      return true;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao atualizar item:', error);
      throw error;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      await api.deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao excluir item:', error);
      throw error;
    }
  };

  const registerMovement = async (params: {
    itemId: string;
    tipo: MovementType;
    quantidade: number;
    motivo: string;
    responsavel?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await api.createMovement(params);
      if (result.success) {
        // Update local item and movements
        setItems((prev) => prev.map((i) => (i.id === params.itemId ? result.item : i)));
        setMovements((prev) => [result.movement, ...prev]);
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message || 'Erro ao movimentar estoque.' };
    } catch (error: any) {
      console.error('[InventoryContext] Erro na movimentação:', error);
      return { success: false, message: error.message || 'Erro de comunicação com o servidor.' };
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    try {
      const newCat = await api.createCategory(categoryData);
      setCategories((prev) => [...prev, newCat]);
      return newCat;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao adicionar categoria:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<boolean> => {
    try {
      const updatedCat = await api.updateCategory(id, updates);
      setCategories((prev) => prev.map((c) => (c.id === id ? updatedCat : c)));
      return true;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao atualizar categoria:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const addLocation = async (locationData: Omit<LabLocation, 'id'>): Promise<LabLocation> => {
    try {
      const newLoc = await api.createLocation(locationData);
      setLocations((prev) => [...prev, newLoc]);
      return newLoc;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao adicionar localização:', error);
      throw error;
    }
  };

  const updateLocation = async (id: string, updates: Partial<LabLocation>): Promise<boolean> => {
    try {
      const updatedLoc = await api.updateLocation(id, updates);
      setLocations((prev) => prev.map((l) => (l.id === id ? updatedLoc : l)));
      return true;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao atualizar localização:', error);
      throw error;
    }
  };

  const deleteLocation = async (id: string): Promise<boolean> => {
    try {
      await api.deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao excluir localização:', error);
      throw error;
    }
  };

  const clearInventoryAndMovements = async () => {
    try {
      await api.clearDatabase();
      setItems([]);
      setMovements([]);
    } catch (error: any) {
      console.error('[InventoryContext] Erro ao zerar dados:', error);
      throw error;
    }
  };

  // Computed values
  const lowStockItems = useMemo(() => {
    return items.filter((i) => i.quantidadeAtual <= i.quantidadeMinima);
  }, [items]);

  const totalItemsCount = items.length;
  const totalCategoriesCount = categories.length;

  const totalInventoryValue = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.precoUnitario || 0) * item.quantidadeAtual, 0);
  }, [items]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        categories,
        locations,
        movements,
        isLoading,
        isOnline,
        refreshData,
        getItem,
        addItem,
        updateItem,
        deleteItem,
        registerMovement,
        addCategory,
        updateCategory,
        deleteCategory,
        addLocation,
        updateLocation,
        deleteLocation,
        clearInventoryAndMovements,
        lowStockItems,
        totalItemsCount,
        totalCategoriesCount,
        totalInventoryValue,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
