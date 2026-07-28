import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import { getStudentById } from "../../mock/company.js";
import Banner from "../../components/Banner/Banner.jsx";
import Button from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import ProgressBar from "../../components/ProgressBar/ProgressBar.jsx";
import styles from "./CompanyStudentDetail.module.css";

export default function CompanyStudentDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [sendingId, setSendingId] = useState(null);
  const [targetDateDraft, setTargetDateDraft] = useState("");
  const [isSavingTargetDate, setIsSavingTargetDate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const companyId = getCurrentCompanyId();
      try {
        const data = await api.getStudentDetail(companyId, studentId);
        if (cancelled) return;
        setStudent(data);
        setTargetDateDraft(data.targetDate ?? "");
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

  async function handleSaveTargetDate() {
    if (isMock) {
      alert("저장되었습니다. (mock)");
      return;
    }

    setIsSavingTargetDate(true);
    try {
      const companyId = getCurrentCompanyId();
      await api.updateStudentTargetDate(companyId, studentId, targetDateDraft || null);
      setStudent((prev) => ({ ...prev, targetDate: targetDateDraft || null }));
    } catch (error) {
      alert(error.message ?? "실습 시작일 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingTargetDate(false);
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
          <Button variant="outline" size="sm" onClick={() => navigate("/company/students")}>
            ← 뒤로가기
          </Button>
          <p>학생 정보를 찾을 수 없어요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Button variant="outline" size="sm" onClick={() => navigate("/company/students")}>
          ← 뒤로가기
        </Button>

        {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

        <div className={styles.profileCard}>
          <h1 className={styles.name}>{student.name}</h1>
          <p className={styles.email}>{student.email}</p>
          <ProgressBar value={student.progress} valueLabel={`온보딩 진도 ${student.progress}%`} />

          <div className={styles.targetDateRow}>
            <Input
              label="실습 시작일"
              id="targetDate"
              type="date"
              value={targetDateDraft}
              onChange={(e) => setTargetDateDraft(e.target.value)}
            />
            <Button size="sm" disabled={isSavingTargetDate} onClick={handleSaveTargetDate} className={styles.saveButton}>
              {isSavingTargetDate ? "저장 중..." : "저장"}
            </Button>
          </div>
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
                  {mission.content && <p className={styles.missionContent}>{mission.content}</p>}

                  {!isMock &&
                    mission.submissionId &&
                    (mission.feedback ? (
                      <p className={styles.existingFeedback}>💬 {mission.feedback}</p>
                    ) : (
                      <div className={styles.feedbackRow}>
                        <Input
                          multiline
                          rows={2}
                          placeholder="이 미션에 대한 피드백을 입력하세요"
                          value={feedbackDrafts[mission.submissionId] ?? ""}
                          onChange={(e) =>
                            setFeedbackDrafts((prev) => ({
                              ...prev,
                              [mission.submissionId]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          className={styles.sendButton}
                          disabled={sendingId === mission.submissionId}
                          onClick={() => handleSendFeedback(mission.submissionId)}
                        >
                          {sendingId === mission.submissionId ? "전송 중..." : "피드백 전송"}
                        </Button>
                      </div>
                    ))}
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
