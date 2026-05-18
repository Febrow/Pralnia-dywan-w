import { Routes, Route } from 'react-router-dom';
import OwnerLayoutDesktop from './OwnerLayout.desktop';
import OwnerLayoutMobile from './OwnerLayout.mobile';
import { useIsMobile } from '../../lib/useIsMobile';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerOrders from './pages/OwnerOrders';
import OwnerRugs from './pages/OwnerRugs';
import OwnerDrivers from './pages/OwnerDrivers';
import OwnerPartners from './pages/OwnerPartners';
import OwnerBranches from './pages/OwnerBranches';
import OwnerUsers from './pages/OwnerUsers';
import OwnerPackages from './pages/OwnerPackages';
import OwnerQrPool from './pages/OwnerQrPool';
import OwnerSettings from './pages/OwnerSettings';
import OrderDetailsPage from '../../pages/OrderDetailsPage';

export default function OwnerPanel() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? OwnerLayoutMobile : OwnerLayoutDesktop;
  return (
    <Layout>
      <Routes>
        <Route index element={<OwnerDashboard />} />
        <Route path="orders" element={<OwnerOrders />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="rugs" element={<OwnerRugs />} />
        <Route path="drivers" element={<OwnerDrivers />} />
        <Route path="partners" element={<OwnerPartners />} />
        <Route path="branches" element={<OwnerBranches />} />
        <Route path="users" element={<OwnerUsers />} />
        <Route path="packages" element={<OwnerPackages />} />
        <Route path="qr-pool" element={<OwnerQrPool />} />
        <Route path="settings" element={<OwnerSettings />} />
      </Routes>
    </Layout>
  );
}
