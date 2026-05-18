import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '../../lib/useIsMobile';
import BranchLayoutDesktop from './BranchLayout.desktop';
import BranchLayoutMobile from './BranchLayout.mobile';
import BranchOrders from './pages/BranchOrders';
import IntakePage from '../../pages/IntakePage';
import OrderDetailsPage from '../../pages/OrderDetailsPage';

export default function BranchPanel() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? BranchLayoutMobile : BranchLayoutDesktop;
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<BranchOrders />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="intake" element={<IntakePage source="STATIONARY" />} />
      </Routes>
    </Layout>
  );
}
