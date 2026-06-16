import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { API_BASE_URL } from "../axiosConfig";
import { sendLocationSilently } from "./locationHelper";
import "./GoogleAuthButton.css";

// Branded Google sign-in surface. We render Google's official iframe button
// (the backend verifies the id_token JWT it returns, which is what the OAuth2
// google-auth-library expects), but wrap it in a polished container so it
// looks like a first-class part of the form, not a tiny add-on.
const GoogleAuthButton = ({
  role,
  text = "signin_with",
  mode,
  onSuccess,
  onConflict,
  onError,
  disabled = false,
  locationEvent = "login",
  gateDriven = false,
}) => {
  const [busy, setBusy] = useState(false);
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  // text overrides — "mode" prop is the friendly API; we map it to the
  // library's enum.
  const buttonText =
    mode === "signup" ? "signup_with" : mode === "signin" ? "signin_with" : text;

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      onError?.("No credential returned by Google");
      return;
    }

    setBusy(true);
    try {
      const selectedRole = role || localStorage.getItem("role") || "user";

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/google`,
        { idToken, role: selectedRole },
        { withCredentials: true },
      );

      const data = response.data || {};
      const userRole = data.role || data.user?.role || selectedRole;
      const isCounselor =
        userRole.toLowerCase() === "counselor" ||
        userRole.toLowerCase() === "counsellor";

      const token = data.accessToken || data.token;
      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("token", token);
      }
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      localStorage.setItem("userRole", userRole);
      localStorage.setItem("isAuthenticated", "true");

      const user = data.user || data;
      if (user) {
        localStorage.setItem("userData", JSON.stringify(user));
        if (user.email) localStorage.setItem("userEmail", user.email);
        const id = user._id || user.id;
        if (id) {
          localStorage.setItem("userId", id);
          if (isCounselor) {
            localStorage.setItem("counsellorId", id);
            localStorage.setItem("counselorId", id);
          }
        }
      }

      localStorage.removeItem("role");

      if (!gateDriven) {
        sendLocationSilently(locationEvent);
      }

      onSuccess?.({ isCounselor, user });
    } catch (err) {
      if (err.response?.status === 409) {
        const conflictEmail = err.response?.data?.email || "";
        onConflict?.({ email: conflictEmail });
        setBusy(false);
        return;
      }
      // Role mismatch: the Google account exists in the DB under a different
      // role than what the user selected on the role-selector. Surface a
      // clear, actionable message — backend sends actualRole/requestedRole.
      if (
        err.response?.status === 403 &&
        err.response?.data?.code === "ROLE_MISMATCH"
      ) {
        const actual = err.response.data.actualRole;
        const requested = err.response.data.requestedRole;
        onError?.(
          `This Google account is registered as ${actual}. You selected ${requested}. Please go back and pick the ${actual} role.`,
        );
        setBusy(false);
        return;
      }
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Google sign-in failed. Please try again.";
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!hasGoogleClientId) {
    return (
      <div className="g-auth-wrap g-auth-wrap-disabled">
        <button type="button" className="g-auth-missing-btn" disabled>
          Google sign-in unavailable
        </button>
      </div>
    );
  }

  return (
    <div
      className={`g-auth-wrap ${disabled ? "g-auth-wrap-disabled" : ""} ${busy ? "g-auth-wrap-busy" : ""}`}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Google sign-in was cancelled or failed")}
        text={buttonText}
        shape="rectangular"
        theme="outline"
        size="large"
        width="320"
        auto_select={false}
        context="use"
        logo_alignment="left"
      />
      {busy && <span className="g-auth-wrap-spinner" aria-hidden="true" />}
    </div>
  );
};

export default GoogleAuthButton;
