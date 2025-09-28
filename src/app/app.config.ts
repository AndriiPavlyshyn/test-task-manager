import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import {
	provideAnimations
}                                                                             from '@angular/platform-browser/animations';
import { provideRouter }                                                      from '@angular/router';
import { NbEvaIconsModule }                                                   from '@nebular/eva-icons';
import { NbDialogModule, NbLayoutModule, NbThemeModule, NbToastrModule }      from '@nebular/theme';

import { routes } from './app.routes';


export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideAnimations(),
		importProvidersFrom(
			NbThemeModule.forRoot({ name: 'default' }),
			NbDialogModule.forRoot(),
			NbToastrModule.forRoot(),
			NbLayoutModule,
			NbEvaIconsModule
		),
	]
};
