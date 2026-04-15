import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ScrollView, Modal, TextInput, Dimensions, KeyboardAvoidingView, 
  Platform, ActivityIndicator, Alert, Vibration, SafeAreaView, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Make sure to install react-native-vector-icons
import axios from 'axios';

// Placeholder imports for your other tabs (Make sure to convert these to React Native too)
// import ChatInterface from '../Tab/chatbot/ChatInterface';
// import WalletDashboard from '../Tab/Wallet/WalletDashboard';
// import CallHistory from '../Tab/Callls/CallHistory';
// import PatientProfile from '../../PatientProfile/PatientProfile';
// import CounselorTable from '../Tab/Counselor/CounselorDirectory';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://localhost:5000'; // Replace with your actual IP for mobile testing

export default function UserDashboard({ navigation }) {
  const [active, setActive] = useState("Chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [userData, setUserData] = useState({
    name: "Loading...",
    email: "",
    phone: "",
    profilePhoto: null,
  });

  // Call Modal States
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState("video");
  const [callerInfo, setCallerInfo] = useState({ name: "",  image: null, requestMessage: "" });
  
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", sender: "ai" },
    { id: 2, text: "I'm feeling anxious today.", sender: "user" },
  ]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");
      if (userId && token) {
        const response = await axios.get(`${API_BASE_URL}/api/auth/getUser/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          const user = response.data.user;
          setUserData({
            name: user.fullName || "User",
            email: user.email || "",
            phone: user.phoneNumber || "",
            profilePhoto: user.profilePhoto?.url || user.profilePhoto || null,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setShowLogoutConfirm(false);
    navigation.replace("RoleSelector"); // Assuming react-navigation is used
  };

  const allMenuItems = [
    { id: "Chat", icon: "comment-dots", label: "Chat" },
    { id: "Live Chat", icon: "user-md", label: "Counselor" },
    { id: "Wallet", icon: "wallet", label: "Wallet" },
    { id: "Video", icon: "video", label: "Video Call" },
    { id: "help", icon: "question-circle", label: "Help Center" },
    { id: "privacy", icon: "lock", label: "Privacy" },
  ];

  const bottomMenuItems = allMenuItems.slice(0, 4);

  // Render Dynamic Content based on active tab
  const renderContent = () => {
    return (
      <View style={styles.tabContentContainer}>
        <Text style={styles.activeTabText}>Current Tab: {active}</Text>
        <Text style={styles.placeholderText}>Convert your web tabs to RN to display them here.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobile Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>MChat</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerRight}
          onPress={() => setShowProfileMenu(true)}
        >
          {userData.profilePhoto ? (
            <Image source={{ uri: userData.profilePhoto }} style={styles.avatar} />
          ) : (
            <Icon name="user-circle" size={30} color="#0056b3" solid />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Floating AI Chat Button */}
      {!chatOpen && (
        <TouchableOpacity style={styles.floatingChatBtn} onPress={() => setChatOpen(true)}>
          <Icon name="robot" size={24} color="#fff" />
          {unreadCount > 0 && (
             <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
             </View>
          )}
        </TouchableOpacity>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {bottomMenuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.navItem} 
            onPress={() => {
                Vibration.vibrate(30);
                setActive(item.id);
            }}
          >
            <Icon 
              name={item.icon} 
              size={22} 
              color={active === item.id ? "#0056b3" : "#888"} 
              solid={active === item.id}
            />
            <Text style={[styles.navText, active === item.id && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => {
              Vibration.vibrate(30);
              setShowMoreModal(true);
          }}
        >
          <Icon name="ellipsis-h" size={22} color="#888" />
          <Text style={styles.navText}>More</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Menu Modal */}
      <Modal visible={showProfileMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowProfileMenu(false)}>
          <View style={styles.profileDropdown}>
            <View style={styles.profileDropdownHeader}>
              <View>
                 <Text style={styles.profileName}>{userData.name}</Text>
                 <Text style={styles.profileEmail}>{userData.email}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dropdownOption} onPress={() => { setShowProfileMenu(false); setActive('profile'); }}>
              <Icon name="user" size={18} color="#333" style={{marginRight: 10}}/>
              <Text style={styles.dropdownOptionText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownOption} onPress={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}>
              <Icon name="sign-out-alt" size={18} color="#ff3b30" style={{marginRight: 10}} />
              <Text style={[styles.dropdownOptionText, {color: '#ff3b30'}]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* More Options Modal */}
      <Modal visible={showMoreModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMoreModal(false)}>
           <View style={styles.bottomSheet}>
              <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Menu Options</Text>
                  <TouchableOpacity onPress={() => setShowMoreModal(false)}>
                     <Icon name="times" size={20} color="#555" />
                  </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                  {allMenuItems.map(item => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={styles.sheetOption} 
                        onPress={() => { setActive(item.id); setShowMoreModal(false); }}
                    >
                        <Icon name={item.icon} size={20} color="#4A90E2" style={{ width: 30 }}/>
                        <Text style={styles.sheetOptionText}>{item.label}</Text>
                        <Icon name="chevron-right" size={14} color="#ccc" style={{marginLeft: 'auto'}}/>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.sheetOption} onPress={() => { setShowMoreModal(false); setShowLogoutConfirm(true); }}>
                       <Icon name="sign-out-alt" size={20} color="#ff3b30" style={{ width: 30 }}/>
                       <Text style={[styles.sheetOptionText, {color: '#ff3b30'}]}>Logout</Text>
                  </TouchableOpacity>
              </ScrollView>
           </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={styles.dialogBox}>
              <Text style={styles.dialogTitle}>Confirm Logout</Text>
              <Text style={styles.dialogMessage}>Are you sure you want to logout?</Text>
              <View style={styles.dialogButtons}>
                 <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogoutConfirm(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.confirmBtn} onPress={handleLogout}>
                    <Text style={styles.confirmBtnText}>Logout</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0056b3',
    letterSpacing: 0.5,
  },
  headerRight: {
    padding: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e4e8',
  },
  content: {
    flex: 1,
  },
  tabContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  activeTabText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    color: '#888',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#0056b3',
    fontWeight: '700',
  },
  floatingChatBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#4A90E2',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    width: 220,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  profileDropdownHeader: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  profileEmail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: height * 0.8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  sheetOptionText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '500',
  },
  dialogBox: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  dialogMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  dialogButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
