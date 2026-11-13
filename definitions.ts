/**
 * Ce que l'extension RDV ajoute aux catalogues du CMS (lu aussi dans le
 * navigateur : données pures) — module d'accueil et bloc de page enrichie,
 * rendus par `RdvCtaSection.astro` (composants dans `site.ts`), famille
 * « rdv » du planning, libellés du journal. Masqués quand l'extension est
 * désactivée (`disponible()` du CMS). Champs vides = textes de `encart:`
 * (`src/content/rdv.yaml`).
 */
import type { ExtensionDefinitions } from '@cms/lib/extensions';

const VIDE = 'Vide = texte de l’encart réglé dans rdv.yaml.';

export default {
	accueil: {
		rdv: {
			label: 'Prise de rendez-vous',
			description: 'Permanences et bouton de prise de rendez-vous en ligne.',
			icon: 'fa-headset',
			fields: [
				{ name: 'surtitre', label: 'Surtitre', type: 'text', default: '', help: VIDE },
				{ name: 'titre', label: 'Titre', type: 'text', default: '', help: VIDE },
				{ name: 'texte', label: 'Texte', type: 'textarea', default: '', help: VIDE },
				{ name: 'bouton-texte', label: 'Bouton', type: 'text', default: '', help: VIDE },
			],
		},
	},
	blocs: {
		rdv: {
			label: 'Prise de rendez-vous',
			description: 'Encart des permanences avec bouton de prise de rendez-vous en ligne.',
			icon: 'fa-calendar-check',
			fields: [
				{ name: 'titre', label: 'Titre', type: 'text', help: VIDE },
				{ name: 'texte', label: 'Texte', type: 'textarea', help: VIDE },
			],
		},
	},
	/** Ancien nom de type encore accepté à la lecture du contenu (enregistré avant le plugin). */
	typesRenommes: { 'rdv-conseiller': 'rdv' },
	agenda: {
		// Permanences : libellé de légende propre à la structure (`legend` des séances).
		rdv: { label: 'Rendez-vous', icon: 'fa-calendar-check', dot: 'bg-violet-500', text: 'text-violet-600', hex: '#8b5cf6' },
	},
	journal: {
		'rdv.modification': { label: 'Rendez-vous modifié', icon: 'fa-calendar-check' },
		'rdv.suppression': { label: 'Rendez-vous supprimé', icon: 'fa-calendar-xmark' },
	},
} satisfies ExtensionDefinitions;
