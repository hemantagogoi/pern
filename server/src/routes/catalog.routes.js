import { Router } from 'express';
import { authenticate, requireApproved, requireRole } from '../middleware/auth.middleware.js';
import { crudController, subjects, units } from '../controllers/catalog.controller.js';

const router = Router();
const adminOnly = [authenticate, requireApproved, requireRole('admin')];
const approvedUser = [authenticate, requireApproved];

for (const resource of ['programs', 'departments', 'semesters']) {
  const controller = crudController(resource);
  router.get(`/${resource}`, authenticate, requireApproved, controller.list);
  router.post(`/${resource}`, adminOnly, controller.create);
  router.put(`/${resource}/:id`, adminOnly, controller.update);
  router.delete(`/${resource}/:id`, adminOnly, controller.remove);
}

router.get('/subjects', authenticate, requireApproved, subjects.list);
router.post('/subjects', adminOnly, subjects.create);
router.put('/subjects/:id', adminOnly, subjects.update);
router.delete('/subjects/:id', adminOnly, subjects.remove);

router.get('/units', approvedUser, units.list);
router.post('/units', approvedUser, units.create);
router.put('/units/:id', approvedUser, units.update);
router.delete('/units/:id', adminOnly, units.remove);

export default router;
