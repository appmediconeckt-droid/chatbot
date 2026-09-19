import React, { useEffect, useMemo, useState } from "react";
import { useDoctorUser } from "../../doctorApi.js";
import "./PaymentSettings.css";

const DEFAULT_SETTINGS = {
  onlinePayment: true,
  upiBank: false,
  cash: true,
  upiId: "",
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
};

export default function PaymentSettings() {
  const authUser = useDoctorUser();
  const currentUser = useMemo(() => {
    if (authUser) return authUser;
    try {
      return JSON.parse(localStorage.getItem("userData") || "null") || {};
    } catch {
      return {};
    }
  }, [authUser]);
  const doctorId = currentUser.doctor_id || currentUser.doctorId || currentUser.id || currentUser._id || "doctor";
  const storageKey = `doctorPaymentSettings:${doctorId}`;
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored });
    } catch {
      setError("Saved payment settings could not be read.");
    }
  }, [storageKey]);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
    setError("");
  };

  const validate = () => {
    if (!settings.onlinePayment && !settings.upiBank && !settings.cash) {
      return "Keep at least one payment method available.";
    }
    if (settings.upiBank && !settings.upiId.trim() && !(settings.accountHolder.trim() && settings.accountNumber.trim() && settings.ifscCode.trim())) {
      return "Enter a UPI ID or complete bank account details.";
    }
    return "";
  };

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(settings));
    setSaved(true);
    setError("");
  };

  const methods = [
    { key: "onlinePayment", title: "Online Payment", description: "Accept card and online appointment payments.", icon: "fa-credit-card" },
    { key: "upiBank", title: "UPI / Bank Transfer", description: "Accept payments using UPI or bank account details.", icon: "fa-building-columns" },
    { key: "cash", title: "Cash Payment", description: "Allow patients to pay cash at the clinic.", icon: "fa-money-bill-wave" },
  ];

  return (
    <section className="payment-container doctor-payment-settings">
      <header className="doctor-payment-header">
        <div>
          <span className="doctor-payment-eyebrow">Billing preferences</span>
          <h2 className="heading">Payment Settings</h2>
          <p>Choose how patients can pay for appointments and consultations.</p>
        </div>
        <div className="doctor-payment-security"><i className="fa-solid fa-shield-halved" /> Secure settings</div>
      </header>

      <div className="doctor-payment-methods">
        {methods.map((method) => {
          const enabled = settings[method.key];
          return (
            <div className={`doctor-payment-method ${enabled ? "enabled" : ""}`} key={method.key}>
              <div className="doctor-payment-method-icon"><i className={`fa-solid ${method.icon}`} /></div>
              <div className="doctor-payment-method-copy">
                <strong>{method.title}</strong>
                <span>{method.description}</span>
              </div>
              <span className={`doctor-payment-status ${enabled ? "on" : "off"}`}>{enabled ? "Available" : "Unavailable"}</span>
              <label className="doctor-payment-switch">
                <input type="checkbox" checked={enabled} onChange={(event) => updateSetting(method.key, event.target.checked)} />
                <span aria-hidden="true" />
                <span className="visually-hidden">Toggle {method.title}</span>
              </label>
            </div>
          );
        })}
      </div>

      {settings.upiBank && (
        <div className="doctor-bank-panel">
          <div className="doctor-bank-panel-title">
            <div><i className="fa-solid fa-building-columns" /></div>
            <span><strong>UPI & Bank Details</strong><small>Enter either a UPI ID or bank account details.</small></span>
          </div>
          <div className="doctor-payment-form-grid">
            <label className="wide">UPI ID<input value={settings.upiId} onChange={(event) => updateSetting("upiId", event.target.value)} placeholder="doctor@upi" /></label>
            <label>Account Holder<input value={settings.accountHolder} onChange={(event) => updateSetting("accountHolder", event.target.value)} placeholder="Account holder name" /></label>
            <label>Bank Name<input value={settings.bankName} onChange={(event) => updateSetting("bankName", event.target.value)} placeholder="Bank name" /></label>
            <label>Account Number<input inputMode="numeric" value={settings.accountNumber} onChange={(event) => updateSetting("accountNumber", event.target.value.replace(/\D/g, ""))} placeholder="Account number" /></label>
            <label>IFSC Code<input value={settings.ifscCode} onChange={(event) => updateSetting("ifscCode", event.target.value.toUpperCase())} placeholder="ABCD0123456" maxLength={11} /></label>
          </div>
        </div>
      )}

      {error && <div className="doctor-payment-message error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
      {saved && <div className="doctor-payment-message success"><i className="fa-solid fa-circle-check" /> Payment settings saved successfully.</div>}

      <footer className="doctor-payment-actions">
        <span>Changes apply to this doctor profile.</span>
        <button type="button" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Save Payment Settings</button>
      </footer>
    </section>
  );
}
