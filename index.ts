/**
 * Valeurs partagées dans l'extension RDV (page, encart, `site.ts`) : adresse
 * et nom de la page, ouverture de la prise de RDV en ligne.
 */
import type { FormToggle } from '@cms/config/site';
import { rdvConfig } from './lib/config';

/** Adresse de la page publique (`adresse:` de `rdv.yaml`). */
export const RDV_HREF = rdvConfig.adresse;

/** Nom de la page (menu, liens de l'Espace Admin…). */
export const RDV_NOM = rdvConfig.textes.nom;

/** Prise de RDV en ligne ouverte (`ouvert:` de `rdv.yaml`) ? Fermée : `<FormGate>` affiche le message. */
export function rdvToggle(): FormToggle {
	const { ouvert, textes } = rdvConfig;
	return { enabled: ouvert, closedTitle: textes.fermeTitre, closedMessage: textes.fermeMessage };
}
