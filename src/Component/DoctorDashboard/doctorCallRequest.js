export async function initiateDoctorCall({ connect, request, receiverId, callType, unlockAudio }) {
  // Browser autoplay can leave AudioContext.resume pending until a later
  // gesture. It must never prevent the actual incoming call request.
  try { Promise.resolve(unlockAudio?.()).catch(() => {}); } catch { /* Optional audio unlock. */ }
  let socket;
  try { socket = await connect(); }
  catch { throw new Error('Could not connect to the call server. Check your connection and retry.'); }
  if (!socket?.id) throw new Error('Call connection is not ready. Please retry.');
  // Let the authenticated HTTP endpoint verify and prepare this exact socket.
  // Waiting for a separate custom socket acknowledgement can prevent the HTTP
  // request entirely when clients and servers are updated at different times.
  const response = await request({ receiverId, callType, socketId: socket.id });
  const call = response?.data?.data || response?.data || response?.callData || response?.call || response;
  if (response?.notificationOnly || call?.notificationOnly || response?.status === 'notification_only' || call?.status === 'notification_only' || call?.presentation === 'notification_only') {
    throw new Error(call?.reason === 'initiator_offline' || call?.callData?.reason === 'initiator_offline' || response?.reason === 'initiator_offline'
      ? 'Your call connection is offline. Reconnect and retry.'
      : 'Patient is offline. A notification was sent. Retry when the patient is online.');
  }
  const id = call?.id || call?.callId || call?.call_id || response?.callId;
  if (response?.success === false || !id) throw new Error(response?.error || 'Call could not be started. Please retry.');
  return { ...call, id, type: callType };
}
