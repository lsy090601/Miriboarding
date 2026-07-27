import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOnboardingDetail } from "../../mock/company.js";
import styles from "./CompanyOnboardingEdit.module.css";

const TABS = [
  { key: "day", label: "하루" },
  { key: "week", label: "1주" },
  { key: "month", label: "1달" },
  { key: "mission", label: "미션" },
];

const IMPORTANCE_OPTIONS = [
  { value: "low", label: "낮음" },
  { value: "medium", label: "중간" },
  { value: "high", label: "높음" },
];

export default function CompanyOnboardingEdit() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const detail = getOnboardingDetail(companyId);

  const [activeTab, setActiveTab] = useState("day");
  const [schedules, setSchedules] = useState(
    detail?.schedules ?? { day: [], week: [], month: [] },
  );
  const [missions, setMissions] = useState(detail?.missions ?? []);

  function updateScheduleField(period, id, field, value) {
    setSchedules((prev) => ({
      ...prev,
      [period]: prev[period].map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addScheduleItem(period) {
    const newItem = {
      id: `${period}-${Date.now()}`,
      time: "",
      day: "",
      activity: "",
      importance: "medium",
      terms: "",
    };
    setSchedules((prev) => ({ ...prev, [period]: [...prev[period], newItem] }));
  }

  function removeScheduleItem(period, id) {
    setSchedules((prev) => ({
      ...prev,
      [period]: prev[period].filter((item) => item.id !== id),
    }));
  }

  function updateMissionField(id, field, value) {
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === id ? { ...mission, [field]: value } : mission,
      ),
    );
  }

  function addMission() {
    setMissions((prev) => [
      ...prev,
      {
        id: `ms-${Date.now()}`,
        title: "",
        description: "",
        submissionType: "text",
      },
    ]);
  }

  function removeMission(id) {
    setMissions((prev) => prev.filter((mission) => mission.id !== id));
  }

  function handleSave() {
    // TODO: API 연결 시 PUT /api/onboarding/:companyId 호출
    alert("저장되었습니다. (임시)");
    navigate("/company/onboarding-list");
  }

  if (!detail) {
    return (
      <div className={styles.page}>
        <p>
          온보딩 정보를 찾을 수 없어요. (임시 데이터라 등록된 companyId만
          조회돼요)
        </p>
        <button
          type="button"
          onClick={() => navigate("/company/onboarding-list")}
        >
          목록으로
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/company/onboarding-list")}
        >
          ← 뒤로가기
        </button>
        <h1 className={styles.title}>
          {detail.companyName} · {detail.jobTitle} 온보딩 수정
        </h1>

        <div className={styles.tabRow}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "mission" && (
          <div className={styles.scheduleSection}>
            {schedules[activeTab].map((item) => (
              <div key={item.id} className={styles.scheduleRow}>
                <input
                  className={styles.smallInput}
                  placeholder={
                    activeTab === "day" ? "시간 (예: 10:00~11:00)" : "요일/일차"
                  }
                  value={
                    activeTab === "day" ? (item.time ?? "") : (item.day ?? "")
                  }
                  onChange={(e) =>
                    updateScheduleField(
                      activeTab,
                      item.id,
                      activeTab === "day" ? "time" : "day",
                      e.target.value,
                    )
                  }
                />
                <input
                  className={styles.input}
                  placeholder="활동 내용"
                  value={item.activity ?? ""}
                  onChange={(e) =>
                    updateScheduleField(
                      activeTab,
                      item.id,
                      "activity",
                      e.target.value,
                    )
                  }
                />
                <select
                  className={styles.smallInput}
                  value={item.importance ?? "medium"}
                  onChange={(e) =>
                    updateScheduleField(
                      activeTab,
                      item.id,
                      "importance",
                      e.target.value,
                    )
                  }
                >
                  {IMPORTANCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  placeholder="관련 용어 (쉼표로 구분)"
                  value={item.terms ?? ""}
                  onChange={(e) =>
                    updateScheduleField(
                      activeTab,
                      item.id,
                      "terms",
                      e.target.value,
                    )
                  }
                />
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => removeScheduleItem(activeTab, item.id)}
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={() => addScheduleItem(activeTab)}
            >
              + 항목 추가
            </button>
          </div>
        )}

        {activeTab === "mission" && (
          <div className={styles.missionSection}>
            {missions.map((mission) => (
              <div key={mission.id} className={styles.missionCard}>
                <input
                  className={styles.input}
                  placeholder="미션 제목"
                  value={mission.title ?? ""}
                  onChange={(e) =>
                    updateMissionField(mission.id, "title", e.target.value)
                  }
                />
                <textarea
                  className={styles.textarea}
                  placeholder="미션 설명"
                  value={mission.description ?? ""}
                  onChange={(e) =>
                    updateMissionField(
                      mission.id,
                      "description",
                      e.target.value,
                    )
                  }
                />
                <select
                  className={styles.smallInput}
                  value={mission.submissionType ?? "text"}
                  onChange={(e) =>
                    updateMissionField(
                      mission.id,
                      "submissionType",
                      e.target.value,
                    )
                  }
                >
                  <option value="text">텍스트 제출</option>
                  <option value="file">파일 제출</option>
                  <option value="choice">선택지 제출</option>
                </select>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => removeMission(mission.id)}
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={addMission}
            >
              + 새 미션 추가
            </button>
          </div>
        )}

        <div className={styles.footerButtons}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate("/company/onboarding-list")}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
