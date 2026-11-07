import { useEffect, useState } from 'react'
import * as api from '../lib/api.js'
import { getCurrentStudentId } from '../lib/auth.js'

export default function useStudentOnboarding(companyId) {
  const [state, setState] = useState({ onboarding: null, enrollmentId: null, isLoading: true, loadError: '' })
  useEffect(() => {
    let cancelled = false
    setState({ onboarding: null, enrollmentId: null, isLoading: true, loadError: '' })
    async function load() {
      try {
        const enrollment = await api.getEnrollment(companyId, getCurrentStudentId())
        const [data, { submissions }] = await Promise.all([
          api.getOnboarding(companyId), api.listSubmissions(enrollment.enrollmentId),
        ])
        const onboarding = api.normalizeOnboardingResponse(companyId, data, submissions)
        onboarding.targetDate = enrollment.targetDate
        if (!cancelled) setState({ onboarding, enrollmentId: enrollment.enrollmentId, isLoading: false, loadError: '' })
      } catch (error) {
        const message = error.status === 404
          ? '등록된 온보딩이 없습니다. 회사 담당자에게 등록을 요청해주세요.'
          : (error.message || '온보딩을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.')
        if (!cancelled) setState({ onboarding: null, enrollmentId: null, isLoading: false, loadError: message })
      }
    }
    load()
    return () => { cancelled = true }
  }, [companyId])
  return state
}
