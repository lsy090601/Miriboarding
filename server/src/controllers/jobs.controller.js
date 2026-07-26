import { OnboardingError } from '../utils/errors.js'
import { listJobs, getJobSchedule, generateJobSchedule } from '../services/jobs.service.js'

function handleError(res, error) {
  if (error instanceof OnboardingError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message })
  }
  console.error(error)
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' })
}

export async function listJobsHandler(req, res) {
  try {
    const jobs = await listJobs()
    return res.status(200).json(jobs)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function getJobScheduleHandler(req, res) {
  try {
    const result = await getJobSchedule(req.params.jobId)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function generateJobScheduleHandler(req, res) {
  try {
    const { sourceContent } = req.body
    const result = await generateJobSchedule(req.params.jobId, sourceContent)
    return res.status(201).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}
