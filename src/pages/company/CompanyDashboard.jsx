import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import { dashboardMock } from "../../mock/company.js";
import Banner from "../../components/Banner/Banner.jsx";
import StatCard from "../../components/StatCard/StatCard.jsx";
import ActionCard from "../../components/ActionCard/ActionCard.jsx";
import styles from "./CompanyDashboard.module.css";

const QUICK_ACTIONS = [
  { icon: "📋", label: "온보딩 관리", path: "/company/onboarding-list" },
  { icon: "👥", label: "학생 현황", path: "/company/students" },
  { icon: "✉️", label: "학생 이메일 등록", path: "/company/register-students" },
  { icon: "➕", label: "새 온보딩 생성", path: "/company/onboarding-setup" },
];

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const companyId = getCurrentCompanyId();
      try {
        const [{ students }, profile] = await Promise.all([
          api.listEnrolledStudents(companyId),
          api.getCompanyProfile(companyId),
        ]);

        let activeOnboardings = 0;
        try {
          await api.getOnboarding(companyId);
          activeOnboardings = 1;
        } catch (err) {
          if (err.code !== "NOT_FOUND") throw err;
        }

        const missionCompletionRate = students.length
          ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
          : 0;

        if (cancelled) return;
        setDashboard({
          companyName: profile.companyName,
          registeredStudents: students.length,
          missionCompletionRate,
          activeOnboardings,
        });
        setIsMock(false);
      } catch (error) {
        console.error("대시보드 API 연동 실패, mock으로 폴백합니다:", error);
        if (cancelled) return;
        setDashboard(dashboardMock);
        setIsMock(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || !dashboard) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>불러오는 중...</div>
      </div>
    );
  }

  const { companyName, registeredStudents, missionCompletionRate, activeOnboardings } = dashboard;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{companyName} 관리자 대시보드</h1>

        {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

        <div className={styles.statList}>
          <StatCard label="등록된 학생 수" value={`${registeredStudents}명`} />
          <StatCard label="미션 완료율 (평균)" value={`${missionCompletionRate}%`} />
          <StatCard label="활성 온보딩 수" value={`${activeOnboardings}건`} />
        </div>

        <div className={styles.actionGrid}>
          {QUICK_ACTIONS.map((action) => (
            <ActionCard
              key={action.path}
              compact
              icon={action.icon}
              title={action.label}
              onClick={() => navigate(action.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
