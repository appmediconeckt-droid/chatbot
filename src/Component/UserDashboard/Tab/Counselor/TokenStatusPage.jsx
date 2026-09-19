import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import "./TokenStatusPage.css";

/**
 * TokenStatusPage
 * ----------------
 * Standalone page (NOT wired into CounselorTable.jsx — add its own tab
 * separately in the parent nav component that renders "All / Online / Nearby").
 *
 * Flow:
 *  1. Fetch the logged-in user's own appointments ("My Appointments").
 *  2. User picks one from the list.
 *  3. Page fetches + live-subscribes to that appointment's token status:
 *     - tokenNumber       -> the token the user was given
 *     - currentServingNo  -> which token number the doctor is on right now
 *     - waitingCount      -> how many tokens are still waiting
 *     - isEmergency       -> whether an emergency case has jumped the queue
 *
 * NOTE ON BACKEND CONTRACT (adjust to match your actual API/socket):
 *   GET  /api/appointments/my                       -> { appointments: [...] }
 *   GET  /api/appointments/:appointmentId/token      -> { token: {...} }
 *   socket event "token-update" with payload:
 *     { appointmentId, tokenNumber, currentServingNumber, waitingCount, isEmergency }
 *   If your real endpoints/events differ, just rename the strings below —
 *   the component structure itself doesn't need to change.
 */

const APPOINTMENTS_ENDPOINT = "/api/appointments/my";
const TOKEN_ENDPOINT = (appointmentId) => `/api/appointments/${appointmentId}/token`;
const TOKEN_SOCKET_EVENT = "token-update";

