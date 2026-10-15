import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from '../../axiosConfig.js';
import { AppointmentTable, PatientDialog } from '../Receptionist/AppointmentViews.jsx';
import { PortalText, PortalElement, PortalTemplate } from '../common/PortalTranslation';
import { indiaToday, patientKey, statusLabel } from '../Receptionist/receptionistView.js';
import '../Receptionist/ReceptionistPortal.css';
export default function StaffAppointments({clinicId} = {}) {
 const context = useOutletContext();
 const canReceptionistCancel = context?.profile?.role === 'receptionist';
 const [cancelBusy, setCancelBusy] = useState('');
 const [cancelError, setCancelError] = useState('');
 const [filters,setFilters]=useState({from:'',to:'',status:'all',search:'',clinic_id:''});
 const [page,setPage]=useState(1);
 const [data,setData]=useState(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [refresh,setRefresh]=useState(0);
 const [selected,setSelected]=useState(null);
 const selectedClinic=clinicId ?? filters.clinic_id;
 const cancelAppointment = async row => {
  if (cancelBusy || !canReceptionistCancel) return;
  if (!window.confirm(`Cancel the appointment for ${row.patientName}?`)) return;
  setCancelBusy(patientKey(row)); setCancelError('');
  try {
   await axios.patch(`/api/appointments/${row.id}/cancel`, { source: row.source || 'online' });
   setSelected(null); setRefresh(value => value + 1);
  } catch (err) {
   setCancelError(err.response?.data?.message || 'Appointment could not be cancelled. Please try again.');
   if (err.response?.status === 409) setRefresh(value => value + 1);
  } finally { setCancelBusy(''); }
 };
 useEffect(()=>{setPage(1);setSelected(null);},[selectedClinic]);
 useEffect(()=>{
  const controller=new AbortController();let timer;
  setLoading(true);setData(null);setError('');
  if(filters.from && filters.to && filters.from>filters.to){setError('Start date must be before end date.');setLoading(false);return ()=>controller.abort();}
  const load=async()=>{
   if(document.visibilityState==='hidden'||navigator.onLine===false){timer=setTimeout(load,15000);return;}
   try{
    const {data:result}=await axios.get('/api/staff/appointments',{params:{...filters,clinic_id:selectedClinic,page,limit:10},signal:controller.signal,timeout:15000});
    if(controller.signal.aborted)return;
    setData(result);setError('');
    const pages=Math.max(1,Math.ceil(result.total/10));if(page>pages)setPage(pages);
   }catch(err){if(!controller.signal.aborted){setError(err.response?.data?.message||'Appointments could not be loaded. Please refresh.');if([401,403,404].includes(err.response?.status))setData(null);}}
   finally{if(!controller.signal.aborted){setLoading(false);timer=setTimeout(load,15000);}}
  };
  timer=setTimeout(load,200);
  return ()=>{controller.abort();clearTimeout(timer);};
 },[filters,selectedClinic,page,refresh]);
 const update=(key,value)=>{setFilters(current=>({...current,[key]:value}));setPage(1);setSelected(null);};
 const reset=()=>{setFilters({from:'',to:'',status:'all',search:'',clinic_id:''});setPage(1);setSelected(null);};
 const pages=Math.max(1,Math.ceil((data?.total||0)/10));
 const patient=data?.appointments.find(row=>patientKey(row)===selected);
 return <section className="rec-card staff-appointments">
  <div className="rec-card-heading"><div><h2><PortalText text="All appointments" /></h2><p><PortalText text="Online and walk-in appointments across all dates, including completed visits." /></p></div><button className="rec-button" disabled={loading} onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={16}/><PortalText text="Refresh" /></button></div>
  <div className="rec-filters"><label className="rec-search"><Search size={18}/><PortalElement as="input" aria-label="Search patient, phone or token" placeholder="Search patient, phone or token..." value={filters.search} onChange={event=>update('search',event.target.value)} /></label>
   <label><PortalText text="From date" /><input type="date" value={filters.from} onChange={event=>update('from',event.target.value)} /></label><label><PortalText text="To date" /><input type="date" value={filters.to} onChange={event=>update('to',event.target.value)} /></label>
   <label><PortalText text="Status" /><select value={filters.status} onChange={event=>update('status',event.target.value)}>{['all','completed','pending','confirmed','booked','waiting','called','in_progress','canceled','rejected','skipped','no_show'].map(value=><option key={value} value={value}><PortalText text={value==='all'?'All statuses':statusLabel(value)} /></option>)}</select></label>
   {clinicId===undefined&&<label><PortalText text="Clinic / Hospital" /><select value={filters.clinic_id} onChange={event=>update('clinic_id',event.target.value)}><option value=""><PortalText text="All clinics / hospitals" /></option>{data?.clinics.map(row=><option key={row._id||row.id} value={String(row._id||row.id)}>{row.clinic_name}</option>)}</select></label>}
   <button className="rec-button" onClick={()=>{const today=indiaToday();setFilters(current=>({...current,from:today,to:today}));setPage(1);setSelected(null);}}><PortalText text="Today" /></button>
   <button className="rec-button" onClick={reset}><PortalText text="All dates" /></button>
   <button className="rec-button" onClick={()=>update('status','completed')}><PortalText text="Completed appointments" /></button>
  </div>
  {error&&<p className="rec-alert" role="alert">{error}</p>}
  {cancelError&&<p className="rec-alert" role="alert">{cancelError}</p>}
  {loading&&!data?<p role="status"><PortalText text="Loading appointments..." /></p>:data&&<>
   <div className="rec-inline"><strong>{data.doctor.fullName}</strong><span className="rec-count"><PortalTemplate text="{0} appointments" values={[data.total]} /></span><span className="rec-count"><PortalTemplate text="{0} completed" values={[data.completed]} /></span></div>
   {data.appointments.length?<AppointmentTable rows={data.appointments} clinics={data.clinics} onView={setSelected} onVitalsSaved={(row,vitals)=>setData(current=>current ? {...current,appointments:current.appointments.map(item=>patientKey(item)===patientKey(row)?{...item,vitals}:item)} : current)} onCancelAppointment={canReceptionistCancel ? cancelAppointment : undefined} cancelBusy={cancelBusy}/>:<div className="rec-empty"><h3><PortalText text="No matching appointments" /></h3><p><PortalText text="Select All dates or adjust your status and search filters." /></p></div>}
   <div className="rec-pagination"><span><PortalTemplate text="Showing {0}-{1} of {2}" values={[data.total?(page-1)*10+1:0,Math.min(page*10,data.total),data.total]}/></span><div><button className="rec-button compact" aria-label="Previous appointments page" disabled={page===1} onClick={()=>setPage(value=>value-1)}><ChevronLeft size={16}/><PortalText text="Previous" /></button><span><PortalTemplate text="Page {0} of {1}" values={[page,pages]}/></span><button className="rec-button compact" aria-label="Next appointments page" disabled={page>=pages} onClick={()=>setPage(value=>value+1)}><PortalText text="Next" /><ChevronRight size={16}/></button></div></div>
  </>}
  <PatientDialog patient={patient} clinics={data?.clinics||[]} doctorName={data?.doctor.fullName} close={()=>setSelected(null)} onCancelAppointment={canReceptionistCancel ? cancelAppointment : undefined} cancelBusy={cancelBusy}/>
 </section>;
}
