import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as api from "../../lib/api.js";
import { getOnboardingDetail } from "../../mock/company.js";
import Banner from "../../components/Banner/Banner.jsx";
import Button from "../../components/Button/Button.jsx";
import Input from "../../components/Input/Input.jsx";
import Select from "../../components/Select/Select.jsx";
import Tabs from "../../components/Tabs/Tabs.jsx";
import styles from "./CompanyOnboardingEdit.module.css";

const TABS = [
  { key: "day", label: "하루" },
  { key: "week", label: "1주" },
  { key: "month", label: "1달" },
  { key: "mission", label: "미션" },
];

const IMPORTANCE_OPTIONS = ["낮음", "중간", "높음"];
const IMPORTANCE_VALUE_TO_LABEL = { low: "낮음", medium: "중간", high: "높음" };
const IMPORTANCE_LABEL_TO_VALUE = { 낮음: "low", 중간: "medium", 높음: "high" };

const SUBMISSION_TYPE_OPTIONS = ["텍스트 제출", "파일 제출", "선택지 제출"];
const SUBMISSION_VALUE_TO_LABEL = { text: "텍스트 제출", file: "파일 제출", choice: "선택지 제출" };
const SUBMISSION_LABEL_TO_VALUE = { "텍스트 제출": "text", "파일 제출": "file", "선택지 제출": "choice" };

const EMPTY_SCHEDULES = { day: [], week: [], month: [] };

function toEditableSchedule(rawItems, period) {
  return (rawItems ?? []).map((item, index) => ({
    id: `${period}-${index}`,
    time: item.time ?? "",
    day: item.time ?? "",
    activity: item.activity ?? "",
    importance: item.importance ?? "medium",
    terms: "",
  }));
}

function toApiScheduleItems(items, period) {
  return items.map((item) => ({
    time: period === "day" ? (item.time ?? "") : (item.day ?? ""),
    activity: item.activity ?? "",
    importance: item.importance ?? "medium",
  }));
}

export default function CompanyOnboardingEdit() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [detail, setDetail] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("day");
  const [schedules, setSchedules] = useState(EMPTY_SCHEDULES);
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getOnboarding(companyId);
        if (cancelled) return;
        setDetail({ companyName: data.companyName, jobTitle: data.jobTitle });
        setSchedules({
          day: toEditableSchedule(data.schedules?.day, "day"),
          week: toEditableSchedule(data.schedules?.week, "week"),
          month: toEditableSchedule(data.schedules?.month, "month"),
        });
        setMissions(data.missions ?? []);
        setIsMock(false);
      } catch (error) {
        console.error("온보딩 상세 API 연동 실패, mock으로 폴백합니다:", error);
        if (cancelled) return;
        const mockDetail = getOnboardingDetail(companyId);
        setDetail(mockDetail);
        setSchedules(mockDetail?.schedules ?? EMPTY_SCHEDULES);
        setMissions(mockDetail?.missions ?? []);
        setIsMock(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  function updateScheduleField(period, id, field, value) {
    setSchedules((prev) => ({
      ...prev,
      [period]: prev[period].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
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
    setMissions((prev) => prev.map((mission) => (mission.id === id ? { ...mission, [field]: value } : mission)));
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

  async function handleSave() {
    if (isMock) {
      alert("저장되었습니다. (mock)");
      navigate("/company/onboarding-list");
      return;
    }

    setIsSaving(true);
    try {
      await api.updateOnboarding(companyId, {
        schedules: {
          day: toApiScheduleItems(schedules.day, "day"),
          week: toApiScheduleItems(schedules.week, "week"),
          month: toApiScheduleItems(schedules.month, "month"),
        },
        missions,
      });
      navigate("/company/onboarding-list");
    } catch (error) {
      alert(error.message ?? "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={styles.page}>
        <p>온보딩 정보를 찾을 수 없어요. (임시 데이터라 등록된 companyId만 조회돼요)</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/company/onboarding-list")}>
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Button variant="outline" size="sm" onClick={() => navigate("/company/onboarding-list")}>
          ← 뒤로가기
        </Button>
        <h1 className={styles.title}>
          {detail.companyName} · {detail.jobTitle} 온보딩 수정
        </h1>

        {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

        <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab !== "mission" && (
          <div className={styles.scheduleSection}>
            {schedules[activeTab].map((item) => (
              <div key={item.id} className={styles.scheduleRow}>
                <Input
                  placeholder={activeTab === "day" ? "시간 (예: 10:00~11:00)" : "요일/일차"}
                  value={activeTab === "day" ? (item.time ?? "") : (item.day ?? "")}
                  onChange={(e) =>
                    updateScheduleField(activeTab, item.id, activeTab === "day" ? "time" : "day", e.target.value)
                  }
                />
                <Input
                  placeholder="활동 내용"
                  value={item.activity ?? ""}
                  onChange={(e) => updateScheduleField(activeTab, item.id, "activity", e.target.value)}
                />
                <Select
                  value={IMPORTANCE_VALUE_TO_LABEL[item.importance ?? "medium"]}
                  onChange={(e) =>
                    updateScheduleField(activeTab, item.id, "importance", IMPORTANCE_LABEL_TO_VALUE[e.target.value])
                  }
                  options={IMPORTANCE_OPTIONS}
                  placeholder="중요도"
                />
                <Input
                  placeholder="관련 용어 (쉼표로 구분)"
                  value={item.terms ?? ""}
                  onChange={(e) => updateScheduleField(activeTab, item.id, "terms", e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className={styles.deleteButton}
                  onClick={() => removeScheduleItem(activeTab, item.id)}
                >
                  삭제
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addScheduleItem(activeTab)}>
              + 항목 추가
            </Button>
          </div>
        )}

        {activeTab === "mission" && (
          <div className={styles.missionSection}>
            {missions.map((mission) => (
              <div key={mission.id} className={styles.missionCard}>
                <Input
                  label="미션 제목"
                  placeholder="미션 제목"
                  value={mission.title ?? ""}
                  onChange={(e) => updateMissionField(mission.id, "title", e.target.value)}
                />
                <Input
                  multiline
                  rows={3}
                  label="미션 설명"
                  placeholder="미션 설명"
                  value={mission.description ?? ""}
                  onChange={(e) => updateMissionField(mission.id, "description", e.target.value)}
                />
                <div className={styles.missionCardFooter}>
                  <Select
                    label="제출 유형"
                    value={SUBMISSION_VALUE_TO_LABEL[mission.submissionType ?? "text"]}
                    onChange={(e) =>
                      updateMissionField(mission.id, "submissionType", SUBMISSION_LABEL_TO_VALUE[e.target.value])
                    }
                    options={SUBMISSION_TYPE_OPTIONS}
                    placeholder="제출 유형"
                  />
                  <Button variant="outline" size="sm" className={styles.deleteButton} onClick={() => removeMission(mission.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addMission}>
              + 새 미션 추가
            </Button>
          </div>
        )}

        <div className={styles.footerButtons}>
          <Button variant="outline" onClick={() => navigate("/company/onboarding-list")}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
