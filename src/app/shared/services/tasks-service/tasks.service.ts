import { inject, Injectable }                                                   from '@angular/core';
import {
	TaskCrudDialogComponent
}                                                                               from '@features/tasks-list/components/task-crud-dialog/task-crud-dialog.component';
import { NbDialogService }                                                      from '@nebular/theme';
import { BehaviorSubject, combineLatest, debounceTime, map, shareReplay, take } from 'rxjs';
import {
	TaskStatusEnum
}                                                                               from 'src/app/shared/types/enums/task-status.enum';
import {
	MaybeNull
}                                                                               from 'src/app/shared/types/interfaces/common';
import {
	FormTaskValue,
	Task
}                                                                               from 'src/app/shared/types/interfaces/task';
import {
	getStatuses
}                                                                               from 'src/app/shared/utils/get-statuses';


const TASKS_STORAGE_KEY: string = 'task-manager-tasks';

@Injectable({
	providedIn: 'root',
})
export class TasksService {
	private readonly dialogService = inject(NbDialogService);
	private readonly statuses = getStatuses();

	private readonly tasksMap = new BehaviorSubject<Map<TaskStatusEnum, Task[]>>(
		new Map([
			[TaskStatusEnum.InQueue, []],
			[TaskStatusEnum.InProgress, []],
			[TaskStatusEnum.Done, []]
		])
	);

	private readonly tasks$ = this.tasksMap.asObservable().pipe(
		map((tasksMap) => {
			return {
				[TaskStatusEnum.InQueue]: tasksMap.get(TaskStatusEnum.InQueue) || [],
				[TaskStatusEnum.InProgress]: tasksMap.get(TaskStatusEnum.InProgress) || [],
				[TaskStatusEnum.Done]: tasksMap.get(TaskStatusEnum.Done) || []
			}
		}),
		shareReplay(1)
	);

	private readonly usersRelatedTasks$ = this.tasks$.pipe(
		map((tasks) => {
			const allTasks = Object.values(tasks).flat(1);

			return allTasks.reduce((acc, task) => {
				const userId = task.assignee;

				if (userId === 0) {
					return acc;
				}

				if (!acc[userId]) {
					acc[userId] = {
						[TaskStatusEnum.InQueue]: [],
						[TaskStatusEnum.InProgress]: [],
						[TaskStatusEnum.Done]: []
					};
				}

				acc[userId][task.status].push(task);

				return acc;
			}, {} as Record<number, Record<TaskStatusEnum, Task[]>>);
		})
	);

	readonly model$ = combineLatest({
		tasks: this.tasks$,
		usersRelatedTasks: this.usersRelatedTasks$
	}).pipe(
		debounceTime(0)
	)

	constructor() {
		this.loadTasksFromStorage();

		this.tasks$.subscribe((tasks) => {
			const jsonString = JSON.stringify(tasks);
			localStorage.setItem(TASKS_STORAGE_KEY, jsonString);
		});
	}

	createTask(): void {
		const taskCrudWindowRef = this.dialogService.open(TaskCrudDialogComponent);
		const statuses = this.statuses.map((item) => {
			return {
				item,
				disabled: true
			}
		});

		taskCrudWindowRef.onClose.pipe(take(1)).subscribe((createdTask: FormTaskValue) => {
			if (createdTask) {
				const task: Task = {
					...createdTask,
					id: Date.now(),
					creationDate: Date.now(),
					assignee: 0,
					statuses
				};

				this.addTask(task);

				if (createdTask.assignee && createdTask.assignee !== 0) {
					this.assignUser(task, createdTask.assignee);
				}
			}
		});
	}

	changeStatus(taskId: number, newStatus: TaskStatusEnum): void {
		const task = this.findTask(taskId);

		if (!task) {
			return;
		}

		const statusItem = task.statuses.find((status) => {
			return status.item.status === newStatus;
		});

		if (statusItem && statusItem.disabled) {
			return;
		}

		if (
			newStatus === TaskStatusEnum.InProgress &&
			task.assignee !== 0 &&
			this.getUserInProgressTask(task.assignee)
		) {
			return;
		}

		const currentStatus = task.status;

		if (currentStatus === newStatus) {
			return;
		}

		const currentMap = this.tasksMap.getValue();
		const newMap = new Map(currentMap);

		newMap.set(currentStatus, currentMap.get(currentStatus)!.filter((taskItem) => {
			return taskItem.id !== taskId;
		}));

		const updatedTask = { ...task, status: newStatus, modificationDate: Date.now() };
		newMap.set(newStatus, [...(currentMap.get(newStatus) || []), updatedTask]);

		this.tasksMap.next(newMap);

		if (task.assignee !== 0) {
			this.updateUserTaskStatuses(task.assignee);
		}
	}

	editTask(taskId: number): void {
		const taskToEdit: MaybeNull<Task> = this.findTask(taskId);

		if (!taskToEdit) {
			return;
		}

		const taskCrudWindowRef = this.dialogService.open(TaskCrudDialogComponent);

		taskCrudWindowRef.componentRef.instance.task = taskToEdit!

		taskCrudWindowRef.onClose.pipe(take(1)).subscribe((editedTask: FormTaskValue) => {
			if (editedTask) {
				this.updateTask(taskId, editedTask);
			}
		});
	}

