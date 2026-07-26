import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import onboardingRoutes from './routes/onboarding.routes.js'
import jobsRoutes from './routes/jobs.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/jobs', jobsRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
