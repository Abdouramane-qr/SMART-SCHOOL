# Deep Audit Mono-School

## Contexte et objectif
- Objectif: basculer l'application en mode mono-school strict.
- Source de verite: une seule ecole active via `schools.is_active = true`.
- Condition: conserver au moins un compte avec tous les droits d'administration/configuration.

## Resume executif
- Mono-school est maintenant applique cote backend (scoping actif partout).
- Une ecole active unique est garantie et autocorrigee si plusieurs actives existent.
- Filament admin permet de definir l'ecole active explicitement.
- UI affiche l'ecole active, mais le front doit encore uniformiser les messages d'erreur.

## Checklist de conformite mono-school
- [x] Une seule ecole active est enforcee automatiquement.
- [x] Toutes les requetes API sont scopees a l'ecole active.
- [x] Les policies appliquent le scoping ecole (notes, absences, classes, paiements, etc.).
- [x] Filament permet de gerer l'ecole active (resource + page admin).
- [x] Tests d'acces negatifs/positifs en place.
- [ ] Messages UI normalises pour indiquer clairement "ecole active".

## Backend: points cles et corrections
- Resolution d'ecole active centralisee: `app/Support/SchoolResolver.php`.
- Scoping enforce partout via `resolveSchoolId()` et policies mono-school.
- Suppression des branches multi-ecole conditionnelles dans les controllers.
- Cohesion des donnees: `School::booted()` garantit qu'une seule ecole est active.

Fichiers critiques:
- `app/Support/SchoolResolver.php`
- `app/Policies/BaseResourcePolicy.php`
- `app/Models/School.php`
- `app/Http/Controllers/Controller.php`
- `app/Http/Controllers/Api/*Controller.php`

## Filament (administration)
Etat:
- Resource `SchoolResource` existant.
- Action "Definir active" ajoutee, avec confirmation et feedback.
- Page admin "Ecole active" ajoutee pour selectionner rapidement l'ecole courante.
- L'activation d'une ecole desactive automatiquement les autres.

Fichier:
- `app/Filament/Resources/SchoolResource.php`
- `app/Filament/Pages/ActiveSchool.php`
- `resources/views/filament/pages/active-school.blade.php`

Recommandation:
- Ajouter un panneau d'info (Filament) montrant l'ecole active courante.
- Bloquer la suppression de l'ecole active (soft guard via hook).

## Frontend: analyse mono-school
Etat:
- Le front n'utilise plus `school_id` pour filtrer.
- L'ecole active est exposee dans `/api/me` et affichee dans la navbar.

Fichiers:
- `resources/js/components/layout/DashboardLayout.tsx`
- `resources/js/services/laravelAuthApi.ts`

Recommandations:
- Normaliser la gestion d'erreurs: afficher "Ecole active manquante" au lieu de "Erreur serveur".
- Afficher l'ecole active dans d'autres pages sensibles (Finances, Notes).

## UI/UX audit (eleves / notes / finances)
### Eleves
Points forts:
- Recherche, filtres, pagination et actions claires.
- Modales bien segmentees (details, paiement, audit).

Points a ameliorer:
- Indiquer visiblement que les donnees sont scopees a l'ecole active (badge ou bandeau).
- Normaliser les etats vides (aucun eleve, aucune classe, pas d'annee active).
- Ajouter un message d'erreur contextualise si l'API refuse l'acces (403/422).
- Clarifier les actions destructives (supprimer, desinscrire) avec un recap.

### Notes
Points forts:
- Statistiques detaillees et filtres multi-criteres.
- Mode lecture seule bien indique pour eleves/parents.

Points a ameliorer:
- Ajouter un badge "Ecole active" dans l'entete.
- Mettre en avant l'annee scolaire courante plus visiblement.
- Verrouiller l'edition si l'annee scolaire active est absente.
- Harmoniser les libelles (Note vs Evaluation) pour eviter les ambiguite.

### Finances
Points forts:
- Tableau de bord riche (stats + graphiques).
- Rendus PDF et outils de suivi utiles.

Points a ameliorer:
- "Multi-devises" donne un signal multi-ecole. Renommer en "Multi-devises (ecole active)".
- Centraliser les erreurs pour ne pas afficher "Erreur serveur" sans contexte.
- Ameliorer la lecture des soldes (couleurs + libelles explicites).
- Ajouter un filtre rapide "periode active" (par defaut).

## Tests
Excuted:
- `php artisan test --filter AccessControlTest`
- `php artisan test --filter PermissionsTest`
- `php artisan test --filter AccessControlPositiveTest`
- `php artisan test --filter SchoolResolverTest`

## Recommendations finales (non destructives)
1) Ajouter un bandeau "Ecole active" sur pages cle (Finances, Notes, Eleves).
2) Normaliser les erreurs API en UI (messages explicites).
3) Ajouter un verrou Filament sur la suppression de l'ecole active.
4) Ajouter un test "Reject school_id param" pour eviter tout retour multi-ecole.
