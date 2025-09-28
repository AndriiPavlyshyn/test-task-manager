import { Routes } from '@angular/router';


export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'tasks'
	},
	{
		path: 'tasks',
		loadComponent: () =>
			import('./features/tasks-list/tasks-list.component').then((m) => { return m.TasksListComponent; }),
	},
	{
		path: 'users',
		loadComponent: () =>
			import('./features/users-list/users-list.component').then((m) => { return m.UsersListComponent; }),
	},
	{
		path: '**',
		redirectTo: 'tasks'
	},
];
