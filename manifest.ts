/**
 * Manifeste de l'extension RDV, lu par la config Astro du CMS
 * (`src/integrations/extensions.ts`) avant la construction : routes et
 * variables d'environnement. Chargé hors de Vite : aucun import `@cms/…`
 * ici, seulement des paquets npm et des fichiers de l'extension.
 */
import { readFileSync } from 'node:fs';
import { envField } from 'astro/config';
import { parse as parseYaml } from 'yaml';
import type { ExtensionManifest } from '../../src/integrations/extensions';

/** Même règle que `ADRESSE_RE` du CMS (`src/plugins/champs.ts`). */
const ADRESSE_RE = /^(\/[a-z0-9]+(-[a-z0-9]+)*)+$/;
const ADRESSE_DEFAUT = '/rendez-vous';

/** `adresse:` de `src/content/rdv.yaml` (validée en entier au build par `lib/config.ts`). */
function adresse(root: URL): string {
	let valeur: unknown;
	try {
		valeur = parseYaml(readFileSync(new URL('src/content/rdv.yaml', root), 'utf8'))?.adresse;
	} catch {
		return ADRESSE_DEFAUT; // fichier absent ou illisible : message clair de lib/config.ts au build
	}
	if (valeur === undefined || valeur === null) return ADRESSE_DEFAUT;
	if (typeof valeur !== 'string' || !ADRESSE_RE.test(valeur)) {
		throw new Error(`src/content/rdv.yaml invalide :\n  - adresse : adresse au format /rendez-vous (minuscules, chiffres, tirets), reçu « ${String(valeur)} »`);
	}
	return valeur;
}

export default {
	routes: (root) => [
		{ pattern: adresse(root), entrypoint: 'pages/rendez-vous.astro' },
		{ pattern: '/api/rdv/beneficiaires', entrypoint: 'api/beneficiaires.ts' },
		{ pattern: '/api/rdv/commune', entrypoint: 'api/commune.ts' },
		{ pattern: '/api/rdv/creneaux', entrypoint: 'api/creneaux.ts' },
		{ pattern: '/api/rdv/demarches', entrypoint: 'api/demarches.ts' },
		{ pattern: '/api/rdv/ics', entrypoint: 'api/ics.ts' },
		{ pattern: '/api/rdv/listes', entrypoint: 'api/listes.ts' },
		{ pattern: '/api/rdv/prendre', entrypoint: 'api/prendre.ts' },
		// Module « Rendez-vous » de l'Espace Admin (garde : `gardes` d'extension.json).
		{ pattern: '/api/admin/rdv', entrypoint: 'admin/api/index.ts' },
		{ pattern: '/api/admin/rdv/pdf', entrypoint: 'admin/api/pdf.ts' },
		{ pattern: '/api/admin/rdv/[id]', entrypoint: 'admin/api/[id].ts' },
	],
	env: {
		// Grist — document des RDV (GRIST_BASE_URL / GRIST_API_KEY partagés avec le CMS).
		// Clé d'API propre, facultative (sinon GRIST_API_KEY) : une clé limitée au
		// document des RDV n'expose pas celui de l'adhésion.
		GRIST_API_KEY_RDV: envField.string({ context: 'server', access: 'secret', optional: true }),
		GRIST_DOC_ID_RDV: envField.string({ context: 'server', access: 'secret', optional: true }),
		GRIST_TABLE_BENEFICIAIRES: envField.string({ context: 'server', access: 'secret', default: 'Beneficiaires' }),
		GRIST_TABLE_RDV: envField.string({ context: 'server', access: 'secret', default: 'RDV' }),
		GRIST_TABLE_DEMARCHES: envField.string({ context: 'server', access: 'secret', default: 'Demarches' }),
	},
	surveiller: ['rdv.yaml'],
} satisfies ExtensionManifest;
