import ModuleComponent from './module.vue';

export default {
	id: 'api-viewer',
	name: 'Api Viewer',
	icon: 'api',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
};