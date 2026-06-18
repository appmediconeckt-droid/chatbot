import React, { useState, useRef } from "react";
import { FaTimes, FaCamera } from "react-icons/fa";
import "./CameraCapture.css";

export default function CameraCapture({ isOpen, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setError(err.message || "Camera access denied");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      const photoData = canvasRef.current.toDataURL("image/jpeg");
      onCapture(photoData);
      stopCamera();
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-capture-overlay" onClick={handleClose}>
      <div className="camera-capture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="camera-capture-header">
          <h3>📷 Take a Photo</h3>
          <button className="camera-close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="camera-capture-body">
          {!isCameraActive && !error && (
            <div className="camera-permission-request">
              <FaCamera className="permission-icon" />
              <p>Click "Start Camera" to open your webcam</p>
              <button className="start-camera-btn" onClick={startCamera}>
                Start Camera
              </button>
            </div>
          )}

          {error && (
            <div className="camera-error">
              <p>❌ {error}</p>
              <p className="error-help">Make sure you allow camera access</p>
              <button className="retry-btn" onClick={startCamera}>
                Retry
              </button>
            </div>
          )}

          {isCameraActive && (
            <div className="camera-view">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-video"
              />
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        {isCameraActive && (
          <div className="camera-capture-actions">
            <button className="camera-btn cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button className="camera-btn capture-btn" onClick={capturePhoto}>
              <FaCamera /> Take Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
