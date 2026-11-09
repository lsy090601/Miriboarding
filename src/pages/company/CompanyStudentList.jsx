import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import Banner from "../../components/Banner/Banner.jsx";
import Button from "../../components/Button/Button.jsx";
import ProgressBar from "../../components/ProgressBar/ProgressBar.jsx";
import styles from "./CompanyStudentList.module.css";

export default function CompanyStudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const companyId = getCurrentCompanyId();
      try {
        const { students: realStudents } = await api.listEnrolledStudents(companyId);
        if (cancelled) return;
        setStudents(
          realStudents.map((student) => ({
            id: student.studentId,
            name: student.name,
            progress: student.progress,
            missions: `${student.completedCount}/${student.totalMissions}`,
            lastAccess: student.lastAccess ? new Date(student.lastAccess).toLocaleString('ko-KR') : '접속 기록 없음',
          })),
        );
      } catch (error) {
        if (cancelled) return;
        setLoadError(error.message || "학생 현황을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(e, studentId, studentName) {
    e.stopPropagation();
    if (!window.confirm(`${studentName} 학생을 삭제할까요? 진행 상황과 제출 내역도 함께 삭제됩니다.`)) {
      return;
    }


    setDeletingId(studentId);
    try {
      const companyId = getCurrentCompanyId();
      await api.removeStudent(companyId, studentId);
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
    } catch (error) {
      alert(error.message ?? "학생 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="outline" size="sm" onClick={() => navigate("/company/home")}>
            ← 뒤로가기
          </Button>
          <h1 className={styles.title}>학생 현황</h1>
          <Button variant="primary" onClick={() => navigate("/company/register-students")}>
            + 학생 등록하기
          </Button>
        </div>

        {loadError && <Banner variant="warning">{loadError}</Banner>}

        {isLoading ? (
          <p>불러오는 중...</p>
        ) : loadError ? null : students.length === 0 ? (
          <p>아직 등록된 학생이 없어요. 위의 학생 등록하기 버튼으로 가입한 학생을 등록해주세요.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>온보딩 진도</th>
                  <th>미션 완료</th>
                  <th>최근 접속일</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className={styles.row} onClick={() => navigate(`/company/students/${student.id}`)}>
                    <td>{student.name}</td>
                    <td>
                      <div className={styles.progressCell}>
                        <ProgressBar value={student.progress} />
                        <span className={styles.progressText}>{student.progress}%</span>
                      </div>
                    </td>
                    <td>{student.missions}</td>
                    <td>{student.lastAccess}</td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        className={styles.deleteButton}
                        disabled={deletingId === student.id}
                        onClick={(e) => handleDelete(e, student.id, student.name)}
                      >
                        {deletingId === student.id ? "삭제 중..." : "삭제"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
