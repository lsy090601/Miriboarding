import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import { JOB_OPTIONS } from "../../mock/company.js";
import styles from "./CompanyOnboardingSetup.module.css";

export default function CompanyOnboardingSetup() {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!jobTitle) return;
    setIsGenerating(true);
    setError("");
    try {
      const companyId = getCurrentCompanyId();
      const { companyName } = await api.getCompanyProfile(companyId);
      await api.generateOnboarding({ companyId, jobTitle, companyName });
      navigate(`/company/onboarding-edit/${companyId}`);
    } catch (err) {
      setError(err.message ?? "온보딩 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
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

        <div className={styles.infoBox}>
          <p className={styles.infoTitle}>
            AI가 데이터를 분석하여 타임라인을 생성합니다
          </p>
          <ul className={styles.infoList}>
            <li>임금직업정보(워크넷)에서 찾은 실제 직무 자료를 분석해요</li>
            <li>하루/1주/1달 일정을 자동으로 만들어요</li>
            <li>직무 관련 용어 사전도 함께 생성돼요</li>
          </ul>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <button
          type="button"
          className={styles.generateButton}
          disabled={!jobTitle || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? "생성 중..." : "자동 생성 시작"}
        </button>
      </div>
    </div>
  );
}
