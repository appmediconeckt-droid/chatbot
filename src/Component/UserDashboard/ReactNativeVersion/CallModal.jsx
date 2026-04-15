import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const CallModal = ({
  isOpen,
  onClose,
  callType,
  callerName,
  callerImage,
  callData,
  onAcceptCall,
  onRejectCall,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Animation values for ringing effect
  const scaleAnim = new Animated.Value(1);

  React.useEffect(() => {
    if (isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isOpen]);

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    if (onAcceptCall && callData) {
      try {
        await onAcceptCall(callData.callId);
        onClose();
      } catch (error) {
        console.error("Error accepting call:", error);
      } finally {
        setIsAccepting(false);
      }
    } else {
      onClose();
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;
    setIsRejecting(true);
    if (onRejectCall && callData) {
      try {
        await onRejectCall(callData.callId);
        onClose();
      } catch (error) {
        console.error("Error rejecting call:", error);
      } finally {
        setIsRejecting(false);
      }
    } else {
      onClose();
      setIsRejecting(false);
    }
  };

  if (!isOpen) return null;

  const displayName = callData?.from?.fullName || callData?.from?.displayName || callerName || "Counselor";
  const profilePhoto = callData?.from?.profilePhoto || callerImage;

  const formatRequestTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const requestedTime = callData?.requestedAt ? formatRequestTime(callData.requestedAt) : "";

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: scaleAnim }] }]}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <Icon name="user-circle" size={80} color="#0056b3" solid />
            )}
          </Animated.View>

          <Text style={styles.callerName}>{displayName}</Text>
          <Text style={styles.callType}>
            {callType === "video" ? "📹 Incoming Video Call" : "📞 Incoming Voice Call"}
          </Text>
          
          {requestedTime ? (
            <Text style={styles.callTime}>Received at {requestedTime}</Text>
          ) : null}

          <Text style={styles.callMessage}>
            {callData?.requestMessage || `Incoming ${callType} call...`}
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.btn, styles.rejectBtn]} 
              onPress={handleReject} 
              disabled={isRejecting}
            >
              {isRejecting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Icon name="phone-slash" size={24} color="#fff" />
              )}
              <Text style={styles.btnText}>{isRejecting ? "Decline..." : "Decline"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.acceptBtn]} 
              onPress={handleAccept} 
              disabled={isAccepting}
            >
              {isAccepting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Icon name="phone-alt" size={24} color="#fff" />
              )}
              <Text style={styles.btnText}>{isAccepting ? "Accepting..." : "Accept"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#e8eff5',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  callType: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: '600',
    marginBottom: 6,
  },
  callTime: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  callMessage: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  btn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
  },
  rejectBtn: {
    backgroundColor: '#ff4757',
  },
  acceptBtn: {
    backgroundColor: '#2ed573',
  },
  btnText: {
    color: '#fff',
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CallModal;
