import { OnboardingError } from '../utils/errors.js'
import {
  generateOnboarding,
  getOnboarding,
  updateOnboarding,
  listMissions,
  createMission,
  updateMission,
  deleteMission,
  updateProgress,
  enrollStudent,
  getEnrollment,
  submitMission,
  listSubmissions,
  listEnrolledStudents,
  getStudentDetail,
  registerStudentsByEmail,
  sendMissionFeedback,
} from '../services/onboarding.service.js'

function handleError(res, error) {
  if (error instanceof OnboardingError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message })
  }
  console.error(error)
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' })
}

export async function generateHandler(req, res) {
  try {
    const { companyId, jobTitle, companyName } = req.body
    const result = await generateOnboarding({ companyId, jobTitle, companyName })
    return res.status(201).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function getOnboardingHandler(req, res) {
  try {
    const result = await getOnboarding(req.params.companyId)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function updateOnboardingHandler(req, res) {
  try {
    const { schedules, missions, targetDate } = req.body
    const result = await updateOnboarding(req.params.companyId, { schedules, missions, targetDate })
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function listMissionsHandler(req, res) {
  try {
    const missions = await listMissions(req.params.companyId)
    return res.status(200).json({ missions })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function createMissionHandler(req, res) {
  try {
    const { title, description } = req.body
    const mission = await createMission(req.params.companyId, { title, description })
    return res.status(201).json({ success: true, mission })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function updateMissionHandler(req, res) {
  try {
    const { title, description } = req.body
    const mission = await updateMission(req.params.companyId, req.params.missionId, { title, description })
    return res.status(200).json({ success: true, mission })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function deleteMissionHandler(req, res) {
  try {
    await deleteMission(req.params.companyId, req.params.missionId)
    return res.status(200).json({ success: true })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function updateProgressHandler(req, res) {
  try {
    const { progressPercent } = req.body
    const result = await updateProgress(req.params.enrollmentId, progressPercent)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function enrollHandler(req, res) {
  try {
    const { studentId } = req.body
    const result = await enrollStudent(req.params.companyId, studentId)
    return res.status(201).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function getEnrollmentHandler(req, res) {
  try {
    const result = await getEnrollment(req.params.companyId, req.params.studentId)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function submitMissionHandler(req, res) {
  try {
    const { content } = req.body
    const result = await submitMission(req.params.enrollmentId, req.params.missionId, content)
    return res.status(201).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function listSubmissionsHandler(req, res) {
  try {
    const submissions = await listSubmissions(req.params.enrollmentId)
    return res.status(200).json({ submissions })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function listEnrolledStudentsHandler(req, res) {
  try {
    const students = await listEnrolledStudents(req.params.companyId)
    return res.status(200).json({ students })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function getStudentDetailHandler(req, res) {
  try {
    const result = await getStudentDetail(req.params.companyId, req.params.studentId)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function registerStudentsHandler(req, res) {
  try {
    const { emails } = req.body
    const result = await registerStudentsByEmail(req.params.companyId, emails)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function sendMissionFeedbackHandler(req, res) {
  try {
    const { feedback } = req.body
    const result = await sendMissionFeedback(req.params.submissionId, feedback)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}
