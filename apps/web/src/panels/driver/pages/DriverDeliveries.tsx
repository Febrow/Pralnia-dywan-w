import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import OrdersList from '../../../components/OrdersList';

export default function DriverDeliveries() {
  const orders = useQuery({ queryKey: ['driver-deliveries'], queryFn: () => api<any[]>('/orders') });
  // pokazujemy doręczenia (ALL_READY przy odbiorze przez kierowcę / IN_PROGRESS z dywanami READY_FOR_DELIVERY)
  const filtered = (orders.data ?? []).filter((o) =>
    o.rugs.some((r: any) => ['READY_FOR_DELIVERY', 'IN_DELIVERY'].includes(r.currentStatus)),
  );
  return (
    <div className="space-y-3 mt-3">
      <h1 className="text-xl font-bold">Doręczenia</h1>
      <OrdersList orders={filtered} basePath="/driver" />
    </div>
  );
}
