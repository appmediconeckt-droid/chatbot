import { FaStar } from 'react-icons/fa';

export default function ProviderRating({ provider = {} }) {
  const rating = Number(provider.rating) || 0;
  const count = Number(provider.ratingCount) || 0;
  return <span className="rating" title={`${count} ratings`}><FaStar aria-hidden="true" /> {rating.toFixed(1)} / 5{count > 0 && <small> ({count})</small>}</span>;
}
