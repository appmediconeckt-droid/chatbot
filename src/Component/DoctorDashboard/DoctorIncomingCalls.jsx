import { useEffect, useRef, useState } from "react";
import axios from "../../axiosConfig";
import useSocketRefresh from "../../hooks/useSocketRefresh";
import useRingtone from "../../hooks/useRingtone";
import IncomingCallModal from "../common/IncomingCallModal/IncomingCallModal";
import VideoCallModal from "../UserDashboard/Tab/CallModal/VideoCallModal";

// One incoming-call owner across every doctor page, including chat.
export default function DoctorIncomingCalls({ doctorId, user }) {
  const [incoming, setIncoming] = useState(null);
  const [active, setActive] = useState(null);
  const [error, setError] = useState("");
  const accepting = useRef(false);
  const { startRinging, stopRinging } = useRingtone();
  const enabled = Boolean(doctorId);
  useSocketRefresh(async () => {
    if (active || accepting.current) return;
    const { data } = await axios.get(`/api/video/calls/pending/${doctorId}`);
    if (accepting.current) return;
    const next = data.pendingRequests?.[0] || null;
    setIncoming(previous => previous?.callId === next?.callId ? previous : next);
  }, ["incoming_call_request", "call_rejected", "call_cancelled", "call_ended", "call_expired", "call_missed", "call_accepted"], enabled,
  { allowHidden: true, pollWhileConnected: true, fallbackIntervalMs: 3000, refreshKey: String(doctorId) });

  useEffect(() => {
    if (incoming && enabled && !active) startRinging();
    else stopRinging();
    return stopRinging;
  }, [incoming, enabled, active, startRinging, stopRinging]);

  const accept = async () => {
    accepting.current = true;
    setError("");
    try {
      const { data } = await axios.put(`/api/video/calls/${incoming.callId}/accept`, { acceptorId: doctorId, acceptorType: "doctor" });
      if (data.success === false) throw new Error(data.error || "Unable to accept call");
      const from = incoming.from || {};
      setActive({ ...incoming, id: incoming.callId, name: from.displayName || from.fullName || "Patient",
        profilePic: from.profilePhoto, initiator: from, receiver: { id: doctorId, type: "doctor" },
        isIncoming: true, status: "active", currentUserId: doctorId, currentUserType: "doctor",
        apiCallData: data.callData || data });
      setIncoming(null);
      stopRinging();
      return true;
    } catch (failure) {
      setError(failure.response?.data?.error || failure.message || "Unable to accept call. Please retry.");
      return false;
    } finally { accepting.current = false; }
  };
  const reject = async () => {
    try {
      await axios.put(`/api/video/calls/${incoming.callId}/reject`, { userId: doctorId, reason: "declined" });
      setIncoming(null); stopRinging(); setError(""); return true;
    } catch (failure) { setError(failure.response?.data?.error || "Unable to decline call. Please retry."); return false; }
  };
  return <>
    <IncomingCallModal key={incoming?.callId || "none"} isOpen={Boolean(incoming) && enabled && !active}
      callData={incoming} callType={incoming?.callType} callerName={incoming?.from?.displayName || incoming?.from?.fullName}
      onAccept={accept} onReject={reject} onClose={() => {}} />
    {error && incoming && enabled && <div role="alert" style={{ position: "fixed", bottom: 20, left: "10%", zIndex: 100000, background: "white", color: "#b91c1c", padding: 16 }}>{error}</div>}
    <VideoCallModal isOpen={Boolean(active)} callData={active} callMode={active?.callType}
      currentUser={{ ...user, id: doctorId, role: "doctor" }} onClose={() => setActive(null)}
      onEndCall={async callId => { await axios.put(`/api/video/calls/${callId}/end`, { userId: doctorId, endedBy: "doctor" }); }} />
  </>;
}
