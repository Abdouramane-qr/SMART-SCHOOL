# Guide Utilisateur - Smart School Hub (Detaille)

## Objectif
Guide pas a pas pour chaque role et chaque module, avec champs et validations.

---

## 1. Connexion & roles
### Connexion
1. Ouvrir l'application React.
2. Saisir email + mot de passe.
3. Valider.

Champs:
- Email (obligatoire, format email).
- Mot de passe (obligatoire).

Validations:
- Message simple en cas d'erreur ("Identifiants invalides").

Capture:
- [CAPTURE-LOGIN-01]

### Roles
- Admin: configuration et supervision.
- Comptable: finances et paiements.
- Enseignant: classes, notes, absences.
- Parent: suivi enfant.
- Eleve: suivi personnel.

---

## 2. Parcours Admin (React + Filament)
### React (usage quotidien)
1. Consulter le Dashboard.
2. Acceder aux eleves (notes, absences, paiements).
3. Verifier finances et alertes.

Capture:
- [CAPTURE-DASHBOARD-ADMIN-01]

### Filament (back-office)
1. Utilisateurs & roles.
2. Parametres systeme (annee scolaire, matieres, salles).
3. CRUD administratif (eleves, classes, paiements, notes, assets).

Capture:
- [CAPTURE-FILAMENT-ADMIN-01]

---

## 3. Parcours Comptable
1. Ouvrir "Comptabilite".
2. Verifier recettes / depenses.
3. Exporter un rapport (PDF/Excel).

Champs principaux:
- Filtre devise.
- Periode (si dispo).

Validations:
- Aucun export si donnees vides.

Capture:
- [CAPTURE-FINANCES-01]

---

## 4. Parcours Enseignant
1. Ouvrir "Emploi du temps".
2. Suivre ses classes.
3. Ajouter notes / absences.

Champs notes:
- Eleve (obligatoire).
- Matiere (obligatoire).
- Note (obligatoire, numerique).
- Periode (obligatoire).
- Type / poids / description (optionnel).

Champs absences:
- Eleve (obligatoire).
- Date (obligatoire).
- Motif (optionnel).
- Justifiee (optionnel).

Capture:
- [CAPTURE-TEACHER-01]

---

## 5. Parcours Parent
1. Ouvrir Dashboard Parent.
2. Suivre notes et absences.
3. Verifier paiements.

Capture:
- [CAPTURE-PARENT-01]

---

## 6. Parcours Eleve
1. Ouvrir Dashboard Eleve.
2. Voir notes et absences.
3. Consulter emploi du temps.

Capture:
- [CAPTURE-ELEVE-01]

---

## 7. Emploi du temps
1. Filtrer par classe.
2. Consulter le planning.
3. Admin: ajouter/modifier un creneau.

Champs creneau:
- Classe (obligatoire).
- Matiere (obligatoire).
- Enseignant (optionnel).
- Salle (optionnel).
- Jour (obligatoire).
- Heure debut (obligatoire).
- Heure fin (obligatoire, > debut).

Validations:
- Heure fin > heure debut.
- Classe obligatoire.

Capture:
- [CAPTURE-TIMETABLE-01]

---

## 8. Absences
1. Selectionner un eleve.
2. Ajouter une absence.
3. Verifier l'historique.

Champs:
- Eleve (obligatoire).
- Date (obligatoire).
- Type (optionnel).
- Motif (optionnel).
- Justifiee (optionnel).

Validations:
- Date obligatoire.
- Eleve obligatoire.

Capture:
- [CAPTURE-ABSENCES-01]

---

## 9. Notes
1. Selectionner un eleve + matiere.
2. Ajouter une note.
3. Verifier la moyenne.

Champs:
- Eleve (obligatoire).
- Matiere (obligatoire).
- Note (obligatoire, numerique).
- Periode (obligatoire).
- Type, poids, description (optionnel).

Validations:
- Note numerique.
- Eleve + matiere + periode obligatoires.

Capture:
- [CAPTURE-NOTES-01]

---

## 10. Paiements
1. Ouvrir la fiche eleve.
2. Ajouter un paiement.
3. Generer un recu.

Champs:
- Montant (obligatoire).
- Date paiement (obligatoire).
- Type paiement (optionnel).
- Statut (optionnel).

Validations:
- Montant > 0.
- Date obligatoire.

Capture:
- [CAPTURE-PAYMENTS-01]

---

## 11. Finances
1. Consulter les indicateurs.
2. Filtrer par devise.
3. Exporter PDF/Excel.

Champs:
- Devise (XOF, USD, EUR, DH).

Validations:
- Devise par defaut = parametre finance.

Capture:
- [CAPTURE-FINANCES-DETAIL-01]

---

## 12. Messages
1. Ouvrir "Messages".
2. Rediger un message.
3. Suivre les reponses.

Champs:
- Sujet (obligatoire).
- Contenu (obligatoire).

Validations:
- Sujet + contenu obligatoires.

Capture:
- [CAPTURE-MESSAGES-01]

---

## 13. Assets (inventaire)
1. Ouvrir "Assets".
2. Ajouter un actif.
3. Suivre l'etat.

Champs:
- Nom (obligatoire).
- Etat (optionnel).
- Description (optionnel).

Capture:
- [CAPTURE-ASSETS-01]

---

## 14. IA Assistant
1. Ouvrir l'assistant.
2. Poser une question simple.
3. Appliquer la recommandation.

Capture:
- [CAPTURE-AI-01]

---

## 15. Astuces & Bonnes pratiques
- Toujours verifier l'annee scolaire active.
- Eviter la double saisie (utiliser les formulaires guides).
- Utiliser les exports pour archivage.
