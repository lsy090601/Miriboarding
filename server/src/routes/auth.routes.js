import { Router } from 'express'
import {
  validateBusinessHandler,
  signupStudentHandler,
  signupCompanyHandler,
  loginHandler,
  getCompanyProfileHandler,
} from '../controllers/auth.controller.js'

const router = Router()

router.post('/validate-business', validateBusinessHandler)
router.post('/signup/student', signupStudentHandler)
router.post('/signup/company', signupCompanyHandler)
router.post('/login', loginHandler)
router.get('/company/:companyId', getCompanyProfileHandler)

export default router
