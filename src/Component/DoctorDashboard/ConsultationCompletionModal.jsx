import React from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { PortalText, PortalElement } from '../common/PortalTranslation';
import { appointmentVitals } from './PatientAppointmentDetails/patientRecordDetails.js';
import { MEDICINE_TIMINGS, createEmptyMedicine, createEmptyRecommendedTest, formatMedicineLine, hasValidMedicine, toDateInputValue, getFollowUpDateFromMedicines } from './consultationPrescription.js';
import './Dashboard/DoctorDashboard.css';
import './ConsultationCompletionModal.css';

// CompleteModal component
const ConsultationCompletionModal = ({ show, onHide, form, setForm, onSave, patientName, appointment, title = 'Complete Appointment', saveLabel = 'Save & Continue', saving = false, saveError = '' }) => {
  const today = new Date();
  const minDate = toDateInputValue(today);
  const defaultFollowUpDateStr = getFollowUpDateFromMedicines(form.medicines || [createEmptyMedicine()], appointment);
  
  React.useEffect(() => {
    if (!show) return;

    if (!form.medicines?.length) {
      setForm(prev => ({
        ...prev,
        medicines: [createEmptyMedicine()],
      }));
    }

    if (!form.followUpDate) {
      setForm(prev => ({
        ...prev,
        followUpDate: defaultFollowUpDateStr,
        followUpRequired: false
      }));
    }
  }, [show, defaultFollowUpDateStr, form.followUpDate, form.medicines?.length]);

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const medicines = form.medicines?.length ? form.medicines : [createEmptyMedicine()];
  const recommendedTests = form.recommendedTests || [];
  const updateRecommendedTest = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      recommendedTests: (prev.recommendedTests || []).map((test, idx) => idx === index ? { ...test, [field]: value } : test),
    }));
  };
  const addRecommendedTest = () => setForm(prev => ({ ...prev, recommendedTests: [...(prev.recommendedTests || []), createEmptyRecommendedTest()] }));
  const removeRecommendedTest = (index) => setForm(prev => ({ ...prev, recommendedTests: (prev.recommendedTests || []).filter((_, idx) => idx !== index) }));
  const updateMedicine = (index, field, value) => {
    setForm(prev => {
      const nextMedicines = (prev.medicines?.length ? prev.medicines : [createEmptyMedicine()]).map((medicine, idx) =>
        idx === index ? { ...medicine, [field]: value } : medicine
      );
      const nextFollowUpDate = getFollowUpDateFromMedicines(nextMedicines, appointment);
      return {
        ...prev,
        medicines: nextMedicines,
        medicine: nextMedicines.map(formatMedicineLine).join("\n"),
        followUpDate: prev.followUpRequired ? nextFollowUpDate : prev.followUpDate,
      };
    });
  };

  const toggleMedicineTiming = (index, timing) => {
    setForm(prev => {
      const nextMedicines = (prev.medicines?.length ? prev.medicines : [createEmptyMedicine()]).map((medicine, idx) => {
        if (idx !== index) return medicine;
        const timings = medicine.timings || [];
        return {
          ...medicine,
          timings: timings.includes(timing)
            ? timings.filter((item) => item !== timing)
            : [...timings, timing],
        };
      });
      return {
        ...prev,
        medicines: nextMedicines,
        medicine: nextMedicines.map(formatMedicineLine).join("\n"),
        followUpDate: prev.followUpRequired ? getFollowUpDateFromMedicines(nextMedicines, appointment) : prev.followUpDate,
      };
    });
  };

  const addMedicine = () => {
    setForm(prev => {
      const nextMedicines = [...(prev.medicines?.length ? prev.medicines : [createEmptyMedicine()]), createEmptyMedicine()];
      return {
        ...prev,
        medicines: nextMedicines,
        medicine: nextMedicines.map(formatMedicineLine).join("\n"),
        followUpDate: prev.followUpRequired ? getFollowUpDateFromMedicines(nextMedicines, appointment) : prev.followUpDate,
      };
    });
  };

  const removeMedicine = (index) => {
    setForm(prev => {
      const source = prev.medicines?.length ? prev.medicines : [createEmptyMedicine()];
      const nextMedicines = source.length > 1 ? source.filter((_, idx) => idx !== index) : [createEmptyMedicine()];
      return {
        ...prev,
        medicines: nextMedicines,
        medicine: nextMedicines.map(formatMedicineLine).join("\n"),
        followUpDate: prev.followUpRequired ? getFollowUpDateFromMedicines(nextMedicines, appointment) : prev.followUpDate,
      };
    });
  };

  const handleFollowUpToggle = (e) => {
    const isChecked = e.target.checked;
    setForm(prev => ({ 
      ...prev, 
      followUpRequired: isChecked,
      followUpDate: isChecked ? getFollowUpDateFromMedicines(prev.medicines || medicines, appointment) : ""
    }));
  };

  const handleSave = () => {
    const medicineText = medicines.map(formatMedicineLine).join("\n");
    const finalForm = form.followUpRequired
      ? { ...form, medicine: medicineText }
      : { ...form, medicine: medicineText, followUpDate: "" };
    onSave(finalForm);
  };

  const patientIdLabel = appointment?.id ? `P${String(appointment.id).padStart(3, "0")}` : "N/A";
  const temperature = appointment?.temperature || appointment?.temp || "36";
  const bloodPressure = appointmentVitals(appointment || {}).bp;
  const canSave = Boolean(form.diagnosis?.trim() && form.advice?.trim() && medicines.every(hasValidMedicine));

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="dd-complete-modal">
      <Modal.Header closeButton className="dd-complete-modal-header">
        <Modal.Title className="dd-complete-modal-title"><PortalText text={title} /></Modal.Title>
      </Modal.Header>
      <Modal.Body className="dd-complete-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <div className="dd-patient-info-summary mb-3">
          <h6 className="dd-patient-summary-title"><PortalText text={"Completing appointment for:"} /></h6>
          <div className="dd-patient-name-display">
            <i className="bi bi-person-circle me-2"></i>
            <span className="fs-6 fw-bold">{patientName}</span>
          </div>
          <div className="dd-complete-patient-meta">
            <span><PortalText text={"ID: "} />{patientIdLabel}</span>
            <span><PortalText text={"Temperature (°C): "} />{temperature}</span>
            <span><PortalText text={"Blood Pressure: "} />{bloodPressure}</span>
          </div>
        </div>

        {saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}
        <Form>
          <Row className="mb-2">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="dd-form-label"><PortalText text={"Diagnosis "} /><span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter detailed diagnosis..."
                  value={form.diagnosis}
                  onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                  className="dd-form-control-sm dd-diagnosis-textarea"
                  required
                />
                <div className="dd-form-text text-muted mt-1"><PortalText text={"Include symptoms, observations, medical findings."} /></div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={12}>
              <div className="dd-medicines-section">
                <div className="dd-section-heading-row">
                  <Form.Label className="dd-form-label mb-0"><PortalText text={"Recommended Tests / Investigations (Optional)"} /></Form.Label>
                  <Button type="button" variant="outline-success" size="sm" onClick={addRecommendedTest}>
                    <i className="bi bi-plus-circle me-1"></i><PortalText text={"Add Test"} /></Button>
                </div>
                {recommendedTests.map((test, index) => (
                  <div className="dd-medicine-card" key={`recommended-test-${index}`}>
                    <div className="dd-medicine-card-header"><strong><PortalText text={"Test #"} />{index + 1}</strong><button type="button" onClick={() => removeRecommendedTest(index)} aria-label={`Remove test ${index + 1}`}><i className="bi bi-x-lg"></i></button></div>
                    <Row className="g-2">
                      <Col md={6}><Form.Group><Form.Label className="dd-form-label"><PortalText text={"Test Name"} /></Form.Label><Form.Control value={test.testName} placeholder="e.g., CBC, Blood Sugar, X-Ray" onChange={(e) => updateRecommendedTest(index, "testName", e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label className="dd-form-label"><PortalText text={"Complete By"} /></Form.Label><Form.Control type="date" min={minDate} value={test.completeBy} onChange={(e) => updateRecommendedTest(index, "completeBy", e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label className="dd-form-label"><PortalText text={"Reason"} /></Form.Label><Form.Control value={test.reason} placeholder="Why this test is required" onChange={(e) => updateRecommendedTest(index, "reason", e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label className="dd-form-label"><PortalText text={"Instructions"} /></Form.Label><Form.Control value={test.instructions} placeholder="e.g., 8 hours fasting" onChange={(e) => updateRecommendedTest(index, "instructions", e.target.value)} /></Form.Group></Col>
                    </Row>
                  </div>
                ))}
                {!recommendedTests.length && <div className="dd-form-text text-muted mt-2"><PortalText text={"Add tests only when the patient needs an investigation or lab report."} /></div>}
              </div>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={12}>
              <div className="dd-medicines-section">
                <div className="dd-section-heading-row">
                  <Form.Label className="dd-form-label mb-0"><PortalText text={"Prescribed Medicines "} /><span className="text-danger">*</span>
                  </Form.Label>
                  <Button type="button" variant="outline-primary" size="sm" onClick={addMedicine}>
                    <i className="bi bi-plus-circle me-1"></i><PortalText text={"Add Medicine"} /></Button>
                </div>

                {medicines.map((medicine, index) => (
                  <div className="dd-medicine-card" key={`medicine-${index}`}>
                    <div className="dd-medicine-card-header">
                      <strong><PortalText text={"Medicine #"} />{index + 1}</strong>
                      {medicines.length > 1 && (
                        <button type="button" onClick={() => removeMedicine(index)} aria-label={`Remove medicine ${index + 1}`}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </div>

                    <Row className="g-2">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="dd-form-label"><PortalText text={"Medicine Name "} /><span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            value={medicine.name}
                            placeholder="e.g., Paracetamol 500mg"
                            onChange={(e) => updateMedicine(index, "name", e.target.value)}
                            className="dd-form-control-sm"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="dd-form-label"><PortalText text={"Dosage "} /><span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            value={medicine.dosage}
                            placeholder="e.g., 1 Tablet"
                            onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                            className="dd-form-control-sm"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mt-2">
                      <Form.Label className="dd-form-label"><PortalText text={"Timing "} /><span className="text-danger">*</span></Form.Label>
                      <div className="dd-medicine-timing-grid">
                        {MEDICINE_TIMINGS.map((timing) => (
                          <Form.Check
                            key={timing}
                            type="checkbox"
                            id={`medicine-${index}-${timing}`}
                            label={timing}
                            checked={medicine.timings?.includes(timing) || false}
                            onChange={() => toggleMedicineTiming(index, timing)}
                          />
                        ))}
                      </div>
                    </Form.Group>

                    <Row className="g-2 mt-1">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="dd-form-label"><PortalText text={"Duration Value "} /><span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            value={medicine.durationValue}
                            placeholder="e.g., 7"
                            onChange={(e) => updateMedicine(index, "durationValue", e.target.value.replace(/[^\d]/g, ""))}
                            className="dd-form-control-sm"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="dd-form-label"><PortalText text={"Duration Type "} /><span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={medicine.durationType}
                            onChange={(e) => updateMedicine(index, "durationType", e.target.value)}
                            className="dd-form-control-sm"
                          >
                            <PortalElement as="option" value={"Days"}>Days</PortalElement>
                            <PortalElement as="option" value={"Weeks"}>Weeks</PortalElement>
                            <PortalElement as="option" value={"Months"}>Months</PortalElement>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="dd-medicine-preview"><PortalText text={"Preview: "} />{formatMedicineLine(medicine)}
                    </div>
                    <Form.Group className="mt-2">
                      <Form.Label className="dd-form-label"><PortalText text="Medicine instructions (optional)" /></Form.Label>
                      <Form.Control value={medicine.instructions || ''} placeholder="Before/after food or other instructions" onChange={event => updateMedicine(index, 'instructions', event.target.value)} />
                    </Form.Group>
                  </div>
                ))}

                <div className="dd-form-text text-muted mt-1"><PortalText text={"Each medicine will be formatted as: Medicine Name - Dosage (Timing) - Duration"} /></div>
              </div>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="dd-form-label"><PortalText text={"Advice "} /><span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter detailed advice..."
                  value={form.advice}
                  onChange={(e) => handleInputChange("advice", e.target.value)}
                  className="dd-form-control-sm dd-advice-textarea"
                  required
                />
                <div className="dd-form-text text-muted mt-1"><PortalText text={"Include lifestyle recommendations and instructions."} /></div>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={12}>
              <div className="dd-follow-up-section p-2 border rounded">
                <Form.Group className="mb-2">
                  <Form.Check
                    type="switch"
                    id="follow-up-switch"
                    label="Schedule Follow-up Appointment"
                    checked={form.followUpRequired || false}
                    onChange={handleFollowUpToggle}
                    className="dd-follow-up-switch"
                  />
                </Form.Group>

                {form.followUpRequired && (
                  <Form.Group>
                    <Form.Label className="dd-form-label"><PortalText text={"Follow-up Date "} /><span className="text-danger">*</span>
                    </Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        type="date"
                        min={minDate}
                        value={form.followUpDate || defaultFollowUpDateStr}
                        onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                        className="dd-form-control-sm dd-follow-up-date-input"
                        required={form.followUpRequired}
                      />
                      <div className="text-muted">
                        <small><PortalText text={"Select date for follow-up"} /></small>
                      </div>
                    </div>
                    {form.followUpDate && (
                      <div className="mt-1 text-info dd-follow-up-date-info">
                        <i className="bi bi-calendar-check me-1"></i><PortalText text={"Follow-up: "} />{new Date(form.followUpDate).toLocaleDateString('en-US', { 
                          day: '2-digit',
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                    )}
                  </Form.Group>
                )}
              </div>
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={12}>
              <div className="dd-additional-notes-section p-2 border rounded">
                <Form.Group>
                  <Form.Label className="dd-form-label"><PortalText text={"Additional Notes (Optional)"} /></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Any additional observations, referrals..."
                    value={form.additionalNotes || ""}
                    onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                    className="dd-form-control-sm dd-additional-notes-textarea"
                  />
                </Form.Group>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className="dd-complete-modal-footer">
        <div className="d-flex justify-content-between w-100 align-items-center">
          <div className="dd-form-requirements">
            <small className="text-muted">
              <i className="bi bi-exclamation-circle me-1"></i><PortalText text={"Fields marked with "} /><span className="text-danger">*</span><PortalText text={" are required"} /></small>
          </div>
          <div className="dd-modal-actions">
            <Button
              variant="outline-secondary"
              onClick={onHide}
              className="dd-complete-cancel-btn me-2"
              size="sm"
            ><PortalText text={"Cancel"} /></Button>
            <Button
              variant="success"
              onClick={handleSave}
              className="dd-complete-save-btn"
              size="sm"
              disabled={saving || !canSave}
            >
              <i className="bi bi-check-circle me-1"></i><PortalText text={saving ? 'Saving...' : saveLabel} /></Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};


export default ConsultationCompletionModal;
