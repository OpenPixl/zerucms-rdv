/**
 * E-mails de la prise de RDV, envoyés par le compte e-mail du site
 * (`envoyerEmail()` du CMS : mise en forme, logo et pied de page communs) :
 *  - **notification** à `notification.email` de `rdv.yaml` (ex. la
 *    conseillère) à chaque RDV pris en ligne, sans bloquer la réservation ;
 *  - **détail du RDV** à la personne, seulement si elle le demande sur
 *    l'écran de confirmation (bouton de `RdvForm.vue`) : `/api/rdv/prendre`
 *    remet un jeton signé (`jetonDetail()`) qui fixe le RDV et l'adresse,
 *    `/api/rdv/email` l'utilise une fois (`envoyerDetail()`).
 * Code serveur uniquement.
 */
import { association } from '@cms/lib/association';
import { emailConfigure, envoyerEmail } from '@cms/lib/email';
import { adresseSite } from '@cms/lib/email-modele';
import { consommerJeton, lireJeton, signerJeton } from '@cms/lib/jeton';
import { rdvConfig, remplir } from './config';
import { lieuPourDate } from './creneaux';
import { demarchesParIds } from './demarches';
import { documentsDemarches } from './ics';
import type { Demarche, PriseRdvPayload } from './types';

const OBJET_JETON = 'rdv-email';
/** Le bouton reste utilisable une heure après la réservation. */
const DUREE_JETON = 60 * 60;

/** Ce que fixe le jeton remis au navigateur (personne ne peut le changer). */
interface DetailDemande {
	a: string;
	date: string;
	heure: string;
	demarches: number[];
}

const capitaliser = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Mardi 3 décembre 2026 ». */
function dateLongue(dateIso: string): string {
	return capitaliser(
		new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
			new Date(`${dateIso}T12:00:00Z`),
		),
	);
}

/** « 9 h 30 – 10 h » (durée `creneaux.duree`). */
function horaires(heure: string): string {
	const [h, m] = heure.split(':').map(Number);
	const libelle = (min: number) => {
		const hh = Math.floor(min / 60);
		const mm = min % 60;
		return mm ? `${hh} h ${String(mm).padStart(2, '0')}` : `${hh} h`;
	};
	return `${libelle(h * 60 + m)} – ${libelle(h * 60 + m + rdvConfig.creneaux.duree)}`;
}

/** Lignes communes : date, heure, lieu, démarche(s). */
function lignesRdv(date: string, heure: string, demarches: Pick<Demarche, 'nom'>[]): string[] {
	const lieu = lieuPourDate(date);
	return [
		`Date : ${dateLongue(date)}`,
		`Heure : ${horaires(heure)}`,
		...(lieu ? [`Lieu : ${lieu}`] : []),
		...(demarches.length ? [`Démarche : ${demarches.map((d) => d.nom).join(', ')}`] : []),
	];
}

/** Prévient `notification.email` d'un nouveau RDV ; jamais d'erreur (la réservation est faite). */
export async function notifierNouveauRdv(payload: PriseRdvPayload, demarches: Demarche[]): Promise<void> {
	const a = rdvConfig.notification.email;
	if (!a || !(await emailConfigure())) return;
	const personne = `${payload.prenom} ${payload.nom}`.trim();
	const contact = [
		...(payload.email ? [`E-mail : ${payload.email}`] : []),
		...(payload.telephone ? [`Téléphone : ${payload.telephone}`] : []),
		...(payload.beneficiaireId ? ['Personne déjà venue (fiche existante)'] : []),
	];
	const commentaire = payload.commentaire?.trim();
	try {
		await envoyerEmail({
			a,
			sujet: `Nouveau rendez-vous : ${personne}, ${dateLongue(payload.date)} à ${payload.heure.replace(':', ' h ')}`,
			titre: 'Nouveau rendez-vous pris en ligne',
			texte: [
				lignesRdv(payload.date, payload.heure, demarches).join('\n'),
				[`Personne : ${personne}`, ...contact].join('\n'),
				...(commentaire ? [`Commentaire :\n${commentaire}`] : []),
				'Le rendez-vous est enregistré dans le document Grist et dans le module « Rendez-vous » de l’Espace Admin.',
			].join('\n\n'),
			raison: 'Vous recevez cet e-mail car votre adresse est indiquée pour être prévenue des rendez-vous pris sur le site.',
			...(payload.email ? { repondreA: payload.email } : {}),
		});
	} catch (err) {
		console.error('[rdv] notification non envoyée :', (err as Error).message);
	}
}

/** Jeton du bouton « M'envoyer le détail » ; `null` sans e-mail saisi ni compte e-mail du site. */
export async function jetonDetail(payload: PriseRdvPayload): Promise<string | null> {
	const a = payload.email?.trim();
	if (!a || !(await emailConfigure())) return null;
	return signerJeton<DetailDemande>(OBJET_JETON, { a, date: payload.date, heure: payload.heure, demarches: payload.demarcheIds }, DUREE_JETON);
}

/** Envoie le détail du RDV décrit par le jeton ; renvoie l'adresse, ou lève une erreur lisible. */
export async function envoyerDetail(jeton: unknown): Promise<string> {
	const d = lireJeton<DetailDemande>(OBJET_JETON, jeton, { unique: true });
	if (!d) throw new ErreurDetail('Ce lien n’est plus valable (déjà utilisé ou trop ancien).', 410);
	const demarches = await demarchesParIds(d.demarches).catch(() => [] as Demarche[]);
	const documents = documentsDemarches(demarches);
	const intervenant = rdvConfig.textes.intervenant;
	await envoyerEmail({
		a: d.a,
		sujet: `Votre rendez-vous du ${dateLongue(d.date).toLowerCase()} – ${association.name}`,
		titre: 'Votre rendez-vous est confirmé',
		texte: [
			`Bonjour,`,
			remplir('Voici le rappel de votre rendez-vous avec {intervenant}.', { intervenant }),
			lignesRdv(d.date, d.heure, demarches).join('\n'),
			...(documents.length ? [`Pièces à apporter :\n${documents.map((doc) => `- ${doc}`).join('\n')}`] : []),
			`En cas d’empêchement, merci de nous prévenir : ${association.email} – ${association.phone}.`,
		].join('\n\n'),
		bouton: { texte: 'Voir le site', lien: adresseSite() },
		raison: 'Vous recevez cet e-mail car vous avez demandé le détail de votre rendez-vous lors de sa prise en ligne.',
	});
	consommerJeton(jeton as string);
	return d.a;
}

export class ErreurDetail extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}
