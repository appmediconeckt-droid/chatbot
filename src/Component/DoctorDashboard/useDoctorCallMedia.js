import { useCallback, useEffect, useRef, useState } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { getStreamToken, resolveStreamApiKey, validateStreamTokenPayload, cleanCallId } from "../UserDashboard/Tab/CallModal/streamCallClient";

// Use the same Stream transport as the existing web/mobile call screens.
export default function useDoctorCallMedia({ callId, callType }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState("");
  const session = useRef(null);
  const currentId = useRef(callId);
  currentId.current = callId;
  const pending = useRef(null);

  const connect = useCallback(async (type = callType) => {
    if (!callId) throw new Error("A call must be started before opening the microphone.");
    if (session.current?.id === callId) return session.current.call;
    if (pending.current?.id === callId) return pending.current.promise;
    const promise = (async () => {
      const payload = await getStreamToken();
      validateStreamTokenPayload(payload);
      if (currentId.current !== callId) throw new Error("Call was closed.");
      const client = StreamVideoClient.getOrCreateInstance({ apiKey: resolveStreamApiKey(payload), user: { id: String(payload.userId) }, token: payload.token, tokenProvider: async () => (await getStreamToken()).token });
      const call = client.call("default", cleanCallId(callId));
      if (type !== "video") await call.camera.disable();
      await call.join({ create: true });
      if (currentId.current !== callId) { await call.leave(); throw new Error("Call was closed."); }
      await call.microphone.enable();
      if (type === "video") await call.camera.enable();
      const combine = (...streams) => {
        const tracks = streams.flatMap((stream) => stream?.getTracks() || []);
        return tracks.length ? new MediaStream([...new Set(tracks)]) : null;
      };
      const syncLocal = () => setLocalStream(combine(call.microphone.state.mediaStream, call.camera.state.mediaStream));
      const subscriptions = [
        call.microphone.state.mediaStream$.subscribe(syncLocal),
        call.camera.state.mediaStream$.subscribe(syncLocal),
        call.state.participants$.subscribe((participants) => {
          const peer = participants.find((participant) => participant.userId !== String(payload.userId));
          setRemoteStream(combine(peer?.audioStream, peer?.videoStream));
        }),
      ];
      session.current = { id: callId, call, subscriptions };
      syncLocal();
      return call;
    })().catch((err) => { setError(err.message); throw err; }).finally(() => { if (pending.current?.id === callId) pending.current = null; });
    pending.current = { id: callId, promise };
    return promise;
  }, [callId, callType]);

  useEffect(() => {
    setLocalStream(null);
    setRemoteStream(null);
    setError("");
    return () => {
      const active = session.current;
      session.current = null;
      active?.subscriptions.forEach((subscription) => subscription.unsubscribe());
      active?.call.leave().catch(() => {});
    };
  }, [callId]);

  return {
    localStream, remoteStream, error,
    getLocalMedia: async (type) => {
      const call = await connect(type);
      return new MediaStream([...(call.microphone.state.mediaStream?.getTracks() || []), ...(call.camera.state.mediaStream?.getTracks() || [])]);
    },
    startOffer: () => connect(),
    setAudioMuted: (muted) => { const mic = session.current?.call.microphone; (muted ? mic?.disable() : mic?.enable())?.catch((err) => setError(err.message)); },
    setVideoOff: (off) => { const camera = session.current?.call.camera; (off ? camera?.disable() : camera?.enable())?.catch((err) => setError(err.message)); },
  };
}
