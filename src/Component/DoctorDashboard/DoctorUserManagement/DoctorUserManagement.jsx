import { PortalText, PortalElement } from "../../common/PortalTranslation";
import ProfileAvatar from '../../common/ProfileAvatar.jsx';
import { defaultShiftTimes, staffIdentity, staffShiftTiming } from '../../StaffDashboard/staffProfileDetails.js';
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../../axiosConfig.js";
import { useDoctorUser } from "../doctorApi.js";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardClock,
  Download,
  Eye,
  FlaskConical,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
import "./DoctorUserManagement.css";
import { staffPhoneCountries } from '../../../utils/staffPhoneCountries.js';
const staffPhoneCountry = iso => staffPhoneCountries.find(country => country.iso === iso) || staffPhoneCountries.find(country => country.iso === 'IN');

const docStaffScreenRows = [
  {
    id: "#MC-4002",
    name: "Jane Cooper",
    email: "jane.c@example.com",
    department: "Emergency",
    role: "Nurse",
    shift: "Morning",
    verification: "Verified",
    status: "Active",
    lastLogin: "Today, 08:42 AM",
    avatar: "JC",
    avatarTone: "teal",
    profilePhoto: "https://i.pravatar.cc/120?img=47",
    joinDate: "15 Jan 2021",
    manager: "Dr. Sarah Jenkins",
    shiftTime: "06:00 - 14:00",
    permissions: ["Patient Records (View)", "Appointments (Update)", "Messages (Send)"],
  },
  {
    id: "#MC-4105",
    name: "Robert Fox",
    email: "robert.f@example.com",
    department: "Pathology",
    role: "Lab Technician",
    shift: "Night",
    verification: "Pending Docs",
    status: "Active",
    lastLogin: "Yesterday, 10:15 PM",
    avatar: "RF",
    avatarTone: "blue",
    profilePhoto: "https://i.pravatar.cc/120?img=12",
    joinDate: "04 Mar 2022",
    manager: "Dr. Sarah Jenkins",
    shiftTime: "22:00 - 06:00",
    permissions: ["Lab Requests (View)", "Test Results (Update)", "Messages (Send)"],
  },
  {
    id: "#MC-3890",
    name: "Cameron Williamson",
    email: "cameron.w@example.com",
    department: "Finance",
    role: "Billing",
    shift: "Morning",
    verification: "Verified",
    status: "On Leave",
    lastLogin: "Oct 12, 2023",
    avatar: "CW",
    avatarTone: "amber",
    profilePhoto: "https://i.pravatar.cc/120?img=32",
    joinDate: "19 Aug 2020",
    manager: "Dr. Sarah Jenkins",
    shiftTime: "06:00 - 14:00",
    permissions: ["Billing Records (View)", "Invoices (Update)", "Reports (Export)"],
  },
  {
    id: "#MC-4211",
    name: "Jerome Bell",
    email: "jerome.b@example.com",
    department: "Admin",
    role: "Receptionist",
    shift: "Evening",
    verification: "Verified",
    status: "Active",
    lastLogin: "Today, 02:30 PM",
    avatar: "JB",
    avatarTone: "green",
    profilePhoto: "https://i.pravatar.cc/120?img=5",
    joinDate: "28 Nov 2021",
    manager: "Dr. Sarah Jenkins",
    shiftTime: "14:00 - 22:00",
    permissions: ["Front Desk (View)", "Appointments (Create)", "Messages (Send)"],
  },
];

const docStaffScreenStats = [
  {
    label: "Total Staff",
    value: "126",
    note: "+ 8 this month",
    type: "total",
    icon: Users,
  },
  {
    label: "Active Staff",
    value: "118",
    note: "(94%)",
    type: "active",
    icon: CheckCircle2,
  },
  {
    label: "Pending Verification",
    value: "6",
    note: "Requires attention",
    type: "pending",
    icon: ClipboardClock,
  },
  {
    label: "Departments",
    value: "12",
    note: "Across hospital",
    type: "departments",
    icon: Building2,
  },
];

const docStaffRoleCards = [
  {
    id: "receptionist", title: "Receptionist",
    description: "Views the assigned doctor's details, appointments, live tokens and ongoing checkups.",
    count: 0, code: "REC-###", department: "Admin", category: "Administration", icon: CalendarClock,
  },
  // Temporarily disabled: remove this block comment to enable the other Add Staff roles.
  /*
  {
    id: "nurse",
    title: "Nurse",
    description: "Provides direct patient care, administers medication, and assists doctors.",
    count: 42,
    code: "NUR-###",
    department: "Clinical",
    category: "Care Team",
    icon: Plus,
  },
  {
    id: "assistant",
    title: "Medical Assistant",
    description: "Supports clinical operations by preparing patients, recording vitals, and scheduling.",
    count: 18,
    code: "MA-###",
    department: "Clinical",
    category: "Care Team",
    icon: ClipboardClock,
  },
  {
    id: "technician",
    title: "Lab Technician",
    description: "Performs laboratory tests, analyzes samples, and manages clinical reports.",
    count: 12,
    code: "LAB-###",
    department: "Pathology",
    category: "Diagnostics",
    icon: FlaskConical,
  },
  {
    id: "billing",
    title: "Billing Staff",
    description: "Manages patient invoicing, insurance claims, payment processing, and receipts.",
    count: 8,
    code: "BIL-###",
    department: "Finance",
    category: "Administration",
    icon: Building2,
  },
  {
    id: "housekeeping",
    title: "Housekeeping",
    description: "Ensures facility cleanliness, sanitizes patient rooms, and maintains hygiene.",
    count: 15,
    code: "HSK-###",
    department: "Operations",
    category: "Support",
    icon: Building2,
  },
  {
    id: "supervisor",
    title: "Supervisor",
    description: "Oversees departmental operations, manages staff schedules, and ensures compliance.",
    count: 6,
    code: "SUP-###",
    department: "Operations",
    category: "Leadership",
    icon: ShieldCheck,
  },
  */
];

const staffRoleValues = ["staff", "nurse", "assistant", "technician", "receptionist", "housekeeping", "supervisor", "manager", "billing"];

const roleLabels = {
  nurse: "Nurse",
  assistant: "Medical Assistant",
  technician: "Lab Technician",
  lab_technician: "Lab Technician",
  housekeeping: "Housekeeping",
  supervisor: "Supervisor",
  manager: "Department Manager",
  department_manager: "Department Manager",
  billing: "Billing",
  receptionist: "Receptionist",
};
const staffApiRole = value => {
  const role = Object.keys(roleLabels).find(key => roleLabels[key] === value) || String(value || '').toLowerCase();
  return ({ technician: 'lab_technician', manager: 'department_manager' })[role] || role;
};

const avatarTones = ["teal", "blue", "amber", "green"];

const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};

const getDoctorId = (user = {}) =>
  user.doctor_id || user.doctorId || user.id || user._id || user.user_id || user.userId || "";

const toTitleCase = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";

const normalizeStatus = (value) => {
  const status = String(value || "active").toLowerCase();
  if (status.includes("suspend") || status.includes("block") || status === "inactive") return "Suspended";
  if (status.includes("leave") || status.includes("off")) return "On Leave";
  return "Active";
};

const normalizeVerification = (value) => {
  const verification = String(value || "").toLowerCase();
  if (verification.includes("pending") || verification.includes("unverified") || verification === "false") {
    return "Pending Docs";
  }
  return "Verified";
};

const normalizeShift = (value) => {
  const shift = toTitleCase(value || "Morning");
  if (["Morning", "Evening", "Night"].includes(shift)) return shift;
  return shift || "Morning";
};

