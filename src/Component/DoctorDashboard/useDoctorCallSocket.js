import { useEffect, useRef } from "react";
import { socketService } from "../../services/socketService";
import { getCurrentUserId } from "./doctorChatApi";

export default function useDoctorCallSocket(handlers) {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    let cancelled = false;
    let socket;
    const subscriptions = [];
    socketService.connect().then((connected) => {
      if (cancelled) return;
      socket = connected;
      for (const [event, handler] of Object.entries({ incoming_call_request: "onRinging", call_accepted: "onAccepted", call_rejected: "onRejected", call_cancelled: "onCancelled", call_ended: "onEnded", call_missed: "onMissed" })) {
        const listener = (call) => latest.current[handler]?.({ ...call, caller_id: call.fromId || call.callerId, receiver_id: call.receiverId || (event === "incoming_call_request" ? getCurrentUserId() : undefined) });
        socket.on(event, listener);
        subscriptions.push([event, listener]);
      }
    }).catch((error) => latest.current.onError?.(error));
    return () => { cancelled = true; subscriptions.forEach(([event, listener]) => socket?.off(event, listener)); };
  }, []);
}
