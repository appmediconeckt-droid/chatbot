import { PortalText, PortalElement } from "../../../common/PortalTranslation";
import React, { useState } from "react";
import { useDoctorUser } from "../../doctorApi.js";
import axios from "../../../../axiosConfig.js";
import { API_BASE_URL, getAuthToken } from "../../doctorApi.js";
import "./ClinicSettings.css";
import "../../ClinicQrPages.css";
import ClinicFeeFields from '../../ClinicFeeFields.jsx';
import { feeCurrency, validFee } from '../../../../utils/consultationCurrency.js';

export default function ClinicSettings() {
  const [clinicName, setClinicName] = useState("");
  const [fee, setFee] = useState('');
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [savedQr, setSavedQr] = useState(null);

  const authUser = useDoctorUser();
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('authUser') || 'null') : null;
  const user = authUser || storedUser;
  
  const extractDoctorId = (userObj) => {
    if (!userObj) return '';
    return (
      userObj.id ||
      userObj.user_id ||
      userObj.doctor_id ||
      userObj._id ||
      userObj.userId ||
      userObj.doctorId ||
      userObj.Id ||
      ''
    );
  };
  
  const doctorId = extractDoctorId(user);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Unable to fetch current location")
    );
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 1);
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage('Choose a JPG, PNG or WebP clinic image of 5 MB or smaller.');
      setStatus('failed'); e.target.value = ''; return;
    }
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPhotos(files);

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSave = async () => {
    if (status === 'loading' || status === 'succeeded') return;
    const token = getAuthToken();

    if (!clinicName || !phone || !address || !doctorId) {
      const missingFields = [];
      if (!clinicName) missingFields.push('Clinic Name');
      if (!phone) missingFields.push('Phone');
      if (!address) missingFields.push('Address');
      if (!doctorId) missingFields.push('Doctor ID (not logged in or ID missing)');
      
      const errorMsg = `Missing: ${missingFields.join(', ')}. Doctor ID: "${doctorId}"`;
      setMessage(errorMsg);
      setStatus('failed');
      console.log('Validation failed:', errorMsg);
      return;
    }

    if (fee !== '' && !validFee(fee, feeCurrency(user || {}))) {
      setMessage('Enter a valid clinic fee in your profile currency.'); setStatus('failed'); return;
    }
    const formData = new FormData();
    formData.append('fee', fee);
    formData.append('doctor_id', doctorId);
    formData.append('clinic_name', clinicName);
    formData.append('phone_number', phone);
    formData.append('location', address);

    if (photos[0]) formData.append('clinic_photo', photos[0]);

    try {
      setStatus('loading');
      setMessage('Creating clinic...');

      const response = await axios.post(`${API_BASE_URL}/clinics`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStatus('succeeded');
      setMessage('Clinic created successfully. Its walk-in QR is ready.');
      setSavedQr({ ...response.data, name: clinicName });
    } catch (error) {
      setStatus('failed');
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create clinic';
      setMessage(errorMessage);
      console.error('Clinic creation error:', error);
    }
  };

  const handleCancel = () => {
    setFee('');
    setClinicName("");
    setPhone("");
    setAddress("");
    setLocation({ lat: null, lng: null });
    setPhotos([]);
    setPreviewUrls([]);
    setStatus('idle');
    setMessage('');
    setSavedQr(null);
  };

  return (
    <div className="clinic-settings">
      <div className="clinic-settings-container">
        <div className="clinic-header">
          <h2><PortalText text={"Clinic Settings"} /></h2>
          <p><PortalText text={"Manage your clinic information and location"} /></p>
        </div>

        <div className="clinic-form">
          <ClinicFeeFields value={fee} onChange={setFee} doctor={user} />
          {/* Clinic Name */}
          <div className="form-group">
            <label className="form-label">
              <span className="required-star">*</span><PortalText text={" Clinic Name"} /></label>
            <PortalElement as="input"
              type="text"
              className="form-input"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Enter clinic name"
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">
              <span className="required-star">*</span><PortalText text={" Phone Number"} /></label>
            <PortalElement as="input"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              maxLength={10}
            />
          </div>

          {/* Location Section */}
          <div className="form-section">
            <div className="section-header">
              <h3><PortalText text={"📍 Location Details"} /></h3>
              <span className="required-badge"><PortalText text={"Required"} /></span>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <span className="required-star">*</span><PortalText text={" Full Address"} /></label>
              <PortalElement as="textarea"
                className="form-textarea"
                placeholder="Enter complete clinic address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows="3"
              />
            </div>

            <button className="btn-location" onClick={getCurrentLocation}><PortalText text={"📍 Get Current Location"} /></button>

            {location.lat && (
              <div className="location-coordinates">
                <div className="coord-box">
                  <span className="coord-label"><PortalText text={"Latitude:"} /></span>
                  <span className="coord-value">{location.lat}</span>
                </div>
                <div className="coord-box">
                  <span className="coord-label"><PortalText text={"Longitude:"} /></span>
                  <span className="coord-value">{location.lng}</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Photos */}
          <div className="form-section">
            <div className="section-header">
              <h3><PortalText text={"📸 Clinic Photos"} /></h3>
              <span className="optional-badge"><PortalText text={"Optional"} /></span>
            </div>
            
            <div className="upload-area">
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="upload-input"
                />
                <div className="upload-content">
                  <span className="upload-icon">📷</span>
                  <p><PortalText text={"Click to upload clinic image"} /></p>
                  <small><PortalText text={"Supports JPG, PNG, WebP (Max 5MB)"} /></small>
                </div>
              </label>
            </div>
          </div>

          {/* Photo Preview */}
          {previewUrls.length > 0 && (
            <div className="photo-preview-section">
              <h4><PortalText text={"Photo Preview ("} />{previewUrls.length})</h4>
              <div className="preview-grid">
                {previewUrls.map((src, i) => (
                  <div className="preview-card" key={i}>
                    <img src={src} alt={`preview-${i}`} />
                    <div className="preview-info">
                      <span><PortalText text={"Photo "} />{i + 1}</span>
                      <button 
                        className="remove-photo"
                        onClick={() => {
                          const newPhotos = photos.filter((_, index) => index !== i);
                          const newUrls = previewUrls.filter((_, index) => index !== i);
                          setPhotos(newPhotos);
                          setPreviewUrls(newUrls);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`alert-message alert-${status}`}>
              {status === 'loading' && <span className="alert-icon">⏳</span>}
              {status === 'succeeded' && <span className="alert-icon">✅</span>}
              {status === 'failed' && <span className="alert-icon">❌</span>}
              <span>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          {savedQr?.walkinQrCode && <section className="clinic-qr-management">
            <h3>{savedQr.name}<PortalText text={" — Walk-in QR"} /></h3>
            <p><PortalText text={"Print this QR at this clinic. Patients will join this doctor's queue here."} /></p>
            <img src={savedQr.walkinQrCode} width="220" height="220" alt={`Walk-in QR for ${savedQr.name}`} />
            <p><a href={savedQr.walkinQrCode} download={`clinic-${savedQr.doctorClinicId}-qr.png`}><PortalText text={"Download QR"} /></a> · <a href={savedQr.walkinQrUrl} target="_blank" rel="noreferrer"><PortalText text={"Open walk-in page"} /></a></p>
          </section>}
          <div className="action-buttons">
            <button className="btn-cancel" disabled={status === 'loading'} onClick={handleCancel}>
              {status === 'succeeded' ? <PortalText text={"Add another clinic"} /> : <PortalText text={"Cancel"} />}
            </button>
            <button className="btn-save" disabled={status === 'loading' || status === 'succeeded'} onClick={handleSave}>
              {status === 'loading' ? <PortalText text={"Saving..."} /> : <PortalText text={"Save Clinic"} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