const formatDate = (value, fallback = "Not available") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getNestedArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  const possibleArrays = [
    payload?.data,
    payload?.users,
    payload?.staff,
    payload?.members,
    payload?.results,
    payload?.clinics,
    payload?.data?.users,
    payload?.data?.staff,
    payload?.data?.members,
    payload?.data?.results,
    payload?.data?.clinics,
  ];
  return possibleArrays.find(Array.isArray) || [];
};

const normalizeStaffRow = (staff, index = 0) => {
  const rawRole = String(staff.role || staff.user_role || staff.staff_role || staff.designation || "").toLowerCase();
  const role = roleLabels[rawRole] || toTitleCase(staff.role_name || staff.role || staff.designation || "Staff");
  const fullName =
    staff.full_name ||
    staff.fullName ||
    staff.name ||
    [staff.first_name || staff.firstName, staff.last_name || staff.lastName].filter(Boolean).join(" ") ||
    "Staff Member";
  const rawId = staff.id || staff._id || staff.user_id || staff.staff_id || staff.employee_id || staff.employeeId;
  const department =
    staff.department ||
    staff.department_name ||
    staff.ward ||
    staff.lab_type ||
    staff.assigned_area ||
    staff.role_department ||
    "General";

  return {
    raw: staff,
    rawId,
    clinicId: String(staff.clinic_id || ""),
    clinicName: staff.clinic_name || "Unassigned",
    id: staff.employee_id || staff.employeeId || staff.staff_code || staff.code || staffIdentity(staff),
    name: fullName,
    email: staff.email || staff.email_address || "No email",
    department: toTitleCase(department),
    role,
    shift: normalizeShift(staff.shift || staff.shift_preference),
    verification: normalizeVerification(staff.verification || staff.emailVerified || staff.is_verified || staff.verified),
    status: normalizeStatus(staff.status || staff.account_status || (staff.isActive === false ? "Suspended" : "Active")),
    lastLogin: staff.lastLogin || staff.last_login || staff.last_seen || "Not logged in",
    avatar: getInitials(fullName),
    avatarTone: avatarTones[index % avatarTones.length],
    profilePhoto: (() => {
      const photo = staff.profilePhoto?.url || (typeof staff.profilePhoto === "string" ? staff.profilePhoto : "") || staff.profile_photo?.url || (typeof staff.profile_photo === "string" ? staff.profile_photo : "") || staff.avatar || staff.image;
      return photo ? (photo.startsWith("/") ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${photo}` : photo) : `https://i.pravatar.cc/120?u=${encodeURIComponent(fullName)}`;
    })(),
    joinDate: formatDate(staff.joinDate || staff.join_date || staff.hireDate || staff.hire_date || staff.createdAt),
    manager: staff.manager || staff.supervisor || staff.created_by_name || "Doctor",
    shiftTime: staffShiftTiming(staff),
    shiftStartTime: staff.shiftStartTime || staff.shift_start_time || (staff.shiftTime || staff.shift_time || "").split(" - ")[0] || "",
    shiftEndTime: staff.shiftEndTime || staff.shift_end_time || (staff.shiftTime || staff.shift_time || "").split(" - ")[1] || "",
    permissions: Array.isArray(staff.permissions) && staff.permissions.length ? staff.permissions : ["Patient Records (View)", "Messages (Send)"],
  };
};

const DoctorUserManagement = () => {
  const authUser = useDoctorUser();
  const user = useMemo(() => authUser || getStoredAuthUser() || {}, [authUser]);
  const doctorId = useMemo(() => getDoctorId(user), [user]);
  const [staffRows, setStaffRows] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicFilter, setClinicFilter] = useState("all");
  const [clinicError, setClinicError] = useState("");
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [viewStaff, setViewStaff] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editPhoto, setEditPhoto] = useState(null);
  const editPhotoInputRef = useRef(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState("");
  useEffect(() => {
    if (!editPhoto) { setEditPhotoPreview(""); return; }
    const preview = URL.createObjectURL(editPhoto);
    setEditPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [editPhoto]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState(docStaffRoleCards[0].id);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [roleDepartmentFilter, setRoleDepartmentFilter] = useState("All");
  const [roleCategoryFilter, setRoleCategoryFilter] = useState("All");
  const [addStaffStep, setAddStaffStep] = useState(1);
  const photoInputRef = useRef(null);
  const [staffPhoto, setStaffPhoto] = useState(null);
  const [staffPhotoPreview, setStaffPhotoPreview] = useState("");
  const [newStaffForm, setNewStaffForm] = useState({
    clinicId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneCountry: "IN",
    dateOfBirth: "",
    gender: "",
    department: "Nursing",
    hireDate: "",
    shift: "Morning",
    shiftStartTime: "06:00", shiftEndTime: "14:00",
  });

  const loadStaffRows = async () => {
    setIsLoadingStaff(true);
    setStaffError("");

    try {
      const mainResponse = await axios.get(`${API_BASE_URL}/staff`, {
        headers: getAuthHeaders(),
        params: {
          doctor_id: doctorId || undefined,
        },
      });
      const apiRows = getNestedArray(mainResponse.data);

      const doctorStaffRows = apiRows
        .filter((staff) => {
          const role = String(staff.role || staff.user_role || staff.staff_role || staff.designation || "").toLowerCase();
          return !role || staffRoleValues.includes(role) || roleLabels[role];
        })
        .map(normalizeStaffRow);

      setStaffRows(doctorStaffRows);
    } catch (error) {
      setStaffRows([]);
      setStaffError(error.response?.data?.message || error.response?.data?.error || "Staff data load nahi ho paya.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (doctorId) loadStaffRows();
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) {
      setIsLoadingClinics(false);
      setClinicError('Doctor account could not be loaded. Please sign in again.');
      return;
    }
    const controller = new AbortController();
    setIsLoadingClinics(true);
    setClinicError("");
    axios.get(`${API_BASE_URL}/clinics`, {
      headers: getAuthHeaders(), params: { doctor_id: doctorId }, signal: controller.signal,
    }).then(({ data }) => {
      setClinics(getNestedArray(data).map((clinic) => ({
        id: String(clinic.id || clinic._id || clinic.clinic_id || ''),
        name: clinic.clinic_name || clinic.name || 'Clinic',
        location: clinic.location || "",
      })).filter(clinic => clinic.id));
    }).catch((error) => {
      if (!axios.isCancel(error)) {
        setClinics([]);
        setClinicError("Clinics could not be loaded. Refresh the page to try again.");
      }
    }).finally(() => { if (!controller.signal.aborted) setIsLoadingClinics(false); });
    return () => controller.abort();
  }, [doctorId]);

  const clinicStaffRows = useMemo(() => staffRows.filter((staff) =>
    clinicFilter === "all" || (clinicFilter === "unassigned" ? !staff.clinicId : staff.clinicId === clinicFilter)
  ), [staffRows, clinicFilter]);

  useEffect(() => {
    const closeActionMenu = (event) => {
      if (!event.target.closest(".docstaff-screen-action-cell")) {
        setOpenActionId(null);
      }
    };

    document.addEventListener("click", closeActionMenu);
    return () => document.removeEventListener("click", closeActionMenu);
  }, []);

  const filteredRows = useMemo(() => {
    return clinicStaffRows.filter((staff) => {
      const query = `${staff.name} ${staff.email} ${staff.id} ${staff.clinicName}`.toLowerCase();

      return (
        query.includes(searchTerm.toLowerCase()) &&
        (roleFilter === "All" || staff.role === roleFilter) &&
        (deptFilter === "All" || staff.department === deptFilter) &&
        (statusFilter === "All" || staff.status === statusFilter) &&
        (shiftFilter === "All" || staff.shift === shiftFilter)
      );
    });
  }, [clinicStaffRows, searchTerm, roleFilter, deptFilter, statusFilter, shiftFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstRowIndex = filteredRows.length ? (safeCurrentPage - 1) * pageSize : 0;
  const paginatedRows = filteredRows.slice(firstRowIndex, firstRowIndex + pageSize);
  const lastRowIndex = Math.min(firstRowIndex + pageSize, filteredRows.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, deptFilter, statusFilter, shiftFilter, clinicFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const filteredRoleCards = useMemo(() => {
    const roleCounts = clinicStaffRows.reduce((counts, staff) => {
      const key = String(staff.role || "").toLowerCase().replace(/\s+/g, "");
      const roleKey = key.includes("medicalassistant") ? "assistant" : key.includes("labtechnician") ? "technician" : key;
      counts[roleKey] = (counts[roleKey] || 0) + 1;
      return counts;
    }, {});

    return docStaffRoleCards.map((role) => ({ ...role, count: roleCounts[role.id] || 0 })).filter((role) => {
      const matchesSearch = `${role.title} ${role.description} ${role.code}`
        .toLowerCase()
        .includes(roleSearchTerm.toLowerCase());
      const matchesDepartment = roleDepartmentFilter === "All" || role.department === roleDepartmentFilter;
      const matchesCategory = roleCategoryFilter === "All" || role.category === roleCategoryFilter;

      return matchesSearch && matchesDepartment && matchesCategory;
    });
  }, [clinicStaffRows, roleSearchTerm, roleDepartmentFilter, roleCategoryFilter]);

  const dynamicStats = useMemo(() => {
    const total = clinicStaffRows.length;
    const active = clinicStaffRows.filter((staff) => staff.status === "Active").length;
    const pending = clinicStaffRows.filter((staff) => staff.verification !== "Verified").length;
    const departments = new Set(clinicStaffRows.map((staff) => staff.department).filter(Boolean)).size;

    return [
      { ...docStaffScreenStats[0], value: String(total), note: clinicFilter === "all" ? "All clinics" : "Selected clinic" },
      { ...docStaffScreenStats[1], value: String(active), note: total ? `(${Math.round((active / total) * 100)}%)` : "(0%)" },
      { ...docStaffScreenStats[2], value: String(pending), note: pending ? "Requires attention" : "All verified" },
      { ...docStaffScreenStats[3], value: String(departments), note: "Across clinic" },
    ];
  }, [clinicStaffRows, clinicFilter]);

  const roleFilterOptions = useMemo(
    () => ["All", ...new Set([...docStaffRoleCards.map((role) => role.title), "Receptionist", ...staffRows.map((staff) => staff.role)].filter(Boolean))],
    [staffRows]
  );

  const departmentFilterOptions = useMemo(
    () => ["All", ...new Set(["Emergency", "Pathology", "Finance", "Admin", ...staffRows.map((staff) => staff.department)].filter(Boolean))],
    [staffRows]
  );

  const statusFilterOptions = useMemo(
    () => ["All", ...new Set(["Active", "On Leave", "Suspended", ...staffRows.map((staff) => staff.status)].filter(Boolean))],
    [staffRows]
  );

  const shiftFilterOptions = useMemo(
    () => ["All", ...new Set(["Morning", "Night", "Evening", ...staffRows.map((staff) => staff.shift)].filter(Boolean))],
    [staffRows]
  );

  const handleViewStaff = (staff) => {
    setViewStaff(staff);
    setOpenActionId(null);
  };

  const handleResendStaffEmail = async (staff) => {
    setOpenActionId(null);
    if (!staff.rawId) return;
    try {
      const result = await axios.post(`${API_BASE_URL}/staff/${staff.rawId}/resend-welcome-email`,
        { password: 'Temp@12345' }, { headers: getAuthHeaders() });
      alert(result.data?.message || 'Staff login email sent.');
    } catch (error) {
      alert(error.response?.data?.message || 'Staff login email nahi bheja ja saka. Please try again.');
    }
  };

  const handleActionMenuToggle = (event, staffId) => {
    event.stopPropagation();

    if (openActionId === staffId) {
      setOpenActionId(null);
      return;
    }

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 58;
    const shouldOpenAbove = triggerRect.bottom + menuHeight + 6 > window.innerHeight;

    setActionMenuPosition({
      top: shouldOpenAbove ? Math.max(8, triggerRect.top - menuHeight - 6) : triggerRect.bottom + 6,
      left: Math.min(
        Math.max(8, triggerRect.right - menuWidth),
        window.innerWidth - menuWidth - 8
      ),
    });
    setOpenActionId(staffId);
  };

  const handleUpdateStaff = (staff) => {
    setEditPhoto(null);
    setEditingStaff(staff);
    setEditForm({ ...staff });
    setOpenActionId(null);
    setViewStaff(null);
  };

  const handleDeleteStaff = async (staff) => {
    const shouldDelete = window.confirm(`Delete ${staff.name}?`);
    setOpenActionId(null);

    if (!shouldDelete) return;

    try {
      if (staff.rawId) {
        await axios.delete(`${API_BASE_URL}/staff/${staff.rawId}`, { headers: getAuthHeaders() });
      }
      setStaffRows((currentRows) => currentRows.filter((row) => row.id !== staff.id));
    } catch (error) {
      alert(error.response?.data?.message || "Staff delete nahi ho paya.");
    }
  };

  const handleSuspendStaff = async (staff) => {
    const updatedStaff = { ...staff, status: "Suspended" };

    try {
      if (staff.rawId) {
        await axios.patch(`${API_BASE_URL}/staff/${staff.rawId}`, { status: "Suspended", isActive: false }, { headers: getAuthHeaders() });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Staff suspend nahi ho paya.");
      return;
    }

    setStaffRows((currentRows) =>
      currentRows.map((row) => (row.id === staff.id ? updatedStaff : row))
    );
    setViewStaff((currentStaff) => (currentStaff?.id === staff.id ? updatedStaff : currentStaff));
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSaveStaffUpdate = async (event) => {
    event.preventDefault();
    if (isSavingStaff) return;
    if (!editForm.clinicId) return alert("Please select a clinic or hospital.");
    if (!editForm.shiftStartTime || !editForm.shiftEndTime) return alert("Please enter shift start and end timings.");

    try {
      setIsSavingStaff(true);
      if (editingStaff.rawId) {
        const editPayload = {
            full_name: editForm.name,
            fullName: editForm.name,
            clinic_id: editForm.clinicId,
            name: editForm.name,
            email: editForm.email,
            department: editForm.department,
            role: staffApiRole(editForm.role),
            shift: editForm.shift,
            shift_start_time: editForm.shiftStartTime,
            shift_end_time: editForm.shiftEndTime,
            shift_time: editForm.shiftStartTime && editForm.shiftEndTime ? `${editForm.shiftStartTime} - ${editForm.shiftEndTime}` : "",
            status: editForm.status,
            isActive: editForm.status === "Active",
        };
        let requestBody = editPayload;
        if (editPhoto) {
          requestBody = new FormData();
          Object.entries(editPayload).forEach(([key, value]) => requestBody.append(key, value ?? ""));
          requestBody.append("profilePhoto", editPhoto);
        }
        const response = await axios.patch(
          `${API_BASE_URL}/staff/${editingStaff.rawId}`,
          requestBody,
          { headers: getAuthHeaders() }
        );
        const updated = normalizeStaffRow(response.data.data || response.data.user);
        setStaffRows((rows) => rows.map((staff) => staff.rawId === editingStaff.rawId ? updated : staff));
        setViewStaff(current => current?.rawId === editingStaff.rawId ? updated : current);
      }
      setEditPhoto(null);
      setEditingStaff(null);
      setEditForm(null);
    } catch (error) {
      alert(error.response?.data?.message || "Staff update nahi ho paya.");
    } finally { setIsSavingStaff(false); }
  };

  const closeUpdateModal = () => {
    if (isSavingStaff) return;
    setEditPhoto(null);
    setEditingStaff(null);
    setEditForm(null);
  };

  const handleEditPhotoChange = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      alert("Please select a JPG, PNG or WebP image, 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setEditPhoto(file);
  };

  const closeAddStaffModal = () => {
    if (isSavingStaff) return;
    setShowAddStaffModal(false);
    setSelectedNewRole(docStaffRoleCards[0].id);
    setRoleSearchTerm("");
    setRoleDepartmentFilter("All");
    setRoleCategoryFilter("All");
    setAddStaffStep(1);
    setStaffPhoto(null);
    setStaffPhotoPreview("");
    setNewStaffForm({
      clinicId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    phoneCountry: "IN",
      dateOfBirth: "",
      gender: "",
      department: "Nursing",
      hireDate: "",
      shift: "Morning",
      shiftStartTime: "06:00", shiftEndTime: "14:00",
    });
  };

  const handleStaffPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setStaffPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setStaffPhotoPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleContinueNewStaff = async () => {
    if (isSavingStaff) return;
    const role = docStaffRoleCards.find((item) => item.id === selectedNewRole) || docStaffRoleCards[0];

    if (addStaffStep === 1) {
      setNewStaffForm((currentForm) => ({
        ...currentForm,
        department: role.title === "Nurse" ? "Nursing" : role.department,
      }));
      setAddStaffStep(2);
      return;
    }

    if (addStaffStep === 2) {
      const missingFields = [];
      if (!newStaffForm.clinicId) missingFields.push("clinic / hospital");
      if (!newStaffForm.firstName.trim()) missingFields.push("first name");
      if (!newStaffForm.lastName.trim()) missingFields.push("last name");
      if (!newStaffForm.email.trim()) missingFields.push("email");
      if (!newStaffForm.phone.trim()) missingFields.push("contact number");
      if (!newStaffForm.shiftStartTime || !newStaffForm.shiftEndTime) missingFields.push("shift start and end timings");

      if (missingFields.length) {
        alert(`Please enter ${missingFields.join(", ")}.`);
        return;
      }

      const country = staffPhoneCountry(newStaffForm.phoneCountry);
      if (!country.lengths.includes(newStaffForm.phone.length)) {
        alert(`Enter ${country.lengths.join(' or ')} digits after ${country.dial} for ${country.name}.`);
        return;
      }
      setAddStaffStep(3);
      return;
    }

    const newStaffNumber = 4300 + staffRows.length;
    const fullName = `${newStaffForm.firstName || "New"} ${newStaffForm.lastName || role.title}`.trim();
    const generatedAvatar = role.title
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const newStaff = {
      id: `#MC-${newStaffNumber}`,
      name: fullName,
      email: newStaffForm.email || `${role.id}.${newStaffNumber}@example.com`,
      department: newStaffForm.department || (role.department === "Clinical" ? "Emergency" : role.department),
      role: role.title,
      shift: newStaffForm.shift,
      verification: "Pending Docs",
      status: "Active",
      lastLogin: "Not logged in",
      avatar: fullName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || generatedAvatar,
      avatarTone: "blue",
      profilePhoto: staffPhotoPreview || `https://i.pravatar.cc/120?img=${staffRows.length + 20}`,
      joinDate: newStaffForm.hireDate || "Today",
      manager: "Dr. Sarah Jenkins",
      shiftTime: `${newStaffForm.shiftStartTime} - ${newStaffForm.shiftEndTime}`,
      permissions: ["Patient Records (View)", "Messages (Send)"],
    };

    try {
      setIsSavingStaff(true);
      const staffPayload = {
          full_name: fullName,
          clinic_id: newStaffForm.clinicId,
          name: fullName,
          email: newStaffForm.email,
          contact_number: `${staffPhoneCountry(newStaffForm.phoneCountry).dial}${newStaffForm.phone}`,
          phoneCountryCode: staffPhoneCountry(newStaffForm.phoneCountry).dial,
          phoneCountry: newStaffForm.phoneCountry,
          role: staffApiRole(selectedNewRole),
          department: newStaff.department,
          shift: newStaffForm.shift,
          shift_start_time: newStaffForm.shiftStartTime,
          shift_end_time: newStaffForm.shiftEndTime,
          shift_time: `${newStaffForm.shiftStartTime} - ${newStaffForm.shiftEndTime}`,
          date_of_birth: newStaffForm.dateOfBirth,
          gender: newStaffForm.gender,
          hire_date: newStaffForm.hireDate,
          password: "Temp@12345",
      };
      let requestBody = staffPayload;
      if (staffPhoto) {
        requestBody = new FormData();
        Object.entries(staffPayload).forEach(([key, value]) => requestBody.append(key, value ?? ""));
        requestBody.append("profilePhoto", staffPhoto);
      }
      const response = await axios.post(
        `${API_BASE_URL}/staff`,
        requestBody,
        { headers: getAuthHeaders() }
      );
      const createdStaff = normalizeStaffRow(response.data?.user || response.data?.data || response.data || newStaff, staffRows.length);
      const newStaffRow = { ...newStaff, ...createdStaff };
      setStaffRows((currentRows) => [
        newStaffRow,
        ...currentRows.filter((staff) => !(
          (newStaffRow.rawId && staff.rawId === newStaffRow.rawId) ||
          staff.email.toLowerCase() === newStaffRow.email.toLowerCase()
        )),
      ]);
      setSearchTerm("");
      setRoleFilter("All");
      setDeptFilter("All");
      setStatusFilter("All");
      setShiftFilter("All");
      setCurrentPage(1);
      setClinicFilter(newStaffForm.clinicId);
      closeAddStaffModal();
      if (response.data?.emailSent === false) {
        alert(response.data.message || 'Staff account ban gaya hai, lekin login email nahi gaya. Staff ke actions se Resend login email karein.');
      } else if (response.data?.emailSent === undefined) {
        alert('Staff account ban gaya hai, lekin backend ne email delivery confirm nahi ki. Updated backend restart/deploy karein, phir Resend login email karein.');
      }
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || "Staff create nahi ho paya.");
    } finally { setIsSavingStaff(false); }
  };

  const handleNewStaffFormChange = (field, value) => {
    setNewStaffForm((currentForm) => ({
      ...currentForm,
      [field]: field === 'phone' ? value.replace(/\D/g, '').slice(0, Math.max(...staffPhoneCountry(currentForm.phoneCountry).lengths)) : value,
      ...(field === 'phoneCountry' ? { phone: '' } : {}),
      ...(field === "shift" ? { shiftStartTime: defaultShiftTimes[value]?.[0] || "", shiftEndTime: defaultShiftTimes[value]?.[1] || "" } : {}),
    }));
  };

  const renderSelect = (label, value, setValue, options) => (
    <label className="docstaff-screen-select-shell">
      <span className="docstaff-screen-sr-only">{<PortalText text={label} />}</span>
      <select
        className="docstaff-screen-select"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {<PortalText text={label} />}: {option}
          </option>
        ))}
      </select>
    </label>
  );

  const selectedStaffRole = docStaffRoleCards.find((item) => item.id === selectedNewRole) || docStaffRoleCards[0];
  const reviewFullName = `${newStaffForm.firstName || "Jonathan"} ${newStaffForm.lastName || "Doe"}`.trim();
  const reviewEmail = newStaffForm.email || `${selectedStaffRole.id}.new@example.com`;
  const reviewPhone = `${staffPhoneCountry(newStaffForm.phoneCountry).dial} ${newStaffForm.phone}`;
  const reviewDepartment = newStaffForm.department || (selectedStaffRole.title === "Nurse" ? "Nursing" : selectedStaffRole.department);
  const reviewHireDate = newStaffForm.hireDate || "October 15, 2023";
  const reviewShift = `${newStaffForm.shift} (${newStaffForm.shiftStartTime} - ${newStaffForm.shiftEndTime})`;
  const reviewEmployeeId = "Assigned after account creation";

  return (
    <div className="docstaff-screen-page">
      <section className="docstaff-screen-main">
        <div className="docstaff-screen-header">
          <div>
            <h1 className="docstaff-screen-title"><PortalText text={"Staff Management"} /></h1>
            <p className="docstaff-screen-subtitle"><PortalText text={"Manage your staff separately for each clinic or hospital."} /></p>
          </div>

          <div className="docstaff-screen-header-tools">
            <label className="docstaff-screen-top-search">
              <Search size={18} strokeWidth={2.2} />
              <PortalElement as="input"
                type="search"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button className="docstaff-screen-add-btn" type="button" disabled={isLoadingClinics} onClick={() => {
              setNewStaffForm((form) => ({ ...form, clinicId: clinics.some((c) => c.id === clinicFilter) ? clinicFilter : clinics.length === 1 ? clinics[0].id : "" }));
              setShowAddStaffModal(true);
            }}>
              <Plus size={16} strokeWidth={2.4} /><PortalText text={"Add Staff Member"} /></button>
          </div>
        </div>

        {clinicError && <p role="alert">{clinicError}</p>}
        {!isLoadingClinics && !clinicError && !clinics.length && <p><PortalText text={"Add a clinic or hospital in Clinic Settings before adding staff."} /></p>}
        <label className="docstaff-clinic-filter"><PortalText text={"Clinic / Hospital"} /><select value={clinicFilter} onChange={(event) => setClinicFilter(event.target.value)}>
            <PortalElement as="option" value="all">All clinics / hospitals</PortalElement>
            {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}{clinic.location ? ` — ${clinic.location}` : ""}</option>)}
            <PortalElement as="option" value="unassigned">Unassigned staff</PortalElement>
          </select>
        </label>

        <div className="docstaff-screen-stats">
          {dynamicStats.map((stat) => {
            const StatIcon = stat.icon;

            return (
              <article className="docstaff-screen-stat-card" key={stat.label}>
                <div className={`docstaff-screen-stat-icon docstaff-screen-stat-icon-${stat.type}`}>
                  <StatIcon size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="docstaff-screen-stat-label">{<PortalText text={stat.label} />}</p>
                  <div className="docstaff-screen-stat-value-row">
                    <strong>{stat.value}</strong>
                    <span className={`docstaff-screen-stat-note docstaff-screen-stat-note-${stat.type}`}>
                      {stat.note}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="docstaff-screen-toolbar">
          <label className="docstaff-screen-table-search">
            <Search size={17} strokeWidth={2.1} />
            <PortalElement as="input"
              type="search"
              placeholder="Search by name, ID or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className="docstaff-screen-filters">
            {renderSelect("Role", roleFilter, setRoleFilter, roleFilterOptions)}
            {renderSelect("Dept", deptFilter, setDeptFilter, departmentFilterOptions)}
            {renderSelect("Status", statusFilter, setStatusFilter, statusFilterOptions)}
            {renderSelect("Shift", shiftFilter, setShiftFilter, shiftFilterOptions)}
          </div>

          <div className="docstaff-screen-toolbar-actions">
            <button className="docstaff-screen-export-btn" type="button">
              <Download size={15} /><PortalText text={"Export"} /></button>
          </div>
        </div>

        <section className="docstaff-screen-table-card">
          <div className="docstaff-screen-table-wrap">
            <table className="docstaff-screen-table">
              <thead>
                <tr>
                  <th><PortalText text={"Staff"} /></th>
                  <th><PortalText text={"Dept & Role"} /></th>
                  <th><PortalText text={"Shift"} /></th>
                  <th><PortalText text={"Verification"} /></th>
                  <th><PortalText text={"Status"} /></th>
                  <th><PortalText text={"Last Login"} /></th>
                  <th><PortalText text={"Actions"} /></th>
                </tr>
              </thead>
              <tbody>
                {isLoadingStaff && (
                  <tr>
                    <td className="docstaff-screen-empty" colSpan="7"><PortalText text={"Loading staff from API..."} /></td>
                  </tr>
                )}
                {!isLoadingStaff && staffError && (
                  <tr>
                    <td className="docstaff-screen-empty" colSpan="7">
                      {staffError}
                    </td>
                  </tr>
                )}
                {!isLoadingStaff && !staffError && paginatedRows.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <button className="docstaff-screen-person" type="button" onClick={() => handleViewStaff(staff)}>
                        <ProfileAvatar photo={staff.profilePhoto} name={staff.name} fallback={staff.avatar} className={`docstaff-screen-avatar docstaff-screen-avatar-${staff.avatarTone}`} />
                        <div>
                          <strong>{staff.name}</strong>
                          <span>{staff.email}</span>
                          <span className="docstaff-clinic-name">{staff.clinicName}</span>
                        </div>
                      </button>
                    </td>
                    <td>
                      <div className="docstaff-screen-role-stack">
                        <span>{staff.department}</span>
                        <b className={`docstaff-screen-role-pill docstaff-screen-role-${staff.role.replace(/\s+/g, "").toLowerCase()}`}>
                          {staff.role}
                        </b>
                      </div>
                    </td>
                    <td>{staff.shift}</td>
                    <td>
                      <span
                        className={`docstaff-screen-verify docstaff-screen-verify-${
                          staff.verification === "Verified" ? "done" : "pending"
                        }`}
                      >
                        {staff.verification === "Verified" ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <CalendarClock size={14} />
                        )}
                        {staff.verification}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`docstaff-screen-status docstaff-screen-status-${
                          staff.status === "Active" ? "active" : staff.status === "Suspended" ? "suspended" : "leave"
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="docstaff-screen-login">{staff.lastLogin}</td>
                    <td>
                      <div className="docstaff-screen-action-cell">
                        {openActionId === staff.id && (
                          <div
                            className="docstaff-screen-row-actions"
                            style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                          >
                            <PortalElement as="button" type="button" title="View" onClick={() => handleViewStaff(staff)}>
                              <Eye size={15} />
                            </PortalElement>
                            <PortalElement as="button" type="button" title="Edit" onClick={() => handleUpdateStaff(staff)}>
                              <Pencil size={15} />
                            </PortalElement>
                            <PortalElement as="button" type="button" title="Resend login email" aria-label={`Resend login email to ${staff.name}`} onClick={() => handleResendStaffEmail(staff)}>
                              <Mail size={15} />
                            </PortalElement>
                            <PortalElement as="button" className="docstaff-screen-action-danger" type="button" title="Delete" onClick={() => handleDeleteStaff(staff)}>
                              <Trash2 size={15} />
                            </PortalElement>
                          </div>
                        )}

                        {openActionId !== staff.id && (
                          <button
                            className="docstaff-screen-more"
                            type="button"
                            aria-label={`More actions for ${staff.name}`}
                            onClick={(event) => handleActionMenuToggle(event, staff.id)}
                          >
                            <MoreVertical size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoadingStaff && !staffError && filteredRows.length === 0 && (
                  <tr>
                    <td className="docstaff-screen-empty" colSpan="7"><PortalText text={"No staff members match these filters."} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="docstaff-screen-pagination">
            <span><PortalText text={"Showing "} />{filteredRows.length ? firstRowIndex + 1 : 0}<PortalText text={" to "} />{lastRowIndex}<PortalText text={" of "} />{filteredRows.length}<PortalText text={" entries"} /></span>
            <div className="docstaff-screen-pages">
              <PortalElement as="button" type="button" aria-label="Previous page" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                ‹
              </PortalElement>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button className={page === safeCurrentPage ? "docstaff-screen-page-active" : ""} type="button" key={page} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <PortalElement as="button" type="button" aria-label="Next page" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>›</PortalElement>
            </div>
          </div>
        </section>
      </section>

      {viewStaff && (
        <div className="docstaff-screen-profile-backdrop" role="presentation" onClick={() => setViewStaff(null)}>
          <section
            className="docstaff-screen-profile-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="docstaff-view-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="docstaff-screen-profile-header">
              <h2 id="docstaff-view-title"><PortalText text={"Staff Profile"} /></h2>
              <button type="button" className="docstaff-screen-profile-close" onClick={() => setViewStaff(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="docstaff-screen-profile-body">
              <div className="docstaff-screen-profile-hero">
                <ProfileAvatar photo={viewStaff.profilePhoto} name={viewStaff.name} size={80} />
                <h3>{viewStaff.name}</h3>
                <p>
                  {viewStaff.email} | {viewStaff.id.replace("#", "")}
                </p>
                <div className="docstaff-screen-profile-badges">
                  <span className={`docstaff-screen-role-pill docstaff-screen-role-${viewStaff.role.replace(/\s+/g, "").toLowerCase()}`}>
                    {viewStaff.role}
                  </span>
                  <span
                    className={`docstaff-screen-status docstaff-screen-status-${
                      viewStaff.status === "Active" ? "active" : viewStaff.status === "Suspended" ? "suspended" : "leave"
                    }`}
                  >
                    {viewStaff.status}
                  </span>
                </div>
                <div className="docstaff-screen-profile-actions">
                  <button type="button" className="docstaff-screen-profile-message"><PortalText text={"Message"} /></button>
                  <button type="button" className="docstaff-screen-profile-edit" onClick={() => handleUpdateStaff(viewStaff)}><PortalText text={"Edit Profile"} /></button>
                </div>
              </div>

              <section className="docstaff-screen-profile-section">
                <h4><PortalText text={"Employment Details"} /></h4>
                <div className="docstaff-screen-profile-details">
                  <span><PortalText text={"Clinic / Hospital"} /></span>
                  <strong>{viewStaff.clinicName}</strong>
                  <span><PortalText text={"Department"} /></span>
                  <strong>{viewStaff.department}</strong>
                  <span><PortalText text={"Shift"} /></span>
                  <strong>
                    {viewStaff.shift} ({viewStaff.shiftTime})
                  </strong>
                  <span><PortalText text={"Join Date"} /></span>
                  <strong>{viewStaff.joinDate}</strong>
                  <span><PortalText text={"Manager"} /></span>
                  <strong className="docstaff-screen-profile-link">{viewStaff.manager}</strong>
                </div>
              </section>

              <section className="docstaff-screen-profile-section">
                <h4><PortalText text={"Permissions & Access"} /></h4>
                <div className="docstaff-screen-permissions">
                  {viewStaff.permissions.map((permission) => (
                    <label key={permission}>
                      <input type="checkbox" checked readOnly />
                      {permission}
                    </label>
                  ))}
                </div>
              </section>

              <button type="button" className="docstaff-screen-suspend-btn" onClick={() => handleSuspendStaff(viewStaff)}><PortalText text={"Suspend Account"} /></button>
            </div>
          </section>
        </div>
      )}

      {showAddStaffModal && (
        <div className="docstaff-screen-add-backdrop" role="presentation" onClick={closeAddStaffModal}>
          <section
            className={`docstaff-screen-add-modal ${addStaffStep === 2 ? "docstaff-screen-add-modal-details" : ""} ${
              addStaffStep === 3 ? "docstaff-screen-add-modal-review" : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="docstaff-add-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="docstaff-screen-add-header">
              <div>
                <h2 id="docstaff-add-title"><PortalText text={"Create New Staff Member"} /></h2>
                <p>
                  {addStaffStep === 1
                    ? <PortalText text={"Choose a staff role to begin creating a new account."} />
                    : <PortalText text={"Enter the personal and professional details for the new staff member."} />}
                </p>
              </div>
              <button type="button" className="docstaff-screen-add-close" onClick={closeAddStaffModal}>
                <X size={19} />
              </button>
            </div>

            <div className="docstaff-screen-add-steps">
              <div className="docstaff-screen-add-step docstaff-screen-add-step-active">
                <span>1</span><PortalText text={"Choose Role"} /></div>
              <div className={`docstaff-screen-add-step ${addStaffStep >= 2 ? "docstaff-screen-add-step-active" : ""}`}>
                <span>2</span><PortalText text={"Staff Details"} /></div>
              <div className={`docstaff-screen-add-step ${addStaffStep >= 3 ? "docstaff-screen-add-step-active" : ""}`}>
                <span>3</span><PortalText text={"Review & Create"} /></div>
            </div>

            {addStaffStep === 1 && (
              <>
            <div className="docstaff-screen-add-filters">
              <label className="docstaff-screen-add-search">
                <Search size={17} />
                <PortalElement as="input"
                  type="search"
                  placeholder="Search staff roles..."
                  value={roleSearchTerm}
                  onChange={(event) => setRoleSearchTerm(event.target.value)}
                />
              </label>
              <select value={roleDepartmentFilter} onChange={(event) => setRoleDepartmentFilter(event.target.value)}>
                <PortalElement as="option" value={"All"}>All</PortalElement>
                <PortalElement as="option" value={"Admin"}>Admin</PortalElement>
                <PortalElement as="option" value={"Clinical"}>Clinical</PortalElement>
                <PortalElement as="option" value={"Pathology"}>Pathology</PortalElement>
                <PortalElement as="option" value={"Finance"}>Finance</PortalElement>
                <PortalElement as="option" value={"Operations"}>Operations</PortalElement>
              </select>
              <select value={roleCategoryFilter} onChange={(event) => setRoleCategoryFilter(event.target.value)}>
                <PortalElement as="option" value={"All"}>All</PortalElement>
                <PortalElement as="option" value={"Care Team"}>Care Team</PortalElement>
                <PortalElement as="option" value={"Diagnostics"}>Diagnostics</PortalElement>
                <PortalElement as="option" value={"Administration"}>Administration</PortalElement>
                <PortalElement as="option" value={"Support"}>Support</PortalElement>
                <PortalElement as="option" value={"Leadership"}>Leadership</PortalElement>
              </select>
            </div>

            <div className="docstaff-screen-role-card-grid">
              {filteredRoleCards.map((role) => {
                const RoleIcon = role.icon;
                const isSelected = selectedNewRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`docstaff-screen-role-card ${isSelected ? "docstaff-screen-role-card-selected" : ""}`}
                    onClick={() => setSelectedNewRole(role.id)}
                  >
                    <span className="docstaff-screen-role-icon">
                      <RoleIcon size={19} />
                    </span>
                    {isSelected && (
                      <span className="docstaff-screen-role-check">
                        <CheckCircle2 size={14} />
                      </span>
                    )}
                    <strong>{role.title}</strong>
                    <p>{role.description}</p>
                    <div className="docstaff-screen-role-meta">
                      <span>
                        <Users size={12} />
                        {role.count}<PortalText text={" Active"} /></span>
                      <b>{role.code}</b>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="docstaff-screen-add-hint"><PortalText text={"Select the staff role first. Details and permissions can be edited in the next step."} /></div>

              </>
            )}

            {addStaffStep === 2 && (
              <div className="docstaff-screen-staff-details-step">
                <section className="docstaff-screen-details-section">
                  <h3><PortalText text={"Personal Information"} /></h3>
                  <label className="docstaff-clinic-filter"><PortalText text={"Clinic / Hospital *"} /><select required value={newStaffForm.clinicId} onChange={(event) => handleNewStaffFormChange("clinicId", event.target.value)}>
                      <PortalElement as="option" value="">Select a clinic or hospital</PortalElement>
                      {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}{clinic.location ? ` — ${clinic.location}` : ""}</option>)}
                    </select>
                  </label>
                  <div className="docstaff-screen-photo-row">
                    <span className="docstaff-screen-photo-placeholder">
                      {staffPhotoPreview ? (
                        <img src={staffPhotoPreview} alt="Selected staff profile" />
                      ) : (
                        <Users size={21} />
                      )}
                    </span>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="docstaff-screen-sr-only"
                      onChange={handleStaffPhotoChange}
                    />
                    <button
                      type="button"
                      className="docstaff-screen-upload-btn"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Download size={13} />
                      {staffPhoto ? <PortalText text={"Change Photo"} /> : <PortalText text={"Upload Photo"} />}
                    </button>
                  </div>

                  <div className="docstaff-screen-details-grid">
                    <label><PortalText text={"First Name"} /><PortalElement as="input"
                        type="text"
                        placeholder="e.g. Jane"
                        value={newStaffForm.firstName}
                        onChange={(event) => handleNewStaffFormChange("firstName", event.target.value)}
                      />
                    </label>
                    <label><PortalText text={"Last Name"} /><PortalElement as="input"
                        type="text"
                        placeholder="e.g. Doe"
                        value={newStaffForm.lastName}
                        onChange={(event) => handleNewStaffFormChange("lastName", event.target.value)}
                      />
                    </label>
                    <label><PortalText text={"Email Address"} /><input
                        type="email"
                        placeholder="jane.doe@example.com"
                        value={newStaffForm.email}
                        onChange={(event) => handleNewStaffFormChange("email", event.target.value)}
                      />
                    </label>
                    <div className="docstaff-phone-field">
                      <label htmlFor="staff-phone-number"><PortalText text={"Phone Number"} /></label>
                      <div className="docstaff-phone-control">
                      <select id="staff-phone-country" aria-label="Phone country code" title={staffPhoneCountry(newStaffForm.phoneCountry).name} value={newStaffForm.phoneCountry} onChange={event => handleNewStaffFormChange('phoneCountry', event.target.value)}>
                        {staffPhoneCountries.map(country => <option key={country.iso} value={country.iso}>{country.iso} ({country.dial})</option>)}
                      </select>
                      <input id="staff-phone-number" type="tel" inputMode="numeric" autoComplete="tel-national" required
                        aria-describedby="staff-phone-help"
                        placeholder={`${staffPhoneCountry(newStaffForm.phoneCountry).lengths.join(' or ')} digits`}
                        maxLength={Math.max(...staffPhoneCountry(newStaffForm.phoneCountry).lengths)}
                        value={newStaffForm.phone}
                        onChange={event => handleNewStaffFormChange('phone', event.target.value)} />
                      </div>
                      <small id="staff-phone-help">Enter {staffPhoneCountry(newStaffForm.phoneCountry).lengths.join(' or ')} digits after {staffPhoneCountry(newStaffForm.phoneCountry).dial}.</small>
                    </div>
                  </div>
                </section>

                <section className="docstaff-screen-details-section">
                  <h3><PortalText text={"Professional Details"} /></h3>
                  <div className="docstaff-screen-details-grid">
                    <label><PortalText text={"Date of Birth"} /><input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={newStaffForm.dateOfBirth}
                        onClick={(event) => event.currentTarget.showPicker?.()}
                        onChange={(event) => handleNewStaffFormChange("dateOfBirth", event.target.value)}
                      />
                    </label>
                    <label><PortalText text={"Gender"} /><select value={newStaffForm.gender} onChange={(event) => handleNewStaffFormChange("gender", event.target.value)}>
                        <PortalElement as="option" value="">Select gender</PortalElement>
                        <PortalElement as="option" value={"Female"}>Female</PortalElement>
                        <PortalElement as="option" value={"Male"}>Male</PortalElement>
                        <PortalElement as="option" value={"Other"}>Other</PortalElement>
                      </select>
                    </label>
                    <label><PortalText text={"Department"} /><select
                        value={newStaffForm.department}
                        onChange={(event) => handleNewStaffFormChange("department", event.target.value)}
                      >
                        <PortalElement as="option" value={"Nursing"}>Nursing</PortalElement>
                        <PortalElement as="option" value={"Emergency"}>Emergency</PortalElement>
                        <PortalElement as="option" value={"Pathology"}>Pathology</PortalElement>
                        <PortalElement as="option" value={"Finance"}>Finance</PortalElement>
                        <PortalElement as="option" value={"Operations"}>Operations</PortalElement>
                        <PortalElement as="option" value={"Admin"}>Admin</PortalElement>
                      </select>
                    </label>
                    <label><PortalText text={"Hire Date"} /><input
                        type="date"
                        value={newStaffForm.hireDate}
                        onClick={(event) => event.currentTarget.showPicker?.()}
                        onChange={(event) => handleNewStaffFormChange("hireDate", event.target.value)}
                      />
                    </label>
                    <label><PortalText text={"Shift Preference"} /><select value={newStaffForm.shift} onChange={(event) => handleNewStaffFormChange("shift", event.target.value)}>
                        <PortalElement as="option" value={"Morning"}>Morning</PortalElement>
                        <PortalElement as="option" value={"Evening"}>Evening</PortalElement>
                        <PortalElement as="option" value={"Night"}>Night</PortalElement>
                      </select>
                    </label>
                    <label><PortalText text={"Shift start time"} /><input type="time" required value={newStaffForm.shiftStartTime || ''} onChange={event => handleNewStaffFormChange('shiftStartTime', event.target.value)} /></label>
                    <label><PortalText text={"Shift end time"} /><input type="time" required value={newStaffForm.shiftEndTime || ''} onChange={event => handleNewStaffFormChange('shiftEndTime', event.target.value)} /></label>
                  </div>
                </section>
              </div>
            )}

            {addStaffStep === 3 && (
              <div className="docstaff-screen-review-step">
                <div className="docstaff-screen-review-left">
                  <section className="docstaff-screen-review-card">
                    <div className="docstaff-screen-review-card-head">
                      <h3>
                        <Users size={17} /><PortalText text={"Personal Information"} /></h3>
                      <button type="button" onClick={() => setAddStaffStep(2)}>
                        <Pencil size={13} /><PortalText text={"Edit"} /></button>
                    </div>

                    <div className="docstaff-screen-review-personal">
                      <div className="docstaff-screen-review-avatar-block">
                        <img src={staffPhotoPreview || `https://i.pravatar.cc/120?u=${reviewEmail}`} alt={reviewFullName} />
                        <span>
                          <CheckCircle2 size={12} /><PortalText text={"Verified"} /></span>
                      </div>

                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Full Name"} /></small>
                        <strong>{reviewFullName}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Email Address"} /></small>
                        <strong>{reviewEmail}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Phone Number"} /></small>
                        <strong>{reviewPhone}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Temporary Password"} /></small>
                        <strong className="docstaff-screen-password-preview">
                          <span>********</span>
                          <Eye size={14} />
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="docstaff-screen-review-card">
                    <div className="docstaff-screen-review-card-head">
                      <h3>
                        <CalendarClock size={17} /><PortalText text={"Professional Details"} /></h3>
                      <button type="button" onClick={() => setAddStaffStep(2)}>
                        <Pencil size={13} /><PortalText text={"Edit"} /></button>
                    </div>

                    <div className="docstaff-screen-review-professional">
                      <div className="docstaff-screen-review-field">
                        <label><PortalText text={"Clinic / Hospital"} /></label>
                        <strong>{clinics.find((clinic) => clinic.id === newStaffForm.clinicId)?.name || <PortalText text={"Not selected"} />}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Role"} /></small>
                        <span className="docstaff-screen-review-role">{selectedStaffRole.title}</span>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Employee ID"} /></small>
                        <strong>{reviewEmployeeId}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Department"} /></small>
                        <strong>{reviewDepartment}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Hire Date"} /></small>
                        <strong>{reviewHireDate}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small><PortalText text={"Shift Preference"} /></small>
                        <strong>{reviewShift}</strong>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="docstaff-screen-summary-card">
                  <h3><PortalText text={"Final Account Summary"} /></h3>
                  <div className="docstaff-screen-summary-list">
                    <div>
                      <CheckCircle2 size={17} />
                      <p>
                        <strong><PortalText text={"Personal Info Complete"} /></strong>
                        <span><PortalText text={"All required fields filled."} /></span>
                      </p>
                    </div>
                    <div>
                      <CheckCircle2 size={17} />
                      <p>
                        <strong><PortalText text={"Professional Details Set"} /></strong>
                        <span><PortalText text={"Role and ID assigned."} /></span>
                      </p>
                    </div>
                  </div>
                  <div className="docstaff-screen-activation-note">
                    <CheckCircle2 size={18} />
                    <p><PortalText text={"An activation email will be sent to "} /><strong>{reviewEmail}</strong><PortalText text={" with instructions to set a permanent password."} /></p>
                  </div>
                </aside>
              </div>
            )}

            <div className="docstaff-screen-add-footer">
              <button
                type="button"
                className="docstaff-screen-add-cancel"
                onClick={addStaffStep === 1 ? closeAddStaffModal : () => setAddStaffStep(addStaffStep - 1)}
              >
                {addStaffStep === 1 ? <PortalText text={"Cancel"} /> : <PortalText text={"Back"} />}
              </button>
              <button type="button" className="docstaff-screen-add-continue" disabled={isSavingStaff} onClick={handleContinueNewStaff}>
                {isSavingStaff ? <PortalText text={"Saving..."} /> : addStaffStep === 3 ? <PortalText text={"Create Account"} /> : <PortalText text={"Continue"} />}
                {addStaffStep !== 3 && <span>-&gt;</span>}
              </button>
            </div>
          </section>
        </div>
      )}

      {editingStaff && editForm && (
        <div className="docstaff-screen-modal-backdrop" role="presentation" onClick={closeUpdateModal}>
          <section
            className="docstaff-screen-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="docstaff-update-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="docstaff-screen-modal-header">
              <div>
                <h2 id="docstaff-update-title"><PortalText text={"Update Staff"} /></h2>
                <p>{editingStaff.id}</p>
              </div>
              <button type="button" className="docstaff-screen-modal-close" onClick={closeUpdateModal}>
                <X size={18} />
              </button>
            </div>

            <form className="docstaff-screen-edit-form" onSubmit={handleSaveStaffUpdate}>
              <div className="docstaff-screen-edit-photo">
                <label htmlFor="docstaff-edit-photo"><PortalText text={"Profile photo"} /></label>
                <div className="docstaff-screen-edit-photo-content">
                  <img src={editPhotoPreview || editingStaff.profilePhoto} alt={editForm.name} width="72" height="72" />
                  <div className="docstaff-screen-edit-photo-controls">
                    <input ref={editPhotoInputRef} id="docstaff-edit-photo" type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={isSavingStaff} onChange={handleEditPhotoChange} />
                    <button type="button" className="docstaff-screen-upload-btn" disabled={isSavingStaff} onClick={() => editPhotoInputRef.current?.click()}><PortalText text={"Change photo"} /></button>
                    {editPhoto && <span className="docstaff-screen-edit-photo-filename" title={editPhoto.name}>{editPhoto.name}</span>}
                    <small><PortalText text={"JPG, PNG or WebP, up to 5 MB. Save to update the photo."} /></small>
                  </div>
                </div>
              </div>
              <label><PortalText text={"Clinic / Hospital *"} /><select required value={editForm.clinicId} onChange={(event) => handleEditFormChange("clinicId", event.target.value)}>
                  <PortalElement as="option" value="">Select a clinic or hospital</PortalElement>
                  {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}{clinic.location ? ` — ${clinic.location}` : ""}</option>)}
                </select>
              </label>
              <label><PortalText text={"Name"} /><input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => handleEditFormChange("name", event.target.value)}
                  required
                />
              </label>
              <label><PortalText text={"Email"} /><input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => handleEditFormChange("email", event.target.value)}
                  required
                />
              </label>
              <label><PortalText text={"Department"} /><select
                  value={editForm.department}
                  onChange={(event) => handleEditFormChange("department", event.target.value)}
                >
                  <PortalElement as="option" value={"Emergency"}>Emergency</PortalElement>
                  <PortalElement as="option" value={"Pathology"}>Pathology</PortalElement>
                  <PortalElement as="option" value={"Finance"}>Finance</PortalElement>
                  <PortalElement as="option" value={"Admin"}>Admin</PortalElement>
                </select>
              </label>
              <label><PortalText text={"Role"} /><select value={editForm.role} onChange={(event) => handleEditFormChange("role", event.target.value)}>
                  {[...new Set([editForm.role, ...Object.values(roleLabels)])].map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
              <label><PortalText text={"Shift"} /><select value={editForm.shift} onChange={(event) => handleEditFormChange("shift", event.target.value)}>
                  <PortalElement as="option" value={"Morning"}>Morning</PortalElement>
                  <PortalElement as="option" value={"Night"}>Night</PortalElement>
                  <PortalElement as="option" value={"Evening"}>Evening</PortalElement>
                </select>
              </label>
              <label><PortalText text={"Shift start time"} /><input type="time" required value={editForm.shiftStartTime || ''} onChange={event => handleEditFormChange('shiftStartTime', event.target.value)} /></label>
              <label><PortalText text={"Shift end time"} /><input type="time" required value={editForm.shiftEndTime || ''} onChange={event => handleEditFormChange('shiftEndTime', event.target.value)} /></label>
              <label><PortalText text={"Status"} /><select value={editForm.status} onChange={(event) => handleEditFormChange("status", event.target.value)}>
                  <PortalElement as="option" value={"Active"}>Active</PortalElement>
                  <PortalElement as="option" value={"On Leave"}>On Leave</PortalElement>
                </select>
              </label>

              <div className="docstaff-screen-modal-actions">
                <button type="button" className="docstaff-screen-cancel-btn" onClick={closeUpdateModal}><PortalText text={"Cancel"} /></button>
                <button type="submit" disabled={isSavingStaff} className="docstaff-screen-save-btn"><PortalText text={"Update Staff"} /></button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default DoctorUserManagement;
