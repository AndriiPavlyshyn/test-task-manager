import { TaskStatusEnum, TaskStatusItem } from 'src/app/shared/types/enums/task-status.enum';


export function getStatuses(): TaskStatusItem[] {
	return Object.values(TaskStatusEnum).map((status) => {
		return {
			title: status.split('-').join(' '),
			status
		};
	})
}
