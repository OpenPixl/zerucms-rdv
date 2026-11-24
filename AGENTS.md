# Extension « rdv » (prise de RDV) — notes de développement

Imports du CMS par l'alias `@cms/…` (= `src/…` du site), sauf dans
`manifest.ts` (chargé par la config Astro, hors de Vite). Travailler sur une
copie dans `extensions/rdv/` d'un site de développement, puis reporter ici ;
publier : version dans `extension.json`, tag `vX.Y.Z` → Release avec
l'archive (`archive.sh`, `.github/workflows/release.yml`).
`depot` d'`extension.json` (`OpenPixl/zerucms-rdv`) : le module « Extensions »
du CMS (≥ 0.5.29) détecte la dernière Release et propose « Mettre à jour »
(archive `.zip` jointe obligatoire, `cms` lu dans `extension.json` au tag).

Extension **générique** du CMS ZeruCMS (installée dans `extensions/rdv/` d'un site ; contrat : `docs/extensions.md` du CMS ; doc : [README.md](README.md),
schéma Grist attendu compris) ; **aucune référence à un dispositif dans
l'extension** : tout le propre à l'asso est dans `src/content/rdv.yaml`
(`lib/config.ts` : `rdvConfig`, zod, défauts génériques, modèle commenté
`rdv.exemple.yaml` ; extension active sans ce fichier = build en échec) —
`adresse` de la page (lue aussi par `plugin.ts` via fs pour `injectRoute`,
format `lib/adresse.ts`), `ouvert` (+ `textes.fermeTitre/fermeMessage`,
`rdvToggle()` → `<FormGate toggle>` ; plus de `site.forms` pour le RDV),
`textes` (`nom`, `titre`, `description`, `intervenant`, `dejaVenu`,
`urgence`, `consentement` ; `{duree}`/`{heure}`/`{intervenant}` remplis par
`remplir()`), `encart` (textes par défaut de `RdvCtaSection`, `logo`
facultatif dans `src/content/images/`), `planning` (titre + `legend`),
`creneaux` (`duree` 15–60, `semaines`, `urgence`), `profil` (questions :
`genre`, `commune`, `zone`, `trancheAge`, `statut` ; sans question de
profil = étape 4 absente), `civilite`, `icones` (thématiques),
`permanences`, `zones`. L'îlot reçoit ces réglages en props
(`rdvFormProps()`, type `RdvFormReglages`), jamais le YAML. **Listes de
choix lues dans le document Grist** (`lib/listes.ts`, `listChoices()`,
cache 5 min, `GET /api/rdv/listes`) : thématiques (`Demarches.Thematique`,
ordre de la colonne), genre, tranche d'âge, statut (`Beneficiaires`) ;
revérifiées par `/api/rdv/prendre` (champs hors `profil` ignorés). Chemins
ci-dessous relatifs à l'extension. Page `pages/rendez-vous.astro`, formulaire
`formulaire/RdvForm.vue` (`client:load`). Parcours en 5 étapes (même motif
que `AdhesionForm.vue`) : démarche → créneau → vous (premier RDV ou déjà
venu) → profil facultatif → consentement/envoi. Module d'accueil et bloc
de type `rdv` (`definitions.ts` ; ancien nom `rdv-conseiller`
accepté à la lecture : `typesRenommes`, composants dans `site.ts`), champs vides = `encart:`.

- `lib/demarches.ts` — catalogue `Demarches` (Nom, Thematique, Icone,
  Description, Documents) tenu **dans Grist** par l'asso. `Documents`
  (une ligne par pièce) rappelé sur l'écran de confirmation seulement.
  Étape 1 en deux temps : thématique (celles qui ont une démarche, ordre
  Grist, icône `icones:`, aussi en repli d'une `Icone` vide) puis démarche.
- `lib/creneaux.ts` — créneaux de `creneaux.duree` sur `creneaux.semaines`.
  `creneaux.urgence: true` : premier créneau de chaque permanence =
  **urgence** (`urgence`, `estCreneauUrgence()`), mention `textes.urgence`
  encadrée au-dessus des horaires, réservable (`reservable`) seulement avec
  une session de l'Espace Admin (`locals.user`, revérifié par
  `/api/rdv/prendre`, 403 sinon).
- Étape 3 « Vous » : **« C'est mon premier rendez-vous »** (civilité si
  `genre` demandé — choix Grist libellés par `civilite:` —, nom,
  coordonnées) ou **`textes.dejaVenu`** (un seul champ « Prénom et nom »,
  fiche réutilisée telle quelle, étape 4 sautée — dernière étape « 4 »).
- Zones (`zones:` de `rdv.yaml`, `label` = choix Grist `Zone_geographique`) :
  `lib/zones.ts` côté serveur, prop `zones` de `RdvForm.vue`,
  `deduireZone()` (`geographie.ts`), revalidées par `estZoneConnue()`.
- `lib/beneficiaires.ts` — premier RDV : rapproche par **email OU
  téléphone** (un des deux obligatoire, `validation.ts`) ou crée. Déjà
  venu : `rechercherParNomComplet()` = « prénom nom » ou « nom prénom »
  **exacts** (hors accents/casse/tirets, jamais partiel, un mot seul ne
  suffit pas), ne renvoie que prénom/nom de la fiche et un indice masqué ;
  `beneficiaireCorrespond()` revérifie à l'envoi (un id seul ne suffit pas).
