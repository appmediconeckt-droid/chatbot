import React, { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import StarRating from "./StarRating";
import styles from "./RatingModal.module.css";

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * RatingModal
 *
 * Eligibility-driven rating popup. Lets the user pick 1-5 stars and leave an
 * optional review. Three actions:
 *   - Submit rating        → onSubmit({ rating, review })
 *   - Remind me later      → onRemindLater()   (backend hides for 7 days)
 *   - Never ask again      → onNeverAskAgain()  (backend hides permanently)
 *
 * Props:
 *   visible          bool
 *   counselorName    string
 *   counselorPhoto   string|null
 *   submitting       bool
 *   success          bool      show a success state after submit
 *   onSubmit         ({ rating, review }) => void
 *   onRemindLater    () => void
 *   onNeverAskAgain  () => void
 *   onClose          () => void   (X / overlay = remind later by default)
 */
const RatingModal = ({
  visible,
  counselorName = "your consultant",
  counselorPhoto,
  submitting = false,
  success = false,
  onSubmit,
  onRemindLater,
  onNeverAskAgain,
  onClose,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);

  const counselorPhotoUrl = useMemo(() => {
    if (typeof counselorPhoto === "string") {
      const value = counselorPhoto.trim();
      return value && value !== "[object Object]" ? value : null;
    }

    return (
      counselorPhoto?.url ||
      counselorPhoto?.secure_url ||
      counselorPhoto?.secureUrl ||
      null
    );
  }, [counselorPhoto]);

  if (!visible) return null;

  const initials = (counselorName || "C")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const busy = submitting;

  const handleSubmit = () => {
    if (rating < 1 || busy) return;
    onSubmit?.({ rating, review });
  };

  return (
    <div className={styles.overlay} onClick={() => !busy && onClose?.()}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        {!success && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => !busy && onClose?.()}
            disabled={busy}
            aria-label="Close"
          >
            <IoClose size={24} />
          </button>
        )}

        {success ? (
          <div className={styles.successWrap}>
            <span className={styles.successIcon}>🎉</span>
            <h2 className={styles.title}>Thank you!</h2>
            <p className={styles.subtitle}>Your rating has been submitted.</p>
          </div>
        ) : (
          <>
            <div className={styles.avatarWrap}>
              {counselorPhotoUrl && !photoFailed ? (
                <img
                  src={counselorPhotoUrl}
                  alt={counselorName}
                  className={styles.avatar}
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className={styles.avatarFallback}>{initials}</div>
              )}
            </div>

            <h2 className={styles.title}>Rate your consultant</h2>
            <p className={styles.subtitle}>
              How was your experience with{" "}
              <span className={styles.counselorName}>{counselorName}</span>?
            </p>

            <div className={styles.starsRow}>
              <StarRating
                rating={rating}
                onChange={setRating}
                size={40}
                showValue={false}
              />
            </div>
            <p className={styles.starLabel}>
              {STAR_LABELS[rating] || "Tap a star to rate"}
            </p>

            <textarea
              className={styles.input}
              placeholder="Add a review (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value.slice(0, 500))}
              disabled={busy}
            />

            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={rating < 1 || busy}
            >
              {busy ? <span className={styles.spinner} /> : "Submit rating"}
            </button>

            <button
              type="button"
              className={styles.laterBtn}
              onClick={() => !busy && onRemindLater?.()}
              disabled={busy}
            >
              Remind me later
            </button>

            <button
              type="button"
              className={styles.neverBtn}
              onClick={() => !busy && onNeverAskAgain?.()}
              disabled={busy}
            >
              Never ask again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RatingModal;
