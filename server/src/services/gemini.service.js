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
    importance: { type: SchemaType.STRING, format: 'enum', enum: ['low', 'medium', 'high'], description: '해당 일정의 중요도' },
  },
  required: ['time', 'activity', 'importance'],
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
          submissionType: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['text', 'file', 'choice'],
            description: '학생이 이 미션을 제출하는 방식',
          },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'submissionType이 choice일 때만 사용하는 선택지 목록 (그 외에는 빈 배열)',
          },
        },
        required: ['title', 'description', 'submissionType', 'options'],
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
- day: 입사 첫날 하루 동안 시간대별로 진행할 일정 (출근부터 퇴근까지, 4~6개 항목). 각 항목마다 중요도(importance: low/medium/high)를 함께 판단해주세요.
- week: 입사 첫 주 동안 요일별로 진행할 일정 (5개 항목 내외). 각 항목마다 importance 포함.
- month: 입사 첫 달 동안 주차별로 진행할 일정 (4개 항목 내외). 각 항목마다 importance 포함.
- missions: 온보딩 기간 동안 직접 수행하며 실무를 익힐 수 있는 실습 미션 3개 (title, description). 각 미션마다 제출 방식(submissionType: text/file/choice)을 정해주고, choice인 경우에만 options에 선택지 3~4개를 채워주세요 (text/file인 경우 options는 빈 배열).

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

const jobScheduleItemSchema = {
  type: SchemaType.OBJECT,
  properties: {
    time: { type: SchemaType.STRING, description: '일정 시점 (예: "09:00", "월요일", "1주차")' },
    activity: { type: SchemaType.STRING, description: '해당 시점에 진행할 업무 내용' },
    importance: { type: SchemaType.STRING, format: 'enum', enum: ['low', 'medium', 'high'], description: '해당 업무의 중요도' },
    terms: {
      type: SchemaType.ARRAY,
      description: '이 업무를 이해하는 데 필요한 관련 용어 3~5개',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          term: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING, description: '마이스터고 학생도 이해할 수 있는 쉬운 설명' },
        },
        required: ['term', 'description'],
      },
    },
  },
  required: ['time', 'activity', 'importance', 'terms'],
}

const jobScheduleResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    schedules: {
      type: SchemaType.OBJECT,
      properties: {
        day: { type: SchemaType.ARRAY, items: jobScheduleItemSchema, description: '이 직무 담당자의 하루 시간대별 업무' },
        week: { type: SchemaType.ARRAY, items: jobScheduleItemSchema, description: '이 직무 담당자의 한 주 요일별 업무' },
        month: { type: SchemaType.ARRAY, items: jobScheduleItemSchema, description: '이 직무 담당자의 한 달 주차별 업무' },
      },
      required: ['day', 'week', 'month'],
    },
  },
  required: ['schedules'],
}

const jobScheduleModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL || 'gemini-flash-latest',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: jobScheduleResponseSchema,
  },
})

function buildJobSchedulePrompt(jobTitle, sourceContent) {
  const sourceSection = sourceContent
    ? `\n다음은 이 직무에 대한 실제 참고 자료입니다 (NCS 능력단위, 워크넷 직업정보, 채용공고 주요업무 등을 조합한 자료일 수 있습니다). 이 내용을 최대한 반영해서 실제 업무와 일치하는 일정을 만들어주세요.\n---\n${sourceContent}\n---\n`
    : ''

  return `당신은 마이스터고 학생을 위한 직무 체험 콘텐츠 설계 전문가입니다.
"${jobTitle}" 직무를 처음 체험해보는 학생을 위한 하루/1주/1달 업무 일정을 한국어로 작성해주세요.
${sourceSection}
다음 내용을 포함해야 합니다.
- day: 이 직무 담당자의 하루 업무를 시간대별로 (4~6개 항목) — 참고 자료가 있다면 특히 이 부분에 자료 속 세부 활동을 반영해주세요.
- week: 이 직무 담당자의 한 주 업무를 요일별로 (5개 항목 내외)
- month: 이 직무 담당자의 한 달 업무를 주차별로 (4개 항목 내외) — 참고 자료의 능력단위 구조를 골격으로 활용해주세요.
- 각 항목마다 중요도(importance)와, 그 업무를 이해하는 데 필요한 관련 용어 3~5개(term, description)를 포함해주세요.

문체 규칙: activity는 반드시 "~확인 및 ~ 처리", "~검토", "~작성" 처럼 명사형으로 끝내주세요. "~합니다", "~한다", "~해요"처럼 문장으로 끝내지 마세요.

모든 내용은 "${jobTitle}" 직무의 실제 업무와 관련된 구체적인 내용으로 작성하고, 추상적인 표현은 피해주세요.`
}

function isValidJobSchedulePlan(parsed) {
  return Boolean(
    parsed &&
      parsed.schedules &&
      Array.isArray(parsed.schedules.day) &&
      Array.isArray(parsed.schedules.week) &&
      Array.isArray(parsed.schedules.month),
  )
}

export async function generateJobSchedulePlan({ jobTitle, sourceContent }) {
  let result
  try {
    result = await jobScheduleModel.generateContent(buildJobSchedulePrompt(jobTitle, sourceContent))
  } catch (error) {
    console.error('[gemini] generateJobSchedulePlan 실패:', error)
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

  if (!isValidJobSchedulePlan(parsed)) {
    console.error('[gemini] 응답 형식 오류:', parsed)
    throw new OnboardingError(502, 'GEMINI_ERROR', 'Gemini 응답 형식이 올바르지 않습니다.')
  }

  return parsed
}
