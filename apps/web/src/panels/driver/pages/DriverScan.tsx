import SerialScanScreen from '../../../components/SerialScanScreen';

export default function DriverScan() {
  return (
    <div className="space-y-3 mt-3">
      <h1 className="text-xl font-bold">Skanowanie seryjne</h1>
      <SerialScanScreen
        availableStatuses={[
          'PICKED_UP_FROM_CUSTOMER',
          'PICKED_UP_FROM_PARTNER',
          'IN_DELIVERY',
          'DELIVERED_TO_CUSTOMER',
        ]}
      />
    </div>
  );
}
