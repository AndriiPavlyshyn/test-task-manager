import { Component, inject }                                             from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet }                    from '@angular/router';
import { NbActionsModule, NbButtonModule, NbIconModule, NbLayoutModule } from '@nebular/theme';
import {
	TasksService
}                                                                        from 'src/app/shared/services/tasks-service/tasks.service';
import {
	UsersService
}                                                                        from 'src/app/shared/services/users-service/users.service';


@Component({
  selector: 'app-root',
	imports: [NbLayoutModule, NbButtonModule, NbIconModule, RouterOutlet, NbActionsModule, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
	standalone: true,
})
export class AppComponent {
	private readonly tasksService = inject(TasksService);
	private readonly usersService = inject(UsersService);

	createService(): void {
		this.tasksService.createTask();
	}

	createUser(): void {
		this.usersService.createUser();
	}
}
