import { useNavigate } from "react-router-dom";
import { studentListMock } from "../../mock/company.js";
import styles from "./CompanyStudentList.module.css";

export default function CompanyStudentList() {
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
          <h1 className={styles.title}>학생 현황</h1>
        </div>

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
            {studentListMock.map((student) => (
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
      </div>
    </div>
  );
}
