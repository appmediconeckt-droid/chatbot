import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import StarRating from "./StarRating";
import styles from "./RatingModal.module.css";

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * RatingModal
 *
 * Popup shown after a counseling session ends. Lets the user pick 1-5 stars and
 * (optionally) leave a comment. "Maybe later" dismisses without rating.
 *
 * Props:
 *   visible        bool
 *   counselorName  string
 *   counselorPhoto string|null
 *   submitting     bool      shows a spinner on the submit button
 *   onSubmit       ({ stars, comment }) => void
 *   onDismiss      () => void   "Maybe later" / close
 */
const RatingModal = ({
  visible,
  counselorName = "your counselor",
  counselorPhoto,
  submitting = false,
  onSubmit,
  onDismiss,
}) => {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (visible) {
      setStars(0);
      setComment("");
    }
  }, [visible]);

  if (!visible) return null;

  const initials = (counselorName || "C")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSubmit = () => {
    if (stars < 1 || submitting) return;
    onSubmit?.({ stars, comment });
  };

  return (
    <div className={styles.overlay} onClick={() => !submitting && onDismiss?.()}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => !submitting && onDismiss?.()}
          disabled={submitting}
          aria-label="Close"
        >
          <IoClose size={24} />
        </button>

        <div className={styles.avatarWrap}>
          {counselorPhoto ? (
            <img
              src={counselorPhoto}
              alt={counselorName}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>{initials}</div>
          )}
        </div>

        <h2 className={styles.title}>Rate your session</h2>
        <p className={styles.subtitle}>
          How was your session with <span className={styles.counselorName}>{counselorName}</span>?
        </p>

        <div className={styles.starsRow}>
          <StarRating
            rating={stars}
            onChange={setStars}
            size={40}
            showValue={false}
          />
        </div>
        <p className={styles.starLabel}>{STAR_LABELS[stars] || "Tap a star to rate"}</p>

        <textarea
          className={styles.input}
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          disabled={submitting}
        />

        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={stars < 1 || submitting}
        >
          {submitting ? (
            <span className={styles.spinner} />
          ) : (
            "Submit rating"
          )}
        </button>

        <button
          type="button"
          className={styles.laterBtn}
          onClick={() => !submitting && onDismiss?.()}
          disabled={submitting}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default RatingModal;
