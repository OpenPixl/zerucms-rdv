import type { APIRoute } from 'astro';
import { json } from '@cms/lib/http';
import { envoyerDetail, ErreurDetail } from '../lib/emails';

export const prerender = false;

/**
 * « M'envoyer le détail par e-mail » (écran de confirmation de `RdvForm.vue`) :
 * `{ jeton }` remis par `/api/rdv/prendre`, qui fixe le RDV et l'adresse —
 * la route ne peut écrire qu'à l'adresse saisie pour ce RDV, une seule fois.
 */
export const POST: APIRoute = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as { jeton?: unknown } | null;
	try {
		const a = await envoyerDetail(body?.jeton);
		return json({ a });
	} catch (err) {
		if (err instanceof ErreurDetail) return json({ error: err.message }, err.status);
		console.error('[api/rdv/email]', (err as Error).message);
		return json({ error: 'L’e-mail n’a pas pu être envoyé : notez votre rendez-vous ou faites une capture d’écran.' }, 503);
	}
};
