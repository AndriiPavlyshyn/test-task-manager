import { AsyncPipe, TitleCasePipe }                                from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit }      from '@angular/core';
import { takeUntilDestroyed }                                      from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	NbButtonModule,
	NbCardModule,
	NbDialogRef,
	NbFormFieldModule,
	NbIconModule,
	NbInputModule,
	NbSelectModule,
	NbToastrService
}                                                                  from '@nebular/theme';
import { BehaviorSubject, combineLatest, map, of }                 from 'rxjs';
import {
	TasksService
}                                                                  from 'src/app/shared/services/tasks-service/tasks.service';
import {
	UsersService
}                                                                  from 'src/app/shared/services/users-service/users.service';
import { TaskStatusEnum }                                          from 'src/app/shared/types/enums/task-status.enum';
import { MaybeNull }                                               from 'src/app/shared/types/interfaces/common';
import { FormTask, Task }                                          from 'src/app/shared/types/interfaces/task';
import { User }                                                    from 'src/app/shared/types/interfaces/user';
import { getStatuses }                                             from 'src/app/shared/utils/get-statuses';


@Component({
  selector: 'app-task-crud-dialog',
	imports: [
		NbInputModule,
		ReactiveFormsModule,
		NbFormFieldModule,
		NbIconModule,
		NbCardModule,
		NbSelectModule,
		TitleCasePipe,
		NbButtonModule,
		AsyncPipe
	],
  templateUrl: './task-crud-dialog.component.html',
  styleUrl: './task-crud-dialog.component.scss',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskCrudDialogComponent implements OnInit {
	private readonly dialogRef = inject(NbDialogRef);
	private readonly toastService = inject(NbToastrService);
	private readonly isEditMode = new BehaviorSubject<boolean>(false);
	private readonly usersService = inject(UsersService);
	private readonly tasksService = inject(TasksService);
	private readonly showStatusSubject = new BehaviorSubject<boolean>(false);
	private readonly assigneeSubject = new BehaviorSubject<number>(0);

	private readonly tasksModel$ = this.tasksService.model$.pipe(
		map(({tasks}) => {
			return tasks;
		})
	);

	task: MaybeNull<Task> = null;

	readonly taskFormGroup = new FormGroup<FormTask>({
		name: new FormControl<string>('', [Validators.required]),
		status: new FormControl<TaskStatusEnum>(TaskStatusEnum.InQueue),
		assignee: new FormControl<number>(0),
		description: new FormControl<string>(''),
	});

	readonly isEditMode$ = this.isEditMode.asObservable();
	readonly windowTitle$ = this.isEditMode$.pipe(
		map((isEditMode) => {
			return isEditMode ? 'Edit task' : 'Create task'
		})
	);
	readonly usersModel$ = this.usersService.model$;
	readonly showStatusSelect$ = this.showStatusSubject.asObservable();

	readonly statuses$ = combineLatest([
		of(getStatuses()),
		this.assigneeSubject.asObservable(),
		this.tasksModel$,
		this.isEditMode$
	]).pipe(
		map(([taskStatuses, assigneeId, tasks, isEditMode]) => {
			return taskStatuses.map((item) => {
				if (assigneeId === 0) {
					return {
						...item,
						isDisabled: item.status !== TaskStatusEnum.InQueue
					};
				}

				if (item.status === TaskStatusEnum.InProgress) {
					const userHasInProgressTask = tasks[TaskStatusEnum.InProgress]?.some((task) => {
						if (isEditMode && this.task && task.id === this.task.id) {
							return false;
						}
						return task.assignee === assigneeId;
					});

					return {
						...item,
						isDisabled: userHasInProgressTask || false
					};
				}

				return {...item, isDisabled: false};
			});
		})
	);

	constructor() {
		this.taskFormGroup.controls.assignee.valueChanges.pipe(
			takeUntilDestroyed()
		).subscribe((assigneeId) => {
			if (assigneeId === 0) {
				this.taskFormGroup.controls.status.setValue(TaskStatusEnum.InQueue);
			}

			this.showStatusSubject.next(assigneeId !== 0);

			if (assigneeId != null) {
				this.assigneeSubject.next(assigneeId);
			}
		});
	}

	ngOnInit() {
		if(this.task) {
			this.isEditMode.next(true);
			const {creationDate, modificationDate, id, ...task} = this.task;
			this.taskFormGroup.patchValue(task);
			this.showStatusSubject.next(task.assignee !== 0);
			this.assigneeSubject.next(task.assignee);
		}
	}

	submit(): void {
		if(this.taskFormGroup.valid) {
			this.dialogRef.close(this.taskFormGroup.value);
		} else {
			this.toastService.danger('Please, fill the name field', 'Task creation form is invalid')
		}
	}

	getAvailableUsers(users: User[], assignableUsers: User[]): User[] {
		if (!this.task) {
			return assignableUsers;
		}

		if (this.task.status === TaskStatusEnum.InProgress) {
			const currentAssignee = users.find((user) => {
				return user.id === this.task!.assignee;
			});

			if (currentAssignee) {
				return [currentAssignee, ...assignableUsers];
			}

			return assignableUsers;
		}

		return users;
	}
}
