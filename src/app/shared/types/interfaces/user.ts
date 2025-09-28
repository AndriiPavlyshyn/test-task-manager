import { FormControl } from '@angular/forms';
import { MaybeNull }   from 'src/app/shared/types/interfaces/common';
import { Task }        from './task';


export interface User {
	name: string;
	id: number;
	assignedTasks?: Task[];
}

export interface FormUser {
	name: FormControl<MaybeNull<string>>;
}

export interface FormUserValue {
	name: string;
}
