import React, { useState } from 'react';
import { Star, MessageSquare, Building2, Stethoscope, RefreshCw, Users } from 'lucide-react';
import axios, { API_BASE_URL, getAuthHeaders } from '../doctorApi.js';
import useSocketRefresh from '../../../hooks/useSocketRefresh';
import { PortalText } from '../../common/PortalTranslation';
import './DoctorRatings.css';

function Stars({ value }) {
  return <span className="dr-stars" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={17} fill={star <= Math.round(value) ? 'currentColor' : 'none'} aria-hidden="true" />)}
  </span>;
}

export default function DoctorRatings() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('doctor');
  const [clinicId, setClinicId] = useState('all');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    setRefreshing(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/appointments/doctor/ratings-summary`, { headers: getAuthHeaders() });
      setSummary(data);
      setError('');
    } catch { setError('Reviews could not be loaded. Please try again.'); }
    finally { setRefreshing(false); }
  };
  useSocketRefresh(load, ['appointments:updated']);
  const clinics = summary?.clinics || [];
  const selectedClinics = clinicId === 'all' ? clinics : clinics.filter(clinic => clinic.clinicId === clinicId);
  const clinicCount = selectedClinics.reduce((count, clinic) => count + clinic.ratingCount, 0);
  const clinicDistribution = selectedClinics.reduce((counts, clinic) => {
    for (let star = 1; star <= 5; star++) counts[star] = (counts[star] || 0) + (clinic.distribution?.[star] || 0);
    return counts;
  }, {});
  const clinicSum = Object.entries(clinicDistribution).reduce((sum, [star, count]) => sum + Number(star) * count, 0);
  const isDoctor = tab === 'doctor';
  const count = isDoctor ? summary?.ratingCount || 0 : clinicCount;
  const average = isDoctor ? summary?.rating || 0 : clinicCount ? clinicSum / clinicCount : 0;
  const distribution = isDoctor ? summary?.distribution || {} : clinicDistribution;
  const reviews = isDoctor ? summary?.reviews || [] : selectedClinics.flatMap(clinic =>
    (clinic.reviews || []).map(review => ({ ...review, clinicId: clinic.clinicId, clinicName: clinic.name }))
  ).sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  const pageCount = Math.max(1, Math.ceil(reviews.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visibleReviews = reviews.slice((currentPage - 1) * 10, currentPage * 10);

  return <section className="doctor-reviews" aria-label="Reviews">
    <header className="dr-header">
      <div><span className="dr-eyebrow"><PortalText text="PATIENT FEEDBACK" /></span><h2><PortalText text="Reviews & Ratings" /></h2>
        <p><PortalText text="See what patients appreciate and where you can improve." /></p></div>
      <button type="button" className="dr-refresh" onClick={load} disabled={refreshing}><RefreshCw size={16} /><PortalText text={refreshing ? 'Refreshing...' : 'Refresh'} /></button>
    </header>
    <div className="dr-tabs" role="tablist" aria-label="Review category">
      {[['doctor', 'Doctor Reviews', Stethoscope, summary?.ratingCount || 0], ['clinic', 'Clinic Reviews', Building2, clinics.reduce((total, clinic) => total + clinic.ratingCount, 0)]].map(([id, label, Icon, total]) =>
        <button key={id} id={`dr-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls="dr-panel" className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setPage(1); }}>
          <Icon size={18} /><PortalText text={label} /><span>{total}</span>
        </button>)}
    </div>
    {error && <div className="dr-error" role="alert">{error} <button type="button" onClick={load}><PortalText text="Retry" /></button></div>}
    {!summary && !error ? <div className="dr-empty" role="status"><PortalText text="Loading reviews..." /></div> : summary &&
      <div id="dr-panel" role="tabpanel" aria-labelledby={`dr-tab-${tab}`}>
        {!isDoctor && <div className="dr-clinic-filter"><label htmlFor="dr-clinic"><Building2 size={17} /><PortalText text="Clinic" /></label>
          <select id="dr-clinic" value={clinicId} onChange={event => { setClinicId(event.target.value); setPage(1); }}>
            <option value="all">All clinics</option>{clinics.map(clinic => <option key={clinic.clinicId} value={clinic.clinicId}>{clinic.name}</option>)}
          </select></div>}
        <div className="dr-overview">
          <div className="dr-score"><span className="dr-score-label"><PortalText text="Average Rating" /></span>
            <div><strong>{count ? average.toFixed(1) : '\u2014'}</strong><span>/ 5</span></div><Stars value={average} />
            <p><Users size={15} />{count} <PortalText text="total ratings" /></p>
          </div>
          <div className="dr-distribution"><h3><PortalText text="Rating breakdown" /></h3>
            {[5, 4, 3, 2, 1].map(star => <div className="dr-bar-row" key={star}><span>{star}<Star size={12} fill="currentColor" aria-hidden="true" /></span>
              <div className="dr-bar" role="meter" aria-label={`${star} star ratings`} aria-valuemin={0} aria-valuemax={Math.max(count, 1)} aria-valuenow={distribution[star] || 0}><i style={{ width: `${count ? (distribution[star] || 0) / count * 100 : 0}%` }} /></div>
              <small>{distribution[star] || 0}</small></div>)}
          </div>
        </div>
        <div className="dr-list-heading"><h3><MessageSquare size={19} /><PortalText text={isDoctor ? 'Patient Reviews' : 'Clinic Reviews'} /></h3><span><PortalText text="Newest first" /></span></div>
        {!reviews.length ? <div className="dr-empty"><span className="dr-empty-icon"><MessageSquare size={28} /></span><h3><PortalText text="No reviews yet" /></h3><p><PortalText text={isDoctor ? 'Patient feedback will appear here after a completed appointment.' : 'Reviews for your selected clinics will appear here.'} /></p></div>
          : <div className="dr-table-scroll" tabIndex={0} role="region" aria-label={isDoctor ? 'Doctor reviews table' : 'Clinic reviews table'}>
            <table className="dr-table">
              <caption className="visually-hidden"><PortalText text={isDoctor ? 'Doctor Reviews' : 'Clinic Reviews'} /></caption>
              <thead><tr>
                <th scope="col"><PortalText text="Patient" /></th>
                {!isDoctor && <th scope="col"><PortalText text="Clinic" /></th>}
                <th scope="col"><PortalText text="Rating" /></th>
                <th scope="col"><PortalText text="Review" /></th>
                <th scope="col"><PortalText text="Date" /></th>
              </tr></thead>
              <tbody>{visibleReviews.map((review, index) => <tr key={`${review.clinicId || ''}-${review.id || index}`}>
                <td><div className="dr-reviewer"><span className="dr-avatar" aria-hidden="true">{(review.reviewerName || 'Patient').trim().slice(0, 1).toUpperCase()}</span>
                  <div><strong>{review.reviewerName || 'Patient'}</strong><span><PortalText text="Completed appointment" /></span></div></div></td>
                {!isDoctor && <td className="dr-table-clinic">{review.clinicName}</td>}
                <td><div className="dr-table-rating"><Stars value={review.stars} /><strong>{review.stars}.0 <span>/ 5</span></strong></div></td>
                <td className="dr-table-comment"><p className={review.review ? 'dr-comment' : 'dr-no-comment'}>{review.review || <PortalText text="Rating given without a written review." />}</p></td>
                <td className="dr-table-date">{review.submittedAt ? <time dateTime={review.submittedAt}>{new Date(review.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time> : <span>&mdash;</span>}</td>
              </tr>)}</tbody>
            </table>
          </div>}

        {pageCount > 1 && <nav className="dr-pagination" aria-label="Review pages"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><PortalText text="Previous" /></button><span>{currentPage} / {pageCount}</span><button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><PortalText text="Next" /></button></nav>}
      </div>}
  </section>;
}
