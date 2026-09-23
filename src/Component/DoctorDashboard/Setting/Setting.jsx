// // SettingsPage.jsx
// import React, { useState } from "react";
// import "./Setting.css";
// import { Link, useNavigate } from "react-router-dom";
// import ProfessionalProfileTable from "./Profile/DoctorProfile";
// import ClinicSettings from "./ClinicSetting/ClinicUpload";
// import ProfileCard from "./SettingProfileQR/profileQR";
// import PaymentSettings from "./PaymentSetting/PaymentSettings";

// export default function SettingsPage() {
//   const [active, setActive] = useState("profile");
//   const [showChangePassword, setShowChangePassword] = useState(false);
//   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🔥 NEW
//   const [deleteSuccess, setDeleteSuccess] = useState(false); // 🔥 NEW

//   const navigate = useNavigate();

//   function MenuItem({ id, icon, label }) {
//     const isActive = active === id;
//     return (
//       <button
//         onClick={() => setActive(id)}
//         className={`settingitem ${isActive ? "active" : ""}`}
//       >
//         <span className="settingicon">{icon}</span>
//         <span className="settingtext">{label}</span>
//       </button>
//     );
//   }

//   return (
//     <div className="settings-ss p-4">
//       <div className="settings-wrapper">
//         {/* Sidebar */}
//         <aside className="set-side">
//           <div className="set-side-box">
//             <div className="header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
//               <h2 className="mb-3">Settings</h2>
//             </div>

//             <MenuItem id="profile" icon="👤" label="Profile" />
//             {/* <MenuItem id="account" icon="🔒" label="Account" /> */}
//             <MenuItem id="clinic" icon="🏥" label="Clinic" />
//             <MenuItem
//               id="payment"
//               icon={<i className="fa-solid fa-credit-card m-lg-1"></i>}
//               label="Payment"
//             />

//             <MenuItem id="profileQR" icon="👤" label="ProfileQR" />

//             <hr className="separator" />

//             <button
//               className="settingitem"
//               onClick={() => setShowChangePassword(true)}
//             >
//               <span className="settingicon">🔑</span> Change Password
//             </button>

//             <button
//               className="settingitem logout"
//               onClick={() => setShowLogoutConfirm(true)}
//             >
//               <span className="settingicon">⛔</span> Logout
//             </button>
//           </div>

//           <div className="set-side-box mt-2">
//             <div className="set-side-sub">More</div>
//             <MenuItem id="Help" label="Help & Support" />
//             <MenuItem id="Privacy" label="Privacy" />

//             {/* 🔥 DELETE ACCOUNT BUTTON */}
//             <button
//               className="more-item text-center"
//               onClick={() => setShowDeleteConfirm(true)}
//             >
//               Delete Account
//             </button>
//           </div>
//         </aside>

//         {/* Content */}
//         <div className="all-tab">
//           <div className="form-box">
//             {active === "profile" && <ProfessionalProfileTable />}
//             {active === "account" && <div>Account</div>}
//             {active === "clinic" && <ClinicSettings />}
//             {active === "payment" && <PaymentSettings />}
//             {active === "profileQR" && <ProfileCard />}
//           </div>
//         </div>
//       </div>

//       {/* Change Password Modal */}
//       {showChangePassword && (
//         <div className="modal-overlay">
//           <div className="modal-box">
//             <div className="modal-title">Change Password</div>
//             <form>
//               <input type="password" placeholder="Current Password" />
//               <input type="password" placeholder="New Password" />
//               <input type="password" placeholder="Confirm Password" />
//               <div className="show">
//                 <button
//                   className="btn-light"
//                   onClick={() => setShowChangePassword(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button className="btn-primary m-lg-2">Save</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Logout Modal */}
//       {showLogoutConfirm && (
//         <div className="modal-overlay">
//           <div className="modal-box">
//             <div className="modal-title">Confirm Logout</div>
//             <p>Are you sure?</p>
//             <div className="show">
//               <button
//                 className="btn-light"
//                 onClick={() => setShowLogoutConfirm(false)}
//               >
//                 Cancel
//               </button>
//               <Link to="/login">
//                 <button className="btn-danger m-lg-2">Logout</button>
//               </Link>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ DELETE ACCOUNT MODAL */}
//       {showDeleteConfirm && (
//         <div className="modal-overlay">
//           <div className="modal-box">
//             <div className="modal-title">Delete Account</div>
//             <p>This action cannot be undone. Are you sure?</p>
//             <div className="show">
//               <button
//                 className="btn-light"
//                 onClick={() => setShowDeleteConfirm(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn-danger m-lg-2"
//                 onClick={() => {
//                   setShowDeleteConfirm(false);
//                   setDeleteSuccess(true);

//                   setTimeout(() => {
//                     navigate("/login"); // redirect
//                   }, 2500);
//                 }}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ DELETE SUCCESS MESSAGE */}
//       {deleteSuccess && (
//         <div className="modal-overlay">
//           <div className="modal-box">
//             <div className="modal-title text-success">Account Deleted!</div>
//             <p>Your account has been deleted successfully.</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState } from "react";
import "./Setting.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../../axiosConfig.js";

