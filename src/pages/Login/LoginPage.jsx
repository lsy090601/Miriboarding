import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import Input from "../../components/Input/Input.jsx";
import Button from "../../components/Button/Button.jsx";
import Checkbox from "../../components/Checkbox/Checkbox.jsx";
import { MailIcon, LockIcon } from "../../components/icons/Icons.jsx";
import { isValidEmail, isRequired } from "../../utils/validation.js";
import * as api from "../../lib/api.js";
import { setStoredAuth } from "../../lib/auth.js";
import { supabase } from "../../lib/supabaseClient.js";
import styles from "./LoginPage.module.css";

const FEATURES = [
  "직무별 하루 · 일주일 · 한 달 일정 미리보기",
  "회사 맞춤 용어와 업무 흐름 사전 학습",
  "실습 전까지의 미션과 진도 관리",
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyNotice, setCompanyNotice] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("idle");
  const [forgotError, setForgotError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (!isRequired(form.email)) nextErrors.email = "이메일을 입력해주세요.";
    else if (!isValidEmail(form.email))
      nextErrors.email = "올바른 이메일 형식이 아닙니다.";
    if (!isRequired(form.password))
      nextErrors.password = "비밀번호를 입력해주세요.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setCompanyNotice(false);
    setIsSubmitting(true);
    try {
      const result = await api.login(form.email, form.password);
      setStoredAuth({
        userId: result.user_id,
        userType: result.user_type,
        accessToken: result.access_token,
      });

      if (result.user_type === "student") {
        navigate("/student/home");
      } else if (result.user_type === "company") {
        navigate("/company/home");
      } else {
        setCompanyNotice(true);
      }
    } catch (error) {
      setErrors({
        password: error.message ?? "로그인 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleForgotPassword() {
    setShowForgotPassword((prev) => !prev);
    setForgotStatus("idle");
    setForgotError("");
    setForgotEmail(form.email);
  }

  async function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      setForgotError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    setForgotStatus("sending");
    setForgotError("");
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setForgotStatus("idle");
      setForgotError(error.message ?? "재설정 링크 발송 중 오류가 발생했습니다.");
      return;
    }
    setForgotStatus("sent");
  }

  const brand = (
    <>
      <p className={styles.brandLogo}>미리보딩</p>
      <div className={styles.brandHeadline}>
        <p>취업 전에 미리 겪어보는</p>
        <p>나의 첫 회사 생활</p>
      </div>
      <p className={styles.brandSubcopy}>
        직무 체험부터 회사 맞춤 온보딩까지,
        <br />
        실습 전 4개월을 준비의 시간으로 바꿔보세요.
      </p>
      <div className={styles.brandSpacer} />
      <ul className={styles.featureList}>
        {FEATURES.map((feature) => (
          <li key={feature} className={styles.featureItem}>
            <span className={styles.featureDot}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <AuthLayout aside={brand}>
      <p className={styles.title}>로그인</p>
      <p className={styles.subtitle}>계정으로 로그인하고 온보딩을 이어가세요</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="이메일"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          icon={<MailIcon />}
          autoComplete="email"
        />
        <Input
          label="비밀번호"
          name="password"
          type="password"
          placeholder="8자 이상 입력해주세요"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          icon={<LockIcon />}
          autoComplete="current-password"
        />

        <div className={styles.meta}>
          <Checkbox id="keep-logged-in" checked={keepLoggedIn} onChange={() => setKeepLoggedIn((prev) => !prev)}>
            로그인 상태 유지
          </Checkbox>
          <button type="button" className={styles.forgotLink} onClick={handleToggleForgotPassword}>
            비밀번호를 잊으셨나요?
          </button>
        </div>

        {showForgotPassword && (
          <div className={styles.forgotBox}>
            {forgotStatus === "sent" ? (
              <p className={styles.forgotSent}>
                {forgotEmail}로 재설정 링크를 보냈어요. 메일함을 확인해주세요.
              </p>
            ) : (
              <div className={styles.forgotForm}>
                <Input
                  label="가입한 이메일"
                  name="forgotEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  error={forgotError}
                  icon={<MailIcon />}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={forgotStatus === "sending"}
                  onClick={handleForgotPasswordSubmit}
                >
                  {forgotStatus === "sending" ? "발송 중..." : "재설정 링크 보내기"}
                </Button>
              </div>
            )}
          </div>
        )}

        {companyNotice && (
          <p className={styles.notice}>기업 계정 대시보드는 아직 준비 중이에요.</p>
        )}

        <Button type="submit" variant="primary" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>

        <p className={styles.footer}>
          아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
