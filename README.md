# Ça s’arrange

> Les solutions discutables à vos problèmes évitables.

Un gestionnaire humoristique de petites galères et d’alibis : esquiver un dîner, annuler un engagement, expliquer un retard, quitter un groupe WhatsApp ou récupérer les 20 € prêtés à un ami. Le tout traité avec un sérieux administratif parfaitement disproportionné.

**Application :** https://jlrigau.github.io/alibi/

## Fonctionnalités

- **Mes galères** : dossiers (titre, personne, catégorie, date, urgence, statut), création, modification, suppression, filtres, exemples fictifs chargeables à la demande.
- **Fabrique d’alibis** : trois propositions par génération (titre, message modifiable et copiable, indice de crédibilité ludique, suivis suggérés), enregistrement de l’alibi retenu.
- **Historique et cohérence** : alertes non bloquantes pour une excuse resservie à la même personne, des lieux différents ou des engagements incompatibles sur des créneaux qui se chevauchent.
- **Suivis** : actions à échéance, en retard / à venir / terminées. Affichées uniquement quand l’application est ouverte (pas de notifications).
- **Ils m’ont grillé** : trois messages de sortie (humour, excuses, geste), modifiables et copiables. Rien n’est jamais envoyé automatiquement.

## Lancer en local

Prérequis : Node.js 20.19+ (LTS recommandée).

```bash
npm install
npm run dev        # http://localhost:5173/alibi/
npm test           # tests Vitest (règles de cohérence, import/export, générateur)
npm run build      # vérification TypeScript + build de production dans dist/
npm run preview    # sert le build de production
```

## Déploiement

Le workflow `.github/workflows/deploy.yml` teste, construit puis publie `dist/` sur GitHub Pages à chaque push sur `main` (les pull requests sont seulement testées et construites). Dans **Settings → Pages**, la source doit être **GitHub Actions**.

Le chemin de base Vite est `/alibi/` (`vite.config.ts`), conforme à l’URL `https://jlrigau.github.io/alibi/`. À adapter si le dépôt est renommé. Le routage utilise le hash (`#/historique`…), ce qui évite les 404 au rechargement sur GitHub Pages.

## Données

- Tout est stocké dans le `localStorage` du navigateur (clé `ca-sarrange:data`), avec un schéma versionné (`version: 1`). Aucun serveur, aucun compte, aucune synchronisation entre appareils.
- Des données locales illisibles sont mises de côté (clé `ca-sarrange:corrupt:<date>`) et un dossier vierge est ouvert ; un échec de sauvegarde (stockage plein, navigation privée) est signalé.
- **Export / import JSON** depuis la page « Données ». Le fichier importé est entièrement validé avant toute modification, puis remplace les données après confirmation.
- Réinitialisation complète avec confirmation.

## Limites de la génération locale

- Aucun appel à une IA : les messages sont assemblés à partir de 47 modèles (absence, retard, sortie de groupe, remboursement × trois niveaux de mauvaise foi) et de formules d’ouverture / conclusion selon le ton.
- Le texte libre n’est pas interprété. Seuls des champs structurés sont exploités (personne, catégorie, date, créneau, nature de la manœuvre, ton, niveau) ; la seule lecture du texte de la situation est la détection d’un montant explicite (« 20 € »).
- Les indices de crédibilité sont des appréciations humoristiques, pas des probabilités.
- La cohérence repose sur des règles simples : destinataire + famille d’excuse identiques, lieux déclarés différents ou engagements différents sur des créneaux qui se chevauchent le même jour. Les lieux sont comparés après normalisation (casse, accents), sans analyse sémantique.

## Stack

React 19, TypeScript, Vite, Vitest. Une seule dépendance d’exécution en plus de React : la police Bricolage Grotesque, auto-hébergée via Fontsource.

Toutes les données d’exemple sont fictives.
