import { inject, Injectable }                                      from '@angular/core';
import {
	UserCrudDialogComponent
}                                                                  from '@features/users-list/components/user-crud-dialog/user-crud-dialog.component';
import { NbDialogService }                                         from '@nebular/theme';
import { BehaviorSubject, combineLatest, debounceTime, map, take } from 'rxjs';
import {
	TasksService
}                                                                  from 'src/app/shared/services/tasks-service/tasks.service';
import { TaskStatusEnum }                                          from 'src/app/shared/types/enums/task-status.enum';
import { MaybeNull }                                               from 'src/app/shared/types/interfaces/common';
import { FormUserValue, User }                                     from 'src/app/shared/types/interfaces/user';


const USERS_STORAGE_KEY: string = 'task-manager-users';


@Injectable({
  providedIn: 'root'
})
export class UsersService {
	private readonly dialogService = inject(NbDialogService);
	private readonly tasksService = inject(TasksService);

	private readonly users = new BehaviorSubject<User[]>([]);
	private readonly users$ = this.users.asObservable();

	private readonly assignableUsers$ = combineLatest({
		tasks: this.tasksService.model$.pipe(
			map(({tasks}) => {
				return tasks;
			})
		),
		users: this.users$
	}).pipe(
		map(({ tasks, users }) => {
			const assignableUserIds = tasks[TaskStatusEnum.InProgress].map((task) => {
				return task.assignee;
			})

			return users.filter((user) => {
				return !assignableUserIds.includes(user.id);
			});
		})
	);

	readonly model$ = combineLatest({
		users: this.users$,
		assignableUsers: this.assignableUsers$
	}).pipe(
		debounceTime(0)
	)

  constructor() {
		this.loadUsersFromStorage();

	  this.users$.subscribe((users) => {
		  const jsonString = JSON.stringify(users);
		  localStorage.setItem(USERS_STORAGE_KEY, jsonString);
	  });
  }

	createUser(): void {
		const userCrudWindowRef = this.dialogService.open(UserCrudDialogComponent);

		userCrudWindowRef.onClose.pipe(take(1)).subscribe((createdUser: FormUserValue) => {
			if (createdUser) {
				const user: User = {
					...createdUser,
					id: Date.now(),
				};

				this.addUser(user);
			}
		});
	}

	editUser(userId: number): void {
		let usersToEdit: MaybeNull<User> = this.users.getValue().find((user) => {
			return user.id === userId
		})!;

		const userCrudWindowRef = this.dialogService.open(UserCrudDialogComponent);
		userCrudWindowRef.componentRef.instance.user = usersToEdit;

		userCrudWindowRef.onClose.pipe(take(1)).subscribe((editedUser: FormUserValue) => {
			if (editedUser) {
				this.updateUser(userId, editedUser);
			}
		});
	}

	deleteUser(userId: number): void {
		this.handleUserTasksBeforeDeletion(userId);

		const currentUsers = this.users.getValue();
		const filteredUsers = currentUsers.filter((user) => {
			return user.id !== userId;
		});

		this.users.next(filteredUsers);
	}

	private handleUserTasksBeforeDeletion(userId: number): void {
		const tasksModel = this.tasksService.model$.pipe(take(1));

		tasksModel.subscribe(({tasks}) => {
			const allTasks = Object.values(tasks).flat();
			const userTasks = allTasks.filter((task) => {
				return task.assignee === userId;
			});

			userTasks.forEach((task) => {
				if (task.status === TaskStatusEnum.InProgress) {
					this.tasksService.assignUser(task, 0);
				} else {
					this.tasksService.updateTaskFields(task.id, { assignee: 0 });
				}
			});
		});
	}

	private updateUser(userId: number, updatedData: FormUserValue): void {
		const currentUsers = this.users.getValue();

		const updatedUsers = currentUsers.map((user) => {
			if (user.id === userId) {
				return {
					...user,
					...updatedData
				};
			}

			return user;
		});

		this.users.next(updatedUsers);
	}

	private addUser(user: User) {
		this.users.next([...this.users.getValue(), user]);
	}

	private loadUsersFromStorage(): void {
		const storedData = localStorage.getItem(USERS_STORAGE_KEY);

		if (storedData) {
			try {
				const parsedUsers = JSON.parse(storedData);

				this.users.next(parsedUsers);
			} catch (error) {
				console.error('Error loading users:', error);
			}
		}
	}
}
