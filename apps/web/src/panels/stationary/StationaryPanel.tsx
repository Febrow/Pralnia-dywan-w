import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '../../lib/useIsMobile';
import StationaryLayoutDesktop from './StationaryLayout.desktop';
import StationaryLayoutMobile from './StationaryLayout.mobile';
import StationaryOrders from './pages/StationaryOrders';
import StationaryAcceptFromDriver from './pages/StationaryAcceptFromDriver';
import IntakePage from '../../pages/IntakePage';
import OrderDetailsPage from '../../pages/OrderDetailsPage';

export default function StationaryPanel() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? StationaryLayoutMobile : StationaryLayoutDesktop;
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<StationaryOrders />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="intake" element={<IntakePage source="STATIONARY" />} />
        <Route path="accept-from-driver" element={<StationaryAcceptFromDriver />} />
      </Routes>
    </Layout>
  );
}
