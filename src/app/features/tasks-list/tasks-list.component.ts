import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input
}                                             from '@angular/core';
import {
	FormsModule,
	ReactiveFormsModule
}                                             from '@angular/forms';
import {
	NbButtonModule,
	NbCardModule,
	NbIconModule,
	NbLayoutModule,
	NbOptionModule,
	NbSelectModule
}                                             from '@nebular/theme';
import { combineLatest, debounceTime, map }   from 'rxjs';
import {
	TasksService
}                                             from 'src/app/shared/services/tasks-service/tasks.service';
import {
	UsersService
}                                             from 'src/app/shared/services/users-service/users.service';
import {
	TaskStatusEnum
}                                             from 'src/app/shared/types/enums/task-status.enum';
import {
	Task
}                                             from 'src/app/shared/types/interfaces/task';
import {
	User
}                                             from 'src/app/shared/types/interfaces/user';
import {
	getStatuses
}                                             from 'src/app/shared/utils/get-statuses';


@Component({
  selector: 'app-tasks-list',
	imports: [
		NbLayoutModule,
		TitleCasePipe,
		NbCardModule,
		AsyncPipe,
		DatePipe,
		NbOptionModule,
		NbSelectModule,
		ReactiveFormsModule,
		NbIconModule,
		NbButtonModule,
		FormsModule
	],
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.scss',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksListComponent {
	private readonly tasksService = inject(TasksService);
	private readonly usersService = inject(UsersService);

	readonly userId = input<number>();

	readonly model$ = combineLatest({
		tasks: this.tasksService.model$.pipe(
			map(({tasks}) => {
				const userId = this.userId();

				if (userId) {
					return Object.entries(tasks).reduce((filteredTasks, [status, taskList]) => {
						filteredTasks[status as TaskStatusEnum] = taskList.filter((task) => {
							return task.assignee === userId;
						});

						return filteredTasks;
					}, {} as Record<TaskStatusEnum, Task[]>);
				}

				return tasks;
			})
		),
		usersModel: this.usersService.model$
	}).pipe(
		debounceTime(0)
	)

	readonly statuses = getStatuses();

	changeStatus(task: Task, newStatus: TaskStatusEnum): void {
		this.tasksService.changeStatus(task.id, newStatus);
	}

	getAvailableUsers(task: Task, allUsers: User[] | undefined, assignableUsers: User[] | undefined): User[] {
		if (!allUsers || !assignableUsers) {
			return [];
		}

		if (task.status === TaskStatusEnum.InProgress) {
			const currentAssignee = allUsers.find((user) => {
				return user.id === task.assignee;
			});

			if (currentAssignee) {
				return [currentAssignee, ...assignableUsers];
			}

			return assignableUsers;
		}

		return allUsers;
	}

	editTask(task: Task): void {
		this.tasksService.editTask(task.id);
	}

	deleteTask(task: Task): void {
		this.tasksService.deleteTask(task.id);
	}

	assignUser(task: Task, userId: number) {
		this.tasksService.assignUser(task, userId);
	}
}
