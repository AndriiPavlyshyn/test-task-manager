export enum TaskStatusEnum {
	InQueue = 'in-queue',
	InProgress = 'in-progress',
	Done = 'done'
}

export interface TaskStatusItem {
	title: string;
	status: TaskStatusEnum;
}
