import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentById } from "../../mock/company.js";
import styles from "./CompanyStudentDetail.module.css";

export default function CompanyStudentDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const student = getStudentById(studentId);
  const [feedback, setFeedback] = useState("");

  if (!student) {
    return (
      <div className={styles.page}>
        <p>학생 정보를 찾을 수 없어요.</p>
      </div>
    );
  }

  function handleSendFeedback() {
    // TODO: API 연결 시 여기서 POST 요청
    alert("피드백이 전송되었습니다. (임시)");
    setFeedback("");
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/company/students")}
        >
          ← 뒤로가기
        </button>

        <div className={styles.profileCard}>
          <h1 className={styles.name}>{student.name}</h1>
          <p className={styles.email}>{student.email}</p>
          <div className={styles.progressBarWrap}>
            <div
              className={styles.progressBar}
              style={{ width: `${student.progress}%` }}
            />
          </div>
          <span className={styles.progressText}>
            온보딩 진도 {student.progress}%
          </span>
        </div>

        <div className={styles.missionSection}>
          <h2 className={styles.sectionTitle}>완료한 미션</h2>
          {student.completedMissions.length === 0 ? (
            <p className={styles.emptyText}>아직 완료한 미션이 없어요.</p>
          ) : (
            <ul className={styles.missionList}>
              {student.completedMissions.map((mission) => (
                <li key={mission.id} className={styles.missionItemDone}>
                  ✅ {mission.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.missionSection}>
          <h2 className={styles.sectionTitle}>미완료 미션</h2>
          {student.incompletedMissions.length === 0 ? (
            <p className={styles.emptyText}>모든 미션을 완료했어요!</p>
          ) : (
            <ul className={styles.missionList}>
              {student.incompletedMissions.map((mission) => (
                <li key={mission.id} className={styles.missionItem}>
                  ⬜ {mission.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.feedbackSection}>
          <h2 className={styles.sectionTitle}>피드백 보내기</h2>
          <textarea
            className={styles.feedbackInput}
            placeholder="학생에게 전달할 피드백을 입력하세요"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button
            type="button"
            className={styles.sendButton}
            onClick={handleSendFeedback}
          >
            피드백 전송
          </button>
        </div>
      </div>
    </div>
  );
}
