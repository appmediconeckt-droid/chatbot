export const isProfessionalRole = (role) =>
  ["counselor", "counsellor", "counsellour", "doctor", "consultant"].includes(
    String(role || "").toLowerCase(),
  );

export const dashboardForRole = (role) =>
  String(role || "").toLowerCase() === "doctor" ? "/doctordashboard" :
  isProfessionalRole(role) ? "/counselor-dashboard" : "/user-dashboard";

export function persistAuthSession(data) {
  const user = data?.user || data?.data?.user;
  const token = data?.accessToken || data?.token || data?.data?.accessToken || data?.data?.token;
  const accountRole = String(data?.accountRole || user?.accountRole || data?.data?.accountRole || "")
    .trim()
    .toLowerCase();
  const role = String(
    accountRole === "doctor"
      ? "doctor"
      : data?.role || user?.role || data?.data?.role || accountRole,
  )
    .trim()
    .toLowerCase();
  if (!token || !role) return null;

  const accessRole = role;
  for (const key of ["userData", "userId", "counsellorId", "counselorId", "refreshToken", "role"]) {
    localStorage.removeItem(key);
  }
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("userType", accessRole);
  localStorage.setItem("userRole", accessRole);
  localStorage.setItem("token", token);
  localStorage.setItem("accessToken", token);
  const refreshToken = data?.refreshToken || data?.data?.refreshToken;
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (user) {
    localStorage.setItem("userData", JSON.stringify({ ...user, role }));
    if (user.email) localStorage.setItem("userEmail", user.email);
    const id = user._id || user.id;
    if (id) {
      localStorage.setItem("userId", id);
      if (isProfessionalRole(role)) {
        localStorage.setItem("counsellorId", id);
        localStorage.setItem("counselorId", id);
      }
    }
  }
  return { role: accessRole, path: dashboardForRole(role) };
}
