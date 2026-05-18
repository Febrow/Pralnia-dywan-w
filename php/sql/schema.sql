-- Pralnia Dywanów — schemat bazy MySQL (hosting współdzielony)
-- Wszystkie CREATE są idempotentne (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(32)  NOT NULL,
  email         VARCHAR(190) NOT NULL,
  passwordHash  VARCHAR(255) NOT NULL,
  firstName     VARCHAR(100) NOT NULL,
  lastName      VARCHAR(100) NOT NULL,
  role          VARCHAR(40)  NOT NULL,
  isActive      TINYINT(1)   NOT NULL DEFAULT 1,
  createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS price_lists (
  id              VARCHAR(32)  NOT NULL,
  ownerBranchId   VARCHAR(32)  NOT NULL,
  name            VARCHAR(190) NOT NULL,
  isActive        TINYINT(1)   NOT NULL DEFAULT 1,
  createdAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY price_lists_owner (ownerBranchId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS branches (
  id                  VARCHAR(32)  NOT NULL,
  type                VARCHAR(40)  NOT NULL,
  name                VARCHAR(190) NOT NULL,
  city                VARCHAR(120) NULL,
  address             VARCHAR(255) NULL,
  isActive            TINYINT(1)   NOT NULL DEFAULT 1,
  partnerPriceListId  VARCHAR(32)  NULL,
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY branches_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS memberships (
  id        VARCHAR(32) NOT NULL,
  userId    VARCHAR(32) NOT NULL,
  branchId  VARCHAR(32) NOT NULL,
  role      VARCHAR(40) NOT NULL,
  createdAt DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY memberships_user_branch (userId, branchId),
  KEY memberships_branch (branchId),
  CONSTRAINT fk_membership_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_membership_branch FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id                     VARCHAR(32)  NOT NULL,
  firstName              VARCHAR(100) NOT NULL,
  lastName               VARCHAR(100) NOT NULL,
  phone                  VARCHAR(40)  NOT NULL,
  email                  VARCHAR(190) NOT NULL,
  defaultPickupAddress   TEXT         NULL,
  defaultDeliveryAddress TEXT         NULL,
  consentSms             TINYINT(1)   NOT NULL DEFAULT 1,
  consentEmail           TINYINT(1)   NOT NULL DEFAULT 1,
  createdAt              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY customers_phone (phone),
  KEY customers_email (email),
  KEY customers_lastName (lastName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS packages (
  id          VARCHAR(32)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  pricePerM2  DECIMAL(10,2) NOT NULL,
  isActive    TINYINT(1)   NOT NULL DEFAULT 1,
  sortOrder   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY packages_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS required_steps (
  id        VARCHAR(32) NOT NULL,
  packageId VARCHAR(32) NOT NULL,
  status    VARCHAR(40) NOT NULL,
  sortOrder INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY required_steps_pkg_status (packageId, status),
  CONSTRAINT fk_step_pkg FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS price_list_items (
  id          VARCHAR(32)   NOT NULL,
  priceListId VARCHAR(32)   NOT NULL,
  packageId   VARCHAR(32)   NOT NULL,
  pricePerM2  DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY pli_unique (priceListId, packageId),
  CONSTRAINT fk_pli_list FOREIGN KEY (priceListId) REFERENCES price_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_pli_pkg FOREIGN KEY (packageId) REFERENCES packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id                VARCHAR(32)   NOT NULL,
  number            VARCHAR(40)   NOT NULL,
  source            VARCHAR(40)   NOT NULL,
  acceptingBranchId VARCHAR(32)   NOT NULL,
  acceptingUserId   VARCHAR(32)   NOT NULL,
  customerId        VARCHAR(32)   NOT NULL,
  pickupAddress     TEXT          NULL,
  deliveryAddress   TEXT          NULL,
  notesForDriver    TEXT          NULL,
  internalNotes     TEXT          NULL,
  declaredRugCount  INT           NULL,
  totalAreaM2       DECIMAL(10,2) NOT NULL DEFAULT 0,
  totalGrossPrice   DECIMAL(10,2) NOT NULL DEFAULT 0,
  computedStatus    VARCHAR(40)   NOT NULL DEFAULT 'NEW',
  driverId          VARCHAR(32)   NULL,
  partnerBranchId   VARCHAR(32)   NULL,
  createdAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_number (number),
  KEY orders_branch (acceptingBranchId),
  KEY orders_customer (customerId),
  KEY orders_partner (partnerBranchId),
  KEY orders_driver (driverId),
  KEY orders_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rugs (
  id                  VARCHAR(32)   NOT NULL,
  orderId             VARCHAR(32)   NOT NULL,
  qrCode              VARCHAR(80)   NOT NULL,
  widthCm             INT           NULL,
  heightCm            INT           NULL,
  areaM2              DECIMAL(10,2) NULL,
  packageId           VARCHAR(32)   NULL,
  pricePerM2          DECIMAL(10,2) NULL,
  totalPrice          DECIMAL(10,2) NULL,
  notes               TEXT          NULL,
  currentStatus       VARCHAR(40)   NOT NULL,
  physicalLocation    VARCHAR(40)   NULL,
  isFromPartner       TINYINT(1)    NOT NULL DEFAULT 0,
  isFromDriverPickup  TINYINT(1)    NOT NULL DEFAULT 0,
  createdAt           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY rugs_qr (qrCode),
  KEY rugs_order (orderId),
  KEY rugs_status (currentStatus),
  KEY rugs_location (physicalLocation),
  CONSTRAINT fk_rug_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rug_photos (
  id                VARCHAR(32) NOT NULL,
  rugId             VARCHAR(32) NOT NULL,
  storageKey        VARCHAR(255) NOT NULL,
  takenAt           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploadedByUserId  VARCHAR(32) NOT NULL,
  PRIMARY KEY (id),
  KEY rug_photos_rug (rugId),
  CONSTRAINT fk_photo_rug FOREIGN KEY (rugId) REFERENCES rugs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rug_status_events (
  id              VARCHAR(32) NOT NULL,
  rugId           VARCHAR(32) NOT NULL,
  fromStatus      VARCHAR(40) NULL,
  toStatus        VARCHAR(40) NOT NULL,
  changedByUserId VARCHAR(32) NOT NULL,
  changedAt       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source          VARCHAR(20) NOT NULL DEFAULT 'manual',
  comment         TEXT        NULL,
  PRIMARY KEY (id),
  KEY rug_events_rug (rugId, changedAt),
  CONSTRAINT fk_event_rug FOREIGN KEY (rugId) REFERENCES rugs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_codes (
  code        VARCHAR(80) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  rugId       VARCHAR(32) NULL,
  createdAt   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archivedAt  DATETIME    NULL,
  PRIMARY KEY (code),
  KEY qr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS driver_daily_settlements (
  id                  VARCHAR(32)  NOT NULL,
  driverUserId        VARCHAR(32)  NOT NULL,
  day                 CHAR(10)     NOT NULL,
  totalCashCollected  DECIMAL(10,2) NOT NULL DEFAULT 0,
  status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  settledAt           DATETIME     NULL,
  settledByUserId     VARCHAR(32)  NULL,
  notes               TEXT         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY dds_driver_day (driverUserId, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS driver_settlement_items (
  id                  VARCHAR(32)   NOT NULL,
  settlementId        VARCHAR(32)   NOT NULL,
  orderId             VARCHAR(32)   NOT NULL,
  rugId               VARCHAR(32)   NOT NULL,
  amountCollected     DECIMAL(10,2) NOT NULL,
  collectedAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY dsi_settlement (settlementId),
  CONSTRAINT fk_dsi_settlement FOREIGN KEY (settlementId) REFERENCES driver_daily_settlements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_logs (
  id                  VARCHAR(32)  NOT NULL,
  orderId             VARCHAR(32)  NOT NULL,
  channel             VARCHAR(10)  NOT NULL,
  trigger_event       VARCHAR(40)  NOT NULL,
  toAddress           VARCHAR(190) NOT NULL,
  subject             VARCHAR(255) NULL,
  body                TEXT         NOT NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'QUEUED',
  providerMessageId   VARCHAR(190) NULL,
  error               TEXT         NULL,
  createdAt           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sentAt              DATETIME     NULL,
  PRIMARY KEY (id),
  KEY notif_order (orderId),
  CONSTRAINT fk_notif_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_events (
  id           VARCHAR(32) NOT NULL,
  actorUserId  VARCHAR(32) NULL,
  entity       VARCHAR(40) NOT NULL,
  entityId     VARCHAR(32) NOT NULL,
  action       VARCHAR(40) NOT NULL,
  diff         TEXT        NULL,
  context      TEXT        NULL,
  createdAt    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY audit_entity (entity, entityId),
  KEY audit_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key  VARCHAR(100) NOT NULL,
  value        LONGTEXT     NOT NULL,
  updatedAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
