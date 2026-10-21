import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NFC_JOBS } from "../config/nfcJobs";

export default function useNfcKiosk() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("kiosk") === "1") localStorage.setItem("nfcKiosk", "1");
        if (params.get("kiosk") === "0") localStorage.removeItem("nfcKiosk");
        if (localStorage.getItem("nfcKiosk") !== "1") return; // 일반 사용자는 동작 안 함

        let ws;
        let timer;
        let closed = false;

        const connect = () => {
            ws = new WebSocket("ws://127.0.0.1:8765");
            ws.onmessage = (e) => {
                const { uid } = JSON.parse(e.data);
                const jobId = NFC_JOBS[uid];
                if (jobId) navigate(`/student/explore/${jobId}`);
                else console.warn("등록되지 않은 카드:", uid);
            };
            ws.onclose = () => {
                if (!closed) timer = setTimeout(connect, 1000);
            };
        };
        connect();

        return () => {
            closed = true;
            clearTimeout(timer);
            ws?.close();
        };
    }, [navigate]);
}