import DoctorProfileFlow from "../DoctorProfile/ActivateProfile";
import ClinicSettings from "./ClinicSetting/ClinicUpload";
import ProfileCard from "./SettingProfileQR/profileQR";
import PaymentSettings from "./PaymentSetting/PaymentSettings";
import { API_BASE_URL } from "../doctorApi.js"; // path apne project ke hisab se check kar lena

export default function SettingsPage() {
  const [active, setActive] = useState("profile");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const authUser = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");
  const userId = authUser?.id || authUser?._id;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      alert("Please fill all fields");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/auth/changePassword`,
        {
          oldPassword: passwordData.current_password,
          newPassword: passwordData.new_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Password changed successfully. Please sign in again.");
      localStorage.clear();
      navigate("/login");
      setShowChangePassword(false);
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.log("Change password error:", error);
      alert(error.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      alert("User ID not found");
      return;
    }

    try {
      setLoading(true);

      await axios.delete(`${API_BASE_URL}/auth/delete`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.clear();
      setShowDeleteConfirm(false);
      setDeleteSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      console.log("Delete account error:", error);
      alert(error.response?.data?.message || "Account delete failed");
    } finally {
      setLoading(false);
    }
  };

  function MenuItem({ id, icon, label }) {
    const isActive = active === id;
    return (
      <button
        type="button"
        onClick={() => setActive(id)}
        className={`settingitem ${isActive ? "active" : ""}`}
      >
        <span className="settingicon">{icon}</span>
        <span className="settingtext">{label}</span>
      </button>
    );
  }

  return (
    <div className="settings-ss p-4">
      <div className="settings-wrapper">
        <aside className="set-side">
          <div className="set-side-box">
            <div className="header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
              <h2 className="mb-3">Settings</h2>
            </div>

            <MenuItem id="profile" icon="👤" label="Profile" />
            <MenuItem id="clinic" icon="🏥" label="Clinic" />
            <MenuItem
              id="payment"
              icon={<i className="fa-solid fa-credit-card m-lg-1"></i>}
              label="Payment"
            />
            <MenuItem id="profileQR" icon="👤" label="ProfileQR" />

            <hr className="separator" />

            <button
              type="button"
              className="settingitem"
              onClick={() => setShowChangePassword(true)}
            >
              <span className="settingicon">🔑</span> Change Password
            </button>

            <button
              type="button"
              className="settingitem logout"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <span className="settingicon">⛔</span> Logout
            </button>
          </div>

          <div className="set-side-box mt-2">
            <div className="set-side-sub">More</div>
            <MenuItem id="Help" label="Help & Support" />
            <MenuItem id="Privacy" label="Privacy" />

            <button
              type="button"
              className="more-item text-center"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        </aside>

        <div className="all-tab">
          <div className="form-box">
            {active === "profile" && <DoctorProfileFlow />}
            {active === "clinic" && <ClinicSettings />}
            {active === "payment" && <PaymentSettings />}
            {active === "profileQR" && <ProfileCard />}
            {active === "Help" && (
              <div className="settings-info-panel">
                <h2>Help & Support</h2>
                <p>Use these settings to keep your doctor profile, clinic details, payment options, and QR profile updated.</p>
                <div className="settings-info-grid">
                  <div>
                    <strong>Profile</strong>
                    <span>Update professional details, education, experience, awards, and availability.</span>
                  </div>
                  <div>
                    <strong>Clinic</strong>
                    <span>Add clinic contact information, location, and photos for patients.</span>
                  </div>
                  <div>
                    <strong>Payment</strong>
                    <span>Choose which payment methods are available for appointments.</span>
                  </div>
                </div>
              </div>
            )}
            {active === "Privacy" && (
              <div className="settings-info-panel">
                <h2>Privacy</h2>
                <p>Your doctor profile and clinic information are used to support appointment booking and patient communication.</p>
                <div className="settings-info-grid">
                  <div>
                    <strong>Public Information</strong>
                    <span>Only profile and clinic details intended for patients are displayed publicly.</span>
                  </div>
                  <div>
                    <strong>Account Security</strong>
                    <span>Change your password regularly and log out from shared devices.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">Change Password</div>

            <form onSubmit={handleChangePassword}>
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    current_password: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="New Password"
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value,
                  })
                }
              />

              <div className="show">
                <button
                  type="button"
                  className="btn-light"
                  onClick={() => setShowChangePassword(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="btn-primary m-lg-2" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">Confirm Logout</div>
            <p>Are you sure?</p>
            <div className="show">
              <button
                type="button"
                className="btn-light"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>

              <Link to="/login">
                <button type="button" className="btn-danger m-lg-2">
                  Logout
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">Delete Account</div>
            <p>This action cannot be undone. Are you sure?</p>
            <div className="show">
              <button
                type="button"
                className="btn-light"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-danger m-lg-2"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title text-success">Account Deleted!</div>
            <p>Your account has been deleted successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
}
