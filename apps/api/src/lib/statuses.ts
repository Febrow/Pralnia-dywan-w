// Wszystkie statusy dywanu i mapowanie statusu -> lokalizacja fizyczna.
// Zob. docs/05-statusy-i-przeplywy.md

export const RUG_STATUSES = [
  'ORDER_PICKUP_ACCEPTED',
  'ACCEPTED_AT_PARTNER',
  'PICKED_UP_FROM_PARTNER',
  'PICKED_UP_FROM_CUSTOMER',
  'ACCEPTED_AT_CENTRAL',
  'WASHING',
  'IMPREGNATION',
  'MITE_REMOVAL',
  'ODOR_REMOVAL',
  'HAIR_REMOVAL',
  'FRINGE_CLEANING',
  'FOIL_PACKING',
  'OZONATION',
  'DRYING',
  'READY_FOR_PICKUP',
  'READY_FOR_DELIVERY',
  'IN_DELIVERY',
  'DELIVERED',
  'DELIVERED_TO_CUSTOMER',
] as const;
export type RugStatus = typeof RUG_STATUSES[number];

export const STATUS_LABELS_PL: Record<string, string> = {
  ORDER_PICKUP_ACCEPTED: 'Przyjęto zlecenie odbioru',
  ACCEPTED_AT_PARTNER: 'Przyjęto w placówce partnerskiej',
  PICKED_UP_FROM_PARTNER: 'Odebrano z placówki partnerskiej',
  PICKED_UP_FROM_CUSTOMER: 'Odebrano z adresu klienta',
  ACCEPTED_AT_CENTRAL: 'Przyjęto w magazynie centralnym',
  WASHING: 'W praniu',
  IMPREGNATION: 'W impregnacji',
  MITE_REMOVAL: 'W eliminacji roztoczy',
  ODOR_REMOVAL: 'W usuwaniu zapachu',
  HAIR_REMOVAL: 'W usuwaniu sierści',
  FRINGE_CLEANING: 'W czyszczeniu frędzli',
  FOIL_PACKING: 'W pakowaniu w folię',
  OZONATION: 'W ozonowaniu',
  DRYING: 'W suszeniu',
  READY_FOR_PICKUP: 'Gotowy do wydania',
  READY_FOR_DELIVERY: 'Gotowy do wydania do doręczenia',
  IN_DELIVERY: 'W doręczeniu',
  DELIVERED: 'Wydano',
  DELIVERED_TO_CUSTOMER: 'Wydano pod adres klienta',
};

export const STATUS_TO_LOCATION: Record<string, string> = {
  ACCEPTED_AT_PARTNER: 'PARTNER_BRANCH',
  PICKED_UP_FROM_PARTNER: 'DRIVER_VEHICLE',
  PICKED_UP_FROM_CUSTOMER: 'DRIVER_VEHICLE',
  IN_DELIVERY: 'DRIVER_VEHICLE',
  ACCEPTED_AT_CENTRAL: 'CENTRAL_WAREHOUSE',
  WASHING: 'WASHING_HALL',
  IMPREGNATION: 'WASHING_HALL',
  MITE_REMOVAL: 'WASHING_HALL',
  ODOR_REMOVAL: 'WASHING_HALL',
  HAIR_REMOVAL: 'WASHING_HALL',
  FRINGE_CLEANING: 'WASHING_HALL',
  OZONATION: 'WASHING_HALL',
  DRYING: 'DRYING_ROOM',
  FOIL_PACKING: 'PACKING_ZONE',
  READY_FOR_PICKUP: 'CENTRAL_WAREHOUSE',
  READY_FOR_DELIVERY: 'CENTRAL_WAREHOUSE',
  DELIVERED: 'STATIONARY_BRANCH',
  DELIVERED_TO_CUSTOMER: 'AT_CUSTOMER',
};

// Wyliczanie statusu zlecenia na bazie statusów dywanów
export function computeOrderStatus(rugStatuses: string[]): string {
  if (rugStatuses.length === 0) return 'NEW';
  const allDelivered = rugStatuses.every(
    (s) => s === 'DELIVERED' || s === 'DELIVERED_TO_CUSTOMER',
  );
  if (allDelivered) return 'COMPLETED';

  const someDelivered = rugStatuses.some(
    (s) => s === 'DELIVERED' || s === 'DELIVERED_TO_CUSTOMER',
  );
  if (someDelivered) return 'PARTIALLY_DELIVERED';

  const allReady = rugStatuses.every(
    (s) => s === 'READY_FOR_PICKUP' || s === 'READY_FOR_DELIVERY',
  );
  if (allReady) return 'ALL_READY';

  const inProgress = rugStatuses.some((s) =>
    [
      'WASHING', 'IMPREGNATION', 'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL',
      'FRINGE_CLEANING', 'FOIL_PACKING', 'OZONATION', 'DRYING',
      'IN_DELIVERY', 'PICKED_UP_FROM_CUSTOMER', 'PICKED_UP_FROM_PARTNER',
      'ACCEPTED_AT_CENTRAL', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
    ].includes(s),
  );
  return inProgress ? 'IN_PROGRESS' : 'NEW';
}

export const DEFAULT_PACKAGES = [
  { name: 'Standard',   pricePerM2: 25, sortOrder: 1, requiredSteps: [] as string[] },
  { name: 'Brązowy',    pricePerM2: 38, sortOrder: 2, requiredSteps: ['MITE_REMOVAL'] },
  { name: 'Srebrny',    pricePerM2: 46, sortOrder: 3, requiredSteps: ['MITE_REMOVAL', 'ODOR_REMOVAL'] },
  { name: 'Złoty',      pricePerM2: 55, sortOrder: 4, requiredSteps: ['MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL', 'FRINGE_CLEANING'] },
  { name: 'Platynowy',  pricePerM2: 65, sortOrder: 5, requiredSteps: ['MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL', 'FRINGE_CLEANING', 'IMPREGNATION', 'OZONATION'] },
];

// Zawsze obecne kroki (poza wymaganymi z pakietu)
export const ALWAYS_REQUIRED_STEPS = ['WASHING', 'DRYING', 'FOIL_PACKING'];

// Kto jaki status może nadać (uproszczona walidacja).
export const ALLOWED_BY_ROLE: Record<string, Set<string>> = {
  OWNER: new Set(RUG_STATUSES),
  STATIONARY_BRANCH_WORKER: new Set([
    'ACCEPTED_AT_CENTRAL',
    'READY_FOR_PICKUP',
    'DELIVERED',
  ]),
  WASHING_WORKER: new Set([
    'WASHING', 'IMPREGNATION', 'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL',
    'FRINGE_CLEANING', 'FOIL_PACKING', 'OZONATION', 'DRYING',
    'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
  ]),
  DRIVER: new Set([
    'PICKED_UP_FROM_CUSTOMER',
    'PICKED_UP_FROM_PARTNER',
    'IN_DELIVERY',
    'DELIVERED_TO_CUSTOMER',
  ]),
  LOGISTICS: new Set(['ORDER_PICKUP_ACCEPTED']),
  PARTNER_BRANCH: new Set(['ACCEPTED_AT_PARTNER', 'DELIVERED']),
  STATIONARY_BRANCH: new Set(['DELIVERED']),
};
