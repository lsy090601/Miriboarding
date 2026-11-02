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
  const canGenerate = company && selectedJobTitle && industry.trim() && companyDescription.trim() && jobDescription.trim();

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

        <p className={styles.hint}>{isLoading ? "회사 정보를 불러오는 중..." : company?.companyName}</p>
        <label className={styles.field}>
          업종 확인
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} maxLength={200} disabled={isLoading || isGenerating} placeholder="예: 소프트웨어 개발업" />
          <span className={styles.hint}>가입 시 저장된 업종입니다. 조회 실패 시 예시 정보가 저장됐을 수 있으니 실제 업종으로 확인·수정해주세요.</span>
        </label>
        <label className={styles.field}>
          회사 소개
          <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} maxLength={2000} disabled={isGenerating} placeholder="예: 소상공인을 위한 온라인 쇼핑몰 서비스를 개발·운영합니다." rows={4} />
        </label>

        <Select
          id="onboardingJobTitle"
          label="입사자 직무"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          options={jobOptions}
          placeholder="회사에 맞는 직무를 선택하세요"
        />
        <p className={styles.hint}>
          {recommendations.matched
            ? "입력한 업종과 회사 소개를 기준으로 관련 직무와 공통 지원 직무를 추천합니다. 실제 채용 직무 목록은 아닙니다."
            : "업종에 맞는 직무를 아직 찾지 못해 공통 직무를 표시합니다. 회사 소개를 구체적으로 입력하거나 직접 입력해주세요."}
        </p>
        {jobTitle === "직접 입력" && (
          <label className={styles.field}>
            직무명 직접 입력
            <input value={customJobTitle} onChange={(e) => setCustomJobTitle(e.target.value)} maxLength={100} disabled={isGenerating} placeholder="예: 반도체 공정 엔지니어" />
          </label>
        )}

        <label className={styles.field}>
          입사자가 맡을 업무
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} maxLength={2000} disabled={isGenerating} placeholder="예: Node.js와 PostgreSQL로 상품·주문 API를 개발하고 테스트합니다." rows={4} />
          <span className={styles.hint}>입력 내용은 이번 생성에 사용됩니다. 생성 후 일정과 미션을 검토·수정해주세요.</span>
        </label>

        <Banner variant="info">
          <p className={styles.infoTitle}>회사 업무에 맞는 온보딩 초안을 만듭니다</p>
          <ul className={styles.infoList}>
            <li>확인한 업종과 회사 소개, 담당 업무를 함께 반영해요</li>
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
