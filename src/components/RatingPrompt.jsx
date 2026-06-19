import React, { useCallback, useEffect, useState } from "react";
import RatingModal from "./RatingModal";
import ratingService from "../services/ratingService";

/**
 * RatingPrompt
 *
 * Drop-in, self-contained rating trigger. On mount it asks the backend
 * (GET /api/ratings/check-eligibility) whether a popup is due and, if so,
 * shows the RatingModal. Mount it once inside the user dashboard shell so it
 * runs on dashboard / messages / profile loads.
 *
 * Optional prop `triggerKey` — change it to re-run the check (e.g. pass the
 * active tab so switching to Messages re-checks).
 */
const RatingPrompt = ({ triggerKey }) => {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [target, setTarget] = useState(null); // { counselorId, counselorName, counselorPhoto }
  // Bumped on every open so the modal remounts with fresh star/review state.
  const [openId, setOpenId] = useState(0);

  const runCheck = useCallback(async () => {
    if (visible) return;
    const result = await ratingService.checkEligibility();
    if (result?.showPopup && result?.counselorId) {
      setTarget({
        counselorId: result.counselorId,
        counselorName: result.counselorName || "your counselor",
        counselorPhoto: result.counselorPhoto || null,
      });
      setSuccess(false);
      setOpenId((n) => n + 1);
      setVisible(true);
    }
  }, [visible]);

  useEffect(() => {
    void runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  const handleSubmit = async ({ rating, review }) => {
    if (!target?.counselorId) return;
    setSubmitting(true);
    try {
      await ratingService.submitRating({
        counselorId: target.counselorId,
        rating,
        review,
      });
      setSuccess(true);
      setTimeout(() => setVisible(false), 1500);
    } catch (e) {
      console.log("RatingPrompt submit failed:", e?.message);
      setVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemindLater = async () => {
    if (target?.counselorId) await ratingService.remindLater(target.counselorId);
    setVisible(false);
  };

  const handleNeverAskAgain = async () => {
    if (target?.counselorId)
      await ratingService.neverAskAgain(target.counselorId);
    setVisible(false);
  };

  // Closing via X / overlay defaults to "remind later" (non-destructive).
  const handleClose = () => {
    void handleRemindLater();
  };

  return (
    <RatingModal
      key={openId}
      visible={visible}
      counselorName={target?.counselorName}
      counselorPhoto={target?.counselorPhoto}
      submitting={submitting}
      success={success}
      onSubmit={handleSubmit}
      onRemindLater={handleRemindLater}
      onNeverAskAgain={handleNeverAskAgain}
      onClose={handleClose}
    />
  );
};

export default RatingPrompt;
