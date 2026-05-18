import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './lib/auth';
import { api } from './lib/api';
import LoginPage from './pages/LoginPage';
import InstallPage from './pages/InstallPage';
import OwnerPanel from './panels/owner/OwnerPanel';
import StationaryPanel from './panels/stationary/StationaryPanel';
import WashingPanel from './panels/washing/WashingPanel';
import DriverPanel from './panels/driver/DriverPanel';
import LogisticsPanel from './panels/logistics/LogisticsPanel';
import PartnerPanel from './panels/partner/PartnerPanel';
import BranchPanel from './panels/branch/BranchPanel';

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role;
  switch (role) {
    case 'OWNER': return <Navigate to="/owner" replace />;
    case 'STATIONARY_BRANCH_WORKER': return <Navigate to="/stationary" replace />;
    case 'WASHING_WORKER': return <Navigate to="/washing" replace />;
    case 'DRIVER': return <Navigate to="/driver" replace />;
    case 'LOGISTICS': return <Navigate to="/logistics" replace />;
    case 'PARTNER_BRANCH': return <Navigate to="/partner" replace />;
    case 'STATIONARY_BRANCH': return <Navigate to="/branch" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

export default function App() {
  const { user, loaded, refresh } = useAuth();
  const navigate = useNavigate();
  const installStatus = useQuery({
    queryKey: ['install', 'status'],
    queryFn: () => api<{ installed: boolean }>('/install/status'),
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (installStatus.isLoading || !loaded) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Ładowanie…</div>;
  }
  if (installStatus.data && !installStatus.data.installed) {
    return (
      <Routes>
        <Route path="*" element={<InstallPage onDone={() => navigate('/login', { replace: true })} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/owner/*" element={user?.role === 'OWNER' ? <OwnerPanel /> : <Navigate to="/login" replace />} />
      <Route path="/stationary/*" element={user?.role === 'STATIONARY_BRANCH_WORKER' ? <StationaryPanel /> : <Navigate to="/login" replace />} />
      <Route path="/washing/*" element={user?.role === 'WASHING_WORKER' ? <WashingPanel /> : <Navigate to="/login" replace />} />
      <Route path="/driver/*" element={user?.role === 'DRIVER' ? <DriverPanel /> : <Navigate to="/login" replace />} />
      <Route path="/logistics/*" element={user?.role === 'LOGISTICS' ? <LogisticsPanel /> : <Navigate to="/login" replace />} />
      <Route path="/partner/*" element={user?.role === 'PARTNER_BRANCH' ? <PartnerPanel /> : <Navigate to="/login" replace />} />
      <Route path="/branch/*" element={user?.role === 'STATIONARY_BRANCH' ? <BranchPanel /> : <Navigate to="/login" replace />} />
      <Route path="/" element={<RoleRouter />} />
      <Route path="*" element={<RoleRouter />} />
    </Routes>
  );
}
