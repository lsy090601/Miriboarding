import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import { studentListMock } from "../../mock/company.js";
import { formatDate } from "../../mock/onboarding.js";
import FallbackBanner from "../../components/FallbackBanner/FallbackBanner.jsx";
import styles from "./CompanyStudentList.module.css";

export default function CompanyStudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [isMock, setIsMock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
            lastAccess: formatDate(student.lastAccess),
          })),
        );
        setIsMock(false);
      } catch (error) {
        console.error("학생 목록 API 연동 실패, mock으로 폴백합니다:", error);
        if (cancelled) return;
        setStudents(studentListMock);
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
          <h1 className={styles.title}>학생 현황</h1>
        </div>

        {isMock && <FallbackBanner />}

        {isLoading ? (
          <p>불러오는 중...</p>
        ) : students.length === 0 ? (
          <p>아직 등록된 학생이 없어요.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>온보딩 진도</th>
                <th>미션 완료</th>
                <th>최근 접속일</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className={styles.row}
                  onClick={() => navigate(`/company/students/${student.id}`)}
                >
                  <td>{student.name}</td>
                  <td>
                    <div className={styles.progressBarWrap}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {student.progress}%
                    </span>
                  </td>
                  <td>{student.missions}</td>
                  <td>{student.lastAccess}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
