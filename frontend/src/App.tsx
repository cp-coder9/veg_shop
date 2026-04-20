import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore.js';
import Layout from './components/layout/Layout.js';
import { PrivacyConsent } from './components/auth/PrivacyConsent.js';

import ProtectedRoute from './components/ProtectedRoute.js';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.js';
import ProtectedDriverRoute from './components/ProtectedDriverRoute.js';
import ProtectedPackerRoute from './components/ProtectedPackerRoute.js';
import AdminLayout from './components/layout/AdminLayout.js';
import DriverLayout from './layouts/DriverLayout.js';
import PackerLayout from './layouts/PackerLayout.js';
import HomePage from './pages/HomePage.js';
import AuthPage from './pages/AuthPage.js';
import VerifyCodePage from './pages/VerifyCodePage.js';
import ProductsPage from './pages/ProductsPage.js';
import CartPage from './pages/CartPage.js';
import OrdersPage from './pages/OrdersPage.js';
import ProfilePage from './pages/ProfilePage.js';
import DashboardPage from './pages/DashboardPage.js';
import PaymentHistoryPage from './pages/PaymentHistoryPage.js';
import PaymentPage from './pages/PaymentPage.js';
import AdminDashboard from './pages/admin/AdminDashboard.js';
import ProductsManagement from './pages/admin/ProductsManagement.js';
import SuppliersManagement from './pages/admin/SuppliersManagement.js';
import OrdersManagement from './pages/admin/OrdersManagement.js';
import InvoicesManagement from './pages/admin/InvoicesManagement.js';
import PaymentsManagement from './pages/admin/PaymentsManagement.js';
import ShortDeliveryManagement from './pages/admin/ShortDeliveryManagement.js';
import PackingListsManagement from './pages/admin/PackingListsManagement.js';
import NotificationsManagement from './pages/admin/NotificationsManagement.js';
import ReportsManagement from './pages/admin/ReportsManagement.js';
import CustomersManagement from './pages/admin/CustomersManagement.js';
import AuditManagement from './pages/admin/AuditManagement.js';
import CustomerDetail from './pages/admin/CustomerDetail.js';
import AdminProfile from './pages/admin/AdminProfile.js';
import SettingsPage from './pages/admin/SettingsPage.js';
import StaffManagement from './pages/admin/StaffManagement.js';
import WeeklyAvailabilityManagement from './pages/admin/WeeklyAvailabilityManagement.js';
import DriverDashboard from './pages/driver/DriverDashboard.js';
import LogbookPage from './pages/driver/LogbookPage.js';
import PackerDashboard from './pages/packer/PackerDashboard.js';
import PublicProductList from './pages/PublicProductList.js';


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
      <PrivacyConsent />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/verify" element={<VerifyCodePage />} />
          <Route path="/payment/:invoiceId" element={<PaymentPage />} />
          <Route path="/payment/:invoiceId/complete" element={<PaymentPage />} />
          <Route path="/shop" element={<PublicProductList />} />

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
            <Route path="/admin/availability" element={<WeeklyAvailabilityManagement />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>

          {/* Driver Routes */}
          <Route
            element={
              <ProtectedDriverRoute>
                <DriverLayout />
              </ProtectedDriverRoute>
            }
          >
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/driver/logs" element={<LogbookPage />} />
          </Route>

           {/* Packer Routes */}
           <Route
             element={
               <ProtectedPackerRoute>
                 <PackerLayout />
               </ProtectedPackerRoute>
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
