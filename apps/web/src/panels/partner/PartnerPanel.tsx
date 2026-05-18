import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '../../lib/useIsMobile';
import PartnerLayoutDesktop from './PartnerLayout.desktop';
import PartnerLayoutMobile from './PartnerLayout.mobile';
import PartnerOrders from './pages/PartnerOrders';
import IntakePage from '../../pages/IntakePage';
import OrderDetailsPage from '../../pages/OrderDetailsPage';

export default function PartnerPanel() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? PartnerLayoutMobile : PartnerLayoutDesktop;
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<PartnerOrders />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="intake" element={<IntakePage source="PARTNER" />} />
      </Routes>
    </Layout>
  );
}
