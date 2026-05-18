import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import OrdersList from '../../../components/OrdersList';

export default function DriverPickups() {
  // Zlecenia czekające na odbiór: ORDER_PICKUP_ACCEPTED + ACCEPTED_AT_PARTNER
  const orders = useQuery({
    queryKey: ['driver-pickups'],
    queryFn: () => api<any[]>(`/orders`),
  });
  const filtered = (orders.data ?? []).filter((o) =>
    o.computedStatus === 'NEW' || o.computedStatus === 'IN_PROGRESS',
  );
  return (
    <div className="space-y-3 mt-3">
      <h1 className="text-xl font-bold">Odbiory</h1>
      <OrdersList orders={filtered} basePath="/driver" />
    </div>
  );
}
