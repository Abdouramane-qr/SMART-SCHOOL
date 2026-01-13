import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface GradeData {
  subject_id?: string | number;
  subject_name: string;
  coefficient: number;
  grade: number;
  weight?: number;
}

interface StudentBulletinData {
  studentName: string;
  studentId: string;
  className: string;
  schoolYear: string;
  term: string;
  grades: GradeData[];
}

const BRAND_NAME = "SMART-SCHOOL";
const PRIMARY_RGB = [33, 126, 253] as const; // #217EFD
const SOFT_GRAY = [245, 247, 250] as const;
const BORDER_GRAY = [226, 232, 240] as const;

const HEADER_HEIGHT = 44;
const PAGE_MARGIN_X = 20;

const drawHeader = (doc: jsPDF, term: string) => {
  // Solid header band (clean, admin-first)
  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(0, 0, 210, HEADER_HEIGHT, "F");

  // Logo badge
  doc.setFillColor(255, 255, 255);
  doc.circle(25, 22, 12, "F");
  doc.setTextColor(...PRIMARY_RGB);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PS", 25, 26, { align: "center" });

  // Brand name and title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(BRAND_NAME, 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Établissement d'Enseignement Privé", 105, 30, { align: "center" });
  doc.text(`Bulletin de Notes - ${term}`, 105, 40, { align: "center" });
};

// Print recommendation: A4, portrait, scale 100%, default margins for best layout fidelity.
const drawFooter = (doc: jsPDF, createdAt: Date) => {
  const pageCount = doc.internal.getNumberOfPages();
  const timestamp = `${createdAt.toLocaleDateString("fr-FR")} à ${createdAt.toLocaleTimeString("fr-FR")}`;

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...BORDER_GRAY);
    doc.line(PAGE_MARGIN_X, 280, 210 - PAGE_MARGIN_X, 280);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Document généré le ${timestamp}`, 105, 286, { align: "center" });
    doc.text(`${BRAND_NAME} - Système de Gestion Scolaire`, 105, 290, { align: "center" });
    doc.text(`Page ${page} / ${pageCount}`, 195, 286, { align: "right" });
  }
};

export const generateStudentBulletin = (data: StudentBulletinData) => {
  const doc = new jsPDF();

  // PDF-safe fonts (Helvetica) and SMART-SCHOOL header
  drawHeader(doc, data.term);

  // Student info section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DE L'ÉLÈVE", 20, 55);

  doc.setDrawColor(...PRIMARY_RGB);
  doc.setLineWidth(0.5);
  doc.line(20, 58, 190, 58);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom complet: ${data.studentName}`, 20, 68);
  doc.text(`N° Matricule: ${data.studentId}`, 120, 68);
  doc.text(`Classe: ${data.className}`, 20, 76);
  doc.text(`Année scolaire: ${data.schoolYear}`, 120, 76);
  
  const groupedGrades = new Map<string, {
    subject_name: string;
    coefficient: number;
    totalWeighted: number;
    totalWeight: number;
  }>();

  data.grades.forEach((grade) => {
    const key = String(grade.subject_id ?? grade.subject_name);
    if (!groupedGrades.has(key)) {
      groupedGrades.set(key, {
        subject_name: grade.subject_name,
        coefficient: grade.coefficient || 1,
        totalWeighted: 0,
        totalWeight: 0,
      });
    }

    const entry = groupedGrades.get(key)!;
    const weight = grade.weight ?? 1;
    entry.totalWeighted += grade.grade * weight;
    entry.totalWeight += weight;
  });

  const rows = Array.from(groupedGrades.values()).map((entry) => {
    const average = entry.totalWeight > 0 ? entry.totalWeighted / entry.totalWeight : 0;
    return {
      subject_name: entry.subject_name,
      coefficient: entry.coefficient,
      average,
      points: average * entry.coefficient,
    };
  });

  const totalWeightedGrade = rows.reduce((acc, row) => acc + row.points, 0);
  const totalCoefficient = rows.reduce((acc, row) => acc + row.coefficient, 0);
  const moyenne = totalCoefficient > 0 ? totalWeightedGrade / totalCoefficient : 0;
  
  // Grades table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RELEVÉ DES NOTES", 20, 92);
  doc.line(20, 95, 190, 95);
  
  const tableData = rows.map((row) => {
    const appreciation = 
      row.average >= 16 ? "Excellent" :
      row.average >= 14 ? "Très Bien" :
      row.average >= 12 ? "Bien" :
      row.average >= 10 ? "Passable" : "Insuffisant";
    
    return [
      row.subject_name,
      row.coefficient.toString(),
      `${row.average.toFixed(2)}/20`,
      row.points.toFixed(2),
      appreciation,
    ];
  });
  
  autoTable(doc, {
    startY: 100,
    head: [["Matière", "Coefficient", "Note", "Points", "Appréciation"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: PRIMARY_RGB,
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 40 },
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: {
      fillColor: SOFT_GRAY,
    },
  });
  
  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY || 160;
  
  // Average box
  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(20, finalY + 10, 170, 30, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSULTATS", 30, finalY + 22);
  
  doc.setFontSize(14);
  doc.text(`Moyenne Générale: ${moyenne.toFixed(2)}/20`, 30, finalY + 32);
  
  // Decision
  const decision = moyenne >= 10 ? "ADMIS" : "TRAVAIL À AMÉLIORER";
  const decisionColor = moyenne >= 10 ? [34, 197, 94] : [239, 68, 68];
  
  doc.setFillColor(decisionColor[0], decisionColor[1], decisionColor[2]);
  doc.roundedRect(130, finalY + 15, 50, 20, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(decision, 155, finalY + 28, { align: "center" });
  
  // Observations
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Observations du conseil de classe:", 20, finalY + 50);
  
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(...BORDER_GRAY);
  doc.rect(20, finalY + 54, 170, 25);
  
  const observation = moyenne >= 16 ? "Excellent travail. Continuez ainsi!" :
    moyenne >= 14 ? "Très bon trimestre. Félicitations!" :
    moyenne >= 12 ? "Bon travail. Quelques efforts encore nécessaires." :
    moyenne >= 10 ? "Résultats satisfaisants. Peut mieux faire." :
    "Des efforts importants sont nécessaires.";
  
  doc.text(observation, 25, finalY + 65);
  
  // Signatures
  doc.setFont("helvetica", "bold");
  doc.text("Le Directeur", 40, finalY + 95);
  doc.text("Le Professeur Principal", 140, finalY + 95);
  
  doc.setDrawColor(0, 0, 0);
  doc.line(25, finalY + 110, 75, finalY + 110);
  doc.line(125, finalY + 110, 175, finalY + 110);
  
  // Footer with pagination (print-safe)
  const now = new Date();
  drawFooter(doc, now);

  // Save
  const fileName = `Bulletin_${data.studentId}_${data.term.replace(/\s/g, "_")}.pdf`;
  doc.save(fileName);
};
