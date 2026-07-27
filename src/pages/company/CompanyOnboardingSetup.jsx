import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JOB_OPTIONS } from "../../mock/company.js";
import styles from "./CompanyOnboardingSetup.module.css";

export default function CompanyOnboardingSetup() {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  function handleGenerate() {
    if (!jobTitle || !companyName) return;
    setIsGenerating(true);
    // TODO: API 연결 시 POST /api/onboarding/generate 호출 (Claude API)
    setTimeout(() => {
      setIsGenerating(false);
      navigate("/company/onboarding-edit/new-company");
    }, 1500);
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/company/onboarding-list")}
        >
          ← 뒤로가기
        </button>

        <h1 className={styles.title}>새 온보딩 생성</h1>

        <label className={styles.label}>직무 선택</label>
        <select
          className={styles.select}
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        >
          <option value="">직무를 선택하세요</option>
          {JOB_OPTIONS.map((job) => (
            <option key={job} value={job}>
              {job}
            </option>
          ))}
        </select>

        <label className={styles.label}>회사명</label>
        <input
          className={styles.input}
          type="text"
          placeholder="예: OO물류"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <div className={styles.infoBox}>
          <p className={styles.infoTitle}>
            AI가 데이터를 분석하여 타임라인을 생성합니다
          </p>
          <ul className={styles.infoList}>
            <li>채용공고, NCS 표준 데이터를 분석해요</li>
            <li>하루/1주/1달 일정을 자동으로 만들어요</li>
            <li>직무 관련 용어 사전도 함께 생성돼요</li>
          </ul>
        </div>

        <button
          type="button"
          className={styles.generateButton}
          disabled={!jobTitle || !companyName || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? "생성 중..." : "자동 생성 시작"}
        </button>
      </div>
    </div>
  );
}
