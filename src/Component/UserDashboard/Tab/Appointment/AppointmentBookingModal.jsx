import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { API_BASE_URL } from '../../../../axiosConfig';
import './AppointmentBookingModal.css';

const getCurrentUserId = () => {
  return localStorage.getItem('userId') || localStorage.getItem('user_id') || '';
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AppointmentBookingModal = ({ doctorData, onClose }) => {
  const location = useLocation();
  // Doctor passed in via prop (modal) or router state
  const incoming = doctorData || location.state?.doctor || location.state?.selectedCounselor || null;

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [clinicOpen, setClinicOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [selectedModeId, setSelectedModeId] = useState('in-clinic');
  const [appointmentLocation, setAppointmentLocation] = useState(incoming?.location || '');
  const [availabilityRanges, setAvailabilityRanges] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'payment' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [token, setToken] = useState(null);
  const [apiClinics, setApiClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);

  const doctorId = incoming?.id || incoming?._id || doctorData?.id || doctorData?._id;

  const doctor = {
    id: doctorId,
    name: incoming?.name || incoming?.fullName || 'Dr. Sarah Jenkins',
    specialty: incoming?.specialization || incoming?.specialty || 'Cardiologist',
    experience: incoming?.experience ? (String(incoming.experience).includes('Year') || String(incoming.experience).includes('year') ? incoming.experience : `${incoming.experience} Years Exp`) : '15 Years Exp',
    rating: incoming?.rating || 4.9,
    reviews: incoming?.reviews || '120+ reviews',
    languages: Array.isArray(incoming?.languages) ? incoming.languages.join(', ') : (incoming?.languages || 'English, Hindi'),
    nextAvailable: incoming?.nextAvailable || 'Today',
    consultationFee: incoming?.consultationFee ?? incoming?.fee ?? incoming?.consultation_fee ?? 150,
    profilePhoto: incoming?.profilePhoto?.url || (typeof incoming?.profilePhoto === 'string' ? incoming?.profilePhoto : null) || incoming?.avatar || null,
  };

  const getDoctorInitials = (name = '') => {
    const cleaned = String(name).replace(/^Dr\.?\s+/i, '').trim();
    if (!cleaned) return 'DR';
    return cleaned.slice(0, 2).toUpperCase();
  };

  // Real patient info from localStorage or /api/auth/getUser/:id
  const [patientInfo, setPatientInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('userData') || localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const id = getCurrentUserId();
    if (!id) return;
    axios.get(`${API_BASE_URL}/api/auth/getUser/${id}`, { headers: getAuthHeaders() })
      .then((res) => {
        const u = res.data?.user || res.data?.data || res.data;
        if (u) setPatientInfo(u);
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  const pt = patientInfo || {};
  const patient = {
    name: `${pt.full_name || pt.fullName || pt.name || 'You'} (You)`,
    email: pt.email || '—',
    phone: pt.contact_number || pt.phoneNumber || pt.phone || pt.phone_number || pt.mobile || '—',
  };

  // Fetch clinics for this doctor from /api/clinics?doctor_id=
  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    setClinicsLoading(true);

    axios.get(`${API_BASE_URL}/api/clinics`, {
      params: { doctor_id: doctorId },
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.clinics || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setApiClinics(list);
        if (list.length > 0) {
          setSelectedClinicId(list[0]._id || list[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Error fetching clinics for doctor:', err);
          setApiClinics([]);
        }
      })
      .finally(() => {
        if (!cancelled) setClinicsLoading(false);
      });

    return () => { cancelled = true; };
  }, [doctorId]);

  const mapClinic = (c, i) => ({
    id: c._id || c.id || `clinic-${i + 1}`,
    name: c.clinic_name || c.name || 'Clinic',
    address: c.location || c.address || c.city || 'Clinic Address',
    phone: c.phone_number || c.phone || '',
    days: c.days || c.available_days || c.working_days || 'Mon - Fri',
    timings: c.timings || c.hours || c.working_hours || '9:00 AM - 5:00 PM',
    fee: c.fee ?? c.consultation_fee ?? c.consultationFee ?? doctor.consultationFee ?? 100,
  });

  const clinics = apiClinics.length
    ? apiClinics.map(mapClinic)
    : [{ id: null, name: 'No clinic available', address: incoming?.location || '', days: '—', timings: '—', fee: doctor.consultationFee || 0 }];

  const hasClinics = apiClinics.length > 0;

  // Default the selected clinic to the first real one once loaded
  useEffect(() => {
    if (apiClinics.length && !selectedClinicId) {
      setSelectedClinicId(apiClinics[0]._id || apiClinics[0].id);
    }
  }, [apiClinics, selectedClinicId]);

  // Consultation modes (selectable)
  const modes = [
    { id: 'in-clinic', name: 'In-Clinic Visit', desc: 'Visit the clinic in person for consultation', icon: 'fa-hospital', fee: 0 },
    { id: 'video', name: 'Video Consultation', desc: 'Connect with doctor via video call', icon: 'fa-video', fee: 10 },
    { id: 'voice', name: 'Voice Consultation', desc: 'Talk with your doctor over a voice call', icon: 'fa-phone', fee: 5 },
  ];

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId) || clinics[0];
  const selectedMode = modes.find((m) => m.id === selectedModeId) || modes[0];
  const totalFee = (Number(selectedClinic?.fee) || 0) + (Number(selectedMode?.fee) || 0);

  // Auto-populate location field if clinic changes
  useEffect(() => {
    if (selectedClinic?.address && !appointmentLocation) {
      setAppointmentLocation(selectedClinic.address);
    }
  }, [selectedClinic]);

  // Fetch Availability ranges
  useEffect(() => {
    if (!doctorId) {
      setAvailabilityRanges([]);
      setUnavailableDates([]);
      return;
    }
    let cancelled = false;
    setAvailabilityLoading(true);
    setSelectedTime(null);

    const params = { doctor_id: doctorId };
    if (selectedClinicId) {
      params.clinic_id = selectedClinicId;
    }

    // Try /api/availability/available first (public/patient endpoint)
    axios.get(`${API_BASE_URL}/api/availability/available`, {
      headers: getAuthHeaders(),
      params,
    })
      .then((response) => {
        if (cancelled) return;
        const ranges = response.data?.availableRanges || response.data?.existingRanges || response.data?.data || [];
        setAvailabilityRanges(ranges);
        setUnavailableDates(response.data?.unavailableDates || []);
      })
      .catch(() => {
        // Fallback to /api/availability/ranges
        if (cancelled) return;
        axios.get(`${API_BASE_URL}/api/availability/ranges`, {
          headers: getAuthHeaders(),
          params,
        })
          .then((res2) => {
            if (cancelled) return;
            setAvailabilityRanges(res2.data?.existingRanges || res2.data?.availableRanges || res2.data?.data || []);
            setUnavailableDates(res2.data?.unavailableDates || []);
          })
          .catch(() => {
            if (!cancelled) {
              setAvailabilityRanges([]);
              setUnavailableDates([]);
            }
          });
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });

    return () => { cancelled = true; };
  }, [doctorId, selectedClinicId]);

  const rangesForDate = (iso, weekday) => {
    const isUnavailable = unavailableDates.some((item) => String(item?.date || item?.unavailable_date || item).slice(0, 10) === iso);
    if (isUnavailable) return [];
    return availabilityRanges.filter((range) => {
      const rangeDate = String(range.date || range.availability_date || '').slice(0, 10);
      const recurrence = String(range.recurrence || '').toLowerCase();
      if (range.is_unavailable === true || Number(range.is_unavailable) === 1) return false;
      return rangeDate ? rangeDate === iso : (recurrence !== 'date' && range.weekday != null && range.weekday !== '' && Number(range.weekday) === weekday);
    });
  };

  const formatMinutes = (minutes) => {
    const hour24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hour24 % 12 || 12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${hour24 >= 12 ? 'PM' : 'AM'}`;
  };

  const slotsForDate = (date) => {
    if (!date) return [];
    const slots = new Map();
    const applicableRanges = rangesForDate(date.iso, date.weekday);

    // If specific ranges exist for this doctor/clinic
    if (applicableRanges.length > 0) {
      applicableRanges.forEach((range) => {
        const [startHour, startMinute] = String(range.start_time || '09:00').split(':').map(Number);
        const [endHour, endMinute] = String(range.end_time || '17:00').split(':').map(Number);
        const start = startHour * 60 + (startMinute || 0);
        const end = endHour * 60 + (endMinute || 0);
        const duration = Math.max(1, Number(range.slot_duration || 15));
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
        for (let cursor = start; cursor + duration <= end; cursor += duration) {
          slots.set(cursor, { time: formatMinutes(cursor), minutes: cursor, disabled: false });
        }
      });
    }

    return Array.from(slots.values()).sort((a, b) => a.minutes - b.minutes);
  };

  // Calendar dates — next 7 days starting today
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const calendarDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ranges = rangesForDate(iso, d.getDay());
    // If ranges exist, status is available if ranges > 0; if no custom ranges configured, allow weekdays (Mon-Sat)
    const isAvailable = ranges.length > 0;
    return {
      date: d.getDate(),
      day: dayNames[d.getDay()],
      label: `${monthNames[d.getMonth()]} ${d.getDate()}`,
      iso,
      weekday: d.getDay(),
      status: isAvailable ? 'available' : 'unavailable',
    };
  });
  const calendarMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Default the selected date to the first available day
  useEffect(() => {
    if (availabilityLoading) return;
    const stillAvailable = selectedDate && calendarDates.some((date) => date.iso === selectedDate.iso && date.status === 'available');
    if (!stillAvailable) {
      setSelectedDate(calendarDates.find((date) => date.status === 'available') || calendarDates[0] || null);
    }
  }, [availabilityLoading, availabilityRanges, unavailableDates, selectedClinicId]);

  const legend = [
    { label: 'Available', className: 'available' },
    { label: 'Limited', className: 'limited' },
    { label: 'Unavailable', className: 'unavailable' },
    { label: 'Selected', className: 'selected' },
  ];

  const selectedDateSlots = slotsForDate(selectedDate);
  const slotGroups = [
    { label: 'Morning', icon: true, slots: selectedDateSlots.filter((slot) => slot.minutes < 720) },
    { label: 'Afternoon', slots: selectedDateSlots.filter((slot) => slot.minutes >= 720 && slot.minutes < 1020) },
    { label: 'Evening', slots: selectedDateSlots.filter((slot) => slot.minutes >= 1020) },
  ].filter((group) => group.slots.length);

  const handleDateSelect = (d) => {
    if (d.status !== 'unavailable') {
      setSelectedDate(d);
      setSelectedTime(null);
    }
  };

  const handleTimeSelect = (slot) => {
    if (!slot.disabled) setSelectedTime(slot.time);
  };

  const paymentMethods = [
    { id: 'Card', label: 'Credit/Debit Card', icon: 'fa-credit-card' },
    { id: 'UPI', label: 'UPI Payment', icon: 'fa-mobile-screen-button' },
    { id: 'Cash', label: 'Cash at Clinic', icon: 'fa-money-bill-wave' },
    { id: 'Insurance', label: 'Insurance', icon: 'fa-shield-heart' },
  ];

  const dateStr = selectedDate ? `${selectedDate.day}, ${selectedDate.label}` : '';
  const patientName = patient.name.replace(' (You)', '') || 'Not Provided';

  const goToPayment = () => {
    if (selectedDate && selectedTime && hasClinics && appointmentLocation.trim()) {
      setStep('payment');
    }
  };

  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');

  // Convert "09:30 AM" / "01:30 PM" -> "09:30:00" / "13:30:00" for MySQL TIME
  const to24Hour = (t) => {
    if (!t) return '09:00:00';
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return t.length === 5 ? `${t}:00` : t;
    let hour = parseInt(m[1], 10);
    const min = m[2];
    const ampm = m[3].toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${min}:00`;
  };

  const confirmBooking = async () => {
    if (!hasClinics) {
      setBookError('This doctor has no clinic available, so the appointment cannot be booked.');
      return;
    }
    setBooking(true);
    setBookError('');

    const formattedTime = to24Hour(selectedTime);
    const isoDate = `${selectedDate?.iso}T${formattedTime}+05:30`;

    const payload = {
      doctor_id: doctorId,
      counselorId: doctorId,
      patient_id: getCurrentUserId(),
      appointment_date: selectedDate?.iso || null,
      appointment_time: formattedTime,
      date: isoDate,
      clinic_id: selectedClinic.id,
      clinic: selectedClinic.name,
      location: appointmentLocation.trim(),
      patient_location: appointmentLocation.trim(),
      appointment_location: appointmentLocation.trim(),
      consultation_mode: selectedMode.id,
      fee: totalFee,
      payment_method: paymentMethod,
      notes: `Consultation: ${selectedMode.name} at ${selectedClinic.name}. Location: ${appointmentLocation.trim()}`,
      booking_source: 'online',
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/appointments`, payload, {
        headers: getAuthHeaders(),
      });
      const data = res.data?.data || res.data || {};
      const respToken = data.token ?? data.token_number ?? data.queue_token;
      setToken(respToken ?? null);
      setStep('success');
    } catch (err) {
      setBookError(err.response?.data?.message || err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const bookAnother = () => onClose?.();

  // After success, auto-return after 6 seconds
  useEffect(() => {
    if (step === 'success') {
      const t = setTimeout(() => onClose?.(), 6000);
      return () => clearTimeout(t);
    }
  }, [step, onClose]);

  const summarySteps = [
    {
      key: 'datetime',
      icon: 'fa-calendar',
      label: 'Date & Time',
      value: selectedDate && selectedTime ? `${selectedDate.day}, ${selectedDate.label} • ${selectedTime}` : null,
      active: false,
    },
    {
      key: 'clinic',
      icon: 'fa-hospital',
      label: 'Selected Clinic',
      value: selectedClinic.name,
      active: false,
    },
    {
      key: 'location',
      icon: 'fa-location-dot',
      label: 'Location',
      value: appointmentLocation.trim() || null,
      active: false,
    },
    {
      key: 'mode',
      icon: selectedMode.icon,
      label: 'Consultation Mode',
      value: `${selectedMode.name}${selectedMode.fee > 0 ? ` +$${selectedMode.fee}` : ''}`,
      active: false,
    },
    {
      key: 'patient',
      icon: 'fa-user',
      label: 'Patient Info',
      value: patient.name.replace(' (You)', ''),
      active: false,
    },
    { key: 'review', icon: 'fa-clipboard-check', label: 'Review', value: null, active: false },
    { key: 'payment', icon: 'fa-credit-card', label: 'Payment', value: null, active: false },
  ];

  /* ===== Success screen ===== */
  if (step === 'success') {
    return (
      <div className="abm-modal-overlay" onClick={onClose}>
        <div className="abm-modal-container" onClick={(e) => e.stopPropagation()}>
          <button className="abm-modal-close-btn" onClick={onClose} type="button" aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="abm-page abm-success-page">
            <div className="abm-success">
              <div className="abm-success-hero">
                <div className="abm-success-icon"><i className="fa-solid fa-check"></i></div>
                <h2 className="abm-success-title">Appointment Booked Successfully!</h2>
                <p className="abm-success-sub">A confirmation notification with all the details has been generated for you.</p>
              </div>

              <div className="abm-success-card">
                <div className="abm-success-token">
                  <div className="abm-success-token-left">
                    <span className="abm-success-token-label"><i className="fa-solid fa-ticket"></i> Token Number</span>
                    <span className="abm-success-token-note">Arrive 15 minutes early</span>
                  </div>
                  <span className="abm-success-token-num">{token != null ? `#${token}` : 'Pending'}</span>
                </div>

                <div className="abm-success-grid">
                  <div className="abm-pay-row"><span><i className="fa-solid fa-user"></i> Patient</span><strong>{patientName}</strong></div>
                  <div className="abm-pay-row"><span><i className="fa-solid fa-user-doctor"></i> Doctor</span><strong>{doctor.name}</strong></div>
                  <div className="abm-pay-row"><span><i className="fa-solid fa-hospital"></i> Clinic</span><strong>{selectedClinic.name}</strong></div>
                  <div className="abm-pay-row"><span><i className="fa-solid fa-location-dot"></i> Location</span><strong>{appointmentLocation}</strong></div>
                  <div className="abm-pay-row"><span><i className={`fa-solid ${selectedMode.icon}`}></i> Consultation Mode</span><strong>{selectedMode.name}</strong></div>
                  <div className="abm-pay-row"><span><i className="fa-regular fa-calendar"></i> Date</span><strong>{dateStr}</strong></div>
                  <div className="abm-pay-row"><span><i className="fa-regular fa-clock"></i> Time</span><strong>{selectedTime}</strong></div>
                </div>

                <div className="abm-pay-row abm-pay-total abm-success-total"><span>Total Fee</span><strong>${totalFee}</strong></div>
              </div>

              <button className="abm-confirm abm-success-btn" onClick={bookAnother}>
                <i className="fa-solid fa-plus"></i> Book Another Appointment
              </button>
              <div className="abm-success-redirect">
                <i className="fa-solid fa-rotate-right"></i> Closing dialog shortly…
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Review & Payment screen ===== */
  if (step === 'payment') {
    return (
      <div className="abm-modal-overlay" onClick={onClose}>
        <div className="abm-modal-container" onClick={(e) => e.stopPropagation()}>
          <button className="abm-modal-close-btn" onClick={onClose} type="button" aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="abm-page abm-pay-page">
            <div className="abm-pay">
              <div className="abm-pay-header">
                <h2 className="abm-pay-heading">Review &amp; Payment</h2>
                <p className="abm-pay-subheading">Please review your appointment details before confirming</p>
              </div>

              <div className="abm-pay-grid">
                {/* Left: details + payment */}
                <div className="abm-pay-main">
                  {/* Appointment summary */}
                  <div className="abm-pay-card">
                    <h3 className="abm-pay-card-title"><i className="fa-regular fa-calendar-check"></i> Appointment Summary</h3>
                    <div className="abm-pay-rows2">
                      <div className="abm-pay-row"><span><i className="fa-solid fa-user"></i> Patient</span><strong>{patientName}</strong></div>
                      <div className="abm-pay-row"><span><i className="fa-solid fa-user-doctor"></i> Doctor</span><strong>{doctor.name}</strong></div>
                      <div className="abm-pay-row"><span><i className="fa-solid fa-hospital"></i> Clinic</span><strong>{selectedClinic.name}</strong></div>
                      <div className="abm-pay-row"><span><i className="fa-solid fa-location-dot"></i> Location</span><strong>{appointmentLocation}</strong></div>
                      <div className="abm-pay-row"><span><i className={`fa-solid ${selectedMode.icon}`}></i> Mode</span><strong>{selectedMode.name}</strong></div>
                      <div className="abm-pay-row"><span><i className="fa-regular fa-calendar"></i> Date</span><strong>{dateStr}</strong></div>
                      <div className="abm-pay-row"><span><i className="fa-regular fa-clock"></i> Time</span><strong>{selectedTime}</strong></div>
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div className="abm-pay-card">
                    <h3 className="abm-pay-card-title"><i className="fa-solid fa-wallet"></i> Choose Payment Method</h3>
                    <div className="abm-pay-methods">
                      {paymentMethods.map((pm) => (
                        <button
                          key={pm.id}
                          className={`abm-pay-method ${paymentMethod === pm.id ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod(pm.id)}
                          type="button"
                        >
                          <span className="abm-pay-method-ic"><i className={`fa-solid ${pm.icon}`}></i></span>
                          <span className="abm-pay-method-label">{pm.label}</span>
                          <span className="abm-pay-method-radio">
                            {paymentMethod === pm.id && <i className="fa-solid fa-check"></i>}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="abm-pay-info">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>Your appointment will be reserved immediately upon confirmation. All details will be stored in your dashboard.</span>
                  </div>
                </div>

                {/* Right: token + fee + confirm (sticky) */}
                <aside className="abm-pay-side">
                  <div className="abm-token-banner">
                    <div className="abm-token-ic"><i className="fa-solid fa-ticket"></i></div>
                    <div className="abm-token-label">Selected Appointment Slot</div>
                    <div className="abm-token-num">{selectedTime || 'Select a time'}</div>
                    <div className="abm-token-note">Your token follows this slot's position in the doctor's daily schedule.</div>
                    <div className="abm-token-note"><i className="fa-regular fa-clock"></i> Arrive 15 minutes early</div>
                  </div>

                  <div className="abm-pay-card">
                    <h3 className="abm-pay-card-title"><i className="fa-solid fa-receipt"></i> Fee Breakdown</h3>
                    <div className="abm-pay-row"><span>Consultation Fee</span><strong>${selectedClinic.fee}</strong></div>
                    {selectedMode.fee > 0 && (
                      <div className="abm-pay-row"><span>{selectedMode.name}</span><strong>+${selectedMode.fee}</strong></div>
                    )}
                    <div className="abm-pay-row abm-pay-total"><span>Total</span><strong>${totalFee}</strong></div>
                  </div>

                  <button className="abm-btn-confirm2 abm-pay-confirm-full" onClick={confirmBooking} disabled={booking} type="button">
                    {booking ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Booking…</>
                    ) : (
                      <><i className="fa-solid fa-lock"></i> Confirm &amp; Book · ${totalFee}</>
                    )}
                  </button>
                  {bookError && <p className="abm-pay-error">{bookError}</p>}
                  <button className="abm-btn-back2 abm-pay-back-full" onClick={() => setStep('select')} disabled={booking} type="button">
                    <i className="fa-solid fa-arrow-left"></i> Back
                  </button>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Step 1: Selection ===== */
  return (
    <div className="abm-modal-overlay" onClick={onClose}>
      <div className="abm-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="abm-modal-close-btn" onClick={onClose} type="button" aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="abm-page">
          <div className="abm-grid">

            {/* Left column (header + date picker) */}
            <div className="abm-left">

              {/* Header row: doctor | clinic+patient stack */}
              <div className="abm-header">
                {/* Doctor Card */}
                <div className="abm-card abm-doctor">
                  <div className="abm-doctor-top">
                    {doctor.profilePhoto ? (
                      <img src={doctor.profilePhoto} alt={doctor.name} className="abm-avatar-img" />
                    ) : (
                      <div className="abm-avatar" style={{ background: '#0d9488' }}>
                        {getDoctorInitials(doctor.name)}
                      </div>
                    )}
                    <div className="abm-doctor-info">
                      <div className="abm-doctor-name">{doctor.name}</div>
                      <div className="abm-doctor-specialty">{doctor.specialty} • {doctor.experience}</div>
                      <div className="abm-doctor-rating">
                        <i className="fa-solid fa-star"></i> {doctor.rating}/5 <span>({doctor.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="abm-doctor-divider"></div>
                  <div className="abm-doctor-badges">
                    <span className="abm-badge"><i className="fa-solid fa-globe"></i> {doctor.languages}</span>
                    <span className="abm-badge"><i className="fa-regular fa-clock"></i> Next available: {doctor.nextAvailable}</span>
                  </div>
                </div>

                {/* Clinic details */}
                <div className="abm-side-stack">
                  <div className="abm-card abm-clinic-details">
                    <div className="abm-cd-title"><i className="fa-solid fa-hospital"></i> Clinic Details</div>
                    <div className="abm-cd-row"><span className="abm-cd-key">Location:</span> {selectedClinic.address || 'Not specified'}</div>
                    <div className="abm-cd-row"><span className="abm-cd-key">Available Days:</span> {selectedClinic.days}</div>
                    <div className="abm-cd-row"><span className="abm-cd-key">Timings:</span> {selectedClinic.timings}</div>
                    <div className="abm-cd-row"><span className="abm-cd-key">Consultation Fee:</span> ${selectedClinic.fee}</div>
                  </div>
                </div>
              </div>

              {/* Clinic + Consultation Mode selectors */}
              <div className="abm-selectors">
                {/* Clinic dropdown */}
                <div className="abm-select">
                  <button className="abm-select-head" type="button" onClick={() => { setClinicOpen(!clinicOpen); setModeOpen(false); }}>
                    <span className="abm-select-icon"><i className="fa-solid fa-hospital"></i></span>
                    <span className="abm-select-headtext">
                      <span className="abm-select-eyebrow">CLINIC</span>
                      <span className="abm-select-current">{selectedClinic.name}</span>
                    </span>
                    <i className={`fa-solid fa-chevron-${clinicOpen ? 'up' : 'down'} abm-select-caret`}></i>
                  </button>

                  {clinicOpen && (
                    <div className="abm-select-body">
                      <div className="abm-select-subtitle"><i className="fa-solid fa-hospital"></i> Select Clinic for {doctor.name}</div>
                      {clinicsLoading && <div className="abm-opt-loading"><i className="fa-solid fa-spinner fa-spin"></i> Loading clinics...</div>}
                      {clinics.map((c) => (
                        <div
                          key={c.id || c.name}
                          className={`abm-opt-card ${selectedClinicId === c.id ? 'selected' : ''}`}
                          onClick={() => {
                            if (c.id) setSelectedClinicId(c.id);
                            if (c.address) setAppointmentLocation(c.address);
                            setClinicOpen(false);
                          }}
                        >
                          <div className="abm-opt-main">
                            <div className="abm-opt-name"><span className="abm-opt-dot"></span> {c.name}</div>
                            <div className="abm-opt-addr">{c.address}</div>
                            <div className="abm-opt-tags">
                              <span className="abm-opt-tag blue"><i className="fa-regular fa-calendar"></i> {c.days}</span>
                              <span className="abm-opt-tag gray"><i className="fa-regular fa-clock"></i> {c.timings}</span>
                              <span className="abm-opt-tag green"><i className="fa-solid fa-money-bill"></i> ${c.fee}</span>
                            </div>
                          </div>
                          {selectedClinicId === c.id && <span className="abm-opt-check"><i className="fa-solid fa-check"></i></span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consultation Mode dropdown */}
                <div className="abm-select">
                  <button className="abm-select-head" type="button" onClick={() => { setModeOpen(!modeOpen); setClinicOpen(false); }}>
                    <span className="abm-select-icon"><i className={`fa-solid ${selectedMode.icon}`}></i></span>
                    <span className="abm-select-headtext">
                      <span className="abm-select-eyebrow">CONSULTATION MODE</span>
                      <span className="abm-select-current">{selectedMode.name}</span>
                    </span>
                    <i className={`fa-solid fa-chevron-${modeOpen ? 'up' : 'down'} abm-select-caret`}></i>
                  </button>

                  {modeOpen && (
                    <div className="abm-select-body">
                      <div className="abm-select-subtitle"><i className="fa-solid fa-comment-medical"></i> Select Consultation Mode</div>
                      {modes.map((m) => (
                        <div
                          key={m.id}
                          className={`abm-opt-card ${selectedModeId === m.id ? 'selected' : ''}`}
                          onClick={() => { setSelectedModeId(m.id); setModeOpen(false); }}
                        >
                          <div className="abm-opt-mode-ic"><i className={`fa-solid ${m.icon}`}></i></div>
                          <div className="abm-opt-main">
                            <div className="abm-opt-name">{m.name}</div>
                            <div className="abm-opt-addr">{m.desc}</div>
                            <span className="abm-opt-fee">Additional Fee: ${m.fee}</span>
                          </div>
                          {selectedModeId === m.id && <span className="abm-opt-check"><i className="fa-solid fa-check"></i></span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="abm-location-field">
                <label htmlFor="appointment-location"><i className="fa-solid fa-location-dot"></i> Appointment Location</label>
                <input
                  id="appointment-location"
                  type="text"
                  value={appointmentLocation}
                  onChange={(event) => setAppointmentLocation(event.target.value)}
                  placeholder="Enter area, address or clinic location"
                  required
                />
              </div>

              <div className="abm-main">
                <div className="abm-section-head">
                  <h3 className="abm-section-title">Choose Appointment Date</h3>
                  <div className="abm-month-nav">
                    <span>{calendarMonthLabel}</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="abm-legend">
                  {legend.map((l) => (
                    <span key={l.label} className="abm-legend-item">
                      <span className={`abm-legend-dot ${l.className}`}></span> {l.label}
                    </span>
                  ))}
                </div>

                {/* Date cards */}
                <div className="abm-dates">
                  {calendarDates.map((d) => {
                    const isSelected = selectedDate?.iso === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        className={`abm-date ${d.status} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleDateSelect(d)}
                        disabled={d.status === 'unavailable'}
                      >
                        <span className="abm-date-day">{d.day}</span>
                        <span className="abm-date-num">{d.date}</span>
                        {d.note && <span className="abm-date-note">{d.note}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="abm-hr"></div>

                {/* Time slots */}
                {availabilityLoading && (
                  <div className="abm-availability-state">
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading doctor availability...
                  </div>
                )}
                {selectedDate && !availabilityLoading && (
                  <div className="abm-times">
                    <h4 className="abm-times-title">Available Times for {selectedDate.day}, {selectedDate.label}</h4>
                    {slotGroups.length > 0 ? (
                      slotGroups.map((group) => (
                        <div className="abm-times-group" key={group.label}>
                          <span className="abm-times-label">
                            {group.icon && <i className="fa-regular fa-clock"></i>} {group.label}
                          </span>
                          <div className="abm-time-slots">
                            {group.slots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                className={`abm-time ${selectedTime === slot.time ? 'selected' : ''}`}
                                onClick={() => handleTimeSelect(slot)}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="abm-availability-state">
                        <i className="fa-regular fa-clock"></i> No specific time slots for this date.
                      </div>
                    )}
                  </div>
                )}
                {!availabilityLoading && !selectedDate && (
                  <div className="abm-availability-state">
                    <i className="fa-regular fa-calendar-xmark"></i> No slots available in the next 7 days for this clinic.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Booking Summary (timeline, sticky) */}
            <aside className="abm-summary">
              <h3 className="abm-summary-title">Booking Summary</h3>
              <div className="abm-summary-doctor">{doctor.name}</div>

              <div className="abm-timeline">
                {summarySteps.map((s) => (
                  <div key={s.key} className={`abm-step ${s.active ? 'active' : ''}`}>
                    <div className="abm-step-icon"><i className={`fa-solid ${s.icon}`}></i></div>
                    <div className="abm-step-body">
                      <div className="abm-step-label">{s.label}</div>
                      {s.value && <div className="abm-step-value">{s.value}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="abm-total">
                <span className="abm-total-label">Total Fee</span>
                <span className="abm-total-amount">${totalFee}.00</span>
              </div>

              {!hasClinics && (
                <p className="abm-no-clinic">
                  <i className="fa-solid fa-circle-exclamation"></i> This doctor has no clinic available yet, so booking isn't possible.
                </p>
              )}

              <button
                className="abm-confirm"
                onClick={goToPayment}
                type="button"
                disabled={!selectedDate || !selectedTime || !hasClinics || !appointmentLocation.trim()}
              >
                Confirm Selection <i className="fa-solid fa-arrow-right"></i>
              </button>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingModal;
