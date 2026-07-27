import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import { getStudentById } from "../../mock/company.js";
import FallbackBanner from "../../components/FallbackBanner/FallbackBanner.jsx";
import styles from "./CompanyStudentDetail.module.css";

export default function CompanyStudentDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const companyId = getCurrentCompanyId();
      try {
        const data = await api.getStudentDetail(companyId, studentId);
        if (cancelled) return;
        setStudent(data);
        setIsMock(false);
      } catch (error) {
        console.error("학생 상세 API 연동 실패, mock으로 폴백합니다:", error);
        if (cancelled) return;
        setStudent(getStudentById(studentId));
        setIsMock(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function handleSendFeedback(submissionId) {
    const feedback = (feedbackDrafts[submissionId] ?? "").trim();
    if (!feedback) return;

    if (isMock) {
      alert("피드백이 전송되었습니다. (mock)");
      setFeedbackDrafts((prev) => ({ ...prev, [submissionId]: "" }));
      return;
    }

    setSendingId(submissionId);
    try {
      await api.sendMissionFeedback(submissionId, feedback);
      setStudent((prev) => ({
        ...prev,
        completedMissions: prev.completedMissions.map((mission) =>
          mission.submissionId === submissionId ? { ...mission, feedback } : mission,
        ),
      }));
      setFeedbackDrafts((prev) => ({ ...prev, [submissionId]: "" }));
    } catch (error) {
      alert(error.message ?? "피드백 전송 중 오류가 발생했습니다.");
    } finally {
      setSendingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>불러오는 중...</div>
      </div>
    );
  }

  if (!student) {
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
          <p>학생 정보를 찾을 수 없어요.</p>
        </div>
      </div>
    );
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

        {isMock && <FallbackBanner />}

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
                <li key={mission.id} className={styles.missionCard}>
                  <p className={styles.missionItemDone}>✅ {mission.title}</p>
                  {mission.content && (
                    <p className={styles.missionContent}>{mission.content}</p>
                  )}

                  {!isMock && mission.submissionId && (
                    mission.feedback ? (
                      <p className={styles.existingFeedback}>💬 {mission.feedback}</p>
                    ) : (
                      <div className={styles.feedbackRow}>
                        <textarea
                          className={styles.feedbackInput}
                          placeholder="이 미션에 대한 피드백을 입력하세요"
                          value={feedbackDrafts[mission.submissionId] ?? ""}
                          onChange={(e) =>
                            setFeedbackDrafts((prev) => ({
                              ...prev,
                              [mission.submissionId]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className={styles.sendButton}
                          disabled={sendingId === mission.submissionId}
                          onClick={() => handleSendFeedback(mission.submissionId)}
                        >
                          {sendingId === mission.submissionId ? "전송 중..." : "피드백 전송"}
                        </button>
                      </div>
                    )
                  )}
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
      </div>
    </div>
  );
}
