import { useUserRole, type AppRole } from "./useUserRole";

interface TooltipContent {
  admin?: string;
  comptable?: string;
  enseignant?: string;
  eleve?: string;
  parent?: string;
  default: string;
}

// Centralized tooltip texts for all critical actions
export const TOOLTIP_TEXTS = {
  // Dashboard actions
  exportPDF: {
    admin: "Exporter le rapport complet en PDF avec toutes les statistiques financières",
    comptable: "Télécharger le rapport financier mensuel en PDF",
    default: "Exporter en PDF",
  },
  exportExcel: {
    admin: "Exporter les données détaillées vers Excel pour analyse approfondie",
    comptable: "Exporter les données comptables vers Excel",
    default: "Exporter en Excel",
  },
  exportAbsences: {
    admin: "Exporter le rapport des absences et retards en PDF",
    enseignant: "Exporter les absences de vos classes",
    default: "Exporter les absences",
  },
  financeSettings: {
    admin: "Paramétrer les devises, taxes et taux",
    default: "Paramètres financiers",
  },
  generateReceipt: {
    admin: "Générer un reçu pour ce paiement",
    comptable: "Télécharger le reçu de paiement",
    default: "Reçu",
  },
  quickAddStudent: {
    admin: "Accès rapide à la création d'un élève",
    comptable: "Ajouter un élève pour le suivi des paiements",
    default: "Ajouter un élève",
  },
  quickAddClass: {
    admin: "Créer une nouvelle classe rapidement",
    default: "Ajouter une classe",
  },
  quickAddGrade: {
    admin: "Saisir une note rapidement",
    enseignant: "Ajouter une note d'évaluation",
    default: "Ajouter une note",
  },
  quickAddAbsence: {
    admin: "Enregistrer une absence rapidement",
    enseignant: "Saisir une absence",
    default: "Ajouter une absence",
  },
  quickMessage: {
    admin: "Composer un message rapidement",
    enseignant: "Envoyer un message",
    parent: "Contacter l'établissement",
    eleve: "Envoyer un message",
    default: "Nouveau message",
  },
  dashboardSchoolYear: {
    default: "Année scolaire courante utilisée pour les données du tableau de bord",
  },
  dashboardCurrency: {
    default: "Devise par défaut issue des paramètres financiers",
  },
  dashboardSummaryTable: {
    default: "Résumé des paiements et dépenses récents de l'année en cours",
  },

  // User management
  addUser: {
    admin: "Créer un nouveau compte utilisateur et attribuer des rôles",
    default: "Ajouter un utilisateur",
  },
  deleteUser: {
    admin: "Supprimer définitivement ce compte utilisateur du système",
    default: "Supprimer l'utilisateur",
  },
  editUser: {
    admin: "Modifier les informations et les rôles de cet utilisateur",
    default: "Modifier l'utilisateur",
  },
  addRole: {
    admin: "Attribuer un nouveau rôle à cet utilisateur",
    default: "Ajouter un rôle",
  },
  removeRole: {
    admin: "Retirer ce rôle de l'utilisateur",
    default: "Supprimer le rôle",
  },

  // Student management
  addStudent: {
    admin: "Inscrire un nouvel élève dans le système",
    comptable: "Ajouter un élève pour le suivi des paiements",
    default: "Ajouter un élève",
  },
  editStudent: {
    admin: "Modifier les informations personnelles de l'élève",
    comptable: "Mettre à jour les coordonnées de l'élève",
    default: "Modifier l'élève",
  },
  deleteStudent: {
    admin: "Supprimer définitivement cet élève et ses données associées",
    default: "Supprimer l'élève",
  },
  viewStudentDetails: {
    admin: "Voir le dossier complet de l'élève",
    enseignant: "Consulter les informations et notes de l'élève",
    parent: "Voir les informations de votre enfant",
    default: "Détails de l'élève",
  },
  studentPayment: {
    admin: "Enregistrer un paiement pour cet élève",
    comptable: "Ajouter un nouveau paiement de scolarité",
    default: "Nouveau paiement",
  },

  // Grade management
  addGrade: {
    admin: "Ajouter une nouvelle note pour un élève",
    enseignant: "Saisir une note d'évaluation",
    default: "Ajouter une note",
  },
  editGrade: {
    admin: "Modifier cette note",
    enseignant: "Corriger cette note d'évaluation",
    default: "Modifier la note",
  },
  deleteGrade: {
    admin: "Supprimer cette note",
    enseignant: "Supprimer cette évaluation",
    default: "Supprimer la note",
  },
  exportBulletin: {
    admin: "Générer le bulletin de notes complet en PDF",
    enseignant: "Exporter le bulletin de l'élève",
    parent: "Télécharger le bulletin de votre enfant",
    default: "Exporter le bulletin",
  },

  // Timetable
  addTimetable: {
    admin: "Ajouter un nouveau créneau à l'emploi du temps",
    default: "Ajouter un cours",
  },
  editTimetable: {
    admin: "Modifier ce créneau de l'emploi du temps",
    default: "Modifier le cours",
  },
  deleteTimetable: {
    admin: "Supprimer ce créneau de l'emploi du temps",
    default: "Supprimer le cours",
  },

  // Class management
  addClass: {
    admin: "Créer une nouvelle classe pour l'année scolaire",
    default: "Ajouter une classe",
  },
  editClass: {
    admin: "Modifier les informations de cette classe",
    default: "Modifier la classe",
  },
  deleteClass: {
    admin: "Supprimer cette classe et ses inscriptions",
    default: "Supprimer la classe",
  },
  manageEnrollments: {
    admin: "Gérer les élèves inscrits dans cette classe",
    default: "Gérer les inscriptions",
  },

  // Teacher/Staff management
  addTeacher: {
    admin: "Ajouter un nouvel enseignant au personnel",
    default: "Ajouter un enseignant",
  },
  editTeacher: {
    admin: "Modifier le profil et le salaire de l'enseignant",
    default: "Modifier l'enseignant",
  },
  deleteTeacher: {
    admin: "Supprimer cet enseignant du système",
    default: "Supprimer l'enseignant",
  },
  teacherSalary: {
    admin: "Gérer le paiement de salaire de cet enseignant",
    default: "Payer le salaire",
  },
  teacherAudit: {
    admin: "Consulter l'historique des modifications",
    default: "Historique",
  },

  // Asset management
  addAsset: {
    admin: "Enregistrer un nouveau bien dans l'inventaire",
    default: "Ajouter un actif",
  },
  editAsset: {
    admin: "Modifier les informations de ce bien",
    default: "Modifier l'actif",
  },
  deleteAsset: {
    admin: "Supprimer ce bien de l'inventaire",
    default: "Supprimer l'actif",
  },

  // Finance
  addPayment: {
    admin: "Enregistrer un nouveau paiement de scolarité",
    comptable: "Saisir un paiement reçu",
    default: "Nouveau paiement",
  },
  addExpense: {
    admin: "Enregistrer une nouvelle dépense",
    comptable: "Ajouter une dépense au registre",
    default: "Nouvelle dépense",
  },

  // Subjects
  addSubject: {
    admin: "Créer une nouvelle matière dans le programme",
    default: "Ajouter une matière",
  },
  editSubject: {
    admin: "Modifier le nom ou coefficient de cette matière",
    default: "Modifier la matière",
  },
  deleteSubject: {
    admin: "Supprimer cette matière du programme",
    default: "Supprimer la matière",
  },

  // Classrooms
  addClassroom: {
    admin: "Ajouter une nouvelle salle à l'établissement",
    default: "Ajouter une salle",
  },
  editClassroom: {
    admin: "Modifier les informations de cette salle",
    default: "Modifier la salle",
  },
  deleteClassroom: {
    admin: "Supprimer cette salle du système",
    default: "Supprimer la salle",
  },

  // School years
  addSchoolYear: {
    admin: "Créer une nouvelle année scolaire",
    default: "Nouvelle année",
  },
  editSchoolYear: {
    admin: "Modifier les dates de cette année scolaire",
    default: "Modifier l'année",
  },
  deleteSchoolYear: {
    admin: "Supprimer cette année scolaire",
    default: "Supprimer l'année",
  },
  setCurrentYear: {
    admin: "Définir cette année comme année courante",
    default: "Année courante",
  },

  // Absences
  addAbsence: {
    admin: "Signaler une absence d'élève",
    enseignant: "Enregistrer une absence dans votre cours",
    default: "Ajouter une absence",
  },
  editAbsence: {
    admin: "Modifier les détails de cette absence",
    enseignant: "Corriger cette absence",
    default: "Modifier l'absence",
  },
  deleteAbsence: {
    admin: "Supprimer définitivement cette absence",
    enseignant: "Supprimer cette absence",
    default: "Supprimer l'absence",
  },
  justifyAbsence: {
    admin: "Marquer cette absence comme justifiée",
    enseignant: "Justifier cette absence",
    default: "Justifier",
  },

  // Messages
  composeMessage: {
    admin: "Envoyer un message à un utilisateur du système",
    enseignant: "Contacter un parent ou collègue",
    parent: "Contacter un enseignant ou l'administration",
    eleve: "Envoyer un message à un enseignant",
    default: "Nouveau message",
  },
  replyMessage: {
    default: "Répondre à ce message",
  },
  deleteMessage: {
    default: "Supprimer ce message",
  },

  // Settings
  saveSettings: {
    admin: "Enregistrer les modifications des paramètres",
    default: "Enregistrer",
  },

  // Common actions
  search: {
    default: "Rechercher dans la liste",
  },
  filter: {
    default: "Filtrer les résultats",
  },
  refresh: {
    default: "Actualiser les données",
  },
  cancel: {
    default: "Annuler l'action",
  },
  confirm: {
    default: "Confirmer l'action",
  },
  close: {
    default: "Fermer",
  },
} as const;

export type TooltipKey = keyof typeof TOOLTIP_TEXTS;

export function useTooltips() {
  const { roles, hasRole } = useUserRole();

  const getTooltip = (key: TooltipKey): string => {
    const tooltipConfig = TOOLTIP_TEXTS[key] as TooltipContent;
    
    // Check roles in priority order
    if (hasRole("admin") && tooltipConfig.admin) {
      return tooltipConfig.admin;
    }
    if (hasRole("comptable") && tooltipConfig.comptable) {
      return tooltipConfig.comptable;
    }
    if (hasRole("enseignant") && tooltipConfig.enseignant) {
      return tooltipConfig.enseignant;
    }
    if (hasRole("eleve") && tooltipConfig.eleve) {
      return tooltipConfig.eleve;
    }
    if (hasRole("parent") && tooltipConfig.parent) {
      return tooltipConfig.parent;
    }
    
    return tooltipConfig.default;
  };

  return { getTooltip };
}