const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const TokenStatusPage = () => {
    const { t } = useUserTranslation();

    const [appointments, setAppointments] = useState([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [appointmentsError, setAppointmentsError] = useState("");

    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

    const [tokenData, setTokenData] = useState(null);
    const [isLoadingToken, setIsLoadingToken] = useState(false);
    const [tokenError, setTokenError] = useState("");

    // 1. Load "My Appointments"
    useEffect(() => {
        let isMounted = true;

        const fetchAppointments = async () => {
            try {
                setIsLoadingAppointments(true);
                const response = await axiosInstance.get(APPOINTMENTS_ENDPOINT);
                const list = response.data?.appointments || response.data?.data || [];
                if (isMounted) {
                    setAppointments(list);
                    setAppointmentsError("");
                }
            } catch (err) {
                console.error("Failed to fetch appointments:", err);
                if (isMounted) {
                    setAppointmentsError(
                        t("error_load_appointments") || "Could not load your appointments.",
                    );
                }
            } finally {
                if (isMounted) setIsLoadingAppointments(false);
            }
        };

        void fetchAppointments();
        return () => {
            isMounted = false;
        };
    }, [t]);

    // 2. Fetch token details whenever a different appointment is selected
    useEffect(() => {
        if (!selectedAppointmentId) {
            setTokenData(null);
            return;
        }

        let isMounted = true;

        const fetchToken = async () => {
            try {
                setIsLoadingToken(true);
                const response = await axiosInstance.get(
                    TOKEN_ENDPOINT(selectedAppointmentId),
                );
                const token = response.data?.token || response.data;
                if (isMounted) {
                    setTokenData(token);
                    setTokenError("");
                }
            } catch (err) {
                console.error("Failed to fetch token status:", err);
                if (isMounted) {
                    setTokenError(
                        t("error_load_token") || "Could not load token status.",
                    );
                    setTokenData(null);
                }
            } finally {
                if (isMounted) setIsLoadingToken(false);
            }
        };

        void fetchToken();
        return () => {
            isMounted = false;
        };
    }, [selectedAppointmentId, t]);

    // 3. Live updates over socket for the selected appointment's token
    useEffect(() => {
        if (!selectedAppointmentId) return undefined;

        let mounted = true;
        let activeSocket = null;

        const onTokenUpdate = (payload = {}) => {
            if (!mounted) return;
            if (String(payload.appointmentId) !== String(selectedAppointmentId)) return;
            setTokenData((prev) => ({
                ...prev,
                tokenNumber: payload.tokenNumber ?? prev?.tokenNumber,
                currentServingNumber:
                    payload.currentServingNumber ?? prev?.currentServingNumber,
                waitingCount: payload.waitingCount ?? prev?.waitingCount,
                isEmergency: payload.isEmergency ?? prev?.isEmergency,
            }));
        };

        socketService
            .connect()
            .then((socket) => {
                if (!mounted) return;
                activeSocket = socket;
                socket.on(TOKEN_SOCKET_EVENT, onTokenUpdate);
            })
            .catch((err) => {
                console.error("[TokenStatusPage] Socket connect failed:", err.message);
            });

        return () => {
            mounted = false;
            activeSocket?.off(TOKEN_SOCKET_EVENT, onTokenUpdate);
        };
    }, [selectedAppointmentId]);

    const selectedAppointment = useMemo(
        () =>
            appointments.find(
                (appt) => String(appt._id || appt.id) === String(selectedAppointmentId),
            ),
        [appointments, selectedAppointmentId],
    );

    return (
        <div className="token-status-page">
            <div className="token-page-header">
                <h2 className="token-page-title">{t("your_token_status") || "Your Token Status"}</h2>
                <p className="token-page-subtitle">
                    {t("token_page_subtitle") ||
                        "Select an appointment to see your live token number and queue position."}
                </p>
            </div>

            <div className="token-page-body">
                {/* Left: appointment picker */}
                <div className="appointment-picker">
                    <h3 className="picker-heading">{t("my_appointments") || "My Appointments"}</h3>

                    {isLoadingAppointments && (
                        <div className="picker-state">{t("loading") || "Loading..."}</div>
                    )}

                    {!isLoadingAppointments && appointmentsError && (
                        <div className="picker-state error">{appointmentsError}</div>
                    )}

                    {!isLoadingAppointments && !appointmentsError && appointments.length === 0 && (
                        <div className="picker-state">
                            {t("no_appointments") || "You don't have any appointments yet."}
                        </div>
                    )}

                    <ul className="appointment-list">
                        {appointments.map((appt) => {
                            const id = appt._id || appt.id;
                            const isSelected = String(id) === String(selectedAppointmentId);
                            const doctorName =
                                appt.doctorName || appt.doctor?.fullName || appt.doctor?.name || "Doctor";
                            return (
                                <li key={id}>
                                    <button
                                        type="button"
                                        className={`appointment-item ${isSelected ? "selected" : ""}`}
                                        onClick={() => setSelectedAppointmentId(id)}
                                    >
                                        <span className="appointment-doctor">{doctorName}</span>
                                        <span className="appointment-datetime">
                                            {formatDateTime(appt.appointmentDate || appt.date)}
                                        </span>
                                        <span className={`appointment-status ${appt.status || ""}`}>
                                            {appt.status}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Right: token details for the selected appointment */}
                <div className="token-detail-panel">
                    {!selectedAppointmentId && (
                        <div className="token-empty-state">
                            {t("select_appointment_prompt") ||
                                "Pick an appointment on the left to see your token."}
                        </div>
                    )}

                    {selectedAppointmentId && isLoadingToken && (
                        <div className="token-empty-state">{t("loading") || "Loading..."}</div>
                    )}

                    {selectedAppointmentId && !isLoadingToken && tokenError && (
                        <div className="token-empty-state error">{tokenError}</div>
                    )}

                    {selectedAppointmentId && !isLoadingToken && !tokenError && tokenData && (
                        <div className="token-card">
                            {tokenData.isEmergency && (
                                <div className="emergency-banner">
                                    {t("emergency_in_progress") ||
                                        "⚠ An emergency case is currently being attended — queue may be delayed."}
                                </div>
                            )}

                            {selectedAppointment && (
                                <div className="token-doctor-line">
                                    {selectedAppointment.doctorName ||
                                        selectedAppointment.doctor?.fullName ||
                                        selectedAppointment.doctor?.name}
                                </div>
                            )}

                            <div className="token-stats-grid">
                                <div className="token-stat your-token">
                                    <span className="token-stat-label">{t("your_token") || "Your Token"}</span>
                                    <span className="token-stat-value">
                                        {tokenData.tokenNumber ?? "--"}
                                    </span>
                                </div>
                                <div className="token-stat">
                                    <span className="token-stat-label">
                                        {t("now_serving") || "Now Serving"}
                                    </span>
                                    <span className="token-stat-value">
                                        {tokenData.currentServingNumber ?? "--"}
                                    </span>
                                </div>
                                <div className="token-stat">
                                    <span className="token-stat-label">
                                        {t("waiting_count") || "Waiting"}
                                    </span>
                                    <span className="token-stat-value">
                                        {tokenData.waitingCount ?? "--"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TokenStatusPage;