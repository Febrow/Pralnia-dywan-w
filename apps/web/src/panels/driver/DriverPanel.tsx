import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '../../lib/useIsMobile';
import DriverLayoutMobile from './DriverLayout.mobile';
import DriverNotAvailableOnDesktop from './DriverNotAvailableOnDesktop';
import DriverHome from './pages/DriverHome';
import DriverPickups from './pages/DriverPickups';
import DriverDeliveries from './pages/DriverDeliveries';
import DriverScan from './pages/DriverScan';
import DriverNewOrder from './pages/DriverNewOrder';
import DriverCash from './pages/DriverCash';
import OrderDetailsPage from '../../pages/OrderDetailsPage';

export default function DriverPanel() {
  const isMobile = useIsMobile();
  if (!isMobile) return <DriverNotAvailableOnDesktop />;
  return (
    <DriverLayoutMobile>
      <Routes>
        <Route index element={<DriverHome />} />
        <Route path="pickups" element={<DriverPickups />} />
        <Route path="deliveries" element={<DriverDeliveries />} />
        <Route path="scan" element={<DriverScan />} />
        <Route path="new-order" element={<DriverNewOrder />} />
        <Route path="cash" element={<DriverCash />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="*" element={<Navigate to="/driver" replace />} />
      </Routes>
    </DriverLayoutMobile>
  );
}
