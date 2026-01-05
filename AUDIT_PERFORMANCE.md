# Audit Performance (Afrique)

Date: 2026-01-06  
Objectif: usage fluide sur Android bas de gamme, réseau 2G/3G, PC anciens.  
Règle: aucune modification visuelle, analyse uniquement.

## Vérifications

### 1) Lazy loading des pages
- **Constaté**: pages React importées de manière directe dans `resources/js/App.tsx`.  
  Lazy loading présent uniquement pour certains dialogs/modales (ex: Students).
- **Statut**: AMÉLIORABLE  
- **Action**: PROPOSER (router-level lazy loading)  
- **Gain estimé**: 30–50% de JS initial en moins sur mobile bas de gamme.

### 2) Pagination backend
- **Constaté**: API Laravel paginée pour Eleves, Notes, Paiements, Absences, etc.  
  Mais le frontend appelle souvent `?per_page=1000` (paiements, absences, notes, emplois du temps, dépenses, salaires).
- **Statut**: AMÉLIORABLE  
- **Action**: PROPOSER (utiliser la pagination réelle et charger par page côté React)  
- **Gain estimé**: 50–90% de réduction de payload sur réseau 2G/3G.

### 3) Taille des payloads API
- **Constaté**: Resources incluent plusieurs relations (élèves + paiements + classe).  
  Calculs (totaux) réalisés côté API pour certains modules (Eleves/Finance).
- **Statut**: AMÉLIORABLE  
- **Action**: PROPOSER (Resource “light” pour listes + supprimer relations non nécessaires sur index)  
- **Gain estimé**: 30–60% de réduction de payload + temps de parsing.

### 4) Cache Laravel par école + année
- **Constaté**: cache tagué dans `FinanceController`, `DashboardController`, `PaiementController`, `AssetController`.  
- **Statut**: OK  
- **Action**: SKIP  
- **Gain estimé**: meilleure réactivité globale, moins d’accès DB en réseau instable.

## Optimisations déjà en place (SKIP)
- Cache tagué pour stats et listes lourdes.
- Calculs financiers côté API (évite recalcul client).
- Lazy loading des dialogs dans certaines pages (ex: Students).

## Optimisations appliquées (performance only)
- Lazy loading route-level pour toutes les pages React (Suspense dans `App.tsx`).
  - Gain estimé: -30% à -50% de JS initial sur appareils bas de gamme.
- Pagination backend active pour les élèves (React consomme `per_page` + `page`).
  - Gain estimé: -70% de payload sur la page élèves.
- Payloads "light" sur les listes Absences, Notes, Paiements (index API réduit aux champs utilisés + relations minimales).
  - Gain estimé: -30% à -60% de payload sur 2G/3G.

## Optimisations à proposer (sans implémentation)
- Paginer toutes les listes React restantes (pas de `per_page=1000`).
- Réduire les champs dans les Resources listées restantes (index “light”).

## Résumé
Priorité pour l’Afrique: pagination réelle + payloads “light” → impact direct sur 2G/3G.  
Le cache API est déjà un bon point; le goulot principal est la taille des réponses côté frontend.
