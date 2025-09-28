import { FormControl }                    from '@angular/forms';
import { TaskStatusEnum, TaskStatusItem } from 'src/app/shared/types/enums/task-status.enum';
import { MaybeNull }                      from 'src/app/shared/types/interfaces/common';


export interface Task {
	id: number;
	name: string;
	description: string;
	creationDate: number;
	modificationDate?: MaybeNull<number>;
	status: TaskStatusEnum;
	assignee: number;
	statuses: TaskStatus[];
}

export interface FormTask {
	name: FormControl<MaybeNull<string>>;
	description: FormControl<MaybeNull<string>>;
	status: FormControl<MaybeNull<TaskStatusEnum>>;
	assignee: FormControl<MaybeNull<number>>;
}

export interface FormTaskValue {
	name: string;
	description: string;
	status: TaskStatusEnum;
	assignee: number;
}

export interface TaskStatus {
	item: TaskStatusItem,
	disabled: boolean;
}