	assignUser(task: Task, userId: number): void {
		const oldUserId = task.assignee;

		this.updateTaskFields(task.id, { assignee: userId });

		if (userId === 0) {
			this.changeStatus(task.id, TaskStatusEnum.InQueue);
		}

		[oldUserId, userId]
			.filter((id) => {
				return id !== 0;
			})
			.forEach((id) => {
				return this.updateUserTaskStatuses(id);
			});
	}

	deleteTask(taskId: number): void {
		const task = this.findTask(taskId);

		if (!task) {
			return;
		}

		const oldUserId = task.assignee;
		const currentMap = this.tasksMap.getValue();
		const newMap = new Map(currentMap);
		const updatedTasks = currentMap.get(task.status)!.filter((taskItem) => {
			return taskItem.id !== taskId;
		});

		newMap.set(task.status, updatedTasks);
		this.tasksMap.next(newMap);

		if (oldUserId !== 0) {
			this.updateUserTaskStatuses(oldUserId);
		}
	}

	getUserInProgressTask(userId: number): Task | null {
		const tasks = this.getUserTasksByStatus(userId, TaskStatusEnum.InProgress);

		return tasks[0] || null;
	}

	getUserTasksInQueue(userId: number): Task[] {
		return this.getUserTasksByStatus(userId, TaskStatusEnum.InQueue);
	}

	updateTaskFields(taskId: number, updatedData: Partial<FormTaskValue>): void {
		const task = this.findTask(taskId);

		if (!task) {
			return;
		}

		const currentMap = this.tasksMap.getValue();
		const newMap = new Map(currentMap);
		const statusTasks = newMap.get(task.status)!;
		const taskIndex = statusTasks.findIndex((t) => t.id === taskId);

		if (taskIndex !== -1) {
			const updatedTasks = [...statusTasks];

			updatedTasks[taskIndex] = {
				...updatedTasks[taskIndex],
				...updatedData,
				modificationDate: Date.now()
			};

			newMap.set(task.status, updatedTasks);
			this.tasksMap.next(newMap);
		}
	}

	private getUserTasksByStatus(userId: number, status: TaskStatusEnum): Task[] {
		const currentMap = this.tasksMap.getValue();
		const tasks = currentMap.get(status) || [];

		return tasks.filter((task) => {
			return task.assignee === userId;
		});
	}

	private updateUserTaskStatuses(userId: number): void {
		const hasInProgressTask = !!this.getUserInProgressTask(userId);
		const userTasks = [...this.getUserTasksInQueue(userId), ...this.getUserTasksInDone(userId)];

		userTasks.forEach((task) => {
			task.statuses.forEach((status) => {
				status.disabled = hasInProgressTask && status.item.status === TaskStatusEnum.InProgress;
			});

			this.updateTaskFields(task.id, task);
		});
	}

	private getUserTasksInDone(userId: number): Task[] {
		return this.getUserTasksByStatus(userId, TaskStatusEnum.Done);
	}

	private loadTasksFromStorage(): void {
		const storedData = localStorage.getItem(TASKS_STORAGE_KEY);

		if (storedData) {
			try {
				const parsedTasks = JSON.parse(storedData);

				const newMap = new Map([
					[TaskStatusEnum.InQueue, parsedTasks[TaskStatusEnum.InQueue] || []],
					[TaskStatusEnum.InProgress, parsedTasks[TaskStatusEnum.InProgress] || []],
					[TaskStatusEnum.Done, parsedTasks[TaskStatusEnum.Done] || []]
				]);

				this.tasksMap.next(newMap);
			} catch (error) {
				console.error('Error loading tasks:', error);
			}
		}
	}

	private addTask(task: Task): void {
		const currentMap = this.tasksMap.getValue();
		const newMap = new Map(currentMap);
		const currentTasks = newMap.get(task.status) || [];

		newMap.set(task.status, [...currentTasks, task]);

		this.tasksMap.next(newMap);
	}

	private updateTask(taskId: number, updatedData: FormTaskValue): void {
		const currentTask = this.findTask(taskId);

		if (!currentTask) {
			return;
		}

		const assigneeChanged = updatedData.assignee !== currentTask.assignee;
		const statusChanged = updatedData.status !== currentTask.status;

		this.updateTaskFields(taskId, {
			name: updatedData.name,
			description: updatedData.description
		});

		if (assigneeChanged) {
			this.updateTaskFields(taskId, { assignee: updatedData.assignee });

			if (updatedData.assignee === 0) {
				this.changeStatus(taskId, TaskStatusEnum.InQueue);
			} else {
				const oldUserId = currentTask.assignee;

				[oldUserId, updatedData.assignee]
					.filter((id) => {
						return id !== 0;
					})
					.forEach((id) => {
						return this.updateUserTaskStatuses(id);
					});
			}
		}

		if (statusChanged && !assigneeChanged) {
			this.changeStatus(taskId, updatedData.status);
		}

		if (statusChanged && assigneeChanged && updatedData.assignee !== 0) {
			this.changeStatus(taskId, updatedData.status);
		}
	}

	private findTask(taskId: number): MaybeNull<Task> {
		const currentMap = this.tasksMap.getValue();

		for (const tasks of currentMap.values()) {
			const task = tasks.find((task) => {
				return task.id === taskId;
			});

			if (task) {
				return task;
			}
		}

		return null;
	}
}
