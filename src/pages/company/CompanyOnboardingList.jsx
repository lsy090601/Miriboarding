import { useNavigate } from "react-router-dom";
import { onboardingListMock } from "../../mock/company.js";
import styles from "./CompanyOnboardingList.module.css";

export default function CompanyOnboardingList() {
  const navigate = useNavigate();

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
          {onboardingListMock.map((item) => (
            <button
              key={item.companyId}
              type="button"
              className={styles.card}
              onClick={() =>
                navigate(`/company/onboarding-edit/${item.companyId}`)
              }
            >
              <span className={styles.jobTitle}>{item.jobTitle}</span>
              <span className={styles.status}>{item.status}</span>
              <span className={styles.enrolled}>
                등록 학생 {item.enrolledCount}명
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
