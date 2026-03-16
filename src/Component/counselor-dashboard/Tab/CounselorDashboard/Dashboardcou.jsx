import React from "react";
import "./Dashboardcou.css";

/**
 * Dashboard Component – Sirf Dashboard ka data/content
 * Koi side menu nahi, sirf dashboard statistics aur cards
 */
const Dashboard = () => {
    // Dashboard statistics data
    const dashboardStats = [
        { title: "Total Patients", value: "156", icon: "👥", change: "+12%", color: "#4285F4" },
        { title: "Today's Sessions", value: "8", icon: "⏳", change: "+2 today", color: "#0F9D58" },
        { title: "Appointments", value: "12", icon: "📅", change: "3 urgent", color: "#F4B400" },
        { title: "Monthly Earnings", value: "₹84.5K", icon: "💰", change: "+18%", color: "#DB4437" },
    ];

    // Recent sessions data
    const recentSessions = [
        { id: 1, patient: "Rahul Sharma", time: "10:30 AM", type: "Video Call", status: "Completed", statusColor: "#0F9D58" },
        { id: 2, patient: "Priya Patel", time: "11:45 AM", type: "In-Person", status: "In Progress", statusColor: "#F4B400" },
        { id: 3, patient: "Amit Kumar", time: "2:00 PM", type: "Voice Call", status: "Scheduled", statusColor: "#4285F4" },
        { id: 4, patient: "Neha Singh", time: "3:30 PM", type: "Video Call", status: "Scheduled", statusColor: "#4285F4" },
        { id: 5, patient: "Vikram Mehta", time: "5:00 PM", type: "In-Person", status: "Scheduled", statusColor: "#4285F4" },
    ];

    // Upcoming appointments
    const upcomingAppointments = [
        { id: 1, patient: "Sunita Reddy", time: "Tomorrow, 9:00 AM", type: "Video Call" },
        { id: 2, patient: "Arjun Nair", time: "Tomorrow, 11:30 AM", type: "In-Person" },
        { id: 3, patient: "Kavita Joshi", time: "Wed, 10:00 AM", type: "Voice Call" },
    ];

    // Recent messages
    const recentMessages = [
        { id: 1, sender: "Anjali Desai", preview: "When can we schedule next session?", time: "5 min ago", unread: true },
        { id: 2, sender: "Rohan Mehra", preview: "Thank you for yesterday's session", time: "2 hours ago", unread: false },
        { id: 3, sender: "Dr. Gupta", preview: "Case notes for patient referral", time: "Yesterday", unread: false },
    ];

    // Weekly schedule
    const weeklySchedule = [
        { day: "Mon", sessions: 6, patients: 8 },
        { day: "Tue", sessions: 4, patients: 6 },
        { day: "Wed", sessions: 8, patients: 10 },
        { day: "Thu", sessions: 5, patients: 7 },
        { day: "Fri", sessions: 7, patients: 9 },
        { day: "Sat", sessions: 3, patients: 4 },
    ];

    return (
        <div className="Coun-dashboard-content" style={{padding:"15px"}}>
            {/* Header Section */}
            <div className="dashboard-header">
                <div>
                    <h1 className="welcome-title">Welcome back, Dr. Sharma 👋</h1>
                    <p className="date-info">{new Date().toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                </div>
                <div className="header-actions">
                    <button className="action-btn">📅 Today's Schedule</button>
                    <button className="action-btn primary">+ New Session</button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-container">
                {dashboardStats.map((stat, index) => (
                    <div className="stat-card" key={index} style={{ borderLeftColor: stat.color }}>
                        <div className="stat-icon" style={{ backgroundColor: stat.color + '15', color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-details">
                            <span className="stat-label">{stat.title}</span>
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-change" style={{ color: stat.color }}>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid - 2 Columns */}
            <div className="dashboard-grid">
                {/* Left Column */}
                <div className="grid-left">
                    {/* Recent Sessions Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>Recent Sessions</h2>
                            <button className="view-link">View All →</button>
                        </div>
                        <div className="table-wrapper">
                            <table className="sessions-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSessions.map((session) => (
                                        <tr key={session.id}>
                                            <td className="patient-name">{session.patient}</td>
                                            <td>{session.time}</td>
                                            <td>{session.type}</td>
                                            <td>
                                                <span className="status-badge" style={{
                                                    backgroundColor: session.statusColor + '20',
                                                    color: session.statusColor
                                                }}>
                                                    {session.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Weekly Overview Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>Weekly Overview</h2>
                            <button className="view-link">Details →</button>
                        </div>
                        <div className="weekly-grid">
                            {weeklySchedule.map((day) => (
                                <div className="day-card" key={day.day}>
                                    <span className="day-name">{day.day}</span>
                                    <span className="day-sessions">{day.sessions} sessions</span>
                                    <span className="day-patients">{day.patients} patients</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="grid-right">
                    {/* Upcoming Appointments Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>Upcoming Appointments</h2>
                            <button className="view-link">Schedule →</button>
                        </div>
                        <div className="appointments-list">
                            {upcomingAppointments.map((apt) => (
                                <div className="appointment-item" key={apt.id}>
                                    <div className="appointment-icon">📅</div>
                                    <div className="appointment-info">
                                        <h4>{apt.patient}</h4>
                                        <p>{apt.time}</p>
                                        <span className="appointment-type">{apt.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Messages Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>Recent Messages</h2>
                            <span className="message-count">1 new</span>
                        </div>
                        <div className="messages-list">
                            {recentMessages.map((msg) => (
                                <div className={`message-item ${msg.unread ? 'unread' : ''}`} key={msg.id}>
                                    <div className="message-avatar">
                                        {msg.sender.charAt(0)}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-sender">{msg.sender}</div>
                                        <div className="message-preview">{msg.preview}</div>
                                        <div className="message-time">{msg.time}</div>
                                    </div>
                                    {msg.unread && <span className="unread-dot"></span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2>Quick Actions</h2>
                        </div>
                        <div className="quick-actions">
                            <button className="quick-action-btn">
                                <span>📝</span> Add Notes
                            </button>
                            <button className="quick-action-btn">
                                <span>💰</span> Invoice
                            </button>
                            <button className="quick-action-btn">
                                <span>📊</span> Reports
                            </button>
                            <button className="quick-action-btn">
                                <span>👥</span> New Patient
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;