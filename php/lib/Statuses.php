<?php
declare(strict_types=1);

class Statuses
{
    public const RUG_STATUSES = [
        'ORDER_PICKUP_ACCEPTED', 'ACCEPTED_AT_PARTNER', 'PICKED_UP_FROM_PARTNER',
        'PICKED_UP_FROM_CUSTOMER', 'ACCEPTED_AT_CENTRAL', 'WASHING', 'IMPREGNATION',
        'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL', 'FRINGE_CLEANING',
        'FOIL_PACKING', 'OZONATION', 'DRYING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
        'IN_DELIVERY', 'DELIVERED', 'DELIVERED_TO_CUSTOMER',
    ];

    public const STATUS_TO_LOCATION = [
        'ACCEPTED_AT_PARTNER' => 'PARTNER_BRANCH',
        'PICKED_UP_FROM_PARTNER' => 'DRIVER_VEHICLE',
        'PICKED_UP_FROM_CUSTOMER' => 'DRIVER_VEHICLE',
        'IN_DELIVERY' => 'DRIVER_VEHICLE',
        'ACCEPTED_AT_CENTRAL' => 'CENTRAL_WAREHOUSE',
        'WASHING' => 'WASHING_HALL',
        'IMPREGNATION' => 'WASHING_HALL',
        'MITE_REMOVAL' => 'WASHING_HALL',
        'ODOR_REMOVAL' => 'WASHING_HALL',
        'HAIR_REMOVAL' => 'WASHING_HALL',
        'FRINGE_CLEANING' => 'WASHING_HALL',
        'OZONATION' => 'WASHING_HALL',
        'DRYING' => 'DRYING_ROOM',
        'FOIL_PACKING' => 'PACKING_ZONE',
        'READY_FOR_PICKUP' => 'CENTRAL_WAREHOUSE',
        'READY_FOR_DELIVERY' => 'CENTRAL_WAREHOUSE',
        'DELIVERED' => 'STATIONARY_BRANCH',
        'DELIVERED_TO_CUSTOMER' => 'AT_CUSTOMER',
    ];

    public const ALWAYS_REQUIRED_STEPS = ['WASHING', 'DRYING', 'FOIL_PACKING'];

    public const DEFAULT_PACKAGES = [
        ['name' => 'Standard',   'pricePerM2' => 25, 'sortOrder' => 1, 'requiredSteps' => []],
        ['name' => 'Brązowy',    'pricePerM2' => 38, 'sortOrder' => 2, 'requiredSteps' => ['MITE_REMOVAL']],
        ['name' => 'Srebrny',    'pricePerM2' => 46, 'sortOrder' => 3, 'requiredSteps' => ['MITE_REMOVAL', 'ODOR_REMOVAL']],
        ['name' => 'Złoty',      'pricePerM2' => 55, 'sortOrder' => 4, 'requiredSteps' => ['MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL', 'FRINGE_CLEANING']],
        ['name' => 'Platynowy',  'pricePerM2' => 65, 'sortOrder' => 5, 'requiredSteps' => ['MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL', 'FRINGE_CLEANING', 'IMPREGNATION', 'OZONATION']],
    ];

    public const ALLOWED_BY_ROLE = [
        'OWNER' => null, // wszystkie
        'STATIONARY_BRANCH_WORKER' => ['ACCEPTED_AT_CENTRAL', 'READY_FOR_PICKUP', 'DELIVERED'],
        'WASHING_WORKER' => [
            'WASHING', 'IMPREGNATION', 'MITE_REMOVAL', 'ODOR_REMOVAL', 'HAIR_REMOVAL',
            'FRINGE_CLEANING', 'FOIL_PACKING', 'OZONATION', 'DRYING',
            'READY_FOR_PICKUP', 'READY_FOR_DELIVERY',
        ],
        'DRIVER' => ['PICKED_UP_FROM_CUSTOMER', 'PICKED_UP_FROM_PARTNER', 'IN_DELIVERY', 'DELIVERED_TO_CUSTOMER'],
        'LOGISTICS' => ['ORDER_PICKUP_ACCEPTED'],
        'PARTNER_BRANCH' => ['ACCEPTED_AT_PARTNER', 'DELIVERED'],
        'STATIONARY_BRANCH' => ['DELIVERED'],
    ];

    public static function compute(array $rugStatuses): string
    {
        if (!$rugStatuses) return 'NEW';
        $allDelivered = true;
        $someDelivered = false;
        $allReady = true;
        $hasInProgress = false;
        foreach ($rugStatuses as $s) {
            $isDelivered = $s === 'DELIVERED' || $s === 'DELIVERED_TO_CUSTOMER';
            $isReady = $s === 'READY_FOR_PICKUP' || $s === 'READY_FOR_DELIVERY';
            if (!$isDelivered) $allDelivered = false;
            if ($isDelivered) $someDelivered = true;
            if (!$isReady) $allReady = false;
            if (in_array($s, [
                'WASHING','IMPREGNATION','MITE_REMOVAL','ODOR_REMOVAL','HAIR_REMOVAL',
                'FRINGE_CLEANING','FOIL_PACKING','OZONATION','DRYING',
                'IN_DELIVERY','PICKED_UP_FROM_CUSTOMER','PICKED_UP_FROM_PARTNER',
                'ACCEPTED_AT_CENTRAL','READY_FOR_PICKUP','READY_FOR_DELIVERY'
            ], true)) $hasInProgress = true;
        }
        if ($allDelivered) return 'COMPLETED';
        if ($someDelivered) return 'PARTIALLY_DELIVERED';
        if ($allReady) return 'ALL_READY';
        return $hasInProgress ? 'IN_PROGRESS' : 'NEW';
    }
}
