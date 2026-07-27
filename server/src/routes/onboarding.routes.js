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
  enrollHandler,
  getEnrollmentHandler,
  submitMissionHandler,
  listSubmissionsHandler,
  listEnrolledStudentsHandler,
  getStudentDetailHandler,
  registerStudentsHandler,
  sendMissionFeedbackHandler,
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
router.post('/:companyId/enroll', enrollHandler)
router.get('/:companyId/enrollment/:studentId', getEnrollmentHandler)
router.post('/enrollments/:enrollmentId/missions/:missionId/submissions', submitMissionHandler)
router.get('/enrollments/:enrollmentId/submissions', listSubmissionsHandler)
router.get('/:companyId/students', listEnrolledStudentsHandler)
router.get('/:companyId/students/:studentId', getStudentDetailHandler)
router.post('/:companyId/students/register', registerStudentsHandler)
router.post('/submissions/:submissionId/feedback', sendMissionFeedbackHandler)

export default router
