// WSPÓLNY komponent listy zleceń — używany przez WSZYSTKIE role.
// Stylowanie pochodzi z styles.css (.orders-list ...)
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../lib/useIsMobile';
import { ORDER_STATUS_LABELS_PL, SOURCE_LABELS_PL, STATUS_LABELS_PL } from '../lib/statuses';

export interface OrderListItem {
  id: string;
  number: string;
  source: string;
  computedStatus: string;
  totalAreaM2: number;
  totalGrossPrice: number;
  createdAt: string;
  customer: { firstName: string; lastName: string; phone: string; email: string };
  rugs: { id: string; qrCode: string; currentStatus: string; areaM2?: number | null; totalPrice?: number | null; package?: { name: string } | null }[];
  driver?: { id: string; firstName: string; lastName: string } | null;
  acceptingBranch?: { id: string; name: string } | null;
  partnerBranch?: { id: string; name: string } | null;
}

export default function OrdersList({
  orders,
  basePath = '',
}: {
  orders: OrderListItem[];
  basePath?: string;
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!orders.length) {
    return (
      <div className="orders-list p-6 text-center text-slate-500">Brak zleceń do wyświetlenia.</div>
    );
  }

  if (isMobile) {
    return (
      <div className="orders-list">
        {orders.map((o) => (
          <div
            key={o.id}
            className="orders-list-mobile-card cursor-pointer"
            onClick={() => navigate(`${basePath}/orders/${o.id}`)}
          >
            <div className="flex justify-between items-start">
              <div className="font-semibold text-brand-700">{o.number}</div>
              <span className={`badge badge-status-${o.computedStatus}`}>
                {ORDER_STATUS_LABELS_PL[o.computedStatus] ?? o.computedStatus}
              </span>
            </div>
            <div className="text-sm">{o.customer.firstName} {o.customer.lastName}</div>
            <div className="text-xs text-slate-500">{o.customer.phone} · {o.customer.email}</div>
            <div className="text-xs text-slate-500 mt-1">
              {SOURCE_LABELS_PL[o.source] ?? o.source} · {o.rugs.length} dyw. ·{' '}
              {o.totalAreaM2.toFixed(2)} m² · {o.totalGrossPrice.toFixed(2)} zł
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="orders-list">
      <table>
        <thead>
          <tr>
            <th>Numer</th>
            <th>Klient</th>
            <th>Kontakt</th>
            <th>Źródło</th>
            <th>Status</th>
            <th>Powierzchnia</th>
            <th>Kwota</th>
            <th>Dywany</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="cursor-pointer" onClick={() => navigate(`${basePath}/orders/${o.id}`)}>
              <td className="order-number">{o.number}</td>
              <td>{o.customer.firstName} {o.customer.lastName}</td>
              <td>
                <div>{o.customer.phone}</div>
                <div className="text-xs text-slate-500">{o.customer.email}</div>
              </td>
              <td><span className="badge">{SOURCE_LABELS_PL[o.source] ?? o.source}</span></td>
              <td>
                <span className={`badge badge-status-${o.computedStatus}`}>
                  {ORDER_STATUS_LABELS_PL[o.computedStatus] ?? o.computedStatus}
                </span>
              </td>
              <td>{o.totalAreaM2.toFixed(2)} m²</td>
              <td>{o.totalGrossPrice.toFixed(2)} zł</td>
              <td>
                <ul className="space-y-1">
                  {o.rugs.map((r) => (
                    <li key={r.id} className="text-xs">
                      <span className="font-mono text-slate-700">{r.qrCode}</span>{' '}
                      <span className="text-slate-400">·</span>{' '}
                      {r.areaM2 != null ? `${r.areaM2.toFixed(2)} m²` : '—'}{' '}
                      <span className="text-slate-400">·</span>{' '}
                      {r.totalPrice != null ? `${r.totalPrice.toFixed(2)} zł` : '—'}{' '}
                      <span className="text-slate-400">·</span>{' '}
                      <span className="badge">{STATUS_LABELS_PL[r.currentStatus] ?? r.currentStatus}</span>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
