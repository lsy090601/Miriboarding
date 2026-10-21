import { Router } from 'express'
import multer from 'multer'
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
  getStudentEnrollmentsHandler,
  updateStudentTargetDateHandler,
  removeStudentEnrollmentHandler,
  uploadMissionFileHandler,
} from '../controllers/onboarding.controller.js'
import { authenticate, requireOwnBody, requireOwnParam, requireRole } from '../middleware/auth.middleware.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.use(authenticate)

router.post('/generate', requireRole('company'), requireOwnBody('companyId'), generateHandler)
router.get('/:companyId', getOnboardingHandler)
router.put('/:companyId', requireRole('company'), requireOwnParam('companyId'), updateOnboardingHandler)
router.get('/:companyId/missions', listMissionsHandler)
router.post('/:companyId/missions', requireRole('company'), requireOwnParam('companyId'), createMissionHandler)
router.put('/:companyId/missions/:missionId', requireRole('company'), requireOwnParam('companyId'), updateMissionHandler)
router.delete('/:companyId/missions/:missionId', requireRole('company'), requireOwnParam('companyId'), deleteMissionHandler)
router.put('/:enrollmentId/progress', requireRole('student'), updateProgressHandler)
router.post('/:companyId/enroll', requireRole('company'), requireOwnParam('companyId'), enrollHandler)
router.get('/:companyId/enrollment/:studentId', getEnrollmentHandler)
router.post('/enrollments/:enrollmentId/missions/:missionId/submissions', requireRole('student'), submitMissionHandler)
router.post(
  '/enrollments/:enrollmentId/missions/:missionId/upload',
  requireRole('student'),
  upload.single('file'),
  uploadMissionFileHandler,
)
router.get('/enrollments/:enrollmentId/submissions', listSubmissionsHandler)
router.get('/:companyId/students', requireRole('company'), requireOwnParam('companyId'), listEnrolledStudentsHandler)
router.get('/:companyId/students/:studentId', requireRole('company'), requireOwnParam('companyId'), getStudentDetailHandler)
router.post('/:companyId/students/register', requireRole('company'), requireOwnParam('companyId'), registerStudentsHandler)
router.post('/submissions/:submissionId/feedback', requireRole('company'), sendMissionFeedbackHandler)
router.get('/student/:studentId/enrollments', requireRole('student'), requireOwnParam('studentId'), getStudentEnrollmentsHandler)
router.put('/:companyId/students/:studentId/target-date', requireRole('company'), requireOwnParam('companyId'), updateStudentTargetDateHandler)
router.delete('/:companyId/students/:studentId', requireRole('company'), requireOwnParam('companyId'), removeStudentEnrollmentHandler)

export default router
