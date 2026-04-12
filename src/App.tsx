/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
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

