# Deep Audit Issues & Blockers

## Contexte
Suite au passage en mode mono-school et à l’UI repensée pour la gestion des élèves, plusieurs points critiques restent ouverts. Ce document recense les problèmes fonctionnels, de tests et d’infrastructure qui bloquent actuellement une mise en production complète.

## Principaux problèmes non résolus

1. **Student API : `GET /api/eleves/{id}` et `PUT /api/eleves/{id}` renvoient 403 en test.**
   * Cause : `BaseResourcePolicy` refuse la requête si l’élève n’appartient pas à l’école active ou si l’utilisateur n’a pas `eleve.view/update`. Même avec un admin, la sélection de l’école active doit être forcée (`SchoolResolver::requireActiveId()`).
   * État : corrigé dans `tests/Feature/StudentsApiTest` via le helper `createActiveSchool()`, mais l’environnement de test (Postgres + politique) doit être stabilisé pour valider définitivement.
   * Action recommandée : s’assurer qu’il ne reste qu’une seule école avec `is_active = true` avant toute création d’élève en tests/seeders, et ajouter éventuellement un test de régression dédié pour `/api/eleves/{id}`.

2. **PostgreSQL DB (testing) : `SQLSTATE[08006] select exists ... pg_class` empêche `StudentsApiTest` et d’autres suites d’exécuter des requêtes.**
   * Cause : la base de tests saute sur `pg_class`, typiquement parce que l’instance est arrêtée ou que le driver ne peut pas joindre le catalogue.
   * État : toutes les tentatives de `php artisan test --filter StudentsApiTest` tombent avant les assertions; `php artisan test --env=testing` passe d’autres suites mais le full run est signalé `SIGKILL`.
   * Action recommandée : vérifier `postgresql` (re-démarrer, vérifier logs `journalctl -u postgresql`, s’assurer que `postgres` est joignable sur la socket attendue).

3. **Tests financiers/Students** : `StudentsApiTest` et une passe complète `php artisan test --env=testing` se terminent par `signal 9` parfois (manque de RAM/time).**
   * Cause : la suite complète inclut des tests lourds (AI RAG, etc.) et le système peut tuer le process.  
   * État : l’exécution `php artisan test --env=testing` termine mais le système signale `signal 9` ; un re-run ciblé sur `StudentsApiTest` suffira une fois la DB stable.
   * Action recommandée : isoler les suites (déjà fait avec `--filter`) ou augmenter les ressources ou exécuter via `composer test --filter StudentsApiTest` dans un container plus léger.

4. **Front-end Student Details modal : console montre 403 et « Non renseigné » car la policy bloque l’accès, même si la carte latérale charge les infos (mêmes endpoints).**
   * Résolution provisoire : la page gère maintenant `selectedStudentId` et un panel latéral pour afficher les données. Une fois la politique alignée (école active, permissions), la modal récupérera les données comme le panel.
   * Action recommandée : vérifier en QA que le modal obtient les données après les corrections du point 1 ; sinon, loguer la réponse 403 et afficher un message contextualisé dans le popup.

5. **Logs & Policy debugging** : `BaseResourcePolicy` maintenant journalise les rejets (voir `storage/logs/laravel.log`) — très utile pour réagir aux nouvelles écoles ajoutées.  
   * Action recommandée : surveiller les logs après chaque modif de `schools.is_active` et vérifier qu’il ne reste pas plusieurs records actifs.

## Tests exécutés récemment
- `php artisan test --filter StudentsApiTest` (bloqué par `SQLSTATE[08006]` ou 403 selon la passe).  
- `php artisan test --env=testing` (toutes les suites passent mais l’exécution est « signalée 9 »).  
- `php artisan test --filter AccessControlTest` (réussit localement après stabilisation).
- `php artisan test --filter PermissionsTest` (réussi).

## Résumé & prochaines étapes
- Stabiliser PostgreSQL pour que les filtres ciblés (et la suite complète) puissent s’exécuter sans `pg_class` errors.  
- Ajouter une tâche d’intégration qui crée dynamiquement une école active + élève + admin pour valider `/api/eleves/{id}` et `/api/eleves/{id}` `PUT`.  
- Mettre à jour les outils de monitoring (logs, Filament) pour signaler les écoles inactives ou les permissions manquantes.  
- Confirmer que l’UX Student Details/Payments reconstruit précédemment affiche les données dans tous les rôles une fois la politique réglée ; le panel reprend déjà le comportement, donc la modale suivra.  