- `lib/reservation.ts` — revérifie la disponibilité puis écrit la ligne `RDV`.
- Routes (`api/`, déclarées dans `manifest.ts`) : `GET /api/rdv/creneaux`,
  `GET /api/rdv/demarches`, `GET /api/rdv/listes`, `GET /api/rdv/commune`,
  `GET /api/rdv/beneficiaires` (`?q=<prénom nom>`), `POST /api/rdv/prendre`,
  `GET /api/rdv/ics` (`?date=&heure=&demarche=<id>`, titre `textes.nom`,
  lieu et documents recalculés côté serveur).
- `lib/emails.ts` — e-mails (CMS ≥ 0.5.28 : `@cms/lib/email`, `@cms/lib/jeton`) :
  notification à `notification.email` de `rdv.yaml` (réglage « Adresse à
  prévenir », type `email`) à chaque RDV, sans bloquer la réponse ; détail du
  RDV à la personne **sur demande** (bouton de l'écran de confirmation) :
  `/api/rdv/prendre` renvoie `jetonEmail` (jeton signé 1 h : adresse, date,
  heure, démarches) si un e-mail est saisi et le compte du site configuré,
  `POST /api/rdv/email { jeton }` l'utilise une fois (410 sinon).
- `lib/ics.ts` — événement d'agenda partagé par la route `.ics` et le QR
  code (heure Europe/Paris convertie en UTC, durée `creneaux.duree`).
- **Module « Rendez-vous »** (`admin/`, bureau + `animateur`, déclaré par
  `admin.ts` → masqué si l'extension est inactive) : `RdvModule.vue` (une semaine à la fois,
  par jour, recherche texte + statut sur toutes les semaines) ; clic → `RdvEditeur.vue`, **second
  panneau fixé à gauche du panneau des modules** (`sm:right-[36rem]`, dans le
  DOM du panneau pour son piège de focus, Échap capturé sur `window`) :
  bénéficiaire et son commentaire en lecture seule, créneau (créneaux libres
  seulement + l'actuel) / démarche / statut, puis **compte rendu** :
  colonnes facultatives de `RDV` listées dans `admin/suivi.ts` (`SUIVI` :
  Lieu_reel, Materiel_utilise, Sous_thematique_demarche, Niveau_autonomie,
  Oriente_autre_structure, Notes_accompagnement, Evaluation_satisfaction,
  Suggestions_beneficiaire ; proposées si présentes avec le bon type, choix
  lus dans Grist via `listColumns()`, ChoiceList écrites `['L', …]` ou
  `null` ; `affichage: 'smileys'` = satisfaction en visages, `visage()` de
  `admin/client.ts`, de la meilleure réponse à la pire). Créneau pris = tout RDV non « Annulé »
  (`STATUTS_OCCUPANTS` de `lib/grist.ts`, page publique comme éditeur).
  Serveur `admin/gestion.ts` (`listerRdv()`, `modifierRdv()` :
  `creneauEstLibre(date, heure, sauf)`, lieu et thématiques recalculés),
  routes `admin/api/` injectées par `manifest.ts` (`/api/admin/rdv`,
  `/api/admin/rdv/[id]`, garde `animateur` : `gardes` d'`extension.json`), écrit dans Grist
  sans reconstruction, `logEvent('rdv.modification')`. Bouton « Supprimer »
  de l'éditeur → `DELETE /api/admin/rdv/[id]` (`supprimerRdv()`,
  `deleteRecord()` de `lib/grist.ts`), motif obligatoire
  (`MOTIFS_SUPPRESSION`, « Autre » + précision), `logEvent('rdv.suppression')`
  avec le RDV supprimé et le motif. Éditeur en 2 colonnes par requête de
  conteneur (`@container` / `@3xl:grid-cols-2`). Liste d'une semaine à la
  fois (chevrons ‹ ›, « Cette semaine » ; recherche texte — mots cumulés, dates jj/mm[/aa[aa]] — et/ou statut = toutes les semaines,
  regroupées, clic → la semaine), bouton « PDF » de la semaine affichée → `GET /api/admin/rdv/pdf?semaine=`
  (`admin/api/pdf.ts`, HTML de `admin/semaine-pdf.ts` : logo en data URI
  `?inline`, A4 paysage, créneaux de `horairesDuJour()` de `lib/creneaux.ts`
  + RDV non annulés : démarche, nom et message, sans coordonnées (RGPD) ; statut pour une
  semaine terminée seulement) converti par `htmlToPdf()` de
  `src/lib/gotenberg.ts` (Gotenberg, `isGotenbergEnabled()`, partagé avec le bulletin d'adhésion).
  Zones qui défilent des panneaux d'admin : utilitaire `scrollbar-fin`
  (`src/styles/global.css`, ascenseur fin). `request()` de
  `src/components/admin/client.ts` (`@cms/components/admin/client`) exporté pour les modules d'extension.

Pistes de suite non traitées (à reprendre si redemandé) :
1. Collecte de l'évaluation par le bénéficiaire lui-même (aujourd'hui
   saisie par l'équipe dans le compte rendu).
2. Notification email/SMS de confirmation ou de rappel de RDV.
3. ~~Vue admin~~ faite : module « Rendez-vous » (voir ci-dessus).
4. Suppression de `Table1` (table Grist vide créée par défaut, sans impact).

