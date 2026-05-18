import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '../../lib/useIsMobile';
import WashingLayoutDesktop from './WashingLayout.desktop';
import WashingLayoutMobile from './WashingLayout.mobile';
import WashingHome from './pages/WashingHome';
import WashingScan from './pages/WashingScan';
import WashingSerial from './pages/WashingSerial';
import OrderDetailsPage from '../../pages/OrderDetailsPage';

export default function WashingPanel() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? WashingLayoutMobile : WashingLayoutDesktop;
  return (
    <Layout>
      <Routes>
        <Route index element={<WashingHome />} />
        <Route path="scan" element={<WashingScan />} />
        <Route path="serial" element={<WashingSerial />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="*" element={<Navigate to="/washing" replace />} />
      </Routes>
    </Layout>
  );
}
