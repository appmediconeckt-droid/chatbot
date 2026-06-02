import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../axiosConfig";
import { captureAndSendLocation } from "../../authtication/locationHelper";
import PasswordChangePage from "../ChangesPassword/PasswordChangePage";
import "./AccountSettings.css";

const emptyAccount = {
  name: "",
  email: "",
  phone: "",
  role: "",
  authProvider: "",
  hasPassword: false,
  profileCompleted: false,
};

const AccountSettings = ({ role = "user", onOpenProfile }) => {
  const [account, setAccount] = useState(emptyAccount);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const isCounselor = role === "counsellor" || role === "counselor";
  const title = isCounselor ? "Counselor Settings" : "Settings";

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const accountId = useMemo(
    () =>
      isCounselor
        ? localStorage.getItem("counsellorId")
        : localStorage.getItem("userId"),
    [isCounselor],
  );

  const fetchAccount = async () => {
    if (!accountId) {
      setNotice({
        type: "error",
        message: "Account ID not found. Please log in again.",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = isCounselor
        ? `${API_BASE_URL}/api/auth/counsellors/${accountId}`
        : `${API_BASE_URL}/api/auth/getUser/${accountId}`;
      const response = await axios.get(url, { headers: authHeaders() });
      const data = isCounselor ? response.data?.counsellor : response.data?.user;

      if (!response.data?.success || !data) {
        throw new Error(response.data?.message || "Failed to load settings.");
      }

      setAccount({
        name: data.fullName || data.name || "",
        email: data.email || "",
        phone: data.phoneNumber || data.phone || "",
        role: data.role || (isCounselor ? "counsellor" : "user"),
        authProvider: data.authProvider || "",
        hasPassword:
          typeof data.hasPassword === "boolean"
            ? data.hasPassword
            : data.authProvider !== "google" || !data.googleId,
        profileCompleted: Boolean(data.profileCompleted),
      });
      setNotice({ type: "", message: "" });
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to load account settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, isCounselor]);

  const handleLocationRefresh = async () => {
    setLocationLoading(true);
    setNotice({ type: "", message: "" });
    try {
      await captureAndSendLocation("manual");
      setNotice({ type: "success", message: "Location updated successfully." });
    } catch (err) {
      setNotice({
        type: "error",
        message: err.message || "Failed to update location.",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePasswordUpdated = ({ hasPassword } = {}) => {
    setAccount((prev) => ({
      ...prev,
      hasPassword: typeof hasPassword === "boolean" ? hasPassword : true,
    }));
    setNotice({
      type: "success",
      message: "Password updated. Please log in again if your session ends.",
    });
  };

  if (loading) {
    return (
      <section className="account-settings">
        <div className="account-settings__loading">Loading settings...</div>
      </section>
    );
  }

  return (
    <section className="account-settings">
      <div className="account-settings__header">
        <div>
          <h1>{title}</h1>
          <p>Manage login security, location, and account preferences.</p>
        </div>
        {onOpenProfile && (
          <button type="button" onClick={onOpenProfile}>
            Edit Profile
          </button>
        )}
      </div>

      {notice.message && (
        <div className={`account-settings__notice ${notice.type}`}>
          {notice.message}
        </div>
      )}

      <div className="account-settings__grid">
        <div className="account-settings__panel">
          <h2>Account</h2>
          <dl className="account-settings__details">
            <div>
              <dt>Name</dt>
              <dd>{account.name || "Not added"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{account.email || "Not added"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{account.phone || "Not added"}</dd>
            </div>
            <div>
              <dt>Login</dt>
              <dd>{account.authProvider === "google" ? "Google" : "Email password"}</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>{account.hasPassword ? "Added" : "Not added"}</dd>
            </div>
          </dl>
        </div>

        <div className="account-settings__panel">
          <h2>Location</h2>
          <p>
            Refresh your location so appointments, safety checks, and counselor
            access use your current details.
          </p>
          <button
            type="button"
            className="account-settings__primary"
            onClick={handleLocationRefresh}
            disabled={locationLoading}
          >
            {locationLoading ? "Updating..." : "Update Location"}
          </button>
        </div>
      </div>

      <PasswordChangePage
        email={account.email}
        hasPassword={account.hasPassword}
        onPasswordUpdated={handlePasswordUpdated}
      />
    </section>
  );
};

export default AccountSettings;
