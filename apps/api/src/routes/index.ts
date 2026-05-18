import { Router } from 'express';
import { installRouter } from './install.js';
import { authRouter } from './auth.js';
import { meRouter } from './me.js';
import { ordersRouter } from './orders.js';
import { rugsRouter } from './rugs.js';
import { scanRouter } from './scan.js';
import { customersRouter } from './customers.js';
import { branchesRouter } from './branches.js';
import { usersRouter } from './users.js';
import { packagesRouter } from './packages.js';
import { priceListsRouter } from './priceLists.js';
import { qrPoolRouter } from './qrPool.js';
import { settingsRouter } from './settings.js';
import { settlementsRouter } from './settlements.js';
import { statisticsRouter } from './statistics.js';
import { photosRouter } from './photos.js';
import { authMiddleware } from '../lib/auth.js';

export const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

// Instalator nie wymaga autoryzacji do statusu
router.use('/install', installRouter);

// Logowanie
router.use('/auth', authRouter);

// Resztę chroni JWT
router.use(authMiddleware as any);

router.use('/me', meRouter);
router.use('/orders', ordersRouter);
router.use('/rugs', rugsRouter);
router.use('/scan', scanRouter);
router.use('/customers', customersRouter);
router.use('/branches', branchesRouter);
router.use('/users', usersRouter);
router.use('/packages', packagesRouter);
router.use('/price-lists', priceListsRouter);
router.use('/qr-pool', qrPoolRouter);
router.use('/settings', settingsRouter);
router.use('/settlements', settlementsRouter);
router.use('/statistics', statisticsRouter);
router.use('/photos', photosRouter);
