// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import "./BookAppointment.css";
// import { API_BASE_URL } from "../../../../axiosConfig";
// import socketService from "../../../../services/socketService";
// import axios from "axios";
// import { useUserTranslation } from "../../../../i18n/LanguageContext";
// import { getPresence } from "../../../../utils/presence";

// const CounselorRequestChat = ({ initialSearch = "" }) => {
//   const navigate = useNavigate();
//   const { t } = useUserTranslation();

//   // State for counselors list
//   const [counselors, setCounselors] = useState([]);
//   const [filteredCounselors, setFilteredCounselors] = useState([]);
//   const [notifications, setNotifications] = useState([]);
//   const [activeChats, setActiveChats] = useState([]);
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [userAnonymous, setUserAnonymous] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const [showUserModal, setShowUserModal] = useState(false);
//   const [selectedCounselorForRequest, setSelectedCounselorForRequest] =
//     useState(null);
//   const [showBookingModal, setShowBookingModal] = useState(false);
//   const [bookingDate, setBookingDate] = useState("");
//   const [bookingNotes, setBookingNotes] = useState("");
//   const [blockedPopup, setBlockedPopup] = useState({ show: false, reason: "" });

//   // Search state
//   const [searchTerm, setSearchTerm] = useState(initialSearch);
//   const [searchLocation, setSearchLocation] = useState("");
//   const [uniqueLocations, setUniqueLocations] = useState([]);
//   const [showLocationDropdown, setShowLocationDropdown] = useState(false);

//   useEffect(() => {
//     if (initialSearch) {
//       setSearchTerm(initialSearch);
//     }
//   }, [initialSearch]);

//   // Get user ID and token from localStorage
//   const userId = localStorage.getItem("userId");
//   const token =
//     localStorage.getItem("token") || localStorage.getItem("accessToken");

//   const handleCounselorClick = (counselor) => {
//     if (!counselor.online && !counselor.available) {
//       alert(t('counselor_unavailable'), `${counselor.name} ${t('not_available_now')}`);
//       return;
//     }
//     setSelectedCounselorForRequest(counselor);
//     setShowUserModal(true);
//   };

//   const handleBookAppointment = (counselor) => {
//     setSelectedCounselorForRequest(counselor);
//     setShowBookingModal(true);
//   };

