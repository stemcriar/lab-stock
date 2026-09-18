import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { InventoryProvider } from './context/InventoryContext';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { InventoryListPage } from './pages/InventoryListPage';
import { ItemFormPage } from './pages/ItemFormPage';
import { MovementsPage } from './pages/MovementsPage';
import { CategoriesLocationsPage } from './pages/CategoriesLocationsPage';
import { ReportsPage } from './pages/ReportsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <InventoryProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/estoque" element={<InventoryListPage />} />
              <Route path="/cadastro" element={<ItemFormPage />} />
              <Route path="/editar/:id" element={<ItemFormPage />} />
              <Route path="/movimentacoes" element={<MovementsPage />} />
              <Route path="/categorias-localizacoes" element={<CategoriesLocationsPage />} />
              <Route path="/relatorios" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </InventoryProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
