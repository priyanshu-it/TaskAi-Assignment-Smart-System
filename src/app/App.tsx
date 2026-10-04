/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from '../features/auth/context/AuthContext';
import Auth from '../features/auth/components/Auth';
import AdminDashboard from '../features/admin-dashboard/pages/AdminDashboard';
import UserDashboard from '../features/user-dashboard/pages/UserDashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
