# Audit Performance (Afrique)

Date: 2026-01-06  
Objectif: usage fluide sur Android bas de gamme, réseau 2G/3G, PC anciens.  
Règle: aucune modification visuelle, analyse uniquement.

## Vérifications

### 1) Lazy loading des pages
- **Constaté**: lazy loading route-level actif dans `resources/js/App.tsx` (Suspense + `lazy`).
- **Statut**: OK  
- **Action**: SKIP  
- **Gain estimé**: -30% à -50% de JS initial sur mobile bas de gamme (déjà capté).

### 2) Pagination backend
- **Constaté**: API Laravel paginée pour Eleves, Notes, Paiements, Absences, etc.  
  Pagination segmentée côté front (per_page=200) pour réduire la taille des réponses.
- **Statut**: AMÉLIORABLE  
- **Action**: PROPOSER (pagination UI complète + Resources “light”)  
- **Gain estimé**: 30–70% de réduction de payload sur réseau 2G/3G.

### 3) Taille des payloads API
- **Constaté**: Resources incluent plusieurs relations (élèves + paiements + classe).  
  Calculs (totaux) réalisés côté API pour certains modules (Eleves/Finance).
- **Statut**: AMÉLIORABLE  
- **Action**: PROPOSER (Resource “light” pour listes + supprimer relations non nécessaires sur index)  
- **Gain estimé**: 30–60% de réduction de payload + temps de parsing.

### 4) Cache Laravel par école + année
- **Constaté**: cache tagué par `school_id` + `academic_year_id` + invalidation/rafraîchissement via events (`FinanceService`).  
- **Statut**: OK  
- **Action**: SKIP  
- **Gain estimé**: meilleure réactivité globale, moins d’accès DB en réseau instable.

## Optimisations déjà en place (SKIP)
- Cache tagué pour stats et listes lourdes + warm via events finance.
- Calculs financiers côté API (évite recalcul client).
- Lazy loading route-level dans `resources/js/App.tsx`.

## Optimisations à proposer (sans implémentation)
- Paginer toutes les listes React restantes (pagination UI complète).
- Réduire les champs dans les Resources listées restantes (index “light”).

## Résumé
Priorité pour l’Afrique: pagination réelle + payloads “light” → impact direct sur 2G/3G.  
Le cache API est déjà un bon point; le goulot principal reste la taille des réponses côté frontend.
