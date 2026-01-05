import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PaymentData {
  receiptNumber: string;
  studentName: string;
  studentId: string;
  paymentType: string;
  amount: number;
  paidAmount: number;
  paymentDate: string;
  notes?: string;
}

export const generatePaymentReceipt = (payment: PaymentData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Primary color
  doc.text("REÇU DE PAIEMENT", 105, 20, { align: "center" });
  
  // School info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Établissement Scolaire", 105, 30, { align: "center" });
  doc.text("Adresse de l'établissement", 105, 35, { align: "center" });
  doc.text("Téléphone: +212 XXX XXX XXX", 105, 40, { align: "center" });
  
  // Receipt number and date
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`N° Reçu: ${payment.receiptNumber || "N/A"}`, 20, 55);
  doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString("fr-FR")}`, 150, 55);
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 60, 190, 60);
  
  // Student information
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text("Informations de l'élève", 20, 70);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Nom: ${payment.studentName}`, 20, 80);
  doc.text(`ID Élève: ${payment.studentId}`, 20, 88);
  
  // Payment details table
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text("Détails du paiement", 20, 105);
  
  autoTable(doc, {
    startY: 110,
    head: [["Type de paiement", "Montant dû", "Montant payé", "Restant"]],
    body: [
      [
        payment.paymentType,
        `${payment.amount.toLocaleString()} DH`,
        `${payment.paidAmount.toLocaleString()} DH`,
        `${(payment.amount - payment.paidAmount).toLocaleString()} DH`,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 11,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 10,
    },
    margin: { left: 20, right: 20 },
  });
  
  // Total section
  const finalY = (doc as any).lastAutoTable.finalY || 140;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, finalY + 10, 170, 25, "F");
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL PAYÉ:", 25, finalY + 22);
  doc.setFontSize(16);
  doc.setTextColor(34, 197, 94); // Green color
  doc.text(`${payment.paidAmount.toLocaleString()} DH`, 170, finalY + 22, { align: "right" });
  
  // Notes
  if (payment.notes) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Notes:", 20, finalY + 45);
    doc.setTextColor(0, 0, 0);
    const splitNotes = doc.splitTextToSize(payment.notes, 170);
    doc.text(splitNotes, 20, finalY + 52);
  }
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Merci pour votre paiement", 105, 270, { align: "center" });
  doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 105, 275, { align: "center" });
  
  // Line at bottom
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 280, 190, 280);
  
  // Save the PDF
  const fileName = `Recu_${payment.studentId}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};
