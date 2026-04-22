import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CounselorProfile.css';
import { API_BASE_URL } from '../../../../axiosConfig';

// Unique class name prefix to avoid conflicts
const COUNSELOR_PROFILE_CLASS = 'counselor-profile-container';

const CounselorProfile = () => {
   const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // State for counselor data
    const [counselor, setCounselor] = useState({
        _id: '',
        uniqueCode: '',
        fullName: '',
        specialization: [],
        experience: 0,
        education: '',
        email: '',
        phoneNumber: '',
        location: '',
        languages: [],
        profilePhoto: null,
        profilePhotoUrl: '',
        certifications: [],
        aboutMe: '',
        rating: 0,
        totalSessions: 0,
        activeClients: 0,
        qualification: '',
        consultationMode: [],
        isActive: true,
        profileCompleted: false,
        age: null,
        gender: '',
        dateOfBirth: null,
        bloodGroup: '',
        address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        },
        emergencyContact: {
            name: '',
            relation: '',
            phone: ''
        },
        medicalInfo: {
            height: '',
            weight: '',
            allergies: [],
            chronicConditions: [],
            currentMedications: []
        }
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(counselor);
    const [newLanguage, setNewLanguage] = useState('');
    const [newSpecialization, setNewSpecialization] = useState('');
    const [newConsultationMode, setNewConsultationMode] = useState('');
    const [newCertification, setNewCertification] = useState({
        name: '',
        issueDate: '',
        expiryDate: '',
        issuedBy: '',
        document: null,
        documentName: ''
    });

    // Fetch profile data on component mount
    useEffect(() => {
        fetchCounselorProfile();
    }, []);

    // GET API - Fetch counselor profile (FIXED)
    const fetchCounselorProfile = async () => {
        try {
            setLoading(true);
            setError('');

            const counsellorId = localStorage.getItem("counsellorId");
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

            if (!counsellorId) {
                setError('Counselor ID not found. Please login again.');
                setLoading(false);
                return;
            }

            console.log('Fetching profile for ID:', counsellorId);

            // GET request to fetch counselor data
            const response = await axios.get(`${API_BASE_URL}/api/auth/counsellors/${counsellorId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('GET API Response:', response.data);

            // FIXED: The API returns data in 'counsellor' object
            if (response.data.success && response.data.counsellor) {
                const userData = response.data.counsellor;

                // FIXED: Extract profile photo URL correctly from nested object
                let profilePhotoUrl = 'https://via.placeholder.com/150x150?text=Profile';
                if (userData.profilePhoto) {
                    if (typeof userData.profilePhoto === 'string') {
                        profilePhotoUrl = userData.profilePhoto;
                    } else if (userData.profilePhoto.url) {
                        profilePhotoUrl = userData.profilePhoto.url;
                    } else if (userData.profilePhoto.publicId) {
                        // If using Cloudinary, construct the URL
                        profilePhotoUrl = userData.profilePhoto.url || `https://res.cloudinary.com/dfll8lwos/image/upload/${userData.profilePhoto.publicId}`;
                    }
                }

                // Transform API data to match component structure
                const formattedData = {
                    _id: userData._id,
                    uniqueCode: userData.uniqueCode || `CNS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    fullName: userData.fullName || userData.name || '',
                    specialization: Array.isArray(userData.specialization) ? userData.specialization :
                        (userData.specialization ? [userData.specialization] : []),
                    experience: userData.experience || 0,
                    education: userData.education || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || userData.phone || '',
                    location: userData.location || '',
                    languages: Array.isArray(userData.languages) ? userData.languages : [],
                    profilePhoto: null,
                    profilePhotoUrl: profilePhotoUrl, // FIXED: Set the correct URL
                    certifications: Array.isArray(userData.certifications) ? userData.certifications : [],
                    aboutMe: userData.aboutMe || userData.bio || '',
                    rating: userData.rating || 0,
                    totalSessions: userData.totalSessions || 0,
                    activeClients: userData.activeClients || 0,
                    qualification: userData.qualification || '',
                    consultationMode: Array.isArray(userData.consultationMode) ? userData.consultationMode : [],
                    isActive: userData.isActive || true,
                    profileCompleted: userData.profileCompleted || false,
                    age: userData.age || null,
                    gender: userData.gender || '',
                    dateOfBirth: userData.dateOfBirth || null,
                    bloodGroup: userData.bloodGroup || '',
                    address: userData.address || {
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        pincode: '',
                        country: 'India'
                    },
                    emergencyContact: userData.emergencyContact || {
                        name: '',
                        relation: '',
                        phone: ''
                    },
                    medicalInfo: userData.medicalInfo || {
                        height: '',
                        weight: '',
                        allergies: [],
                        chronicConditions: [],
                        currentMedications: []
                    }
                };

                setCounselor(formattedData);
                setEditedData(formattedData);
            } else {
                setError(response.data.message || 'Failed to load profile data');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            if (err.response) {
                setError(err.response.data?.message || `Error: ${err.response.status} - ${err.response.statusText}`);
            } else if (err.request) {
                setError('Network error. Please check your connection.');
            } else {
                setError('Failed to load profile data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // PATCH/PUT API - Update counselor profile
    const updateCounselorProfile = async (formData) => {
        try {
            const counsellorId = localStorage.getItem("counsellorId");
            const token = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken');
            const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');

            const response = await axios.patch(`${API_BASE_URL}/api/auth/update/${counsellorId}`, formData, {
                refreshToken: refreshToken,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response;
        } catch (error) {
            throw error;
        }
    };

    const handleInputChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedInputChange = (parentField, field, value) => {
        setEditedData(prev => ({
            ...prev,
            [parentField]: {
                ...prev[parentField],
                [field]: value
            }
        }));
    };

    // Profile Photo Handlers
    const handleProfilePhotoUpload = (file) => {
        if (file) {
            const photoUrl = URL.createObjectURL(file);
            setEditedData(prev => ({
                ...prev,
                profilePhoto: file,
                profilePhotoUrl: photoUrl
            }));
        }
    };

    const handleRemoveProfilePhoto = () => {
        setEditedData(prev => ({
            ...prev,
            profilePhoto: null,
            profilePhotoUrl: 'https://via.placeholder.com/150x150?text=Profile'
        }));
    };

    // Language handlers
    const handleAddLanguage = () => {
        if (newLanguage.trim() && !editedData.languages.includes(newLanguage.trim())) {
            setEditedData(prev => ({
                ...prev,
                languages: [...prev.languages, newLanguage.trim()]
            }));
            setNewLanguage('');
        }
    };

    const handleRemoveLanguage = (languageToRemove) => {
        setEditedData(prev => ({
            ...prev,
            languages: prev.languages.filter(lang => lang !== languageToRemove)
        }));
    };

    // Specialization handlers
    const handleAddSpecialization = () => {
        if (newSpecialization.trim() && !editedData.specialization.includes(newSpecialization.trim())) {
            setEditedData(prev => ({
                ...prev,
                specialization: [...prev.specialization, newSpecialization.trim()]
            }));
            setNewSpecialization('');
        }
    };

    const handleRemoveSpecialization = (specToRemove) => {
        setEditedData(prev => ({
            ...prev,
            specialization: prev.specialization.filter(spec => spec !== specToRemove)
        }));
    };

    // Consultation Mode handlers
    const handleAddConsultationMode = () => {
        const modes = ['online', 'offline', 'both'];
        if (newConsultationMode && modes.includes(newConsultationMode) && !editedData.consultationMode.includes(newConsultationMode)) {
            setEditedData(prev => ({
                ...prev,
                consultationMode: [...prev.consultationMode, newConsultationMode]
            }));
            setNewConsultationMode('');
        }
    };

    const handleRemoveConsultationMode = (modeToRemove) => {
        setEditedData(prev => ({
            ...prev,
            consultationMode: prev.consultationMode.filter(mode => mode !== modeToRemove)
        }));
    };

    // Certification handlers
    const handleAddCertification = () => {
        if (newCertification.name.trim()) {
            const newCert = {
                _id: `temp_${Date.now()}`,
                name: newCertification.name,
                document: newCertification.document,
                documentName: newCertification.documentName,
                documentUrl: newCertification.document ? URL.createObjectURL(newCertification.document) : '',
                issueDate: newCertification.issueDate,
                expiryDate: newCertification.expiryDate,
                issuedBy: newCertification.issuedBy
            };

            setEditedData(prev => ({
                ...prev,
                certifications: [...prev.certifications, newCert]
            }));

            setNewCertification({
                name: '',
                issueDate: '',
                expiryDate: '',
                issuedBy: '',
                document: null,
                documentName: ''
            });
        }
    };

    const handleRemoveCertification = (certId) => {
        setEditedData(prev => ({
            ...prev,
            certifications: prev.certifications.filter(cert => cert._id !== certId)
        }));
    };

    const handleCertificationInputChange = (field, value) => {
        setNewCertification(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDocumentUpload = (certId, file) => {
        if (file) {
            const updatedCerts = editedData.certifications.map(cert => {
                if (cert._id === certId) {
                    return {
                        ...cert,
                        document: file,
                        documentName: file.name,
                        documentUrl: URL.createObjectURL(file)
                    };
                }
                return cert;
            });

            setEditedData(prev => ({
                ...prev,
                certifications: updatedCerts
            }));
        }
    };

    const handleNewDocumentUpload = (file) => {
        if (file) {
            setNewCertification(prev => ({
                ...prev,
                document: file,
                documentName: file.name
            }));
        }
    };

    const handleRemoveDocument = (certId) => {
        const updatedCerts = editedData.certifications.map(cert => {
            if (cert._id === certId) {
                return {
                    ...cert,
                    document: null,
                    documentName: '',
                    documentUrl: ''
                };
            }
            return cert;
        });

        setEditedData(prev => ({
            ...prev,
            certifications: updatedCerts
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccessMessage('');

            // Prepare form data for API
            const formData = new FormData();

            // Add basic fields
            formData.append('fullName', editedData.fullName);
            formData.append('email', editedData.email);
            formData.append('phoneNumber', editedData.phoneNumber);
            formData.append('qualification', editedData.qualification || editedData.education);
            formData.append('experience', editedData.experience.toString());
            formData.append('location', editedData.location);
            formData.append('aboutMe', editedData.aboutMe);
            formData.append('education', editedData.education);

            // Add age, gender, blood group
            if (editedData.age) formData.append('age', editedData.age.toString());
            if (editedData.gender) formData.append('gender', editedData.gender);
            if (editedData.bloodGroup) formData.append('bloodGroup', editedData.bloodGroup);

            // Add address fields
            if (editedData.address) {
                formData.append('address[line1]', editedData.address.line1 || '');
                formData.append('address[line2]', editedData.address.line2 || '');
                formData.append('address[city]', editedData.address.city || '');
                formData.append('address[state]', editedData.address.state || '');
                formData.append('address[pincode]', editedData.address.pincode || '');
                formData.append('address[country]', editedData.address.country || 'India');
            }

            // Add emergency contact
            if (editedData.emergencyContact) {
                formData.append('emergencyContact[name]', editedData.emergencyContact.name || '');
                formData.append('emergencyContact[relation]', editedData.emergencyContact.relation || '');
                formData.append('emergencyContact[phone]', editedData.emergencyContact.phone || '');
            }

            // Add languages
            if (editedData.languages && editedData.languages.length > 0) {
                editedData.languages.forEach((lang, index) => {
                    formData.append(`languages[${index}]`, lang);
                });
            }

            // Add specialization
            if (editedData.specialization && editedData.specialization.length > 0) {
                editedData.specialization.forEach((spec, index) => {
                    formData.append(`specialization[${index}]`, spec);
                });
            }

            // Add consultation mode
            if (editedData.consultationMode && editedData.consultationMode.length > 0) {
                editedData.consultationMode.forEach((mode, index) => {
                    formData.append(`consultationMode[${index}]`, mode);
                });
            }

            // Add profile photo if changed
            if (editedData.profilePhoto instanceof File) {
                formData.append('profilePhoto', editedData.profilePhoto);
            }

            // FIXED: Use nested field names for certifications
            // Add certifications with nested field names
            if (editedData.certifications && editedData.certifications.length > 0) {
                editedData.certifications.forEach((cert, index) => {
                    // Add certification data
                    formData.append(`certifications[${index}][name]`, cert.name || '');
                    formData.append(`certifications[${index}][issuedBy]`, cert.issuedBy || '');

                    if (cert.issueDate) {
                        formData.append(`certifications[${index}][issueDate]`, cert.issueDate);
                    }
                    if (cert.expiryDate) {
                        formData.append(`certifications[${index}][expiryDate]`, cert.expiryDate);
                    }

                    // Keep existing _id if present
                    if (cert._id && !cert._id.toString().startsWith('temp_')) {
                        formData.append(`certifications[${index}][_id]`, cert._id);
                    }

                    // Keep existing document info
                    if (cert.documentUrl && !cert.document) {
                        formData.append(`certifications[${index}][documentUrl]`, cert.documentUrl);
                        formData.append(`certifications[${index}][documentName]`, cert.documentName || '');
                        if (cert.documentPublicId) {
                            formData.append(`certifications[${index}][documentPublicId]`, cert.documentPublicId);
                        }
                    }

                    // Add new document file
                    if (cert.document instanceof File) {
                        formData.append(`certifications[${index}][document]`, cert.document);
                        console.log(`Adding file for certification ${index}:`, cert.document.name);
                    }
                });
            }

            // Call the update API
            const response = await updateCounselorProfile(formData);

            if (response.data.success) {
                setSuccessMessage('Profile updated successfully!');
                await fetchCounselorProfile();
                setIsEditing(false);

                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                setError(response.data.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            console.error('Error details:', err.response?.data);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile');

            setTimeout(() => {
                setError('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditedData(counselor);
        setNewLanguage('');
        setNewSpecialization('');
        setNewConsultationMode('');
        setNewCertification({
            name: '',
            issueDate: '',
            expiryDate: '',
            issuedBy: '',
            document: null,
            documentName: ''
        });
        setIsEditing(false);
        setError('');
        setSuccessMessage('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    

    return (
        <div className={COUNSELOR_PROFILE_CLASS}>
            {/* Success/Error Messages */}
            {successMessage && (
                <div className={`${COUNSELOR_PROFILE_CLASS}__alert ${COUNSELOR_PROFILE_CLASS}__alert--success`}>
                    {successMessage}
                </div>
            )}
            {error && (
                <div className={`${COUNSELOR_PROFILE_CLASS}__alert ${COUNSELOR_PROFILE_CLASS}__alert--error`}>
                    {error}
                </div>
            )}

            {/* Header Section */}
            <div className={`${COUNSELOR_PROFILE_CLASS}__header`}>
                <div className={`${COUNSELOR_PROFILE_CLASS}__avatar-wrapper`}>
                    {/* Profile Photo - FIXED display */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__profile-photo-container`}>
                        {editedData?.profilePhotoUrl && editedData.profilePhotoUrl !== 'https://via.placeholder.com/150x150?text=Profile' ? (
                            <img
                                src={editedData.profilePhotoUrl}
                                alt={editedData.fullName || 'Profile'}
                                className={`${COUNSELOR_PROFILE_CLASS}__profile-photo`}
                                onError={(e) => {
                                    console.error('Image failed to load:', editedData.profilePhotoUrl);
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/150x150?text=Profile';
                                }}
                            />
                        ) : (
                            <div className={`${COUNSELOR_PROFILE_CLASS}__avatar`}>
                                {counselor?.fullName?.charAt(0) || 'C'}
                            </div>
                        )}

                        {isEditing && (
                            <div className={`${COUNSELOR_PROFILE_CLASS}__photo-edit-overlay`}>
                                <input
                                    type="file"
                                    id="profile-photo-upload"
                                    accept="image/*"
                                    onChange={(e) => handleProfilePhotoUpload(e.target.files[0])}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="profile-photo-upload"
                                    className={`${COUNSELOR_PROFILE_CLASS}__upload-photo-btn`}
                                    title="Upload Photo"
                                >
                                    📷
                                </label>
                                {editedData.profilePhotoUrl !== 'https://via.placeholder.com/150x150?text=Profile' && (
                                    <button
                                        onClick={handleRemoveProfilePhoto}
                                        className={`${COUNSELOR_PROFILE_CLASS}__remove-photo-btn`}
                                        title="Remove Photo"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`${COUNSELOR_PROFILE_CLASS}__unique-code`}>
                        <span className={`${COUNSELOR_PROFILE_CLASS}__unique-code-label`}>
                            Counselor Code:
                        </span>
                        <span className={`${COUNSELOR_PROFILE_CLASS}__unique-code-value`}>
                            {counselor?.uniqueCode || 'Not assigned'}
                        </span>
                    </div>
                </div>

                <div className={`${COUNSELOR_PROFILE_CLASS}__header-info`}>
                    <h1 className={`${COUNSELOR_PROFILE_CLASS}__name`}>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedData.fullName || ''}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className={`${COUNSELOR_PROFILE_CLASS}__input`}
                            />
                        ) : (
                            counselor?.fullName
                        )}
                    </h1>
                    <p className={`${COUNSELOR_PROFILE_CLASS}__specialization`}>
                        {isEditing ? (
                            <div className={`${COUNSELOR_PROFILE_CLASS}__specialization-input`}>
                                <div className={`${COUNSELOR_PROFILE_CLASS}__specialization-list`}>
                                    {editedData.specialization.map((spec, index) => (
                                        <span key={index} className={`${COUNSELOR_PROFILE_CLASS}__specialization-tag`}>
                                            {spec}
                                            <button
                                                onClick={() => handleRemoveSpecialization(spec)}
                                                className={`${COUNSELOR_PROFILE_CLASS}__remove-spec-btn`}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className={`${COUNSELOR_PROFILE_CLASS}__add-spec-section`}>
                                    <input
                                        type="text"
                                        value={newSpecialization}
                                        onChange={(e) => setNewSpecialization(e.target.value)}
                                        placeholder="Add new specialization..."
                                        className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
                                    />
                                    <button
                                        onClick={handleAddSpecialization}
                                        className={`${COUNSELOR_PROFILE_CLASS}__add-btn`}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        ) : (
                            counselor?.specialization?.join(', ') || 'Not specified'
                        )}
                    </p>
                    <div className={`${COUNSELOR_PROFILE_CLASS}__stats`}>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__stat`}>
                            <span className={`${COUNSELOR_PROFILE_CLASS}__stat-value`}>
                                {counselor?.rating || 0} ★
                            </span>
                            <span className={`${COUNSELOR_PROFILE_CLASS}__stat-label`}>Rating</span>
                        </div>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__stat`}>
                            <span className={`${COUNSELOR_PROFILE_CLASS}__stat-value`}>
                                {counselor?.totalSessions || 0}
                            </span>
                            <span className={`${COUNSELOR_PROFILE_CLASS}__stat-label`}>Sessions</span>
                        </div>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__stat`}>
                            <span className={`${COUNSELOR_PROFILE_CLASS}__stat-value`}>
                                {counselor?.activeClients || 0}
                            </span>
                            <span className={`${COUNSELOR_PROFILE_CLASS}__stat-label`}>Active Clients</span>
                        </div>
                    </div>
                </div>
                <div className={`${COUNSELOR_PROFILE_CLASS}__actions`}>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className={`${COUNSELOR_PROFILE_CLASS}__btn ${COUNSELOR_PROFILE_CLASS}__btn--edit`}
                            disabled={loading}
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                className={`${COUNSELOR_PROFILE_CLASS}__btn ${COUNSELOR_PROFILE_CLASS}__btn--save`}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className={`${COUNSELOR_PROFILE_CLASS}__btn ${COUNSELOR_PROFILE_CLASS}__btn--cancel`}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={`${COUNSELOR_PROFILE_CLASS}__content`}>
                {/* Left Column */}
                <div className={`${COUNSELOR_PROFILE_CLASS}__left-column`}>
                    {/* Contact Information */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Contact Information</h3>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__contact-info`}>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__contact-item`}>
                                <span className={`${COUNSELOR_PROFILE_CLASS}__contact-icon`}>📧</span>
                                <div>
                                    <label>Email</label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editedData.email || ''}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                        />
                                    ) : (
                                        <p>{counselor?.email || 'Not specified'}</p>
                                    )}
                                </div>
                            </div>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__contact-item`}>
                                <span className={`${COUNSELOR_PROFILE_CLASS}__contact-icon`}>📱</span>
                                <div>
                                    <label>Phone</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editedData.phoneNumber || ''}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                        />
                                    ) : (
                                        <p>{counselor?.phoneNumber || 'Not specified'}</p>
                                    )}
                                </div>
                            </div>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__contact-item`}>
                                <span className={`${COUNSELOR_PROFILE_CLASS}__contact-icon`}>📍</span>
                                <div>
                                    <label>Location</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedData.location || ''}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                        />
                                    ) : (
                                        <p>{counselor?.location || 'Not specified'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Personal Information</h3>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__personal-info`}>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__info-row`}>
                                <label>Age:</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editedData.age || ''}
                                        onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                                        className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                    />
                                ) : (
                                    <p>{counselor?.age || 'Not specified'}</p>
                                )}
                            </div>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__info-row`}>
                                <label>Gender:</label>
                                {isEditing ? (
                                    <select
                                        value={editedData.gender || ''}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                ) : (
                                    <p>{counselor?.gender ? counselor.gender.charAt(0).toUpperCase() + counselor.gender.slice(1) : 'Not specified'}</p>
                                )}
                            </div>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__info-row`}>
                                <label>Blood Group:</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedData.bloodGroup || ''}
                                        onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                                        className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                        placeholder="e.g., A+, B-, O+"
                                    />
                                ) : (
                                    <p>{counselor?.bloodGroup || 'Not specified'}</p>
                                )}
                            </div>
                            {counselor?.dateOfBirth && (
                                <div className={`${COUNSELOR_PROFILE_CLASS}__info-row`}>
                                    <label>Date of Birth:</label>
                                    <p>{formatDate(counselor.dateOfBirth)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Address</h3>
                        {isEditing ? (
                            <div className={`${COUNSELOR_PROFILE_CLASS}__address-form`}>
                                <input
                                    type="text"
                                    value={editedData.address?.line1 || ''}
                                    onChange={(e) => handleNestedInputChange('address', 'line1', e.target.value)}
                                    placeholder="Address Line 1"
                                    className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                />
                                <input
                                    type="text"
                                    value={editedData.address?.line2 || ''}
                                    onChange={(e) => handleNestedInputChange('address', 'line2', e.target.value)}
                                    placeholder="Address Line 2"
                                    className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                />
                                <input
                                    type="text"
                                    value={editedData.address?.city || ''}
                                    onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                                    placeholder="City"
                                    className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                />
                                <input
                                    type="text"
                                    value={editedData.address?.state || ''}
                                    onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                                    placeholder="State"
                                    className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                />
                                <input
                                    type="text"
                                    value={editedData.address?.pincode || ''}
                                    onChange={(e) => handleNestedInputChange('address', 'pincode', e.target.value)}
                                    placeholder="Pincode"
                                    className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                />
                                <input
                                    type="text"
                                    value={editedData.address?.country || ''}
                                    onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                                    placeholder="Country"
                                    className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                />
                            </div>
                        ) : (
                            <div className={`${COUNSELOR_PROFILE_CLASS}__address-display`}>
                                {counselor.address?.line1 && <p>{counselor.address.line1}</p>}
                                {counselor.address?.line2 && <p>{counselor.address.line2}</p>}
                                <p>
                                    {counselor.address?.city && `${counselor.address.city}, `}
                                    {counselor.address?.state && `${counselor.address.state} `}
                                    {counselor.address?.pincode && `- ${counselor.address.pincode}`}
                                </p>
                                {counselor.address?.country && <p>{counselor.address.country}</p>}
                                {!counselor.address?.line1 && !counselor.address?.city && (
                                    <p>No address provided</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Education */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Education</h3>
                        {isEditing ? (
                            <textarea
                                value={editedData.education || ''}
                                onChange={(e) => handleInputChange('education', e.target.value)}
                                className={`${COUNSELOR_PROFILE_CLASS}__textarea`}
                                rows="3"
                                placeholder="Enter your educational qualifications"
                            />
                        ) : (
                            <p>{counselor?.education || counselor?.qualification || 'Not specified'}</p>
                        )}
                    </div>

                    {/* Experience */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Experience</h3>
                        {isEditing ? (
                            <input
                                type="number"
                                value={editedData.experience || ''}
                                onChange={(e) => handleInputChange('experience', parseInt(e.target.value))}
                                className={`${COUNSELOR_PROFILE_CLASS}__input`}
                            />
                        ) : (
                            <p>{counselor?.experience} years</p>
                        )}
                    </div>

                    {/* Consultation Mode */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Consultation Mode</h3>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__consultation-section`}>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__consultation-list`}>
                                {editedData?.consultationMode?.map((mode, index) => (
                                    <div key={index} className={`${COUNSELOR_PROFILE_CLASS}__consultation-item`}>
                                        <span className={`${COUNSELOR_PROFILE_CLASS}__consultation-tag`}>
                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                        </span>
                                        {isEditing && (
                                            <button
                                                onClick={() => handleRemoveConsultationMode(mode)}
                                                className={`${COUNSELOR_PROFILE_CLASS}__remove-btn`}
                                                title="Remove mode"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {isEditing && (
                                <div className={`${COUNSELOR_PROFILE_CLASS}__add-section`}>
                                    <select
                                        value={newConsultationMode}
                                        onChange={(e) => setNewConsultationMode(e.target.value)}
                                        className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                    >
                                        <option value="">Select consultation mode...</option>
                                        <option value="online">Online</option>
                                        <option value="offline">Offline</option>
                                        <option value="both">Both</option>
                                    </select>
                                    <button
                                        onClick={handleAddConsultationMode}
                                        className={`${COUNSELOR_PROFILE_CLASS}__add-btn`}
                                        disabled={!newConsultationMode}
                                    >
                                        + Add
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Languages</h3>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__languages-section`}>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__languages-list`}>
                                {editedData?.languages?.map((lang, index) => (
                                    <div key={index} className={`${COUNSELOR_PROFILE_CLASS}__language-item`}>
                                        <span className={`${COUNSELOR_PROFILE_CLASS}__language-tag`}>
                                            {lang}
                                        </span>
                                        {isEditing && (
                                            <button
                                                onClick={() => handleRemoveLanguage(lang)}
                                                className={`${COUNSELOR_PROFILE_CLASS}__remove-btn`}
                                                title="Remove language"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {isEditing && (
                                <div className={`${COUNSELOR_PROFILE_CLASS}__add-section`}>
                                    <input
                                        type="text"
                                        value={newLanguage}
                                        onChange={(e) => setNewLanguage(e.target.value)}
                                        placeholder="Add new language..."
                                        className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                                    />
                                    <button
                                        onClick={handleAddLanguage}
                                        className={`${COUNSELOR_PROFILE_CLASS}__add-btn`}
                                    >
                                        + Add
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className={`${COUNSELOR_PROFILE_CLASS}__right-column`}>
                    {/* Bio */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Professional Bio</h3>
                        {isEditing ? (
                            <textarea
                                value={editedData.aboutMe || ''}
                                onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                                className={`${COUNSELOR_PROFILE_CLASS}__textarea`}
                                rows="5"
                                placeholder="Write about your professional background, expertise, and approach to counseling..."
                            />
                        ) : (
                            <p>{counselor?.aboutMe || 'No bio provided'}</p>
                        )}
                    </div>

                    {/* Licenses & Certifications with Document Upload */}
                    <div className={`${COUNSELOR_PROFILE_CLASS}__card`}>
                        <h3 className={`${COUNSELOR_PROFILE_CLASS}__card-title`}>Licenses & Certifications</h3>
                        <div className={`${COUNSELOR_PROFILE_CLASS}__certifications-section`}>
                            <div className={`${COUNSELOR_PROFILE_CLASS}__certifications-list`}>
                                {editedData?.certifications?.map((cert) => (
                                    <div key={cert._id} className={`${COUNSELOR_PROFILE_CLASS}__certification-card`}>
                                        <div className={`${COUNSELOR_PROFILE_CLASS}__certification-header`}>
                                            <div className={`${COUNSELOR_PROFILE_CLASS}__certification-title`}>
                                                <span className={`${COUNSELOR_PROFILE_CLASS}__certification-icon`}>📜</span>
                                                <strong>{cert.name}</strong>
                                            </div>
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleRemoveCertification(cert._id)}
                                                    className={`${COUNSELOR_PROFILE_CLASS}__remove-cert-btn`}
                                                    title="Remove certification"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        <div className={`${COUNSELOR_PROFILE_CLASS}__certification-details`}>
                                            <div className={`${COUNSELOR_PROFILE_CLASS}__certification-info`}>
                                                <div>
                                                    <label>Issued By:</label>
                                                    <p>{cert.issuedBy || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <label>Issue Date:</label>
                                                    <p>{cert.issueDate ? formatDate(cert.issueDate) : 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <label>Expiry Date:</label>
                                                    <p>{cert.expiryDate ? formatDate(cert.expiryDate) : 'Not specified'}</p>
                                                </div>
                                            </div>

                                            <div className={`${COUNSELOR_PROFILE_CLASS}__document-section`}>
                                                <label>Supporting Document:</label>
                                                {cert.documentUrl || cert.document ? (
                                                    <div className={`${COUNSELOR_PROFILE_CLASS}__document-preview`}>
                                                        <a
                                                            href={cert.documentUrl || (cert.document instanceof File ? URL.createObjectURL(cert.document) : '#')}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`${COUNSELOR_PROFILE_CLASS}__document-link`}
                                                        >
                                                            📄 {cert.documentName || 'View Document'}
                                                        </a>
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => handleRemoveDocument(cert._id)}
                                                                className={`${COUNSELOR_PROFILE_CLASS}__remove-document-btn`}
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className={`${COUNSELOR_PROFILE_CLASS}__no-document`}>
                                                        No document uploaded
                                                    </p>
                                                )}

                                                {isEditing && (
                                                    <div className={`${COUNSELOR_PROFILE_CLASS}__upload-section`}>
                                                        <input
                                                            type="file"
                                                            id={`document-${cert._id}`}
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleDocumentUpload(cert._id, e.target.files[0])}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <label
                                                            htmlFor={`document-${cert._id}`}
                                                            className={`${COUNSELOR_PROFILE_CLASS}__upload-btn`}
                                                        >
                                                            📁 Upload Document
                                                        </label>
                                                        <span className={`${COUNSELOR_PROFILE_CLASS}__upload-hint`}>
                                                            PDF, DOC, JPG (Max 5MB)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isEditing && (
                                <div className={`${COUNSELOR_PROFILE_CLASS}__add-certification-form`}>
                                    <h4>Add New License/Certification</h4>
                                    <div className={`${COUNSELOR_PROFILE_CLASS}__form-group`}>
                                        <input
                                            type="text"
                                            value={newCertification.name}
                                            onChange={(e) => handleCertificationInputChange('name', e.target.value)}
                                            placeholder="Certification/License Name *"
                                            className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                        />
                                    </div>
                                    <div className={`${COUNSELOR_PROFILE_CLASS}__form-row`}>
                                        <div className={`${COUNSELOR_PROFILE_CLASS}__form-group`}>
                                            <input
                                                type="text"
                                                value={newCertification.issuedBy}
                                                onChange={(e) => handleCertificationInputChange('issuedBy', e.target.value)}
                                                placeholder="Issued By"
                                                className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                            />
                                        </div>
                                        <div className={`${COUNSELOR_PROFILE_CLASS}__form-group`}>
                                            <input
                                                type="date"
                                                value={newCertification.issueDate}
                                                onChange={(e) => handleCertificationInputChange('issueDate', e.target.value)}
                                                className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                            />
                                        </div>
                                        <div className={`${COUNSELOR_PROFILE_CLASS}__form-group`}>
                                            <input
                                                type="date"
                                                value={newCertification.expiryDate}
                                                onChange={(e) => handleCertificationInputChange('expiryDate', e.target.value)}
                                                className={`${COUNSELOR_PROFILE_CLASS}__input`}
                                            />
                                        </div>
                                    </div>
                                    <div className={`${COUNSELOR_PROFILE_CLASS}__form-group`}>
                                        <input
                                            type="file"
                                            id="new-document"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={(e) => handleNewDocumentUpload(e.target.files[0])}
                                            style={{ display: 'none' }}
                                        />
                                        <div className={`${COUNSELOR_PROFILE_CLASS}__document-upload-area`}>
                                            <label
                                                htmlFor="new-document"
                                                className={`${COUNSELOR_PROFILE_CLASS}__upload-area-label`}
                                            >
                                                {newCertification.documentName ? (
                                                    <>📄 {newCertification.documentName}</>
                                                ) : (
                                                    <>📁 Click to upload supporting document</>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddCertification}
                                        className={`${COUNSELOR_PROFILE_CLASS}__add-cert-btn`}
                                        disabled={!newCertification.name.trim()}
                                    >
                                        + Add Certification
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CounselorProfile;