import React, { useState, useEffect } from 'react';
import './ChatInterface.css';
import { Link } from 'react-router-dom';

const ChatInterface = () => {
    // State for counselors and chats
    const [counselors, setCounselors] = useState([
        { id: 1, name: 'Dr. Amit Verma', lastMessage: 'How are you feeling today?', time: '10:30 AM', unread: 2, online: true },
        { id: 2, name: 'DR. Anjali Mehta', lastMessage: 'Remember our session tomorrow', time: 'Yesterday', unread: 0, online: true },
        { id: 3, name: 'Dr. Priya Sharma', lastMessage: 'Here are the resources I mentioned', time: '2 days ago', unread: 5, online: false },
        { id: 4, name: 'Dr. Rajesh Kumar', lastMessage: 'We can discuss this further', time: '1 week ago', unread: 0, online: true },
        { id: 5, name: 'Dr. Suresh Reddy', lastMessage: 'Hope you\'re doing well', time: '2 weeks ago', unread: 0, online: false },
    ]);

   

    const [selectedCounselor, setSelectedCounselor] = useState(counselors[0]);

    

    // Handle counselor selection
    const handleCounselorSelect = (counselor) => {
        setSelectedCounselor(counselor);
        // Mark messages as read when selecting counselor
        setCounselors(prev => prev.map(c =>
            c.id === counselor.id ? { ...c, unread: 0 } : c
        ));
        setShowOptions(false);
    };

    // Handle sending a new message
   

    // Handle key press for sending message
  

    // Options menu items
   

    return (
        <div className="chatAppContainer">



            <div className="counselorSidebar ">
                <div className="counselorSidebarHeader">
                    <h2 className="counselorListTitle">Counselors</h2>
                    <div className="counselorSearchBox">
                        <input
                            type="text"
                            placeholder="Search counselors..."
                            className="counselorSearchInput"
                        />
                        <span className="counselorSearchIcon">🔍</span>
                    </div>
                </div>

                <div className="counselorListContainer">
                    {counselors.map(counselor => (
                       <Link key={counselor.id} to={`/chatbox/${counselor.id}`} className="counselorListItemLink">
                           <div className={`counselorListItem ${selectedCounselor.id === counselor.id ? 'counselorListItemActive' : ''}`}>
                               <div className="counselorAvatarContainer">
                                   <div className="counselorAvatar">
                                       {counselor.name.charAt(0)}
                                   </div>
                                   <div className={`counselorStatus ${counselor.online ? 'counselorStatusOnline' : 'counselorStatusOffline'}`} />
                               </div>

                               <div className="counselorInfo">
                                   <div className="counselorNameRow">
                                       <h3 className="counselorName">{counselor.name}</h3>
                                       <span className="counselorTime">{counselor.time}</span>
                                   </div>
                                   <div className="counselorLastMessageRow">
                                       <p className="counselorLastMessage">{counselor.lastMessage}</p>
                                       {counselor.unread > 0 && (
                                           <span className="counselorUnreadBadge">{counselor.unread}</span>
                                       )}
                                   </div>
                               </div>
                           </div>
                       </Link>
                    ))}
                </div>
            </div>




        </div>
    );
};

export default ChatInterface;