/**
 * Ce que l'extension RDV apporte aux pages du CMS (`src/lib/extensions-site.ts`) :
 * composants du module d'accueil et du bloc `rdv`, permanences dans le
 * planning de `/activites`, page publique (plan du site, liens de l'Espace
 * Admin). Lu seulement si l'extension est active.
 */
import type { ExtensionSite } from '@cms/lib/extensions-site';
import RdvAccueil from './sections/RdvAccueil.astro';
import RdvBloc from './sections/RdvBloc.astro';
import { permanences } from './lib/permanences';
import { RDV_HREF, RDV_NOM, rdvToggle } from './index';

export default {
	accueil: { rdv: RdvAccueil },
	blocs: { rdv: RdvBloc },
	agenda: () => permanences,
	pages: () => [{ title: RDV_NOM, href: RDV_HREF, closed: !rdvToggle().enabled }],
} satisfies ExtensionSite;
