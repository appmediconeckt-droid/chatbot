// ===============================
// pdfGenerator.js
// ===============================
import { jsPDF } from "jspdf";

export const generatePrescriptionPDF = (patient, record) => {
  return new Promise((resolve) => {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Set colors
    const primaryColor = [59, 130, 246]; // Blue-500
    const secondaryColor = [107, 114, 128]; // Gray-500
    const accentColor = [16, 185, 129]; // Green-500
    
    // Add header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("MEDICAL PRESCRIPTION", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Official Document", 105, 28, null, null, "center");
    
    // Add clinic info
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.text("HealthCare Clinic", 15, 50);
    doc.text("123 Medical Street, City, State 12345", 15, 55);
    doc.text("Phone: (123) 456-7890 | Email: clinic@example.com", 15, 60);
    
    // Add date and prescription ID
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Prescription ID: RX-${record.id}`, 160, 50);
    doc.text(`Generated: ${currentDate}`, 160, 55);
    
    // Add horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 65, 195, 65);
    
    // Patient Information Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT INFORMATION", 15, 75);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let yPos = 82;
    
    doc.text(`Name: ${patient.name}`, 20, yPos);
    doc.text(`Age/Gender: ${patient.age} years, ${patient.gender}`, 100, yPos);
    yPos += 7;
    
    doc.text(`Phone: ${patient.phone}`, 20, yPos);
    doc.text(`Blood Group: ${patient.bloodGroup}`, 100, yPos);
    yPos += 7;
    
    // Visit Details
    doc.setFont("helvetica", "bold");
    doc.text("VISIT DETAILS", 15, yPos + 5);
    doc.setFont("helvetica", "normal");
    yPos += 12;
    
    doc.text(`Date: ${record.date}`, 20, yPos);
    doc.text(`Time: ${record.time}`, 100, yPos);
    yPos += 7;
    
    doc.text(`Doctor: ${record.doctor}`, 20, yPos);
    doc.text(`Follow-up: ${record.followUp}`, 100, yPos);
    yPos += 15;
    
    // Medical Information
    doc.setFont("helvetica", "bold");
    doc.text("MEDICAL INFORMATION", 15, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 7;
    
    doc.text(`Problem: ${record.problem}`, 20, yPos);
    yPos += 7;
    doc.text(`Diagnosis: ${record.diagnosis}`, 20, yPos);
    yPos += 12;
    
    // Vital Signs
    doc.setFont("helvetica", "bold");
    doc.text("VITAL SIGNS", 15, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 7;
    
    doc.text(`Blood Pressure: ${record.bp} mmHg`, 20, yPos);
    doc.text(`Pulse Rate: ${record.pulse} bpm`, 100, yPos);
    yPos += 7;
    doc.text(`Temperature: ${record.temperature}`, 20, yPos);
    yPos += 12;
    
    // Prescription Details
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIPTION", 15, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 7;
    
    // Create a table for medications
    const medications = record.tablets.split(',').map(m => m.trim());
    
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 4, 170, 10, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, yPos - 4, 170, 10);
    
    doc.setFont("helvetica", "bold");
    doc.text("Medication", 25, yPos);
    doc.text("Duration", 140, yPos);
    doc.setFont("helvetica", "normal");
    
    yPos += 10;
    
    medications.forEach((med, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.rect(20, yPos - 4, 170, 10);
      doc.text(med, 25, yPos);
      doc.text(record.days, 140, yPos);
      yPos += 10;
    });
    
    yPos += 5;
    
    // Doctor's Instructions
    doc.setFont("helvetica", "bold");
    doc.text("DOCTOR'S INSTRUCTIONS", 15, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 7;
    
    // Split instructions into multiple lines if needed
    const instructions = doc.splitTextToSize(record.prescription, 170);
    doc.text(instructions, 20, yPos);
    yPos += (instructions.length * 6) + 10;
    
    // Important Notes
    doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT NOTES", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    yPos += 7;
    
    const notes = [
      "1. Take medications as prescribed. Do not stop without consulting doctor.",
      "2. Complete the full course of medication even if you feel better.",
      "3. Report any side effects or adverse reactions immediately.",
      "4. Keep this prescription for your records and future reference.",
      "5. Follow up on the specified date for further evaluation."
    ];
    
    notes.forEach(note => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(note, 20, yPos);
      yPos += 6;
    });
    
    // Footer
    if (yPos < 260) {
      yPos = 260;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, 195, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    yPos += 10;
    
    doc.text("Doctor's Signature & Stamp", 15, yPos);
    doc.text("___________________________", 15, yPos + 5);
    
    doc.text("Patient's Signature", 150, yPos);
    doc.text("___________________________", 150, yPos + 5);
    
    yPos += 15;
    doc.setFontSize(8);
    doc.text("This is a computer-generated prescription. Valid without signature.", 105, yPos, null, null, "center");
    doc.text("For official use only. Do not duplicate or distribute without permission.", 105, yPos + 4, null, null, "center");
    
    // Save the PDF
    const fileName = `Prescription_${patient.name.replace(/\s+/g, '_')}_${record.date}.pdf`;
    doc.save(fileName);
    
    resolve();
  });
};