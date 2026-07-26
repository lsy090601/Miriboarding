import { Router } from 'express'
import { listJobsHandler, getJobScheduleHandler, generateJobScheduleHandler } from '../controllers/jobs.controller.js'

const router = Router()

router.get('/', listJobsHandler)
router.get('/:jobId', getJobScheduleHandler)
router.post('/:jobId/generate', generateJobScheduleHandler)

export default router