//   // Function to fetch user data from API
//   const fetchUserData = async () => {
//     if (!userId) {
//       const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
//       setUserAnonymous(anonymousName);
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const response = await axios.get(
//         `${API_BASE_URL}/api/auth/getUser/${userId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       if (response.data.success) {
//         const user = response.data.user;
//         const anonymousName =
//           user.anonymous || user.fullName || user.name || "";
//         setUserAnonymous(anonymousName);
//         if (anonymousName) {
//           localStorage.setItem("userAnonymousName", anonymousName);
//         }
//       } else {
//         const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
//         setUserAnonymous(anonymousName);
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//       const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
//       setUserAnonymous(anonymousName);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Function to get initials for avatar fallback
//   const getInitials = (name = "") => {
//     const safeName = typeof name === "string" ? name.trim() : "";
//     if (!safeName) return "C";

//     const initials = safeName
//       .split(/\s+/)
//       .filter(Boolean)
//       .map((word) => word[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);

//     return initials || "C";
//   };

//   // Some chat payloads store lastMessage as an object; always derive a safe string.
//   const getLastMessageText = useCallback((chat) => {
//     const directLastMessage = chat?.lastMessage;

//     if (typeof directLastMessage === "string") {
//       return directLastMessage;
//     }

//     if (directLastMessage && typeof directLastMessage === "object") {
//       if (typeof directLastMessage.content === "string") {
//         return directLastMessage.content;
//       }
//       if (typeof directLastMessage.text === "string") {
//         return directLastMessage.text;
//       }
//     }

//     const fallback =
//       chat?.messages?.length > 0
//         ? chat.messages[chat.messages.length - 1]?.text
//         : "";

//     return typeof fallback === "string" ? fallback : "";
//   }, []);

//   const normalizeChatMessagePreview = useCallback(
//     (chat) => {
//       const safeChat = chat && typeof chat === "object" ? chat : {};
//       const rawCounselor =
//         safeChat.counselor && typeof safeChat.counselor === "object"
//           ? safeChat.counselor
//           : safeChat.otherParty && typeof safeChat.otherParty === "object"
//             ? safeChat.otherParty
//             : {};

//       const counselorName =
//         rawCounselor.name || rawCounselor.fullName || "Counselor";
//       const counselorAvatar =
//         rawCounselor.avatar ||
//         rawCounselor.profilePhoto?.url ||
//         getInitials(counselorName);

//       return {
//         ...safeChat,
//         id:
//           safeChat.id ||
//           safeChat.chatId ||
//           `${safeChat.counselorId || rawCounselor.id || "chat"}_${safeChat.startedAt || "local"}`,
//         counselorId:
//           safeChat.counselorId || rawCounselor.id || rawCounselor._id || null,
//         counselor: {
//           ...rawCounselor,
//           name: counselorName,
//           avatar: counselorAvatar,
//           avatarType:
//             rawCounselor.avatarType ||
//             (rawCounselor.profilePhoto?.url ? "image" : "text"),
//         },
//         unread: Boolean(safeChat.unread || safeChat.unreadCount),
//         lastMessage: getLastMessageText(safeChat) || "No messages yet",
//       };
//     },
//     [getLastMessageText],
//   );

//   const [isInitialized, setIsInitialized] = useState(false);

//   // Load active chats from localStorage on mount
//   useEffect(() => {
//     const savedChats = localStorage.getItem("activeChats");
//     if (savedChats) {
//       try {
//         const parsedChats = JSON.parse(savedChats);
//         if (Array.isArray(parsedChats)) {
//           setActiveChats(parsedChats.map(normalizeChatMessagePreview));
//         }
//       } catch (error) {
//         console.error("Failed to parse active chats from localStorage:", error);
//       }
//     }
//     setIsInitialized(true);
//   }, [normalizeChatMessagePreview]);

//   // Save active chats to localStorage whenever they change
//   useEffect(() => {
//     if (isInitialized) {
//       localStorage.setItem("activeChats", JSON.stringify(activeChats));
//     }
//   }, [activeChats, isInitialized]);

//   // Function to get counselor profile photo URL
//   const getProfilePhotoUrl = (counselor) => {
//     if (counselor.profilePhoto && counselor.profilePhoto.url) {
//       return counselor.profilePhoto.url;
//     }
//     return null;
//   };

//   // Extract unique locations from counselors
//   const extractUniqueLocations = (counselorsList) => {
//     const locations = counselorsList
//       .map((c) => c.location)
//       .filter((location) => location && location.trim() !== "")
//       .map((location) => location.trim());
//     return [...new Set(locations)].sort();
//   };

//   // Filter counselors based on search term and location
//   useEffect(() => {
//     let filtered = [...counselors];

//     // Filter by name/search term
//     if (searchTerm.trim()) {
//       filtered = filtered.filter(
//         (counselor) =>
//           counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           counselor.specialization
//             .toLowerCase()
//             .includes(searchTerm.toLowerCase()) ||
//           (counselor.expertise &&
//             counselor.expertise.some((exp) =>
//               exp.toLowerCase().includes(searchTerm.toLowerCase()),
//             )),
//       );
//     }

//     // Filter by location
//     if (searchLocation && searchLocation.trim()) {
//       filtered = filtered.filter(
//         (counselor) =>
//           counselor.location &&
//           counselor.location
//             .toLowerCase()
//             .includes(searchLocation.toLowerCase()),
//       );
//     }

//     setFilteredCounselors(filtered);
//   }, [searchTerm, searchLocation, counselors]);

//   // Fetch counselors from API
//   useEffect(() => {
//     const fetchCounselors = async () => {
//       try {
//         const response = await fetch(`${API_BASE_URL}/api/auth/counsellors`);

//         const data = await response.json();

//         if (data.success) {
//           const formattedCounselors = data.counsellors.map((c, index) => {
//             const presence = getPresence(c);
//             return {
//               id: c._id,
//               name: c.fullName,
//               specialization: c.specialization?.join(" , ") || "General",
//               experience: `${c.experience || 0} years`,
//               rating: c.rating || 4.5,
//               online: presence.isOnline,
//               isOnline: presence.isOnline,
//               available: c.isActive,
//               lastSeen: presence.lastSeen,
//               avatar: getProfilePhotoUrl(c) || getInitials(c.fullName),
//               avatarType: getProfilePhotoUrl(c) ? "image" : "text",
//               expertise: c.specialization || [],
//               responseTime: "< 10 seconds",
//               profilePhoto: c.profilePhoto,
//               email: c.email,
//               phone: c.phoneNumber,
//               location: c.location,
//               languages: c.languages || [],
//               aboutMe: c.aboutMe,
//               qualification: c.qualification,
//               education: c.education,
//               certifications: c.certifications || [],
//               consultationMode: c.consultationMode || [],
//               totalSessions: c.totalSessions || 0,
//               activeClients: c.activeClients || 0,
//             };
//           });

//           setCounselors(formattedCounselors);
//           setFilteredCounselors(formattedCounselors);

//           // Extract unique locations
//           const locations = extractUniqueLocations(formattedCounselors);
//           setUniqueLocations(locations);
//         }
//       } catch (error) {
//         console.error("Error fetching counselors:", error);
//       }
//     };

//     fetchCounselors();
//   }, []);

//   useEffect(() => {
//     let mounted = true;

//     const updatePresence = (payload = {}) => {
//       if (!mounted) return;
//       const presence = getPresence(payload);
//       const applyPresence = (list) =>
//         list.map((counselor) =>
//           String(counselor.id) === String(payload.userId)
//             ? {
//                 ...counselor,
//                 online: presence.isOnline,
//                 isOnline: presence.isOnline,
//                 lastSeen: presence.lastSeen,
//               }
//             : counselor,
//         );
//       setCounselors(applyPresence);
//       setFilteredCounselors(applyPresence);
//     };

//     const onConnectError = (err) => {
//       console.error("Appointment presence socket error:", err.message);
//     };

//     socketService.connect().then((socket) => {
//       if (!mounted) return;
//       socket.on("presence-update", updatePresence);
//       socket.on("connect_error", onConnectError);
//     }).catch((err) => {
//       console.error("[BookAppointment] Socket connect failed:", err.message);
//     });

//     return () => {
//       mounted = false;
//       socketService.off("presence-update", updatePresence);
//       socketService.off("connect_error", onConnectError);
//     };
//   }, []);

//   // Fetch user data when modal opens
//   useEffect(() => {
//     if (showUserModal) {
//       fetchUserData();
//     }
//   }, [showUserModal]);

//   // Show notification
//   const addNotification = (
//     type,
//     title,
//     message,
//     counselorId = null,
//     chatId = null,
//   ) => {
//     const newNotification = {
//       id: Date.now(),
//       type,
//       title,
//       message,
//       counselorId,
//       chatId,
//       timestamp: new Date().toLocaleTimeString(),
//       read: false,
//     };
//     setNotifications((prev) => [newNotification, ...prev]);

//     setTimeout(() => {
//       setNotifications((prev) =>
//         prev.filter((n) => n.id !== newNotification.id),
//       );
//     }, 5000);
//   };

//   // Handle Chat Now click
//   const handleChatNow = (counselor) => {
//     if (!counselor.available) {
//       addNotification(
//         "error",
//         "Counselor Unavailable",
//         `${counselor.name} ${t('not_available_now')}`,
//         counselor.id,
//       );
//       return;
//     }

//     setSelectedCounselorForRequest(counselor);
//     setShowUserModal(true);
//   };

//   // Send chat request
//   const sendChatRequest = async (e) => {
//     e.preventDefault();

//     try {
//       setIsLoading(true);

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const counselorId = selectedCounselorForRequest?.id;

//       if (!counselorId) {
//         alert(t('counselor_not_selected'));
//         return;
//       }

//       const res = await axios.post(
//         `${API_BASE_URL}/api/chat/start`,
//         {
//           counselorId: counselorId,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       console.log("✅ Chat Started:", res.data);

//       // Navigate to chat if chat details are in response
//       if (res.data?.chat?.id || res.data?.chatId) {
//         const chatId = res.data.chat?.id || res.data.chatId;
//         setShowUserModal(false);
//         navigate("/user-dashboard", {
//           state: {
//             chatId: chatId,
//             counselor: selectedCounselorForRequest,
//           },
//         });
//       } else {
//         alert(t('chat_request_sent'));
//         setShowUserModal(false);
//       }
//     } catch (error) {
//       console.error("❌ Error:", error);
//       const status = error?.response?.status;
//       const serverError = error?.response?.data?.error || error?.response?.data?.message || "";
//       const existingChatId = error?.response?.data?.chatId;
//       const isBlocked = status === 403 && /restricted|blocked|unavailable/i.test(serverError);

//       if (isBlocked) {
//         setShowUserModal(false);
//         setBlockedPopup({ show: true, reason: serverError });
//       } else if (status === 400 && existingChatId) {
//         // Chat already exists - navigate to it instead of showing error
//         setShowUserModal(false);
//         navigate("/user-dashboard", {
//           state: {
//             chatId: existingChatId,
//             counselor: selectedCounselorForRequest,
//           },
//         });
//       } else {
//         alert(serverError || t('chat_already_connected'));
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleConfirmBooking = async (e) => {
//     e.preventDefault();
//     if (!bookingDate) {
//       alert(t('please_select_date_time'));
//       return;
//     }

//     try {
//       setIsLoading(true);

//       // Convert datetime-local to ISO string for backend (IST timezone)
//       const appointmentDate = new Date(bookingDate);
//       const isoDate = appointmentDate.toISOString();

//       const res = await axios.post(
//         `${API_BASE_URL}/api/appointments`,
//         {
//           counselorId: selectedCounselorForRequest.id,
//           date: isoDate,
//           notes: bookingNotes,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       console.log("✅ Appointment Booked:", res.data);
//       alert(t('appointment_booked_success'));
//       setShowBookingModal(false);
//       setBookingDate("");
//       setBookingNotes("");
//     } catch (error) {
//       console.error("❌ Error booking appointment:", error);
//       alert(error?.response?.data?.message || t('appointment_booking_failed'));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Accept chat request
//   const acceptChatRequest = (counselor) => {
//     const newChat = {
//       id: Date.now(),
//       counselorId: counselor.id,
//       counselor: counselor,
//       user: {
//         name: userAnonymous,
//         anonymousName: userAnonymous,
//         userId: userId || null,
//         isAnonymous: !userId || true,
//       },
//       messages: [
//         {
//           id: Date.now(),
//           text: `Hello ${userAnonymous}! I'm ${counselor.name}. How can I help you today?`,
//           sender: "counselor",
//           time: new Date().toLocaleTimeString(),
//         },
//       ],
//       unread: true,
//       startedAt: new Date().toISOString(),
//       lastMessage: `Hello ${userAnonymous}! I'm ${counselor.name}. How can I help you today?`,
//       lastMessageTime: new Date().toLocaleTimeString(),
//     };

//     setActiveChats((prev) => [newChat, ...prev]);

//     addNotification(
//       "success",
//       "Chat Request Accepted",
//       `${counselor.name} has accepted your chat request. Click to start chatting.`,
//       counselor.id,
//       newChat.id,
//     );
//   };

//   // Navigate to chat interface
//   const goToChat = (chat) => {
//     navigate("/chat", {
//       state: {
//         chatId: chat.chatId || chat.id,
//         chatData: chat,
//         counselor: chat.counselor,
//         user: chat.user,
//       },
//     });
//   };

//   // Remove notification
//   const removeNotification = (id) => {
//     setNotifications((prev) => prev.filter((n) => n.id !== id));
//   };

//   // Clear all filters
//   const clearFilters = () => {
//     setSearchTerm("");
//     setSearchLocation("");
//     setShowLocationDropdown(false);
//   };

//   return (
//     <div className="counselor-request-unique">
//       {/* Notification Panel - Right Side Top */}
//       <div className="notification-panel-unique">
//         {notifications.map((notification) => (
//           <div
//             key={notification.id}
//             className={`notification-item-unique ${notification.type}`}
//             onClick={() => {
//               if (notification.type === "success" && notification.chatId) {
//                 const chat = activeChats.find(
//                   (c) => c.id === notification.chatId,
//                 );
//                 if (chat) goToChat(chat);
//               }
//               removeNotification(notification.id);
//             }}
//           >
//             <div className="notification-icon-unique">
//               {notification.type === "request" && "⏳"}
//               {notification.type === "success" && "✅"}
//               {notification.type === "error" && "❌"}
//               {notification.type === "message" && "💬"}
//             </div>
//             <div className="notification-content-unique">
//               <div className="notification-title-unique">
//                 {notification.title}
//               </div>
//               <div className="notification-message-unique">
//                 {notification.message}
//               </div>
//               <div className="notification-time-unique">
//                 {notification.timestamp}
//               </div>
//             </div>
//             <button
//               className="notification-close-unique"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 removeNotification(notification.id);
//               }}
//             >
//               ×
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Main Content */}
//       <div className="main-content-unique">
//         {/* Counselors Grid */}
//         <div className="counselors-section-unique">
//           <h1 className="page-title-unique">{t('online_counselors')}</h1>
//           <p className="page-subtitle-unique">
//             {t('click_chat_now_request')}
//           </p>

//           {/* Search Bar Section */}
//           <div className="search-section-unique">
//             <div className="search-container-unique">
//               {/* Search by Name */}
//               <div className="search-input-wrapper-unique">
//                 <span className="search-icon-unique">🔍</span>
//                 <input
//                   type="text"
//                   className="search-input-unique"
//                   placeholder={t('search_counselors')}
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 {searchTerm && (
//                   <button
//                     className="clear-search-btn-unique"
//                     onClick={() => setSearchTerm("")}
//                   >
//                     ✕
//                   </button>
//                 )}
//               </div>

//               {/* Search by Location */}
//               <div className="location-input-wrapper-unique">
//                 <span className="location-icon-unique">📍</span>
//                 <input
//                   type="text"
//                   className="location-input-unique"
//                   placeholder={`${t('search')} ${t('location').toLowerCase()}...`}
//                   value={searchLocation}
//                   onChange={(e) => {
//                     setSearchLocation(e.target.value);
//                     setShowLocationDropdown(true);
//                   }}
//                   onFocus={() => setShowLocationDropdown(true)}
//                 />
//                 {searchLocation && (
//                   <button
//                     className="clear-location-btn-unique"
//                     onClick={() => setSearchLocation("")}
//                   >
//                     ✕
//                   </button>
//                 )}

//                 {/* Location Dropdown */}
//                 {showLocationDropdown && uniqueLocations.length > 0 && (
//                   <div className="location-dropdown-unique">
//                     {uniqueLocations
//                       .filter((location) =>
//                         location
//                           .toLowerCase()
//                           .includes(searchLocation.toLowerCase()),
//                       )
//                       .map((location, index) => (
//                         <div
//                           key={index}
//                           className="location-option-unique"
//                           onClick={() => {
//                             setSearchLocation(location);
//                             setShowLocationDropdown(false);
//                           }}
//                         >
//                           📍 {location}
//                         </div>
//                       ))}
//                   </div>
//                 )}
//               </div>

//               {/* Filter Stats and Clear Button */}
//               {(searchTerm || searchLocation) && (
//                 <div className="filter-stats-unique">
//                   <span className="filter-count-unique">
//                     Found {filteredCounselors.length} counselor
//                     {filteredCounselors.length !== 1 ? "s" : ""}
//                   </span>
//                   <button
//                     className="clear-filters-btn-unique"
//                     onClick={clearFilters}
//                   >
//                     Clear Filters
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* No Results Message */}
//           {filteredCounselors.length === 0 && (
//             <div className="no-results-unique">
//               <div className="no-results-icon-unique">🔍</div>
//               <h3>No counselors found</h3>
//               <p>Try adjusting your search or location filters</p>
//               <button
//                 className="reset-search-btn-unique"
//                 onClick={clearFilters}
//               >
//                 Clear all filters
//               </button>
//             </div>
//           )}

//           {/* Desktop View - Cards Grid */}
//           <div className="counselors-grid-unique desktop-view">
//             {filteredCounselors.map((counselor) => (
//               <div
//                 key={counselor.id}
//                 className={`counselor-card-unique ${!counselor.available ? "unavailable" : ""}`}
//               >
//                 <div className="counselor-card-header-unique">
//                   <div className="counselor-avatar-unique">
//                     {counselor.avatarType === "image" ? (
//                       <img
//                         src={counselor.avatar}
//                         alt={counselor.name}
//                         className="counselor-avatar-image-unique"
//                         onError={(e) => {
//                           e.target.style.display = "none";
//                           e.target.parentElement.innerHTML = `<span>${getInitials(counselor.name)}</span>`;
//                         }}
//                       />
//                     ) : (
//                       <span>{counselor.avatar}</span>
//                     )}
//                   </div>
//                   <div className="counselor-status-unique">
//                     <span
//                       className={`status-dot-unique ${counselor.online ? "online" : "offline"}`}
//                     ></span>
//                     <span className="status-text-unique">
//                       {counselor.online ? "Online" : "Offline"}
//                     </span>
//                   </div>
//                 </div>

//                 <h3 className="counselor-name-unique">{counselor.name}</h3>
//                 {counselor.location && (
//                   <div className="counselor-location-unique">
//                     📍 {counselor.location}
//                   </div>
//                 )}
//                 <div className="counselor-specialization-unique">
//                   {counselor.specialization}
//                 </div>

//                 <div className="counselor-experience-unique">
//                   💼 {counselor.experience} experience
//                 </div>

//                 <div className="counselor-rating-unique">
//                   <div className="stars-unique">
//                     {"★".repeat(Math.floor(counselor.rating))}
//                     {"☆".repeat(5 - Math.floor(counselor.rating))}
//                   </div>
//                   <span className="rating-number-unique">
//                     {counselor.rating}
//                   </span>
//                 </div>

//                 <div className="counselor-response-unique">
//                   ⚡ {t('avg_response')} {counselor.responseTime}
//                 </div>

//                 <div className="card-actions-unique">
//                   <button
//                     onClick={() => handleChatNow(counselor)}
//                     disabled={!counselor.available}
//                     className={`chat-now-btn-unique ${!counselor.available ? "disabled" : ""}`}
//                   >
//                     {counselor.available ? `💬 ${t('chat_now')}` : `🔴 ${t('unavailable')}`}
//                   </button>
//                   <button
//                     onClick={() => handleBookAppointment(counselor)}
//                     className="book-apt-btn-unique"
//                   >
//                     📅 {t('book')}
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Mobile View - Table/List Style */}
//           <div className="counselors-table-unique mobile-view">
//             {filteredCounselors.map((counselor) => (
//               <div
//                 key={counselor.id}
//                 className="counselor-row-unique"
//                 onClick={() => handleChatNow(counselor)}
//               >
//                 <div className="row-avatar-unique">
//                   {counselor.avatarType === "image" ? (
//                     <img
//                       src={counselor.avatar}
//                       alt={counselor.name}
//                       onError={(e) => {
//                         e.target.style.display = "none";
//                         e.target.parentElement.innerHTML = `<span>${getInitials(counselor.name)}</span>`;
//                       }}
//                     />
//                   ) : (
//                     <span>{counselor.avatar}</span>
//                   )}
//                 </div>

//                 <div className="row-info-unique">
//                   <div className="row-name-unique">{counselor.name}</div>
//                   <div className="row-specialization-unique">
//                     {counselor.specialization}
//                   </div>
//                   {counselor.location && (
//                     <div className="row-location-unique">
//                       📍 {counselor.location}
//                     </div>
//                   )}
//                   {counselor.experience && (
//                     <div className="row-experience-unique">
//                       💼 {counselor.experience}
//                     </div>
//                   )}
//                 </div>

//                 <div className="row-action-unique">
//                   <span
//                     className={`dot ${counselor.online ? "online" : "offline"}`}
//                   ></span>
//                   <div className="row-buttons-unique">
//                     <button
//                     disabled={!counselor.available}
//                     className="row-btn-unique"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleChatNow(counselor);
//                     }}
//                   >
//                     {t('chat_now')}
//                   </button>
//                   <button
//                     className="row-book-btn-unique"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleBookAppointment(counselor);
//                     }}
//                   >
//                     {t('book')}
//                   </button>
//                 </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Active Chats Sidebar
//         {activeChats.length > 0 && (
//           <div className="active-chats-sidebar-unique">
//             <h3 className="sidebar-title-unique">Active Chats</h3>
//             {activeChats.filter(Boolean).map((chat, index) => {
//               const counselor = chat?.counselor || {};
//               const counselorName = counselor.name || "Counselor";
//               const counselorAvatar =
//                 counselor.avatar || getInitials(counselorName);

//               return (
//                 <div
//                   key={chat?.id || chat?.chatId || `chat_${index}`}
//                   className={`chat-tab-unique ${chat?.unread ? "unread" : ""}`}
//                   onClick={() => goToChat(chat)}
//                 >
//                   <div className="chat-tab-avatar-container-unique">
//                     {counselor.avatarType === "image" ? (
//                       <img
//                         src={counselorAvatar}
//                         alt={counselorName}
//                         className="chat-tab-avatar-image-unique"
//                         onError={(e) => {
//                           e.target.style.display = "none";
//                           e.target.parentElement.innerHTML = `
//                             <div class="chat-tab-avatar-text-unique">
//                               ${getInitials(counselorName)}
//                             </div>
//                           `;
//                         }}
//                       />
//                     ) : (
//                       <div className="chat-tab-avatar-text-unique">
//                         {counselorAvatar}
//                       </div>
//                     )}
//                   </div>
//                   <div className="chat-tab-info-unique">
//                     <div className="chat-tab-name-unique">{counselorName}</div>
//                     <div className="chat-tab-preview-unique">
//                       {getLastMessageText(chat).substring(0, 30)}...
//                     </div>
//                   </div>
//                   {chat?.unread && (
//                     <span className="unread-badge-unique">●</span>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )} */}

//         {showUserModal && (
//           <div
//             className="modal-overlay-unique"
//             onClick={() => setShowUserModal(false)}
//           >
//             <div
//               className="modal-content-unique"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="modal-header-unique">
//                 <h2>Start Chat with {selectedCounselorForRequest?.name}</h2>
//                 <button
//                   className="modal-close-unique"
//                   onClick={() => setShowUserModal(false)}
//                 >
//                   ×
//                 </button>
//               </div>
//               <form onSubmit={sendChatRequest}>
//                 <input
//                   type="hidden"
//                   value={userAnonymous}
//                   name="anonymousName"
//                 />

//                 <div className="modal-user-info-unique">
//                   <div className="user-info-card-unique">
//                     <div className="user-info-icon-unique">🔒</div>
//                     <div className="user-info-details-unique">
//                       <div className="user-info-label-unique">
//                         You are chatting anonymously as:
//                       </div>
//                       <div className="user-info-name-unique">
//                         {isLoading ? (
//                           <span className="loading-text-unique">
//                             Loading your info...
//                           </span>
//                         ) : (
//                           <span className="anonymous-name-unique">
//                             {userAnonymous || "Loading..."}
//                           </span>
//                         )}
//                       </div>
//                       <div className="user-info-note-unique">
//                         This anonymous name will be shown to the counselor
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {selectedCounselorForRequest && (
//                   <div className="counselor-preview-unique">
//                     <div className="counselor-preview-header-unique">
//                       <div className="counselor-preview-avatar-unique">
//                         {selectedCounselorForRequest.avatarType === "image" ? (
//                           <img
//                             src={selectedCounselorForRequest.avatar}
//                             alt={selectedCounselorForRequest.name}
//                             className="counselor-preview-image-unique"
//                           />
//                         ) : (
//                           <div className="counselor-preview-text-unique">
//                             {selectedCounselorForRequest.avatar}
//                           </div>
//                         )}
//                       </div>
//                       <div className="counselor-preview-info-unique">
//                         <div className="counselor-preview-name-unique">
//                           {selectedCounselorForRequest.name}
//                         </div>
//                         <div className="counselor-preview-specialization-unique">
//                           {selectedCounselorForRequest.specialization}
//                         </div>
//                         {selectedCounselorForRequest.location && (
//                           <div className="counselor-preview-location-unique">
//                             📍 {selectedCounselorForRequest.location}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="modal-info-unique">
//                   <p>⏳ Your request will be sent to the counselor</p>
//                   <p>✅ You'll be notified when they accept</p>
//                   <p>
//                     💬 Average response time:{" "}
//                     {selectedCounselorForRequest?.responseTime}
//                   </p>
//                   <p className="privacy-note-unique">
//                     🔒 You are chatting anonymously. Your real identity is
//                     protected.
//                   </p>
//                 </div>

//                 <button
//                   type="submit"
//                   className="modal-submit-btn-unique"
//                   disabled={isLoading || !userAnonymous}
//                 >
//                   {isLoading ? "Loading..." : "Send Chat Request"}
//                 </button>
//               </form>
//             </div>
//           </div>
//         )}

//         {showBookingModal && (
//           <div
//             className="modal-overlay-unique"
//             onClick={() => setShowBookingModal(false)}
//           >
//             <div
//               className="modal-content-unique"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="modal-header-unique">
//                 <h2>Book Appointment with {selectedCounselorForRequest?.name}</h2>
//                 <button
//                   className="modal-close-unique"
//                   onClick={() => setShowBookingModal(false)}
//                 >
//                   ×
//                 </button>
//               </div>
//               <form onSubmit={handleConfirmBooking}>
//                 <div className="booking-form-unique">
//                   <div className="form-group-unique">
//                     <label>Select Date and Time</label>
//                     <input
//                       type="datetime-local"
//                       className="form-input-unique"
//                       value={bookingDate}
//                       onChange={(e) => setBookingDate(e.target.value)}
//                       required
//                     />
//                   </div>
//                   <div className="form-group-unique">
//                     <label>Clinical Notes / Reason (Required)</label>
//                     <textarea
//                       className="form-textarea-unique"
//                       placeholder="Share what you'd like to discuss..."
//                       value={bookingNotes}
//                       onChange={(e) => setBookingNotes(e.target.value)}
//                       required
//                     ></textarea>
//                   </div>
//                 </div>

//                 <div className="modal-info-unique">
//                   <p>⏳ Appointment will be sent for confirmation</p>
//                   <p>✅ Counselor will be notified instantly</p>
//                 </div>

//                 <button
//                   type="submit"
//                   className="modal-submit-btn-unique"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? "Booking..." : "Confirm Appointment"}
//                 </button>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>

//       {blockedPopup.show && (
//         <div
//           onClick={() => setBlockedPopup({ show: false, reason: "" })}
//           style={{
//             position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             zIndex: 9999, padding: 16,
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#fff", borderRadius: 12, maxWidth: 380, width: "100%",
//               padding: "24px 22px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
//               textAlign: "center",
//             }}
//           >
//             <div style={{ fontSize: 42, marginBottom: 8 }}>🚫</div>
//             <h3 style={{ margin: "0 0 8px", color: "#c0392b", fontSize: 18 }}>
//               Chat Unavailable
//             </h3>
//             <p style={{ margin: "0 0 16px", color: "#444", fontSize: 14, lineHeight: 1.5 }}>
//               This counselor has been blocked by admin. You cannot start a chat right now.
//             </p>
//             {blockedPopup.reason && (
//               <p style={{ margin: "0 0 16px", color: "#888", fontSize: 12, fontStyle: "italic" }}>
//                 {blockedPopup.reason}
//               </p>
//             )}
//             <button
//               onClick={() => setBlockedPopup({ show: false, reason: "" })}
//               style={{
//                 background: "#c0392b", color: "#fff", border: "none",
//                 padding: "10px 24px", borderRadius: 8, cursor: "pointer",
//                 fontSize: 14, fontWeight: 600,
//               }}
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CounselorRequestChat;



import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaLock,
  FaMapMarkerAlt,
  FaSearch,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import "./BookAppointment.css";
import axiosInstance, { API_BASE_URL } from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import axios from "axios";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import {
  getPresence,
  getPresenceUserId,
  resolveOfflineLastSeen,
} from "../../../../utils/presence";

const CounselorRequestChat = ({ initialSearch = "", onOpenConversation }) => {
  const navigate = useNavigate();
  const { t } = useUserTranslation();
  const tr = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const openCounselorChat = (conversation) => {
    if (onOpenConversation) {
      onOpenConversation(conversation);
      return;
    }

    navigate("/chat", { state: conversation });
  };

  // State for counselors list
  const [counselors, setCounselors] = useState([]);
  const [filteredCounselors, setFilteredCounselors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [userAnonymous, setUserAnonymous] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCounselorForRequest, setSelectedCounselorForRequest] =
    useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [blockedPopup, setBlockedPopup] = useState({ show: false, reason: "" });

  // State for chat requests status
  const [pendingRequests, setPendingRequests] = useState({}); // { counselorId: true }
  const [acceptedChats, setAcceptedChats] = useState({}); // { counselorId: chatId }
  const [rejectedRequests, setRejectedRequests] = useState({}); // { counselorId: true }
  const [paymentConfig, setPaymentConfig] = useState({
    enabled: false,
    fees: { chat: 100, voice: 200, video: 300 },
    durationMinutes: 30,
    requestExpiryHours: 24,
  });
  const [walletBalance, setWalletBalance] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [searchLocation, setSearchLocation] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState("all");
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  // Get user ID and token from localStorage
  const userId = localStorage.getItem("userId");
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const configRes = await axiosInstance.get("/api/chat/payment-config");
        setPaymentConfig((prev) => ({ ...prev, ...(configRes.data || {}) }));
      } catch (error) {
        console.warn(
          "Payment config unavailable:",
          error?.response?.data || error.message,
        );
      }

      if (!token) return;

      try {
        const walletRes = await axiosInstance.get("/api/wallet/data");
        setWalletBalance(Number(walletRes.data?.balance || 0));
      } catch (error) {
        console.warn(
          "Wallet balance unavailable:",
          error?.response?.data || error.message,
        );
      }
    };

    fetchPaymentDetails();
  }, [token]);

  // Check chat status function
  const checkChatStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/chat-statuses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data = response.data || {};
      
      // A chat request must stay connected to its counselor card after this
      // tab remounts. Both pending and accepted chats use the Chat Now button.
      const pending = {};
      const accepted = {};
      const rejected = {};
      const latestByCounselor = new Map();
      
      if (data.chats && Array.isArray(data.chats)) {
        data.chats.forEach(chat => {
          const counselorId = chat.counselorId || chat.counselor?._id || chat.counselor?.id;
          if (counselorId) {
            const status = String(chat.status || "").toLowerCase();

            if (["pending", "accepted", "active"].includes(status)) {
              accepted[counselorId] = chat.chatId || chat.id || chat._id;
              return;
            }

            const currentTime = new Date(
              chat.updatedAt || chat.createdAt || chat.timestamp || chat.startedAt || 0,
            ).getTime();
            const previous = latestByCounselor.get(counselorId);

            if (!previous || currentTime >= previous.time) {
              latestByCounselor.set(counselorId, { chat, time: currentTime });
            }
          }
        });
      }

      latestByCounselor.forEach(({ chat }, counselorId) => {
        if (accepted[counselorId]) {
          return;
        }

        const status = String(chat.status || "").toLowerCase();

        if (["pending", "accepted", "active"].includes(status)) {
          accepted[counselorId] = chat.chatId || chat.id || chat._id;
        } else if (["rejected", "declined", "cancelled", "canceled"].includes(status)) {
          rejected[counselorId] = true;
        }
      });
      
      setPendingRequests(pending);
      setAcceptedChats(accepted);
      setRejectedRequests(rejected);
    } catch (error) {
      console.error("Failed to fetch chat status:", error);
    }
  };

  // Fetch chat status when component mounts
  useEffect(() => {
    if (token) {
      checkChatStatus();
    }
  }, [token]);

  const handleCounselorClick = (counselor) => {
    if (!counselor.online && !counselor.available) {
      alert(t('counselor_unavailable'), `${counselor.name} ${t('not_available_now')}`);
      return;
    }
    setSelectedCounselorForRequest(counselor);
    setShowUserModal(true);
  };

  const handleBookAppointment = (counselor) => {
    setSelectedCounselorForRequest(counselor);
    setShowBookingModal(true);
  };

  // Function to fetch user data from API
  const fetchUserData = async () => {
    if (!userId) {
      const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
      setUserAnonymous(anonymousName);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/auth/getUser/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        const user = response.data.user;
        const anonymousName =
          user.anonymous || user.fullName || user.name || "";
        setUserAnonymous(anonymousName);
        if (anonymousName) {
          localStorage.setItem("userAnonymousName", anonymousName);
        }
      } else {
        const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
        setUserAnonymous(anonymousName);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
      setUserAnonymous(anonymousName);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get initials for avatar fallback
  const getInitials = (name = "") => {
    const safeName = typeof name === "string" ? name.trim() : "";
    if (!safeName) return "C";

    const initials = safeName
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return initials || "C";
  };

  // Some chat payloads store lastMessage as an object; always derive a safe string.
  const getLastMessageText = useCallback((chat) => {
    const directLastMessage = chat?.lastMessage;

    if (typeof directLastMessage === "string") {
      return directLastMessage;
    }

    if (directLastMessage && typeof directLastMessage === "object") {
      if (typeof directLastMessage.content === "string") {
        return directLastMessage.content;
      }
      if (typeof directLastMessage.text === "string") {
        return directLastMessage.text;
      }
    }

    const fallback =
      chat?.messages?.length > 0
        ? chat.messages[chat.messages.length - 1]?.text
        : "";

    return typeof fallback === "string" ? fallback : "";
  }, []);

  const normalizeChatMessagePreview = useCallback(
    (chat) => {
      const safeChat = chat && typeof chat === "object" ? chat : {};
      const rawCounselor =
        safeChat.counselor && typeof safeChat.counselor === "object"
          ? safeChat.counselor
          : safeChat.otherParty && typeof safeChat.otherParty === "object"
            ? safeChat.otherParty
            : {};

      const counselorName =
        rawCounselor.name || rawCounselor.fullName || "Counselor";
      const counselorAvatar =
        rawCounselor.avatar ||
        rawCounselor.profilePhoto?.url ||
        getInitials(counselorName);

      return {
        ...safeChat,
        id:
          safeChat.id ||
          safeChat.chatId ||
          `${safeChat.counselorId || rawCounselor.id || "chat"}_${safeChat.startedAt || "local"}`,
        counselorId:
          safeChat.counselorId || rawCounselor.id || rawCounselor._id || null,
        counselor: {
          ...rawCounselor,
          name: counselorName,
          avatar: counselorAvatar,
          avatarType:
            rawCounselor.avatarType ||
            (rawCounselor.profilePhoto?.url ? "image" : "text"),
        },
        unread: Boolean(safeChat.unread || safeChat.unreadCount),
        lastMessage: getLastMessageText(safeChat) || "No messages yet",
      };
    },
    [getLastMessageText],
  );

  const [isInitialized, setIsInitialized] = useState(false);

  // Load active chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("activeChats");
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        if (Array.isArray(parsedChats)) {
          setActiveChats(parsedChats.map(normalizeChatMessagePreview));
        }
      } catch (error) {
        console.error("Failed to parse active chats from localStorage:", error);
      }
    }
    setIsInitialized(true);
  }, [normalizeChatMessagePreview]);

  // Save active chats to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("activeChats", JSON.stringify(activeChats));
    }
  }, [activeChats, isInitialized]);

  // Function to get counselor profile photo URL
  const getProfilePhotoUrl = (counselor) => {
    if (counselor.profilePhoto && counselor.profilePhoto.url) {
      return counselor.profilePhoto.url;
    }
    return null;
  };

  // Extract unique locations from counselors
  const extractUniqueLocations = (counselorsList) => {
    const locations = counselorsList
      .map((c) => c.location)
      .filter((location) => location && location.trim() !== "")
      .map((location) => location.trim());
    return [...new Set(locations)].sort();
  };

  // Filter counselors based on search term and location
  useEffect(() => {
    let filtered = [...counselors];

    // Filter by name/search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (counselor) =>
          counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          counselor.specialization
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (counselor.expertise &&
            counselor.expertise.some((exp) =>
              exp.toLowerCase().includes(searchTerm.toLowerCase()),
            )),
      );
    }

    // Filter by location
    if (searchLocation && searchLocation.trim()) {
      filtered = filtered.filter(
        (counselor) =>
          counselor.location &&
          counselor.location
            .toLowerCase()
            .includes(searchLocation.toLowerCase()),
      );
    }

    setFilteredCounselors(filtered);
  }, [searchTerm, searchLocation, counselors]);

  // Fetch counselors from API
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/counsellors`);

        const data = await response.json();

        if (data.success) {
          const formattedCounselors = data.counsellors.map((c) => {
            // The directory API returns live socket presence. Do not combine
            // it with an older login/session value, otherwise an offline
            // counselor can remain displayed as online.
            const presence = getPresence(c);
            const isOnline = presence.isOnline;
            return {
              id: c._id,
              name: c.fullName,
              specialization: c.specialization?.join(" , ") || "General",
              experience: `${c.experience || 0} years`,
              rating: c.rating || 4.5,
              online: isOnline,
              isOnline,
              isLoggedIn: isOnline,
              hasActiveSession: isOnline,
              presenceStatus: isOnline ? "online" : "offline",
              socketOnline: isOnline,
              available: c.isActive,
              lastSeen: c.lastSeen || null,
              avatar: getProfilePhotoUrl(c) || getInitials(c.fullName),
              avatarType: getProfilePhotoUrl(c) ? "image" : "text",
              expertise: c.specialization || [],
              responseTime: "< 10 seconds",
              profilePhoto: c.profilePhoto,
              email: c.email,
              phone: c.phoneNumber,
              location: c.location,
              languages: c.languages || [],
              aboutMe: c.aboutMe,
              qualification: c.qualification,
              education: c.education,
              certifications: c.certifications || [],
              consultationMode: c.consultationMode || [],
              totalSessions: c.totalSessions || 0,
              activeClients: c.activeClients || 0,
            };
          });

          setCounselors(formattedCounselors);
          setFilteredCounselors(formattedCounselors);

          // Extract unique locations
          const locations = extractUniqueLocations(formattedCounselors);
          setUniqueLocations(locations);
        }
      } catch (error) {
        console.error("Error fetching counselors:", error);
      }
    };

    fetchCounselors();
  }, []);

  useEffect(() => {
    let mounted = true;

    const updatePresence = (payload = {}) => {
      if (!mounted) return;
      const presence = getPresence(payload);
      const presenceUserId = getPresenceUserId(payload);
      if (!presenceUserId) return;

      const applyPresence = (list) =>
        list.map((counselor) => {
          if (String(counselor.id) !== String(presenceUserId)) {
            return counselor;
          }

          // A presence-update is the newest live state. It must replace every
          // cached presence field so an explicit offline event is visible.
          const isOnline = presence.isOnline;

          return {
            ...counselor,
            online: isOnline,
            isOnline,
            isLoggedIn: isOnline,
            hasActiveSession: isOnline,
            presenceStatus: isOnline ? "online" : "offline",
            socketOnline: isOnline,
            lastSeen: resolveOfflineLastSeen(presence, counselor.lastSeen),
          };
        });
      setCounselors(applyPresence);
    };

    const onChatAccepted = (data) => {
      if (!mounted) return;
      const counselorId = data.counselorId || data.counselor?._id || data.counselor?.id;
      const chatId = data.chatId || data.chat?.id || data._id;
      
      if (counselorId) {
        // Remove from pending and add to accepted
        setPendingRequests(prev => {
          const newPending = { ...prev };
          delete newPending[counselorId];
          return newPending;
        });
        setRejectedRequests(prev => {
          const newRejected = { ...prev };
          delete newRejected[counselorId];
          return newRejected;
        });
        setAcceptedChats(prev => ({ ...prev, [counselorId]: chatId }));
        
        // Show notification
        addNotification(
          "success",
          "Chat Request Accepted",
          `Your chat request has been accepted! Click to start chatting.`,
          counselorId,
          chatId
        );
      }
    };

    const onChatRejected = (data = {}) => {
      if (!mounted) return;
      const counselorId =
        data.counselorId ||
        data.counsellorId ||
        data.counselor?._id ||
        data.counselor?.id;

      if (counselorId) {
        setPendingRequests(prev => {
          const newPending = { ...prev };
          delete newPending[counselorId];
          return newPending;
        });
        setAcceptedChats(prev => {
          const newAccepted = { ...prev };
          delete newAccepted[counselorId];
          return newAccepted;
        });
        setRejectedRequests(prev => ({ ...prev, [counselorId]: true }));
      }
    };

    const onConnectError = (err) => {
      console.error("Appointment presence socket error:", err.message);
    };

    socketService.connect().then((socket) => {
      if (!mounted) return;
      socket.on("presence-update", updatePresence);
      socket.on("chat-accepted", onChatAccepted);
      socket.on("chat-rejected", onChatRejected);
      socket.on("chat-declined", onChatRejected);
      socket.on("chat-cancelled", onChatRejected);
      socket.on("connect_error", onConnectError);
    }).catch((err) => {
      console.error("[BookAppointment] Socket connect failed:", err.message);
    });

    return () => {
      mounted = false;
      socketService.off("presence-update", updatePresence);
      socketService.off("chat-accepted", onChatAccepted);
      socketService.off("chat-rejected", onChatRejected);
      socketService.off("chat-declined", onChatRejected);
      socketService.off("chat-cancelled", onChatRejected);
      socketService.off("connect_error", onConnectError);
    };
  }, []);

  // Fetch user data when modal opens
  useEffect(() => {
    if (showUserModal) {
      fetchUserData();
    }
  }, [showUserModal]);

  // Show notification
  const addNotification = (
    type,
    title,
    message,
    counselorId = null,
    chatId = null,
  ) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      counselorId,
      chatId,
      timestamp: new Date().toLocaleTimeString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== newNotification.id),
      );
    }, 5000);
  };

  // Get button state for a counselor
  const getChatButtonState = (counselor) => {
    const counselorId = counselor.id;
    const isOnline = counselor.online || counselor.isOnline;
    const isPending = pendingRequests[counselorId];
    const isAccepted = !!acceptedChats[counselorId];
    if (!isOnline || !counselor.available) {
      const text = tr("unavailable", "Unavailable");
      return { text, title: text, disabled: true, className: "disabled" };
    }
    
    if (isAccepted) {
      const text = tr("chat_now", "Chat Now");
      return { text, title: text, disabled: false, className: "active" };
    }
    
    if (isPending) {
      const text = tr("request_sent", tr("chat_request_sent", "Request Sent"));
      return { text, title: text, disabled: true, className: "pending" };
    }
    
    const text = tr(
      "send_chat_request",
      tr("counselor.messageCounselor", "Send Chat Request"),
    );
    return { text, title: text, disabled: false, className: "" };
  };

  // Handle Chat Now click
  const handleChatNow = (counselor) => {
    const counselorId = counselor.id;

    // Check if chat is already accepted
    if (acceptedChats[counselorId]) {
      openCounselorChat({
          chatId: acceptedChats[counselorId],
          counselor: {
            id: counselor.id,
            name: counselor.name,
            specialization: counselor.specialization,
            online: counselor.online,
            lastSeen: counselor.lastSeen,
            avatar: counselor.avatar,
            profilePhoto: counselor.profilePhoto,
            avatarType: counselor.avatarType,
          },
      });
      return;
    }

    // Check if request is already pending
    if (pendingRequests[counselorId]) {
      alert(t('chat_request_already_sent'));
      return;
    }

    if (!counselor.available) {
      addNotification(
        "error",
        "Counselor Unavailable",
        `${counselor.name} ${t('not_available_now')}`,
        counselor.id,
      );
      return;
    }

    setSelectedCounselorForRequest(counselor);
    setShowUserModal(true);
  };

  // Send chat request
  const sendChatRequest = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counselorId = selectedCounselorForRequest?.id;

      if (!counselorId) {
        alert(t('counselor_not_selected'));
        return;
      }

      if (paymentConfig.enabled) {
        const amount = Number(paymentConfig.fees?.chat || 100);
        const currentBalance = Number(walletBalance || 0);

        if (currentBalance < amount) {
          alert(`Insufficient wallet balance. Please add ₹${amount - currentBalance} to continue.`);
          return;
        }
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/chat/start`,
        {
          counselorId: counselorId,
          sessionType: "chat",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("✅ Chat Started:", res.data);

      // Check response status
      const chatId = res.data?.chat?.id || res.data?.chatId;
      const status = res.data?.chat?.status || res.data?.status;
      if (typeof res.data?.chat?.walletBalance === "number") {
        setWalletBalance(res.data.chat.walletBalance);
      }

      if (status === 'pending') {
        // Keep Chat Now visible immediately and after a tab change. The
        // request remains pending for the counselor, but the user is already
        // connected to this chat.
        setAcceptedChats(prev => ({ ...prev, [counselorId]: chatId }));
        setPendingRequests(prev => {
          const newPending = { ...prev };
          delete newPending[counselorId];
          return newPending;
        });
        setRejectedRequests(prev => {
          const newRejected = { ...prev };
          delete newRejected[counselorId];
          return newRejected;
        });
        setShowUserModal(false);
        alert(t('chat_request_sent'));
        addNotification(
          "request",
          "Chat Request Sent",
          `Your chat request has been sent to ${selectedCounselorForRequest.name}. Waiting for acceptance.`,
          counselorId
        );
      } else if (status === 'accepted' || status === 'active') {
        // Chat already accepted, navigate directly
        setAcceptedChats(prev => ({ ...prev, [counselorId]: chatId }));
        setPendingRequests(prev => {
          const newPending = { ...prev };
          delete newPending[counselorId];
          return newPending;
        });
        setRejectedRequests(prev => {
          const newRejected = { ...prev };
          delete newRejected[counselorId];
          return newRejected;
        });
        setShowUserModal(false);
        openCounselorChat({
            chatId: chatId,
            counselor: selectedCounselorForRequest,
        });
      } else if (res.data?.chat?.id || res.data?.chatId) {
        // Fallback: navigate to chat
        setShowUserModal(false);
        navigate("/user-dashboard", {
          state: {
            chatId: chatId,
            counselor: selectedCounselorForRequest,
          },
        });
      } else {
        alert(t('chat_request_sent'));
        setShowUserModal(false);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      const status = error?.response?.status;
      const serverError = error?.response?.data?.error || error?.response?.data?.message || "";
      const existingChatId = error?.response?.data?.chatId;
      const isBlocked = status === 403 && /restricted|blocked|unavailable/i.test(serverError);

      if (isBlocked) {
        setShowUserModal(false);
        setBlockedPopup({ show: true, reason: serverError });
      } else if (status === 400 && existingChatId) {
        // Chat already exists - navigate to it
        setAcceptedChats(prev => ({ ...prev, [selectedCounselorForRequest.id]: existingChatId }));
        setPendingRequests(prev => {
          const newPending = { ...prev };
          delete newPending[selectedCounselorForRequest.id];
          return newPending;
        });
        setRejectedRequests(prev => {
          const newRejected = { ...prev };
          delete newRejected[selectedCounselorForRequest.id];
          return newRejected;
        });
        setShowUserModal(false);
        navigate("/user-dashboard", {
          state: {
            chatId: existingChatId,
            counselor: selectedCounselorForRequest,
          },
        });
      } else {
        alert(serverError || t('chat_already_connected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      alert(t('please_select_date_time'));
      return;
    }

    try {
      setIsLoading(true);

      // Convert datetime-local to ISO string for backend (IST timezone)
      const appointmentDate = new Date(bookingDate);
      const isoDate = appointmentDate.toISOString();

      const res = await axios.post(
        `${API_BASE_URL}/api/appointments`,
        {
          counselorId: selectedCounselorForRequest.id,
          date: isoDate,
          notes: bookingNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("✅ Appointment Booked:", res.data);
      alert(t('appointment_booked_success'));
      setShowBookingModal(false);
      setBookingDate("");
      setBookingNotes("");
    } catch (error) {
      console.error("❌ Error booking appointment:", error);
      alert(error?.response?.data?.message || t('appointment_booking_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Accept chat request (for demo)
  const acceptChatRequest = (counselor) => {
    const newChat = {
      id: Date.now(),
      counselorId: counselor.id,
      counselor: counselor,
      user: {
        name: userAnonymous,
        anonymousName: userAnonymous,
        userId: userId || null,
        isAnonymous: !userId || true,
      },
      messages: [
        {
          id: Date.now(),
          text: `Hello ${userAnonymous}! I'm ${counselor.name}. How can I help you today?`,
          sender: "counselor",
          time: new Date().toLocaleTimeString(),
        },
      ],
      unread: true,
      startedAt: new Date().toISOString(),
      lastMessage: `Hello ${userAnonymous}! I'm ${counselor.name}. How can I help you today?`,
      lastMessageTime: new Date().toLocaleTimeString(),
    };

    setActiveChats((prev) => [newChat, ...prev]);

    addNotification(
      "success",
      "Chat Request Accepted",
      `${counselor.name} has accepted your chat request. Click to start chatting.`,
      counselor.id,
      newChat.id,
    );
  };

  // Navigate to chat interface
  const goToChat = (chat) => {
    openCounselorChat({
        chatId: chat.chatId || chat.id,
        chatData: chat,
        counselor: chat.counselor,
        user: chat.user,
    });
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSearchLocation("");
    setDirectoryFilter("all");
    setShowLocationDropdown(false);
  };

  const directoryCounselors = filteredCounselors.filter((counselor) => {
    const specialization = String(counselor.specialization || "").toLowerCase();
    if (directoryFilter === "online") return counselor.online;
    if (directoryFilter === "top-rated") return Number(counselor.rating || 0) >= 4;
    if (directoryFilter === "therapist") return specialization.includes("therap");
    if (directoryFilter === "nearby") return Boolean(counselor.location);
    return true;
  });

  const recommendedCounselor =
    [...directoryCounselors].sort((a, b) =>
      Number(b.online) - Number(a.online) ||
      Number(b.rating || 0) - Number(a.rating || 0),
    )[0];

  return (
    <div className="counselor-request-unique">
      {/* Notification Panel - Right Side Top */}
      <div className="notification-panel-unique">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item-unique ${notification.type}`}
            onClick={() => {
              if (notification.type === "success" && notification.chatId) {
                const chat = activeChats.find(
                  (c) => c.id === notification.chatId,
                );
                if (chat) goToChat(chat);
              }
              removeNotification(notification.id);
            }}
          >
            <div className="notification-icon-unique">
              {notification.type === "request" && "⏳"}
              {notification.type === "success" && "✅"}
              {notification.type === "error" && "❌"}
              {notification.type === "message" && "💬"}
            </div>
            <div className="notification-content-unique">
              <div className="notification-title-unique">
                {notification.title}
              </div>
              <div className="notification-message-unique">
                {notification.message}
              </div>
              <div className="notification-time-unique">
                {notification.timestamp}
              </div>
            </div>
            <button
              className="notification-close-unique"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="main-content-unique">
        {/* Counselors Grid */}
        <div className="counselors-section-unique">
          <div className="directory-hero-unique">
            <h1 className="page-title-unique">{t('online_counselors')}</h1>
            <p className="page-subtitle-unique">Send a request and book a counsellor</p>
          </div>

          {/* Search Bar Section */}
          <div className="search-section-unique">
            <div className="search-container-unique">
              {/* Search by Name */}
              <div className="search-input-wrapper-unique">
                <FaSearch className="search-icon-unique" aria-hidden="true" />
                <input
                  type="text"
                  className="search-input-unique"
                  placeholder="Search patients, counsellors, or conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="clear-search-btn-unique"
                    onClick={() => setSearchTerm("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search by Location */}
              <div className="location-input-wrapper-unique">
                <FaMapMarkerAlt className="location-icon-unique" aria-hidden="true" />
                <input
                  type="text"
                  className="location-input-unique"
                  placeholder={`${t('search')} ${t('location').toLowerCase()}...`}
                  value={searchLocation}
                  onChange={(e) => {
                    setSearchLocation(e.target.value);
                    setShowLocationDropdown(true);
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                />
                {searchLocation && (
                  <button
                    className="clear-location-btn-unique"
                    onClick={() => setSearchLocation("")}
                  >
                    ✕
                  </button>
                )}

                {/* Location Dropdown */}
                {showLocationDropdown && uniqueLocations.length > 0 && (
                  <div className="location-dropdown-unique">
                    {uniqueLocations
                      .filter((location) =>
                        location
                          .toLowerCase()
                          .includes(searchLocation.toLowerCase()),
                      )
                      .map((location, index) => (
                        <div
                          key={index}
                          className="location-option-unique"
                          onClick={() => {
                            setSearchLocation(location);
                            setShowLocationDropdown(false);
                          }}
                        >
                          📍 {location}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Filter Stats and Clear Button */}
              {(searchTerm || searchLocation) && (
                <div className="filter-stats-unique">
                  <span className="filter-count-unique">
                    Found {filteredCounselors.length} counselor
                    {filteredCounselors.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    className="clear-filters-btn-unique"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="directory-filter-pills-unique" role="tablist" aria-label="Counsellor filters">
            {[
              ["all", "All"],
              ["online", "Online"],
              ["nearby", "Nearby"],
              ["top-rated", "Top Rated"],
              ["therapist", "Therapist"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={directoryFilter === value ? "active" : ""}
                onClick={() => setDirectoryFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {recommendedCounselor && (
            <section className="recommended-section-unique">
              <h2>Recommended for you</h2>
              <div className="recommended-card-unique">
                <div className="recommended-profile-unique">
                  <div className="recommended-avatar-unique">
                    {recommendedCounselor.avatarType === "image" ? (
                      <img src={recommendedCounselor.avatar} alt={recommendedCounselor.name} />
                    ) : (
                      <span>{recommendedCounselor.avatar}</span>
                    )}
                  </div>
                  <div>
                    <h3>{recommendedCounselor.name} <span>✓</span></h3>
                    <p>{recommendedCounselor.specialization}</p>
                    <div className="recommended-stats-unique">
                      <span>▣ {recommendedCounselor.experience} experience</span>
                      <span className="rating">★ {recommendedCounselor.rating || "4.9"}</span>
                    </div>
                  </div>
                </div>
                <div className="recommended-actions-unique">
                  <span className={`recommended-availability-unique ${recommendedCounselor.online ? "available" : ""}`}>
                    ● {recommendedCounselor.online ? "AVAILABLE" : "OFFLINE"}
                  </span>
                  <div>
                    <button onClick={() => handleBookAppointment(recommendedCounselor)}>Book Appointment</button>
                    <button
                      className="outline"
                      disabled={!recommendedCounselor.online}
                      onClick={() => handleChatNow(recommendedCounselor)}
                    >
                      Chat Now
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="available-heading-unique">
            <h2>Available Counselors</h2>
            <button type="button" onClick={() => setDirectoryFilter("all")}>See All</button>
          </div>

          {/* No Results Message */}
          {directoryCounselors.length === 0 && (
            <div className="no-results-unique">
              <div className="no-results-icon-unique">🔍</div>
              <h3>No counselors found</h3>
              <p>Try adjusting your search or location filters</p>
              <button
                className="reset-search-btn-unique"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Desktop View - Cards Grid */}
          <div className="counselors-grid-unique desktop-view">
            {directoryCounselors.map((counselor) => {
              const buttonState = getChatButtonState(counselor);
              
              return (
                <div
                  key={counselor.id}
                  className={`counselor-card-unique ${!counselor.available ? "unavailable" : ""}`}
                >
                  <div className="counselor-card-header-unique">
                    <div className="counselor-avatar-unique">
                      {counselor.avatarType === "image" ? (
                        <img
                          src={counselor.avatar}
                          alt={counselor.name}
                          className="counselor-avatar-image-unique"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = `<span>${getInitials(counselor.name)}</span>`;
                          }}
                        />
                      ) : (
                        <span>{counselor.avatar}</span>
                      )}
                    </div>
                    <div className="counselor-status-unique">
                      <span
                        className={`status-dot-unique ${counselor.online ? "online" : "offline"}`}
                      ></span>
                      <span className="status-text-unique">
                        {counselor.online
                          ? tr("online", "Online")
                          : tr("offline", "Offline")}
                      </span>
                    </div>
                  </div>

                  <h3 className="counselor-name-unique">{counselor.name}</h3>
                  {counselor.location && (
                    <div className="counselor-location-unique">
                      📍 {counselor.location}
                    </div>
                  )}
                  <div className="counselor-specialization-unique">
                    {counselor.specialization}
                  </div>

                  <div className="counselor-experience-unique">
                    💼 {counselor.experience} experience
                  </div>

                  <div className="counselor-rating-unique">
                    <div className="stars-unique">
                      {"★".repeat(Math.floor(counselor.rating))}
                      {"☆".repeat(5 - Math.floor(counselor.rating))}
                    </div>
                    <span className="rating-number-unique">
                      {counselor.rating}
                    </span>
                  </div>

                  <div className="card-actions-unique">
                    <button
                      onClick={() => handleChatNow(counselor)}
                      disabled={buttonState.disabled}
                      className={`chat-now-btn-unique ${buttonState.className}`}
                      title={buttonState.title}
                    >
                      {buttonState.text}
                    </button>
                    <button
                      onClick={() => handleBookAppointment(counselor)}
                      className="book-apt-btn-unique"
                    >
                      📅 {t('book')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile View - Table/List Style */}
          <div className="counselors-table-unique mobile-view">
            {directoryCounselors.map((counselor) => {
              const buttonState = getChatButtonState(counselor);
              
              return (
                <div
                  key={counselor.id}
                  className="counselor-row-unique"
                >
                  <div className="row-avatar-unique">
                    {counselor.avatarType === "image" ? (
                      <img
                        src={counselor.avatar}
                        alt={counselor.name}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<span>${getInitials(counselor.name)}</span>`;
                        }}
                      />
                    ) : (
                      <span>{counselor.avatar}</span>
                    )}
                  </div>

                  <div className="row-info-unique">
                    <div className="row-name-unique">{counselor.name}</div>
                    <div className="row-specialization-unique">
                      {counselor.specialization}
                    </div>
                    {counselor.location && (
                      <div className="row-location-unique">
                        📍 {counselor.location}
                      </div>
                    )}
                    {counselor.experience && (
                      <div className="row-experience-unique">
                        💼 {counselor.experience}
                      </div>
                    )}
                  </div>

                  <div className="row-action-unique">
                    <span
                      className={`dot ${counselor.online ? "online" : "offline"}`}
                    ></span>
                    <div className="row-buttons-unique">
                      <button
                        disabled={buttonState.disabled}
                        className={`row-btn-unique ${buttonState.className}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChatNow(counselor);
                        }}
                      >
                        {buttonState.text}
                      </button>
                      <button
                        className="row-book-btn-unique"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookAppointment(counselor);
                        }}
                      >
                        {t('book')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat Request Modal */}
      {showUserModal && (
        <div
          className="modal-overlay-unique"
          onClick={() => setShowUserModal(false)}
        >
          <div
            className="modal-content-unique chat-request-modal-unique"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-unique">
              <h2>
                {tr("start_chat", "Start Chat")}{" "}
                {selectedCounselorForRequest?.name
                  ? `${tr("with", "with")} ${selectedCounselorForRequest.name}`
                  : ""}
              </h2>
              <button
                className="modal-close-unique"
                onClick={() => setShowUserModal(false)}
                type="button"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={sendChatRequest}>
              <input
                type="hidden"
                value={userAnonymous}
                name="anonymousName"
              />

              <div className="modal-user-info-unique">
                <div className="user-info-card-unique">
                  <div className="user-info-details-unique">
                    <div className="user-info-label-unique">
                      <FaLock aria-hidden="true" />
                      You're chatting anonymously
                    </div>
                    <div className="user-info-name-unique">
                      {isLoading ? (
                        <span className="loading-text-unique">
                          Loading your info...
                        </span>
                      ) : (
                        <span className="anonymous-name-unique">
                          <FaUser aria-hidden="true" />
                          Stranger
                        </span>
                      )}
                    </div>
                    <div className="user-info-note-unique">
                      Your real identity remains hidden. Only your anonymous
                      name is visible to the counselor.
                    </div>
                  </div>
                  <FaLock className="anonymous-watermark-unique" aria-hidden="true" />
                </div>
              </div>

              {selectedCounselorForRequest && (
                <div className="counselor-preview-unique">
                  <div className="counselor-preview-header-unique">
                    <div className="counselor-preview-avatar-unique">
                      {selectedCounselorForRequest.avatarType === "image" ? (
                        <img
                          src={selectedCounselorForRequest.avatar}
                          alt={selectedCounselorForRequest.name}
                          className="counselor-preview-image-unique"
                        />
                      ) : (
                        <div className="counselor-preview-text-unique">
                          {selectedCounselorForRequest.avatar}
                        </div>
                      )}
                    </div>
                    <div className="counselor-preview-info-unique">
                      <div className="counselor-preview-name-unique">
                        {selectedCounselorForRequest.name}
                        <FaCheckCircle
                          className="counselor-verified-unique"
                          aria-label="Verified"
                        />
                      </div>
                      <div className="counselor-preview-specialization-unique">
                        {selectedCounselorForRequest.specialization}
                      </div>
                    </div>
                    <span
                      className={`preview-presence-unique ${
                        selectedCounselorForRequest.online ? "online" : "offline"
                      }`}
                    >
                      {selectedCounselorForRequest.online
                        ? tr("available", "Available")
                        : tr("offline", "Offline")}
                    </span>
                  </div>
                </div>
              )}

              {paymentConfig.enabled && (
                <div className="paid-session-preview-unique">
                  <div>
                    <span>Chat Session</span>
                    <strong>₹{paymentConfig.fees?.chat || 100} / {paymentConfig.durationMinutes || 30} min</strong>
                  </div>
                  <div>
                    <span>Wallet Balance</span>
                    <strong>₹{Number(walletBalance || 0).toFixed(2)}</strong>
                  </div>
                  <p>
                    Amount will be kept on hold. If counselor does not accept within {paymentConfig.requestExpiryHours || 24} hours, it will be refunded automatically.
                  </p>
                </div>
              )}

              <div className="modal-info-unique">
                <p>
                  <FaInfoCircle aria-hidden="true" />
                  You can chat once the counselor accepts your request.
                </p>
                <p className="privacy-note-unique">
                  <FaShieldAlt aria-hidden="true" />
                  You are chatting anonymously. Your real identity is protected.
                </p>
              </div>

              <button
                type="submit"
                className="modal-submit-btn-unique"
                disabled={isLoading || !userAnonymous}
              >
                {isLoading
                  ? tr("loading", "Loading...")
                  : tr("send_request", "Send Request")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div
          className="modal-overlay-unique"
          onClick={() => setShowBookingModal(false)}
        >
          <div
            className="modal-content-unique booking-appointment-modal-unique"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-unique">
              <h2>Book Appointment with {selectedCounselorForRequest?.name}</h2>
              <button
                className="modal-close-unique"
                onClick={() => setShowBookingModal(false)}
                type="button"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleConfirmBooking}>
              <div className="booking-form-unique">
                <div className="booking-section-label-unique">
                  Appointment Date &amp; Time
                </div>
                <div className="booking-datetime-row-unique">
                  <label className="booking-field-card-unique">
                    <span>
                      <FaCalendarAlt aria-hidden="true" />
                      Date
                    </span>
                    <input
                      type="date"
                      value={bookingDate.split("T")[0] || ""}
                      onChange={(e) =>
                        setBookingDate(
                          `${e.target.value}T${bookingDate.split("T")[1] || ""}`,
                        )
                      }
                      required
                    />
                  </label>
                  <label className="booking-field-card-unique">
                    <span>
                      <FaClock aria-hidden="true" />
                      Time
                    </span>
                    <input
                      type="time"
                      value={bookingDate.split("T")[1] || ""}
                      onChange={(e) =>
                        setBookingDate(
                          `${bookingDate.split("T")[0] || ""}T${e.target.value}`,
                        )
                      }
                      required
                    />
                  </label>
                </div>
                <div className="form-group-unique">
                  <label>Clinical Notes / Reason</label>
                  <textarea
                    className="form-textarea-unique"
                    placeholder="Share what you want to discuss in this session..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    required
                  ></textarea>
                  <small>Sent to the counselor for confirmation.</small>
                </div>
              </div>

              <div className="booking-modal-footer-unique">
                <button
                  type="button"
                  className="booking-cancel-btn-unique"
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="booking-confirm-btn-unique"
                  disabled={isLoading}
                >
                  {isLoading ? "Booking..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocked Popup */}
      {blockedPopup.show && (
        <div
          onClick={() => setBlockedPopup({ show: false, reason: "" })}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, maxWidth: 380, width: "100%",
              padding: "24px 22px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 8 }}>🚫</div>
            <h3 style={{ margin: "0 0 8px", color: "#c0392b", fontSize: 18 }}>
              Chat Unavailable
            </h3>
            <p style={{ margin: "0 0 16px", color: "#444", fontSize: 14, lineHeight: 1.5 }}>
              This counselor has been blocked by admin. You cannot start a chat right now.
            </p>
            {blockedPopup.reason && (
              <p style={{ margin: "0 0 16px", color: "#888", fontSize: 12, fontStyle: "italic" }}>
                {blockedPopup.reason}
              </p>
            )}
            <button
              onClick={() => setBlockedPopup({ show: false, reason: "" })}
              style={{
                background: "#c0392b", color: "#fff", border: "none",
                padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                fontSize: 14, fontWeight: 600,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorRequestChat;
