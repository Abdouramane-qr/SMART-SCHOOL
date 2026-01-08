# Audit General (React + Filament + API)

Date: 2026-01-06  
Objectif: vue d'ensemble rapide (visuel, perf, automatisation, coherence, finance).

## Etat global
- **Design/Branding**: POPSPACE appliquee (React + Filament) avec tokens centralises.
- **Automatisation**: finance centralisee + events cache + audits automatiques.
- **Performance**: lazy loading OK, mais pagination front encore en `per_page=1000`.
- **Coherence**: React = usage quotidien, Filament = admin (redirections OK).

## Points forts
- Cache tague par ecole/annee avec invalidation + warm.
- Assets synchronises avec depenses (expense_id).
- Statuts assets standardises (actif/panne/vendu).
- Audit automatique pour paiements, depenses, salaires, assets.

## Risques/limites
- Payloads trop lourds (per_page=1000).
- Double saisie possible React/Filament sur certains modules.
- Devise `school_id` non deduite pour depenses sans regle explicite (depend d'usage).

## References
- Couleurs/typo: `AUDIT_COLORS_TYPO.md`
- Performance: `AUDIT_PERFORMANCE.md`
- Automatisation: `AUDIT_AUTOMATION.md`
- Readiness: `AUDIT_READINESS.md`
- Coherence: `AUDIT_COHERENCE.md`
