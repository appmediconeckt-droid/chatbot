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
  Filter,
  FlaskConical,
  ListFilter,
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

const docStaffScreenRows = [
  {
    id: "#MC-4002",
    name: "Jane Cooper",
    email: "jane.c@mediconeckt.com",
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
    email: "robert.f@mediconeckt.com",
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
    email: "cameron.w@mediconeckt.com",
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
    email: "jerome.b@mediconeckt.com",
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
];

const staffRoleValues = ["nurse", "assistant", "technician", "housekeeping", "supervisor", "manager", "billing"];

const roleLabels = {
  nurse: "Nurse",
  assistant: "Medical Assistant",
  technician: "Lab Technician",
  housekeeping: "Housekeeping",
  supervisor: "Supervisor",
  manager: "Department Manager",
  billing: "Billing",
  receptionist: "Receptionist",
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
    payload?.data?.users,
    payload?.data?.staff,
    payload?.data?.members,
    payload?.data?.results,
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
    id: staff.employee_id || staff.employeeId || staff.staff_code || staff.code || (rawId ? `#MC-${rawId}` : `#MC-${4000 + index}`),
    name: fullName,
    email: staff.email || staff.email_address || "No email",
    department: toTitleCase(department),
    role,
    shift: normalizeShift(staff.shift || staff.shift_preference),
    verification: normalizeVerification(staff.verification || staff.emailVerified || staff.is_verified || staff.verified),
    status: normalizeStatus(staff.status || staff.account_status),
    lastLogin: staff.lastLogin || staff.last_login || staff.last_seen || "Not logged in",
    avatar: getInitials(fullName),
    avatarTone: avatarTones[index % avatarTones.length],
    profilePhoto: staff.profilePhoto || staff.profile_photo || staff.avatar || staff.image || `https://i.pravatar.cc/120?u=${encodeURIComponent(fullName)}`,
    joinDate: formatDate(staff.joinDate || staff.join_date || staff.hireDate || staff.hire_date || staff.createdAt),
    manager: staff.manager || staff.supervisor || staff.created_by_name || "Doctor",
    shiftTime: staff.shiftTime || staff.shift_time || "06:00 - 14:00",
    permissions: Array.isArray(staff.permissions) && staff.permissions.length ? staff.permissions : ["Patient Records (View)", "Messages (Send)"],
  };
};

