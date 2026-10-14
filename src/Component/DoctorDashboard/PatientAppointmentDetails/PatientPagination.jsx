import { PortalText } from "../../common/PortalTranslation";
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function PatientPagination({ page, totalPages, total, first, last, label, onChange }) {
  if (!total) return null;
  const pages = [...new Set([1, totalPages, page - 1, page, page + 1].filter(value => value > 0 && value <= totalPages))].sort((a, b) => a - b);
  return <nav className="pd-pagination" aria-label={`${label} pagination`}>
    <span><PortalText text={"Showing "} />{first + 1}<PortalText text={" to "} />{last}<PortalText text={" of "} />{total} {<PortalText text={label} />}</span>
    <div>
      <button type="button" aria-label={`Previous ${label} page`} disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={18} aria-hidden="true" /></button>
      {pages.map((value, index) => <React.Fragment key={value}>{index > 0 && value > pages[index - 1] + 1 && <span className="pd-page-gap" aria-hidden="true"><MoreHorizontal size={17} /></span>}<button type="button" aria-label={`${label} page ${value}`} aria-current={value === page ? 'page' : undefined} className={value === page ? 'active' : ''} onClick={() => onChange(value)}>{value}</button></React.Fragment>)}
      <button type="button" aria-label={`Next ${label} page`} disabled={page >= totalPages} onClick={() => onChange(page + 1)}><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
  </nav>;
}
