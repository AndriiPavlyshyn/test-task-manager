import { AsyncPipe } from '@angular/common';
import {
	Component,
	inject
}                    from '@angular/core';
import {
	TasksListComponent
}                    from '@features/tasks-list/tasks-list.component';
import {
	NbAccordionModule,
	NbButtonModule,
	NbCardModule,
	NbIconModule,
	NbLayoutModule,
	NbListModule
}                    from '@nebular/theme';
import { map }       from 'rxjs';
import {
	UsersService
}                    from 'src/app/shared/services/users-service/users.service';


@Component({
  selector: 'app-users-list',
	imports: [
		NbLayoutModule,
		NbCardModule,
		NbListModule,
		AsyncPipe,
		NbButtonModule,
		NbIconModule,
		TasksListComponent,
		NbAccordionModule
	],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent {
	private readonly usersService = inject(UsersService);

	readonly users$ = this.usersService.model$.pipe(
		map(({users}) => {
			return users
		})
	);

	editUser(userId: number): void {
		this.usersService.editUser(userId);
	}

	deleteUser(userId: number): void {
		this.usersService.deleteUser(userId);
	}
}
