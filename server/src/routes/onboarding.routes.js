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

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

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
router.post(
  '/enrollments/:enrollmentId/missions/:missionId/upload',
  upload.single('file'),
  uploadMissionFileHandler,
)
router.get('/enrollments/:enrollmentId/submissions', listSubmissionsHandler)
router.get('/:companyId/students', listEnrolledStudentsHandler)
router.get('/:companyId/students/:studentId', getStudentDetailHandler)
router.post('/:companyId/students/register', registerStudentsHandler)
router.post('/submissions/:submissionId/feedback', sendMissionFeedbackHandler)
router.get('/student/:studentId/enrollments', getStudentEnrollmentsHandler)
router.put('/:companyId/students/:studentId/target-date', updateStudentTargetDateHandler)
router.delete('/:companyId/students/:studentId', removeStudentEnrollmentHandler)

export default router
