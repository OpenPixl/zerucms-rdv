/**
 * Modules de l'Espace Admin apportés par l'extension RDV (registre
 * `src/components/admin/modules.ts` du CMS) : « Rendez-vous », pour le
 * bureau et les animateur·rice·s (routes gardées par `gardes` d'extension.json).
 */
import { defineAsyncComponent } from 'vue';
import type { AdminModule } from '@cms/components/admin/modules';

export default [
	{
		id: 'rendez-vous',
		label: 'Rendez-vous',
		icon: 'fa-calendar-check',
		groups: ['animateur'],
		component: defineAsyncComponent(() => import('./admin/RdvModule.vue')),
	},
] satisfies AdminModule[];
