import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CompanyStudentRegister.module.css";

export default function CompanyStudentRegister() {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState("");
  const [result, setResult] = useState(null);

  function handleRegister() {
    const emails = emailInput
      .split("\n")
      .map((email) => email.trim())
      .filter(Boolean);

    // TODO: API 연결 시 여기서 POST 요청, 지금은 임시로 전부 성공 처리
    setResult({ success: emails.length, failed: 0 });
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/company/home")}
        >
          ← 뒤로가기
        </button>

        <h1 className={styles.title}>학생 이메일 등록</h1>
        <p className={styles.desc}>
          일괄로 학생 이메일을 등록하면 학생들이 자동으로 온보딩을 시작할 수
          있습니다.
        </p>

        <textarea
          className={styles.emailInput}
          placeholder={"student1@school.ac.kr\nstudent2@school.ac.kr"}
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
        />

        <p className={styles.tip}>
          💡 팁: 엑셀 파일의 이메일 열을 모두 선택 → 복사 → 붙이기
        </p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate("/company/home")}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.registerButton}
            onClick={handleRegister}
          >
            등록하기
          </button>
        </div>

        {result && (
          <div className={styles.resultBox}>
            성공 {result.success}건 / 실패 {result.failed}건
          </div>
        )}
      </div>
    </div>
  );
}
