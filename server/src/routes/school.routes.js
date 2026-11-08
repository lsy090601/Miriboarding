import { Router } from 'express'
import { searchSchoolsHandler } from '../controllers/school.controller.js'

const router = Router()

// 회원가입 화면에서 로그인 전에 호출하므로 인증 없이 열어둔다. (GET /api/schools?q=학교명)
router.get('/', searchSchoolsHandler)

export default router
