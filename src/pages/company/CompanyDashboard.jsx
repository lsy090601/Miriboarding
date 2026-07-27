import { useNavigate } from "react-router-dom";
import { dashboardMock } from "../../mock/company.js";
import styles from "./CompanyDashboard.module.css";

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const {
    companyName,
    registeredStudents,
    missionCompletionRate,
    activeOnboardings,
  } = dashboardMock;

  const quickActions = [
    { icon: "📋", label: "온보딩 관리", path: "/company/onboarding-list" },
    { icon: "👥", label: "학생 현황", path: "/company/students" },
    {
      icon: "✉️",
      label: "학생 이메일 등록",
      path: "/company/register-students",
    },
    { icon: "➕", label: "새 온보딩 생성", path: "/company/onboarding-setup" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{companyName} 관리자 대시보드</h1>

        <div className={styles.statList}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>등록된 학생 수</span>
            <span className={styles.statValue}>{registeredStudents}명</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>미션 완료율 (평균)</span>
            <span className={styles.statValue}>{missionCompletionRate}%</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>활성 온보딩 수</span>
            <span className={styles.statValue}>{activeOnboardings}건</span>
          </div>
        </div>

        <div className={styles.actionGrid}>
          {quickActions.map((action) => (
            <button
              key={action.path}
              type="button"
              className={styles.actionCard}
              onClick={() => navigate(action.path)}
            >
              <span className={styles.actionIcon}>{action.icon}</span>
              <span className={styles.actionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
