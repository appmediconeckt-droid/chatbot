import { normalizeProfileImage } from "../../utils/profileImage.js";

export function getApprovedPrescriptionSignature(prescription, origin = "") {
  if (prescription.verificationStatus !== "verified") return "";
  return normalizeProfileImage(
    prescription.prescriptionSignatureUrl || prescription.signatureUrl ||
    prescription.psychiatrist?.prescriptionSignature || "", origin,
  );
}
