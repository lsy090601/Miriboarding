import { searchSchools } from '../services/school.service.js'

export async function searchSchoolsHandler(req, res) {
  try {
    const schools = await searchSchools(req.query.q)
    return res.status(200).json({ schools })
  } catch (error) {
    return res.status(502).json({ success: false, code: 'SCHOOL_API_ERROR', message: error.message })
  }
}
