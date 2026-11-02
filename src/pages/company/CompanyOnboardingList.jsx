import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import Button from "../../components/Button/Button.jsx";
import ActionCard from "../../components/ActionCard/ActionCard.jsx";
import Badge from "../../components/Badge/Badge.jsx";
import styles from "./CompanyOnboardingList.module.css";

export default function CompanyOnboardingList() {
  const navigate = useNavigate();
  const companyId = getCurrentCompanyId();
  const [versions, setVersions] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { versions } = await api.listOnboardingVersions(companyId);
        if (cancelled) return;
        setVersions(versions);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error.message || "온보딩 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="outline" size="sm" onClick={() => navigate("/company/home")}>
            ← 뒤로가기
          </Button>
          <h1 className={styles.title}>온보딩 목록</h1>
        </div>

        <Button variant="primary" onClick={() => navigate("/company/onboarding-setup")}>
          + 새 온보딩 생성
        </Button>

        <div className={styles.cardList}>
          {isLoading ? (
            <p>불러오는 중...</p>
          ) : loadError ? (
            <p role="alert">{loadError}</p>
          ) : !versions.length ? (
            <p className={styles.emptyText}>아직 생성된 온보딩이 없어요.</p>
          ) : (
            versions.map((version) => <ActionCard
              key={version.id}
              title={version.job_title}
              badge={<Badge tone={version.status === "draft" ? "warning" : "success"}>{version.status === "draft" ? "초안" : "배포됨"}</Badge>}
              meta={`생성 ${new Date(version.created_at).toLocaleString('ko-KR')}`}
              onClick={() => navigate(`/company/onboarding-edit/${companyId}?versionId=${version.id}`)}
            />)
          )}
        </div>
      </div>
    </div>
  );
}
