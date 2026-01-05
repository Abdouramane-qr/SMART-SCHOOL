import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardStats {
  totalStudents: number;
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
}

interface PaymentDistribution {
  name: string;
  value: number;
}

interface MonthlyPayment {
  month: string;
  montant: number;
}

interface ExportData {
  schoolYear: string;
  stats: DashboardStats;
  paymentDistribution: PaymentDistribution[];
  monthlyPayments: MonthlyPayment[];
  exportDate: string;
}

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('fr-FR')} DH`;
};

export const exportDashboardToPDF = (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(33, 150, 243);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("SMART SCHOOL", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Rapport du Tableau de Bord - ${data.schoolYear}`, 14, 32);
  
  // Date d'export
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(`Exporté le: ${data.exportDate}`, pageWidth - 14, 50, { align: "right" });
  
  // Stats Section
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 150, 243);
  doc.text("Statistiques Générales", 14, 60);
  
  doc.setDrawColor(33, 150, 243);
  doc.line(14, 63, pageWidth - 14, 63);
  
  // Stats Table
  autoTable(doc, {
    startY: 70,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Total Élèves", data.stats.totalStudents.toString()],
      ["Total Recettes", formatAmount(data.stats.totalRevenue)],
      ["Dépenses", formatAmount(data.stats.totalExpenses)],
      ["Résultat Net", formatAmount(data.stats.netResult)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 250, 255],
    },
    styles: {
      fontSize: 11,
      cellPadding: 6,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right", cellWidth: 80 },
    },
  });
  
  // Payment Distribution Section
  const currentY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 150, 243);
  doc.text("Répartition des Paiements", 14, currentY);
  
  doc.setDrawColor(33, 150, 243);
  doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);
  
  autoTable(doc, {
    startY: currentY + 10,
    head: [["Statut", "Nombre", "Pourcentage"]],
    body: data.paymentDistribution.map(item => {
      const total = data.paymentDistribution.reduce((sum, i) => sum + i.value, 0);
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
      return [item.name, item.value.toString(), `${percentage}%`];
    }),
    theme: "grid",
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 250, 255],
    },
    styles: {
      fontSize: 11,
      cellPadding: 6,
    },
  });
  
  // Monthly Payments Section
  const currentY2 = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 150, 243);
  doc.text("Évolution Mensuelle des Paiements", 14, currentY2);
  
  doc.setDrawColor(33, 150, 243);
  doc.line(14, currentY2 + 3, pageWidth - 14, currentY2 + 3);
  
  autoTable(doc, {
    startY: currentY2 + 10,
    head: [["Mois", "Montant"]],
    body: data.monthlyPayments.map(item => [
      item.month,
      formatAmount(item.montant),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 250, 255],
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      1: { halign: "right" },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} sur ${pageCount} - SMART SCHOOL Gestion Scolaire`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  doc.save(`dashboard-rapport-${data.exportDate.replace(/\//g, "-")}.pdf`);
};

export const exportDashboardToExcel = (data: ExportData) => {
  // Create CSV content (Excel compatible)
  let csvContent = "\uFEFF"; // BOM for UTF-8
  
  // Header
  csvContent += "SMART SCHOOL - Rapport du Tableau de Bord\n";
  csvContent += `Année scolaire: ${data.schoolYear}\n`;
  csvContent += `Date d'export: ${data.exportDate}\n\n`;
  
  // Stats
  csvContent += "STATISTIQUES GÉNÉRALES\n";
  csvContent += "Indicateur;Valeur\n";
  csvContent += `Total Élèves;${data.stats.totalStudents}\n`;
  csvContent += `Total Recettes;${formatAmount(data.stats.totalRevenue)}\n`;
  csvContent += `Dépenses;${formatAmount(data.stats.totalExpenses)}\n`;
  csvContent += `Résultat Net;${formatAmount(data.stats.netResult)}\n\n`;
  
  // Payment Distribution
  csvContent += "RÉPARTITION DES PAIEMENTS\n";
  csvContent += "Statut;Nombre;Pourcentage\n";
  const total = data.paymentDistribution.reduce((sum, i) => sum + i.value, 0);
  data.paymentDistribution.forEach(item => {
    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
    csvContent += `${item.name};${item.value};${percentage}%\n`;
  });
  csvContent += "\n";
  
  // Monthly Payments
  csvContent += "ÉVOLUTION MENSUELLE DES PAIEMENTS\n";
  csvContent += "Mois;Montant\n";
  data.monthlyPayments.forEach(item => {
    csvContent += `${item.month};${formatAmount(item.montant)}\n`;
  });
  
  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `dashboard-rapport-${data.exportDate.replace(/\//g, "-")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
