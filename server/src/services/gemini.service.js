import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { OnboardingError } from '../utils/errors.js'

const { GEMINI_API_KEY, GEMINI_MODEL } = process.env

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env를 확인해주세요.')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

const scheduleItemSchema = {
  type: SchemaType.OBJECT,
  properties: {
    time: { type: SchemaType.STRING, description: '일정 시점 (예: "09:00", "1일차", "1주차")' },
    activity: { type: SchemaType.STRING, description: '해당 시점에 진행할 활동 내용' },
  },
  required: ['time', 'activity'],
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    schedules: {
      type: SchemaType.OBJECT,
      properties: {
        day: { type: SchemaType.ARRAY, items: scheduleItemSchema, description: '입사 첫날 하루 시간대별 일정' },
        week: { type: SchemaType.ARRAY, items: scheduleItemSchema, description: '입사 첫 주 요일별 일정' },
        month: { type: SchemaType.ARRAY, items: scheduleItemSchema, description: '입사 첫 달 주차별 일정' },
      },
      required: ['day', 'week', 'month'],
    },
    missions: {
      type: SchemaType.ARRAY,
      description: '온보딩 기간에 수행할 실습 미션 목록 (3개 권장)',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: ['title', 'description'],
      },
    },
  },
  required: ['schedules', 'missions'],
}

const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL || 'gemini-flash-latest',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema,
  },
})

function buildPrompt(jobTitle, companyName) {
  return `당신은 신입사원 온보딩 설계 전문가입니다.
"${companyName}"에 새로 입사한 "${jobTitle}" 직무 담당자를 위한 온보딩 계획을 한국어로 작성해주세요.

다음 내용을 포함해야 합니다.
- day: 입사 첫날 하루 동안 시간대별로 진행할 일정 (출근부터 퇴근까지, 4~6개 항목)
- week: 입사 첫 주 동안 요일별로 진행할 일정 (5개 항목 내외)
- month: 입사 첫 달 동안 주차별로 진행할 일정 (4개 항목 내외)
- missions: 온보딩 기간 동안 직접 수행하며 실무를 익힐 수 있는 실습 미션 3개 (title, description)

모든 일정과 미션은 "${jobTitle}" 직무의 실제 업무와 관련된 구체적인 내용으로 작성하고, 추상적인 표현은 피해주세요.`
}

function isValidPlan(parsed) {
  return Boolean(
    parsed &&
      parsed.schedules &&
      Array.isArray(parsed.schedules.day) &&
      Array.isArray(parsed.schedules.week) &&
      Array.isArray(parsed.schedules.month) &&
      Array.isArray(parsed.missions),
  )
}

export async function generateOnboardingPlan({ jobTitle, companyName }) {
  let result
  try {
    result = await model.generateContent(buildPrompt(jobTitle, companyName))
  } catch (error) {
    console.error('[gemini] generateContent 실패:', error)
    throw new OnboardingError(502, 'GEMINI_ERROR', 'Gemini API 호출 중 오류가 발생했습니다.')
  }

  const text = result?.response?.text?.()
  if (!text) {
    throw new OnboardingError(502, 'GEMINI_ERROR', 'Gemini 응답이 비어 있습니다.')
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    console.error('[gemini] JSON 파싱 실패:', text)
    throw new OnboardingError(502, 'GEMINI_ERROR', 'Gemini 응답을 해석할 수 없습니다.')
  }

  if (!isValidPlan(parsed)) {
    console.error('[gemini] 응답 형식 오류:', parsed)
    throw new OnboardingError(502, 'GEMINI_ERROR', 'Gemini 응답 형식이 올바르지 않습니다.')
  }

  return parsed
}
