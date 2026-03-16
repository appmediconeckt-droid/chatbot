import { useState, useEffect } from 'react'
import './App.css'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Leanding from './authtication/Leanding'

import UserDashboard from './Component/UserDashboard/Dashboard/UserDashboard'
import ChatBox from './Component/UserDashboard/Tab/ChatBox/ChatBox'
import Login from './authtication/Login'
import RoleSelector from './authtication/RoleSelector'
import CounselorSignup from './authtication/CounselorSignup'
import UserSignup from './authtication/UserSignup'
import CounselorDashboard from './Component/counselor-dashboard/Dashboard/dashboard'
import CounselorTable from './Component/UserDashboard/Tab/Counselor/CounselorDirectory'
import SMSInput from './Component/counselor-dashboard/Tab/SMSInput/SMSInput.'


function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      const currentPath = location.pathname;

      // Agar mobile hai to sirf login page dikhao, home page mat dikhao
      if (mobile && currentPath === '/') {
        navigate('/');
      }

      // Agar mobile nahi hai (desktop) to kuch mat karo - user jo chahe wahan ja sakta hai
    };

    // Initial check
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [navigate, location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Leanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/chat/:id" element={<ChatBox />} />
        <Route path="/role-selector" element={<RoleSelector />} />
        <Route path="/counselor-signup" element={<CounselorSignup />} />
        <Route path="/user-signup" element={<UserSignup />} />
        <Route path="/counselor-directory" element={<CounselorTable />} />
        <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
        <Route path="/sms-input" element={<SMSInput />} />


      </Routes>
    </>
  )
}

export default App