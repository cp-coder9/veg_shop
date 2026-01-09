import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import DriverLayout from './layouts/DriverLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import VerifyCodePage from './pages/VerifyCodePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import SuppliersManagement from './pages/admin/SuppliersManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import InvoicesManagement from './pages/admin/InvoicesManagement';
import PaymentsManagement from './pages/admin/PaymentsManagement';
import ShortDeliveryManagement from './pages/admin/ShortDeliveryManagement';
import PackingListsManagement from './pages/admin/PackingListsManagement';
import NotificationsManagement from './pages/admin/NotificationsManagement';
import ReportsManagement from './pages/admin/ReportsManagement';
import CustomersManagement from './pages/admin/CustomersManagement';
import AuditManagement from './pages/admin/AuditManagement';
import CustomerDetail from './pages/admin/CustomerDetail';
import AdminProfile from './pages/admin/AdminProfile';
import SettingsPage from './pages/admin/SettingsPage';
import StaffManagement from './pages/admin/StaffManagement';
import DriverDashboard from './pages/driver/DriverDashboard';
import LogbookPage from './pages/driver/LogbookPage';
import PackerDashboard from './pages/packer/PackerDashboard';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/verify" element={<VerifyCodePage />} />

          {/* Customer Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <PaymentHistoryPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<ProductsManagement />} />
            <Route path="/admin/suppliers" element={<SuppliersManagement />} />
            <Route path="/admin/orders" element={<OrdersManagement />} />
            <Route path="/admin/invoices" element={<InvoicesManagement />} />
            <Route path="/admin/payments" element={<PaymentsManagement />} />
            <Route path="/admin/short-delivery" element={<ShortDeliveryManagement />} />
            <Route path="/admin/packing-lists" element={<PackingListsManagement />} />
            <Route path="/admin/notifications" element={<NotificationsManagement />} />
            <Route path="/admin/reports" element={<ReportsManagement />} />
            <Route path="/admin/audit" element={<AuditManagement />} />
            <Route path="/admin/customers" element={<CustomersManagement />} />
            <Route path="/admin/customers/:customerId" element={<CustomerDetail />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>

          {/* Driver Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/driver/logs" element={<LogbookPage />} />
          </Route>

          {/* Packer Routes */}
          <Route
            element={
              <ProtectedAdminRoute>
                <DriverLayout />
                {/* Reusing DriverLayout for simple mobile wrapper, or just use Outlet */}
              </ProtectedAdminRoute>
            }
          >
            <Route path="/packer" element={<PackerDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
