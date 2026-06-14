import express from 'express';
import { protectSuperAdmin } from '../middleware/auth.js';
import {
  superLogin,
  getDashboardOverview,
  getAllAdmins,
  addAdmin,
  editAdmin,
  deleteAdmin,
  getAllProviders,
  getProviderDetails,
  getAllUsers,
  getAllServices,
  getAllProjects,
  getAdminLogs,
  getSuperAdminLogs,
  getAllLogs,
  getLogById,
  deleteUser,
  deleteService,
} from '../controllers/superController.js';

const router = express.Router();

// Public route
router.post('/login', superLogin);

// Protected routes (require super admin authentication)
router.use(protectSuperAdmin);

// Dashboard
router.get('/dashboard', getDashboardOverview);

// Admin Management
router.get('/admins', getAllAdmins);
router.post('/admins', addAdmin);
router.put('/admins/:id', editAdmin);
router.delete('/admins/:id', deleteAdmin);

// Provider Management
router.get('/providers', getAllProviders);
router.get('/providers/:id', getProviderDetails);

// User Management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Service Management
router.get('/services', getAllServices);
router.delete('/services/:id', deleteService);

// Project Management
router.get('/projects', getAllProjects);

// Logs
router.get('/logs/admin', getAdminLogs);
router.get('/logs/super', getSuperAdminLogs);
router.get('/logs/all', getAllLogs);
router.get('/logs/:id', getLogById);

export default router;