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

export const ROLE_LABELS_PL: Record<string, string> = {
  OWNER: 'Właściciel',
  STATIONARY_BRANCH_WORKER: 'Pracownik placówki',
  WASHING_WORKER: 'Pracownik prania',
  DRIVER: 'Kierowca',
  LOGISTICS: 'Logistyka',
  PARTNER_BRANCH: 'Placówka partnerska',
  STATIONARY_BRANCH: 'Placówka sieci',
};

export const ORDER_STATUS_LABELS_PL: Record<string, string> = {
  NEW: 'Nowe',
  IN_PROGRESS: 'W realizacji',
  ALL_READY: 'Gotowe',
  PARTIALLY_DELIVERED: 'Częściowo wydane',
  COMPLETED: 'Zakończone',
  CANCELLED: 'Anulowane',
};

export const SOURCE_LABELS_PL: Record<string, string> = {
  STATIONARY: 'Placówka stacjonarna',
  CENTRAL_WAREHOUSE: 'Magazyn centralny',
  LOGISTICS_PHONE: 'Telefon / e-mail',
  DRIVER_FIELD: 'Kierowca w terenie',
  PARTNER: 'Placówka partnerska',
};
