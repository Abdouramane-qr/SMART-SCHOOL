/**
 * Fonctions de calcul des moyennes et statistiques des notes
 */

interface GradeEntry {
  grade: number;
  weight?: number;
  coefficient?: number;
  grade_type?: string;
}

interface SubjectGrade extends GradeEntry {
  subject_id: string;
  subjects?: { coefficient: number | null } | null;
}

/**
 * Calcule la moyenne pondérée d'un ensemble de notes
 */
export function calculateWeightedAverage(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0;
  
  let totalWeighted = 0;
  let totalWeight = 0;
  
  grades.forEach(grade => {
    const weight = grade.weight || 1;
    totalWeighted += grade.grade * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? totalWeighted / totalWeight : 0;
}

/**
 * Calcule la moyenne d'un élève pour une matière sur un trimestre
 */
export function calculateSubjectAverage(grades: GradeEntry[]): number {
  return calculateWeightedAverage(grades);
}

/**
 * Calcule la moyenne générale d'un élève avec coefficients des matières
 */
export function calculateGeneralAverage(grades: SubjectGrade[]): number {
  if (grades.length === 0) return 0;
  
  // Grouper les notes par matière
  const bySubject: Record<string, SubjectGrade[]> = {};
  grades.forEach(grade => {
    if (!bySubject[grade.subject_id]) {
      bySubject[grade.subject_id] = [];
    }
    bySubject[grade.subject_id].push(grade);
  });
  
  let totalWeighted = 0;
  let totalCoeff = 0;
  
  Object.entries(bySubject).forEach(([_, subjectGrades]) => {
    if (subjectGrades.length > 0) {
      const subjectAvg = calculateWeightedAverage(subjectGrades);
      const coefficient = subjectGrades[0].subjects?.coefficient || 1;
      totalWeighted += subjectAvg * coefficient;
      totalCoeff += coefficient;
    }
  });
  
  return totalCoeff > 0 ? totalWeighted / totalCoeff : 0;
}

/**
 * Calcule la moyenne de classe pour une matière
 */
export function calculateClassSubjectAverage(allGrades: SubjectGrade[], subjectId: string): number {
  const subjectGrades = allGrades.filter(g => g.subject_id === subjectId);
  if (subjectGrades.length === 0) return 0;
  
  const sum = subjectGrades.reduce((acc, g) => acc + g.grade, 0);
  return sum / subjectGrades.length;
}

/**
 * Calcule les statistiques d'un ensemble de notes
 */
export function calculateGradeStats(grades: number[]): {
  min: number;
  max: number;
  average: number;
  median: number;
  aboveAverage: number;
  belowAverage: number;
} {
  if (grades.length === 0) {
    return { min: 0, max: 0, average: 0, median: 0, aboveAverage: 0, belowAverage: 0 };
  }
  
  const sorted = [...grades].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const average = sum / sorted.length;
  
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average,
    median,
    aboveAverage: grades.filter(g => g >= 10).length,
    belowAverage: grades.filter(g => g < 10).length,
  };
}

/**
 * Obtient l'appréciation basée sur la moyenne
 */
export function getAppreciation(average: number): {
  label: string;
  color: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (average >= 16) {
    return { label: "Excellent", color: "text-green-600", variant: "default" };
  }
  if (average >= 14) {
    return { label: "Bien", color: "text-blue-600", variant: "secondary" };
  }
  if (average >= 12) {
    return { label: "Assez bien", color: "text-cyan-600", variant: "secondary" };
  }
  if (average >= 10) {
    return { label: "Passable", color: "text-yellow-600", variant: "outline" };
  }
  if (average >= 8) {
    return { label: "Insuffisant", color: "text-orange-600", variant: "destructive" };
  }
  return { label: "Très insuffisant", color: "text-red-600", variant: "destructive" };
}

/**
 * Types d'évaluation avec leurs pondérations par défaut
 */
export const GRADE_TYPES = {
  devoir: { label: "Devoir", defaultWeight: 1 },
  composition: { label: "Composition", defaultWeight: 2 },
  interrogation: { label: "Interrogation", defaultWeight: 0.5 },
  projet: { label: "Projet", defaultWeight: 1.5 },
} as const;

export type GradeType = keyof typeof GRADE_TYPES;

/**
 * Périodes/Trimestres
 */
export const TERMS = [
  { value: "Trimestre 1", label: "Trimestre 1" },
  { value: "Trimestre 2", label: "Trimestre 2" },
  { value: "Trimestre 3", label: "Trimestre 3" },
  { value: "Annuel", label: "Moyenne annuelle" },
] as const;
