// AppointmentModal.jsx
import React from "react";
import { Modal, Button, Form } from "react-bootstrap";

const modalBodyStyle = {
  maxHeight: "65vh",
  overflowY: "auto",
};

/* -------------------- START MODAL -------------------- */
// export function StartModal({ show, onHide, form, setForm, onSave, patientName }) {
//   return (
//     <Modal show={show} onHide={onHide} centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Start Appointment — {patientName}</Modal.Title>
//       </Modal.Header>

//       {/* Scrollable Body */}
//       <Modal.Body style={modalBodyStyle}>
//         <Form>
//           <Form.Group className="mb-2">
//             <Form.Label>Blood Pressure (BP)</Form.Label>
//             <Form.Control
//               placeholder="120/80"
//               value={form.bp}
//               onChange={(e) => setForm({ ...form, bp: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Sugar Level</Form.Label>
//             <Form.Control
//               placeholder="110 mg/dL"
//               value={form.sugar}
//               onChange={(e) => setForm({ ...form, sugar: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Temperature (°C)</Form.Label>
//             <Form.Control
//               placeholder="98.6"
//               value={form.temperature}
//               onChange={(e) => setForm({ ...form, temperature: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>BMI</Form.Label>
//             <Form.Control
//               placeholder="22.5"
//               value={form.bmi}
//               onChange={(e) => setForm({ ...form, bmi: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>SpO2 (%)</Form.Label>
//             <Form.Control
//               placeholder="96"
//               value={form.spo2}
//               onChange={(e) => setForm({ ...form, spo2: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Weight (kg)</Form.Label>
//             <Form.Control
//               placeholder="70"
//               value={form.weight}
//               onChange={(e) => setForm({ ...form, weight: e.target.value })}
//             />
//           </Form.Group>

//           <Form.Group className="mb-2">
//             <Form.Label>Symptoms</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               placeholder="Symptoms / Complaint"
//               value={form.symptoms}
//               onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
//             />
//           </Form.Group>
//         </Form>
//       </Modal.Body>

//       {/* Buttons stay fixed */}
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>Cancel</Button>
//         <Button variant="primary" onClick={onSave}>Start Appointment</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }

/* -------------------- COMPLETE MODAL -------------------- */
export function CompleteModal({
  show,
  onHide,
  form,
  setForm,
  onSave,
  patientName,
}) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg" style={{ background: "none" }}>
      <Modal.Header closeButton>
        <Modal.Title>Complete Appointment — {patientName}</Modal.Title>
      </Modal.Header>

      {/* Scrollable Body */}
      <Modal.Body style={modalBodyStyle}>
        <Form>
          <h6 className="fw-bold mb-3">Final Vitals</h6>

          <div className="row">
            <div className="col-md-4 mb-2">
              <Form.Label>Blood Pressure</Form.Label>
              <Form.Control
                value={form.bp}
                onChange={(e) => setForm({ ...form, bp: e.target.value })}
              />
            </div>

            <div className="col-md-4 mb-2">
              <Form.Label>Sugar Level</Form.Label>
              <Form.Control
                value={form.sugar}
                onChange={(e) => setForm({ ...form, sugar: e.target.value })}
              />
            </div>

            <div className="col-md-4 mb-2">
              <Form.Label>Temperature (°C)</Form.Label>
              <Form.Control
                value={form.temperature}
                onChange={(e) =>
                  setForm({ ...form, temperature: e.target.value })
                }
              />
            </div>

            <div className="col-md-4 mb-2">
              <Form.Label>BMI</Form.Label>
              <Form.Control
                value={form.bmi}
                onChange={(e) => setForm({ ...form, bmi: e.target.value })}
              />
            </div>

            <div className="col-md-4 mb-2">
              <Form.Label>SpO2 (%)</Form.Label>
              <Form.Control
                value={form.spo2}
                onChange={(e) => setForm({ ...form, spo2: e.target.value })}
              />
            </div>

            <div className="col-md-4 mb-2">
              <Form.Label>Weight (kg)</Form.Label>
              <Form.Control
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
          </div>

          <hr />

          <Form.Group className="mb-2">
            <Form.Label>Diagnosis</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Medicine / Prescription</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.medicine}
              onChange={(e) => setForm({ ...form, medicine: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Advice / Follow-up</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={form.advice}
              onChange={(e) => setForm({ ...form, advice: e.target.value })}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      {/* Buttons stay fixed */}
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="success" onClick={onSave}>Save & Complete</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default {  CompleteModal };
