import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface GradeData {
  subject_name: string;
  coefficient: number;
  grade: number;
}

interface StudentBulletinData {
  studentName: string;
  studentId: string;
  className: string;
  schoolYear: string;
  term: string;
  grades: GradeData[];
}

export const generateStudentBulletin = (data: StudentBulletinData) => {
  const doc = new jsPDF();
  
  // Header with gradient background simulation
  doc.setFillColor(18, 115, 211); // Primary color
  doc.rect(0, 0, 210, 45, "F");
  
  // School logo area
  doc.setFillColor(255, 255, 255);
  doc.circle(25, 22, 12, "F");
  doc.setTextColor(18, 115, 211);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SS", 25, 26, { align: "center" });
  
  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SMART SCHOOL", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Établissement d'Enseignement Privé", 105, 30, { align: "center" });
  doc.text(`Bulletin de Notes - ${data.term}`, 105, 40, { align: "center" });
  
  // Student info section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DE L'ÉLÈVE", 20, 55);
  
  doc.setDrawColor(18, 115, 211);
  doc.setLineWidth(0.5);
  doc.line(20, 58, 190, 58);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom complet: ${data.studentName}`, 20, 68);
  doc.text(`N° Matricule: ${data.studentId}`, 120, 68);
  doc.text(`Classe: ${data.className}`, 20, 76);
  doc.text(`Année scolaire: ${data.schoolYear}`, 120, 76);
  
  // Calculate statistics
  let totalWeightedGrade = 0;
  let totalCoefficient = 0;
  data.grades.forEach((g) => {
    totalWeightedGrade += g.grade * g.coefficient;
    totalCoefficient += g.coefficient;
  });
  const moyenne = totalCoefficient > 0 ? totalWeightedGrade / totalCoefficient : 0;
  
  // Grades table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RELEVÉ DES NOTES", 20, 92);
  doc.line(20, 95, 190, 95);
  
  const tableData = data.grades.map((g) => {
    const appreciation = 
      g.grade >= 16 ? "Excellent" :
      g.grade >= 14 ? "Très Bien" :
      g.grade >= 12 ? "Bien" :
      g.grade >= 10 ? "Passable" : "Insuffisant";
    
    return [
      g.subject_name,
      g.coefficient.toString(),
      `${g.grade.toFixed(2)}/20`,
      (g.grade * g.coefficient).toFixed(2),
      appreciation,
    ];
  });
  
  autoTable(doc, {
    startY: 100,
    head: [["Matière", "Coefficient", "Note", "Points", "Appréciation"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [18, 115, 211],
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
      fillColor: [245, 247, 250],
    },
  });
  
  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY || 160;
  
  // Average box
  doc.setFillColor(18, 115, 211);
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
  doc.setDrawColor(200, 200, 200);
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
  
  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
    105,
    285,
    { align: "center" }
  );
  doc.text("SMART SCHOOL - Système de Gestion Scolaire", 105, 290, { align: "center" });
  
  // Save
  const fileName = `Bulletin_${data.studentId}_${data.term.replace(/\s/g, "_")}.pdf`;
  doc.save(fileName);
};
