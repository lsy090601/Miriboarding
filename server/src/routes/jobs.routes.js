import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { listJobsHandler, getJobScheduleHandler, generateJobScheduleHandler } from '../controllers/jobs.controller.js'

const router = Router()
router.use(authenticate)

router.get('/', listJobsHandler)
router.get('/:jobId', getJobScheduleHandler)
router.post('/:jobId/generate', generateJobScheduleHandler)

export default router
