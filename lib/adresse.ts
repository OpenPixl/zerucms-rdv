/**
 * Adresse de la page publique de l’extension RDV (`adresse:` de
 * `src/content/rdv.yaml`). Module pur : partagé par `manifest.ts` (config
 * Astro, qui lit le fichier sans `?raw`, avec sa propre copie), `config.ts` (validation au build)
 * et le catalogue (module « Plugins »).
 */
export { ADRESSE_RE } from '@cms/plugins/champs';

export const ADRESSE_DEFAUT = '/rendez-vous';
