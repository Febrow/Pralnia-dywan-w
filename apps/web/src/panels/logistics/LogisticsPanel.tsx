import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '../../lib/useIsMobile';
import LogisticsLayoutDesktop from './LogisticsLayout.desktop';
import LogisticsLayoutMobile from './LogisticsLayout.mobile';
import LogisticsOrders from './pages/LogisticsOrders';
import LogisticsNewOrder from './pages/LogisticsNewOrder';
import OrderDetailsPage from '../../pages/OrderDetailsPage';

export default function LogisticsPanel() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? LogisticsLayoutMobile : LogisticsLayoutDesktop;
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<LogisticsOrders />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="new" element={<LogisticsNewOrder />} />
      </Routes>
    </Layout>
  );
}
