import { normalizeProfileImage } from "../../utils/profileImage.js";

export function getApprovedPrescriptionSignature(prescription, origin = "") {
  const completedVisit = prescription.source === 'appointment' && prescription.verificationStatus === 'completed';
  if (prescription.verificationStatus !== "verified" && !completedVisit) return "";
  return normalizeProfileImage(
    prescription.prescriptionSignatureUrl || prescription.signatureUrl ||
    prescription.psychiatrist?.prescriptionSignature ||
    prescription.doctorProfile?.prescriptionSignature || prescription.doctor?.prescriptionSignature || "", origin,
  );
}
