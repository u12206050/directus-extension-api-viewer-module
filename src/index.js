import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';

export default defineModule({
	id: 'api-viewer',
	name: 'Api Viewer',
	icon: 'api',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
});