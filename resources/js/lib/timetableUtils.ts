/**
 * Utilitaires pour la gestion de l'emploi du temps
 */

// Plage horaire: 07:00 - 18:00
export const TIME_RANGE = {
  start: 7,
  end: 18,
};

// Générer les créneaux horaires de 07:00 à 18:00
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = TIME_RANGE.start; hour < TIME_RANGE.end; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

export const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

export const DAYS_LABELS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/**
 * Convertit une heure au format HH:MM en minutes depuis minuit
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Calcule la durée en minutes entre deux heures
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Formate une durée en minutes vers un format lisible
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}min`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h${mins}min`;
}

/**
 * Valide une entrée d'emploi du temps
 */
export function validateTimetableEntry(startTime: string, endTime: string): {
  valid: boolean;
  error?: string;
} {
  const startHour = parseInt(startTime.split(":")[0]);
  const endHour = parseInt(endTime.split(":")[0]);
  const endMinutes = parseInt(endTime.split(":")[1]);
  
  // Vérifier la plage horaire
  if (startHour < TIME_RANGE.start) {
    return { valid: false, error: `L'heure de début ne peut pas être avant ${TIME_RANGE.start}:00` };
  }
  
  if (endHour > TIME_RANGE.end || (endHour === TIME_RANGE.end && endMinutes > 0)) {
    return { valid: false, error: `L'heure de fin ne peut pas être après ${TIME_RANGE.end}:00` };
  }
  
  // Vérifier que l'heure de fin est après l'heure de début
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return { valid: false, error: "L'heure de fin doit être après l'heure de début" };
  }
  
  // Durée minimale de 30 minutes
  const duration = calculateDuration(startTime, endTime);
  if (duration < 30) {
    return { valid: false, error: "La durée minimale d'un cours est de 30 minutes" };
  }
  
  // Durée maximale de 4 heures
  if (duration > 240) {
    return { valid: false, error: "La durée maximale d'un cours est de 4 heures" };
  }
  
  return { valid: true };
}

/**
 * Vérifie les conflits d'horaire pour un enseignant
 */
export function checkTeacherConflict(
  existingEntries: Array<{ day_of_week: number; start_time: string; end_time: string; teacher_id: string | null }>,
  newEntry: { day_of_week: number; start_time: string; end_time: string; teacher_id: string | null },
  excludeId?: string
): boolean {
  if (!newEntry.teacher_id) return false;
  
  const newStart = timeToMinutes(newEntry.start_time);
  const newEnd = timeToMinutes(newEntry.end_time);
  
  return existingEntries.some(entry => {
    if (entry.teacher_id !== newEntry.teacher_id) return false;
    if (entry.day_of_week !== newEntry.day_of_week) return false;
    
    const existingStart = timeToMinutes(entry.start_time);
    const existingEnd = timeToMinutes(entry.end_time);
    
    // Vérifier le chevauchement
    return (newStart < existingEnd && newEnd > existingStart);
  });
}

/**
 * Vérifie les conflits de salle
 */
export function checkRoomConflict(
  existingEntries: Array<{ day_of_week: number; start_time: string; end_time: string; classroom_id: string | null }>,
  newEntry: { day_of_week: number; start_time: string; end_time: string; classroom_id: string | null },
  excludeId?: string
): boolean {
  if (!newEntry.classroom_id) return false;
  
  const newStart = timeToMinutes(newEntry.start_time);
  const newEnd = timeToMinutes(newEntry.end_time);
  
  return existingEntries.some(entry => {
    if (entry.classroom_id !== newEntry.classroom_id) return false;
    if (entry.day_of_week !== newEntry.day_of_week) return false;
    
    const existingStart = timeToMinutes(entry.start_time);
    const existingEnd = timeToMinutes(entry.end_time);
    
    // Vérifier le chevauchement
    return (newStart < existingEnd && newEnd > existingStart);
  });
}

/**
 * Couleurs pour les matières dans l'emploi du temps
 */
export const SUBJECT_COLORS = [
  "bg-surface border-brand-neutral",
  "bg-background border-brand-neutral",
  "bg-primary/10 border-primary/30",
  "bg-primary/5 border-primary/20",
  "bg-brand-neutral/10 border-brand-neutral/30",
  "bg-brand-neutral/5 border-brand-neutral/20",
  "bg-surface border-brand-neutral",
  "bg-background border-brand-neutral",
];

export function getSubjectColor(subjectId: string | number): string {
  const subjectKey = String(subjectId || "0");
  const index = subjectKey.charCodeAt(0) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
}
