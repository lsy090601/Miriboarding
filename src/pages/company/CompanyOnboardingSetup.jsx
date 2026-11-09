import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import { getCompanyJobRecommendations } from "../../utils/companyJobs.js";
import Button from "../../components/Button/Button.jsx";
import Select from "../../components/Select/Select.jsx";
import Banner from "../../components/Banner/Banner.jsx";
import styles from "./CompanyOnboardingSetup.module.css";

export default function CompanyOnboardingSetup() {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState("");
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState(null);
  const [industry, setIndustry] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getCompanyProfile(getCurrentCompanyId()).then((profile) => {
      if (!cancelled) { setCompany(profile); setIndustry(profile.industry ?? ""); }
    }).catch((err) => {
      if (!cancelled) setError(err.message ?? "회사 정보를 불러오지 못했습니다.");
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const recommendations = getCompanyJobRecommendations(industry, companyDescription);
  const selectedJobTitle = jobTitle === "직접 입력" ? customJobTitle.trim() : jobTitle;
  const jobOptions = [...new Set([...recommendations.jobs, ...(jobTitle && jobTitle !== "직접 입력" ? [jobTitle] : []), "직접 입력"])];
  const canGenerate = company && selectedJobTitle && industry.trim();

  async function handleGenerate() {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    setError("");
    try {
      const companyId = getCurrentCompanyId();
      const draft = await api.generateOnboarding({ companyId, jobTitle: selectedJobTitle, industry, companyDescription, jobDescription });
      navigate(`/company/onboarding-edit/${companyId}?versionId=${draft.versionId}`);
    } catch (err) {
      setError(err.message ?? "온보딩 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Button variant="outline" size="sm" onClick={() => navigate("/company/onboarding-list")}>
          ← 뒤로가기
        </Button>

        <h1 className={styles.title}>새 온보딩 생성</h1>

        <div className={styles.companyInfo}>
          <strong>{isLoading ? "회사 정보를 불러오는 중..." : company?.companyName}</strong>
          {company && <p className={styles.hint}>등록 업종: {industry || "업종 정보 없음"}</p>}
          <p className={styles.hint}>회사에 맞는 직무를 고르면 일정과 미션을 자동으로 생성합니다.</p>
        </div>

        <Select
          id="onboardingJobTitle"
          label="입사자 직무"
          disabled={isLoading || isGenerating || !company}
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          options={jobOptions}
          placeholder="회사에 맞는 직무를 선택하세요"
        />
        <p className={styles.hint}>
          {recommendations.matched
            ? "등록된 업종에 맞는 직무를 추천했어요. 목록에 없으면 직접 입력할 수 있습니다."
            : "등록 업종에 대한 세부 추천이 없어 공통 직무를 표시합니다. 목록에 없으면 직접 입력해주세요."}
        </p>
        {jobTitle === "직접 입력" && (
          <label className={styles.field}>
            직무명 직접 입력
            <input value={customJobTitle} onChange={(e) => setCustomJobTitle(e.target.value)} maxLength={100} disabled={isGenerating} placeholder="예: 반도체 공정 엔지니어" />
          </label>
        )}

        <details className={styles.optionalDetails}>
          <summary>추가 설명 입력 (선택)</summary>
        <label className={styles.field}>
          회사 소개 (선택)
          <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} maxLength={2000} disabled={isGenerating} placeholder="예: 소상공인을 위한 온라인 쇼핑몰 서비스를 개발·운영합니다." rows={4} />
        </label>
        <label className={styles.field}>
          입사자가 맡을 업무 (선택)
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} maxLength={2000} disabled={isGenerating} placeholder="예: Node.js와 PostgreSQL로 상품·주문 API를 개발하고 테스트합니다." rows={4} />
          <span className={styles.hint}>입력 내용은 이번 생성에 사용됩니다. 생성 후 일정과 미션을 검토·수정해주세요.</span>
        </label>
        </details>

        <Banner variant="info">
          <p className={styles.infoTitle}>회사 업무에 맞는 온보딩 초안을 만듭니다</p>
          <ul className={styles.infoList}>
            <li>등록된 회사 업종과 선택한 직무를 자동으로 반영해요</li>
            <li>하루/1주/1달 일정을 자동으로 만들어요</li>
            <li>실제 업무를 연습할 실습 미션 3개도 만들어요</li>
          </ul>
        </Banner>

        {error && <p className={styles.errorText}>{error}</p>}

        <Button variant="primary" disabled={!canGenerate || isLoading || isGenerating} onClick={handleGenerate}>
          {isGenerating ? "생성 중..." : "자동 생성 시작"}
        </Button>
      </div>
    </div>
  );
}
