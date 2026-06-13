import React from "react";
import styles from "./StarRating.module.css";
import { IoStar, IoStarOutline, IoStarHalf } from "react-icons/io5";

/**
 * StarRating
 *
 * Dual-purpose star component:
 *  - Read-only display (default): pass `rating` to render full / half / empty stars
 *    with optional review count like "★ 4.6 (128)".
 *  - Interactive input: pass `onChange` to make stars tappable (used by the
 *    rating modal). When interactive, only whole stars are shown.
 *
 * Props:
 *   rating    number   current value (0-5)
 *   count     number   optional number of reviews to show next to the stars
 *   onChange  func     (value) => void; when provided, stars become tappable
 *   showValue bool     show the numeric value next to the stars (default true)
 *   size      number   icon size in px (default 16)
 *   className string   additional CSS class
 */
const StarRating = ({
  rating = 0,
  count,
  onChange,
  showValue,
  size = 16,
  className = "",
}) => {
  const interactive = typeof onChange === "function";
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const display = showValue === undefined ? !interactive : showValue;

  const renderStar = (index) => {
    const starNumber = index + 1;
    let icon;
    if (interactive) {
      icon =
        starNumber <= safeRating ? (
          <IoStar key={index} size={size} className={styles.filled} />
        ) : (
          <IoStarOutline key={index} size={size} className={styles.empty} />
        );
    } else if (safeRating >= starNumber) {
      icon = <IoStar key={index} size={size} className={styles.filled} />;
    } else if (safeRating >= starNumber - 0.5) {
      icon = <IoStarHalf key={index} size={size} className={styles.filled} />;
    } else {
      icon = <IoStarOutline key={index} size={size} className={styles.empty} />;
    }

    if (!interactive) return icon;

    return (
      <button
        key={index}
        type="button"
        className={styles.starBtn}
        onClick={() => onChange(starNumber)}
        title={`Rate ${starNumber} star${starNumber > 1 ? "s" : ""}`}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className={`${styles.row} ${className}`}>
      <div className={styles.stars}>{[0, 1, 2, 3, 4].map(renderStar)}</div>
      {display && (
        <span className={styles.value}>
          {safeRating.toFixed(1)}
          {typeof count === "number" && count >= 0 ? ` (${count})` : ""}
        </span>
      )}
    </div>
  );
};

export default StarRating;