const DoctorUserManagement = () => {
  const authUser = useDoctorUser();
  const user = useMemo(() => authUser || getStoredAuthUser() || {}, [authUser]);
  const doctorId = useMemo(() => getDoctorId(user), [user]);
  const [staffRows, setStaffRows] = useState([]);
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
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState("nurse");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [roleDepartmentFilter, setRoleDepartmentFilter] = useState("All");
  const [roleCategoryFilter, setRoleCategoryFilter] = useState("All");
  const [addStaffStep, setAddStaffStep] = useState(1);
  const photoInputRef = useRef(null);
  const [staffPhoto, setStaffPhoto] = useState(null);
  const [staffPhotoPreview, setStaffPhotoPreview] = useState("");
  const [newStaffForm, setNewStaffForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    department: "Nursing",
    hireDate: "",
    shift: "Morning",
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
      let apiRows = getNestedArray(mainResponse.data);

      if (!apiRows.length) {
        const roleResponses = await Promise.allSettled(
          staffRoleValues.map((role) =>
            axios.get(`${API_BASE_URL}/staff`, {
              headers: getAuthHeaders(),
              params: {
                role,
                doctor_id: doctorId || undefined,
              },
            })
          )
        );

        apiRows = roleResponses.flatMap((result) =>
          result.status === "fulfilled" ? getNestedArray(result.value.data) : []
        );
      }

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
    loadStaffRows();
  }, [doctorId]);

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
    return staffRows.filter((staff) => {
      const query = `${staff.name} ${staff.email} ${staff.id}`.toLowerCase();

      return (
        query.includes(searchTerm.toLowerCase()) &&
        (roleFilter === "All" || staff.role === roleFilter) &&
        (deptFilter === "All" || staff.department === deptFilter) &&
        (statusFilter === "All" || staff.status === statusFilter) &&
        (shiftFilter === "All" || staff.shift === shiftFilter)
      );
    });
  }, [staffRows, searchTerm, roleFilter, deptFilter, statusFilter, shiftFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstRowIndex = filteredRows.length ? (safeCurrentPage - 1) * pageSize : 0;
  const paginatedRows = filteredRows.slice(firstRowIndex, firstRowIndex + pageSize);
  const lastRowIndex = Math.min(firstRowIndex + pageSize, filteredRows.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, deptFilter, statusFilter, shiftFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const filteredRoleCards = useMemo(() => {
    const roleCounts = staffRows.reduce((counts, staff) => {
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
  }, [staffRows, roleSearchTerm, roleDepartmentFilter, roleCategoryFilter]);

  const dynamicStats = useMemo(() => {
    const total = staffRows.length;
    const active = staffRows.filter((staff) => staff.status === "Active").length;
    const pending = staffRows.filter((staff) => staff.verification !== "Verified").length;
    const departments = new Set(staffRows.map((staff) => staff.department).filter(Boolean)).size;

    return [
      { ...docStaffScreenStats[0], value: String(total), note: total ? "From API" : "No staff found" },
      { ...docStaffScreenStats[1], value: String(active), note: total ? `(${Math.round((active / total) * 100)}%)` : "(0%)" },
      { ...docStaffScreenStats[2], value: String(pending), note: pending ? "Requires attention" : "All verified" },
      { ...docStaffScreenStats[3], value: String(departments), note: "Across clinic" },
    ];
  }, [staffRows]);

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

  const handleActionMenuToggle = (event, staffId) => {
    event.stopPropagation();

    if (openActionId === staffId) {
      setOpenActionId(null);
      return;
    }

    const triggerRect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 136;
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
        await axios.delete(`${API_BASE_URL}/users/${staff.rawId}`, { headers: getAuthHeaders() });
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
        await axios.put(`${API_BASE_URL}/users/${staff.rawId}`, { status: "Suspended" }, { headers: getAuthHeaders() });
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

    try {
      if (editingStaff.rawId) {
        await axios.put(
          `${API_BASE_URL}/users/${editingStaff.rawId}`,
          {
            full_name: editForm.name,
            name: editForm.name,
            email: editForm.email,
            department: editForm.department,
            role: editForm.role,
            shift: editForm.shift,
            status: editForm.status,
          },
          { headers: getAuthHeaders() }
        );
      }

      setStaffRows((currentRows) =>
        currentRows.map((staff) => (staff.id === editingStaff.id ? { ...staff, ...editForm } : staff))
      );
      setEditingStaff(null);
      setEditForm(null);
    } catch (error) {
      alert(error.response?.data?.message || "Staff update nahi ho paya.");
    }
  };

  const closeUpdateModal = () => {
    setEditingStaff(null);
    setEditForm(null);
  };

  const closeAddStaffModal = () => {
    setShowAddStaffModal(false);
    setSelectedNewRole("nurse");
    setRoleSearchTerm("");
    setRoleDepartmentFilter("All");
    setRoleCategoryFilter("All");
    setAddStaffStep(1);
    setStaffPhoto(null);
    setStaffPhotoPreview("");
    setNewStaffForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      department: "Nursing",
      hireDate: "",
      shift: "Morning",
    });
  };

  const handleStaffPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
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
      if (!newStaffForm.firstName.trim()) missingFields.push("first name");
      if (!newStaffForm.lastName.trim()) missingFields.push("last name");
      if (!newStaffForm.email.trim()) missingFields.push("email");
      if (!newStaffForm.phone.trim()) missingFields.push("contact number");

      if (missingFields.length) {
        alert(`Please enter ${missingFields.join(", ")}.`);
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
      email: newStaffForm.email || `${role.id}.${newStaffNumber}@mediconeckt.com`,
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
      shiftTime: "06:00 - 14:00",
      permissions: ["Patient Records (View)", "Messages (Send)"],
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/staff`,
        {
          full_name: fullName,
          name: fullName,
          email: newStaffForm.email,
          contact_number: newStaffForm.phone.trim(),
          role: selectedNewRole,
          department: newStaff.department,
          shift: newStaffForm.shift,
          date_of_birth: newStaffForm.dateOfBirth,
          gender: newStaffForm.gender,
          hire_date: newStaffForm.hireDate,
          password: "Temp@12345",
        },
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
      closeAddStaffModal();
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || "Staff create nahi ho paya.");
    }
  };

  const handleNewStaffFormChange = (field, value) => {
    setNewStaffForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const renderSelect = (label, value, setValue, options) => (
    <label className="docstaff-screen-select-shell">
      <span className="docstaff-screen-sr-only">{label}</span>
      <select
        className="docstaff-screen-select"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label}: {option}
          </option>
        ))}
      </select>
    </label>
  );

  const selectedStaffRole = docStaffRoleCards.find((item) => item.id === selectedNewRole) || docStaffRoleCards[0];
  const reviewFullName = `${newStaffForm.firstName || "Jonathan"} ${newStaffForm.lastName || "Doe"}`.trim();
  const reviewEmail = newStaffForm.email || `${selectedStaffRole.id}.new@mediconeckt.com`;
  const reviewPhone = newStaffForm.phone || "+1 (555) 123-4567";
  const reviewDepartment = newStaffForm.department || (selectedStaffRole.title === "Nurse" ? "Nursing" : selectedStaffRole.department);
  const reviewHireDate = newStaffForm.hireDate || "October 15, 2023";
  const reviewShift = newStaffForm.shift === "Night" ? "Night Shift (7 PM - 7 AM)" : `${newStaffForm.shift || "Morning"} Shift`;
  const reviewEmployeeId = `${selectedStaffRole.code.split("-")[0]}004`;

  return (
    <div className="docstaff-screen-page">
      <section className="docstaff-screen-main">
        <div className="docstaff-screen-header">
          <div>
            <h1 className="docstaff-screen-title">Staff Management</h1>
            <p className="docstaff-screen-subtitle">
              Manage staff accounts, permissions, departments, and employment status.
            </p>
          </div>

          <div className="docstaff-screen-header-tools">
            <label className="docstaff-screen-top-search">
              <Search size={18} strokeWidth={2.2} />
              <input
                type="search"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button className="docstaff-screen-add-btn" type="button" onClick={() => setShowAddStaffModal(true)}>
              <Plus size={16} strokeWidth={2.4} />
              Add Staff Member
            </button>
          </div>
        </div>

        <div className="docstaff-screen-stats">
          {dynamicStats.map((stat) => {
            const StatIcon = stat.icon;

            return (
              <article className="docstaff-screen-stat-card" key={stat.label}>
                <div className={`docstaff-screen-stat-icon docstaff-screen-stat-icon-${stat.type}`}>
                  <StatIcon size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="docstaff-screen-stat-label">{stat.label}</p>
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
            <input
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
            <button className="docstaff-screen-icon-btn" type="button" aria-label="List filters">
              <ListFilter size={16} />
            </button>
            <button className="docstaff-screen-icon-btn" type="button" aria-label="Advanced filter">
              <Filter size={16} />
            </button>
            <button className="docstaff-screen-export-btn" type="button">
              <Download size={15} />
              Export
            </button>
          </div>
        </div>

        <section className="docstaff-screen-table-card">
          <div className="docstaff-screen-table-wrap">
            <table className="docstaff-screen-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Dept & Role</th>
                  <th>Shift</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingStaff && (
                  <tr>
                    <td className="docstaff-screen-empty" colSpan="7">
                      Loading staff from API...
                    </td>
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
                        <div className={`docstaff-screen-avatar docstaff-screen-avatar-${staff.avatarTone}`}>
                          {staff.avatar}
                        </div>
                        <div>
                          <strong>{staff.name}</strong>
                          <span>{staff.email}</span>
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
                            <button type="button" title="View" onClick={() => handleViewStaff(staff)}>
                              <Eye size={15} />
                            </button>
                            <button type="button" title="Edit" onClick={() => handleUpdateStaff(staff)}>
                              <Pencil size={15} />
                            </button>
                            <button className="docstaff-screen-action-danger" type="button" title="Delete" onClick={() => handleDeleteStaff(staff)}>
                              <Trash2 size={15} />
                            </button>
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
                    <td className="docstaff-screen-empty" colSpan="7">
                      No staff members match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="docstaff-screen-pagination">
            <span>Showing {filteredRows.length ? firstRowIndex + 1 : 0} to {lastRowIndex} of {filteredRows.length} entries</span>
            <div className="docstaff-screen-pages">
              <button type="button" aria-label="Previous page" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button className={page === safeCurrentPage ? "docstaff-screen-page-active" : ""} type="button" key={page} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button type="button" aria-label="Next page" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>›</button>
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
              <h2 id="docstaff-view-title">Staff Profile</h2>
              <button type="button" className="docstaff-screen-profile-close" onClick={() => setViewStaff(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="docstaff-screen-profile-body">
              <div className="docstaff-screen-profile-hero">
                <img src={viewStaff.profilePhoto} alt={viewStaff.name} />
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
                  <button type="button" className="docstaff-screen-profile-message">
                    Message
                  </button>
                  <button type="button" className="docstaff-screen-profile-edit" onClick={() => handleUpdateStaff(viewStaff)}>
                    Edit Profile
                  </button>
                </div>
              </div>

              <section className="docstaff-screen-profile-section">
                <h4>Employment Details</h4>
                <div className="docstaff-screen-profile-details">
                  <span>Department</span>
                  <strong>{viewStaff.department}</strong>
                  <span>Shift</span>
                  <strong>
                    {viewStaff.shift} ({viewStaff.shiftTime})
                  </strong>
                  <span>Join Date</span>
                  <strong>{viewStaff.joinDate}</strong>
                  <span>Manager</span>
                  <strong className="docstaff-screen-profile-link">{viewStaff.manager}</strong>
                </div>
              </section>

              <section className="docstaff-screen-profile-section">
                <h4>Permissions & Access</h4>
                <div className="docstaff-screen-permissions">
                  {viewStaff.permissions.map((permission) => (
                    <label key={permission}>
                      <input type="checkbox" checked readOnly />
                      {permission}
                    </label>
                  ))}
                </div>
              </section>

              <button type="button" className="docstaff-screen-suspend-btn" onClick={() => handleSuspendStaff(viewStaff)}>
                Suspend Account
              </button>
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
                <h2 id="docstaff-add-title">Create New Staff Member</h2>
                <p>
                  {addStaffStep === 1
                    ? "Choose a staff role to begin creating a new account."
                    : "Enter the personal and professional details for the new staff member."}
                </p>
              </div>
              <button type="button" className="docstaff-screen-add-close" onClick={closeAddStaffModal}>
                <X size={19} />
              </button>
            </div>

            <div className="docstaff-screen-add-steps">
              <div className="docstaff-screen-add-step docstaff-screen-add-step-active">
                <span>1</span>
                Choose Role
              </div>
              <div className={`docstaff-screen-add-step ${addStaffStep >= 2 ? "docstaff-screen-add-step-active" : ""}`}>
                <span>2</span>
                Staff Details
              </div>
              <div className={`docstaff-screen-add-step ${addStaffStep >= 3 ? "docstaff-screen-add-step-active" : ""}`}>
                <span>3</span>
                Review & Create
              </div>
            </div>

            {addStaffStep === 1 && (
              <>
            <div className="docstaff-screen-add-filters">
              <label className="docstaff-screen-add-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search staff roles..."
                  value={roleSearchTerm}
                  onChange={(event) => setRoleSearchTerm(event.target.value)}
                />
              </label>
              <select value={roleDepartmentFilter} onChange={(event) => setRoleDepartmentFilter(event.target.value)}>
                <option>All</option>
                <option>Clinical</option>
                <option>Pathology</option>
                <option>Finance</option>
                <option>Operations</option>
              </select>
              <select value={roleCategoryFilter} onChange={(event) => setRoleCategoryFilter(event.target.value)}>
                <option>All</option>
                <option>Care Team</option>
                <option>Diagnostics</option>
                <option>Administration</option>
                <option>Support</option>
                <option>Leadership</option>
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
                        {role.count} Active
                      </span>
                      <b>{role.code}</b>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="docstaff-screen-add-hint">
              Select the staff role first. Details and permissions can be edited in the next step.
            </div>

              </>
            )}

            {addStaffStep === 2 && (
              <div className="docstaff-screen-staff-details-step">
                <section className="docstaff-screen-details-section">
                  <h3>Personal Information</h3>
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
                      {staffPhoto ? "Change Photo" : "Upload Photo"}
                    </button>
                  </div>

                  <div className="docstaff-screen-details-grid">
                    <label>
                      First Name
                      <input
                        type="text"
                        placeholder="e.g. Jane"
                        value={newStaffForm.firstName}
                        onChange={(event) => handleNewStaffFormChange("firstName", event.target.value)}
                      />
                    </label>
                    <label>
                      Last Name
                      <input
                        type="text"
                        placeholder="e.g. Doe"
                        value={newStaffForm.lastName}
                        onChange={(event) => handleNewStaffFormChange("lastName", event.target.value)}
                      />
                    </label>
                    <label>
                      Email Address
                      <input
                        type="email"
                        placeholder="jane.doe@example.com"
                        value={newStaffForm.email}
                        onChange={(event) => handleNewStaffFormChange("email", event.target.value)}
                      />
                    </label>
                    <label>
                      Phone Number
                      <input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={newStaffForm.phone}
                        onChange={(event) => handleNewStaffFormChange("phone", event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="docstaff-screen-details-section">
                  <h3>Professional Details</h3>
                  <div className="docstaff-screen-details-grid">
                    <label>
                      Date of Birth
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={newStaffForm.dateOfBirth}
                        onClick={(event) => event.currentTarget.showPicker?.()}
                        onChange={(event) => handleNewStaffFormChange("dateOfBirth", event.target.value)}
                      />
                    </label>
                    <label>
                      Gender
                      <select value={newStaffForm.gender} onChange={(event) => handleNewStaffFormChange("gender", event.target.value)}>
                        <option value="">Select gender</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <label>
                      Department
                      <select
                        value={newStaffForm.department}
                        onChange={(event) => handleNewStaffFormChange("department", event.target.value)}
                      >
                        <option>Nursing</option>
                        <option>Emergency</option>
                        <option>Pathology</option>
                        <option>Finance</option>
                        <option>Operations</option>
                        <option>Admin</option>
                      </select>
                    </label>
                    <label>
                      Hire Date
                      <input
                        type="date"
                        value={newStaffForm.hireDate}
                        onClick={(event) => event.currentTarget.showPicker?.()}
                        onChange={(event) => handleNewStaffFormChange("hireDate", event.target.value)}
                      />
                    </label>
                    <label>
                      Shift Preference
                      <select value={newStaffForm.shift} onChange={(event) => handleNewStaffFormChange("shift", event.target.value)}>
                        <option>Morning</option>
                        <option>Evening</option>
                        <option>Night</option>
                      </select>
                    </label>
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
                        <Users size={17} />
                        Personal Information
                      </h3>
                      <button type="button" onClick={() => setAddStaffStep(2)}>
                        <Pencil size={13} />
                        Edit
                      </button>
                    </div>

                    <div className="docstaff-screen-review-personal">
                      <div className="docstaff-screen-review-avatar-block">
                        <img src={staffPhotoPreview || `https://i.pravatar.cc/120?u=${reviewEmail}`} alt={reviewFullName} />
                        <span>
                          <CheckCircle2 size={12} />
                          Verified
                        </span>
                      </div>

                      <div className="docstaff-screen-review-field">
                        <small>Full Name</small>
                        <strong>{reviewFullName}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small>Email Address</small>
                        <strong>{reviewEmail}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small>Phone Number</small>
                        <strong>{reviewPhone}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small>Temporary Password</small>
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
                        <CalendarClock size={17} />
                        Professional Details
                      </h3>
                      <button type="button" onClick={() => setAddStaffStep(2)}>
                        <Pencil size={13} />
                        Edit
                      </button>
                    </div>

                    <div className="docstaff-screen-review-professional">
                      <div className="docstaff-screen-review-field">
                        <small>Role</small>
                        <span className="docstaff-screen-review-role">{selectedStaffRole.title}</span>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small>Employee ID</small>
                        <strong>{reviewEmployeeId}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small>Department</small>
                        <strong>{reviewDepartment}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small>Hire Date</small>
                        <strong>{reviewHireDate}</strong>
                      </div>
                      <div className="docstaff-screen-review-field">
                        <small>Shift Preference</small>
                        <strong>{reviewShift}</strong>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="docstaff-screen-summary-card">
                  <h3>Final Account Summary</h3>
                  <div className="docstaff-screen-summary-list">
                    <div>
                      <CheckCircle2 size={17} />
                      <p>
                        <strong>Personal Info Complete</strong>
                        <span>All required fields filled.</span>
                      </p>
                    </div>
                    <div>
                      <CheckCircle2 size={17} />
                      <p>
                        <strong>Professional Details Set</strong>
                        <span>Role and ID assigned.</span>
                      </p>
                    </div>
                  </div>
                  <div className="docstaff-screen-activation-note">
                    <CheckCircle2 size={18} />
                    <p>
                      An activation email will be sent to <strong>{reviewEmail}</strong> with instructions to set a
                      permanent password.
                    </p>
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
                {addStaffStep === 1 ? "Cancel" : "Back"}
              </button>
              <button type="button" className="docstaff-screen-add-continue" onClick={handleContinueNewStaff}>
                {addStaffStep === 3 ? "Create Account" : "Continue"}
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
                <h2 id="docstaff-update-title">Update Staff</h2>
                <p>{editingStaff.id}</p>
              </div>
              <button type="button" className="docstaff-screen-modal-close" onClick={closeUpdateModal}>
                <X size={18} />
              </button>
            </div>

            <form className="docstaff-screen-edit-form" onSubmit={handleSaveStaffUpdate}>
              <label>
                Name
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => handleEditFormChange("name", event.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => handleEditFormChange("email", event.target.value)}
                  required
                />
              </label>
              <label>
                Department
                <select
                  value={editForm.department}
                  onChange={(event) => handleEditFormChange("department", event.target.value)}
                >
                  <option>Emergency</option>
                  <option>Pathology</option>
                  <option>Finance</option>
                  <option>Admin</option>
                </select>
              </label>
              <label>
                Role
                <select value={editForm.role} onChange={(event) => handleEditFormChange("role", event.target.value)}>
                  <option>Nurse</option>
                  <option>Lab Technician</option>
                  <option>Billing</option>
                  <option>Receptionist</option>
                </select>
              </label>
              <label>
                Shift
                <select value={editForm.shift} onChange={(event) => handleEditFormChange("shift", event.target.value)}>
                  <option>Morning</option>
                  <option>Night</option>
                  <option>Evening</option>
                </select>
              </label>
              <label>
                Status
                <select value={editForm.status} onChange={(event) => handleEditFormChange("status", event.target.value)}>
                  <option>Active</option>
                  <option>On Leave</option>
                </select>
              </label>

              <div className="docstaff-screen-modal-actions">
                <button type="button" className="docstaff-screen-cancel-btn" onClick={closeUpdateModal}>
                  Cancel
                </button>
                <button type="submit" className="docstaff-screen-save-btn">
                  Update Staff
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default DoctorUserManagement;
