import SerialScanScreen from '../../../components/SerialScanScreen';

export default function WashingSerial() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Skanowanie seryjne</h1>
      <SerialScanScreen
        availableStatuses={[
          'WASHING', 'IMPREGNATION', 'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL',
          'FRINGE_CLEANING', 'FOIL_PACKING', 'OZONATION', 'DRYING',
          'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
        ]}
      />
    </div>
  );
}
