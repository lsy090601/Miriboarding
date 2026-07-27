import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import Input from "../../components/Input/Input.jsx";
import Button from "../../components/Button/Button.jsx";
import { MailIcon, LockIcon } from "../../components/icons/Icons.jsx";
import { isValidEmail, isRequired } from "../../utils/validation.js";
import * as api from "../../lib/api.js";
import { setStoredAuth } from "../../lib/auth.js";
import { supabase } from "../../lib/supabaseClient.js";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyNotice, setCompanyNotice] = useState(false);

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

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          name="email"
          type="email"
          placeholder="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          icon={<MailIcon />}
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          placeholder="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          icon={<LockIcon />}
          autoComplete="current-password"
        />
        {companyNotice && (
          <p className={styles.notice}>
            기업 계정 대시보드는 아직 준비 중이에요.
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className={styles.submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "logging in..." : "log in"}
        </Button>
        <Link to="/signup" className={styles.link}>
          create an account
        </Link>
        <button
          type="button"
          className={styles.forgotLink}
          onClick={handleToggleForgotPassword}
        >
          비밀번호를 잊으셨나요?
        </button>

        {showForgotPassword && (
          <div className={styles.forgotBox}>
            {forgotStatus === "sent" ? (
              <p className={styles.forgotSent}>
                {forgotEmail}로 재설정 링크를 보냈어요. 메일함을 확인해주세요.
              </p>
            ) : (
              <div className={styles.forgotForm}>
                <Input
                  name="forgotEmail"
                  type="email"
                  placeholder="가입한 이메일을 입력해주세요"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  error={forgotError}
                  icon={<MailIcon />}
                />
                <Button
                  type="button"
                  variant="outline"
                  className={styles.forgotSubmit}
                  disabled={forgotStatus === "sending"}
                  onClick={handleForgotPasswordSubmit}
                >
                  {forgotStatus === "sending" ? "발송 중..." : "재설정 링크 보내기"}
                </Button>
              </div>
            )}
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
