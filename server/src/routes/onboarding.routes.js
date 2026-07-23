import { Router } from 'express'
import {
  generateHandler,
  getOnboardingHandler,
  updateOnboardingHandler,
  listMissionsHandler,
  createMissionHandler,
  updateMissionHandler,
  deleteMissionHandler,
  updateProgressHandler,
} from '../controllers/onboarding.controller.js'

const router = Router()

router.post('/generate', generateHandler)
router.get('/:companyId', getOnboardingHandler)
router.put('/:companyId', updateOnboardingHandler)
router.get('/:companyId/missions', listMissionsHandler)
router.post('/:companyId/missions', createMissionHandler)
router.put('/:companyId/missions/:missionId', updateMissionHandler)
router.delete('/:companyId/missions/:missionId', deleteMissionHandler)
router.put('/:enrollmentId/progress', updateProgressHandler)

export default router
