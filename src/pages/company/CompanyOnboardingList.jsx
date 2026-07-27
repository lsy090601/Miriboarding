import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import styles from "./CompanyOnboardingList.module.css";

export default function CompanyOnboardingList() {
  const navigate = useNavigate();
  const companyId = getCurrentCompanyId();
  const [onboarding, setOnboarding] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [data, { students }] = await Promise.all([
          api.getOnboarding(companyId),
          api.listEnrolledStudents(companyId),
        ]);
        if (cancelled) return;
        setOnboarding({ jobTitle: data.jobTitle, enrolledCount: students.length });
      } catch (error) {
        if (error.code !== "NOT_FOUND") console.error("온보딩 목록 조회 실패:", error);
        if (cancelled) return;
        setOnboarding(null);
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
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/company/home")}
          >
            ← 뒤로가기
          </button>
          <h1 className={styles.title}>온보딩 목록</h1>
        </div>

        <button
          type="button"
          className={styles.createButton}
          onClick={() => navigate("/company/onboarding-setup")}
        >
          + 새 온보딩 생성
        </button>

        <div className={styles.cardList}>
          {isLoading ? (
            <p>불러오는 중...</p>
          ) : !onboarding ? (
            <p className={styles.emptyText}>아직 생성된 온보딩이 없어요.</p>
          ) : (
            <button
              type="button"
              className={styles.card}
              onClick={() => navigate(`/company/onboarding-edit/${companyId}`)}
            >
              <span className={styles.jobTitle}>{onboarding.jobTitle}</span>
              <span className={styles.status}>진행 중</span>
              <span className={styles.enrolled}>
                등록 학생 {onboarding.enrolledCount}명
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
