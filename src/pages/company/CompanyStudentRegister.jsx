import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getCurrentCompanyId } from "../../lib/auth.js";
import styles from "./CompanyStudentRegister.module.css";

export default function CompanyStudentRegister() {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState("");
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    const emails = emailInput
      .split("\n")
      .map((email) => email.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    setIsSubmitting(true);
    try {
      const companyId = getCurrentCompanyId();
      const data = await api.registerStudentsByEmail(companyId, emails);
      setResult({ success: data.success, failed: data.failed, failedEmails: data.failedEmails ?? [] });
    } catch (error) {
      console.error("학생 등록 API 실패:", error);
      setResult({ success: 0, failed: emails.length, failedEmails: emails });
    } finally {
      setIsSubmitting(false);
    }
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
          있습니다. (미리보딩에 학생으로 가입된 이메일만 등록됩니다)
        </p>

        <textarea
          className={styles.emailInput}
          placeholder={"student1@school.ac.kr\nstudent2@school.ac.kr"}
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
        />

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
            disabled={isSubmitting}
          >
            {isSubmitting ? "등록 중..." : "등록하기"}
          </button>
        </div>

        {result && (
          <div className={styles.resultBox}>
            성공 {result.success}건 / 실패 {result.failed}건
            {result.failedEmails.length > 0 && (
              <p className={styles.failedList}>
                실패: {result.failedEmails.join(", ")} (가입되지 않은 이메일일 수 있어요)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
