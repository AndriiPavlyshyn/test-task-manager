import { AsyncPipe }                                               from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit }      from '@angular/core';
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
import { BehaviorSubject, map }                                    from 'rxjs';
import { MaybeNull }                                               from 'src/app/shared/types/interfaces/common';
import { FormUser, User }                                          from 'src/app/shared/types/interfaces/user';


@Component({
	selector: 'app-task-crud-dialog',
	imports: [
		NbInputModule,
		ReactiveFormsModule,
		NbFormFieldModule,
		NbIconModule,
		NbCardModule,
		NbSelectModule,
		NbButtonModule,
		AsyncPipe,
	],
	templateUrl: './user-crud-dialog.component.html',
	styleUrl: './user-crud-dialog.component.scss',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCrudDialogComponent implements OnInit {
	private readonly dialogRef = inject(NbDialogRef);
	private readonly toastService = inject(NbToastrService);
	private readonly isEditMode = new BehaviorSubject<boolean>(false);

	readonly userFormGroup = new FormGroup<FormUser>({
		name: new FormControl<string>('', [Validators.required])
	});

	isEditMode$ = this.isEditMode.asObservable();

	windowTitle$ = this.isEditMode$.pipe(
		map((isEditMode) => {
			return isEditMode ? 'Edit user' : 'Create user'
		})
	);

	user: MaybeNull<User> = null;

	ngOnInit() {
		if(this.user) {
			this.isEditMode.next(true);
			const { name } = this.user;

			this.userFormGroup.patchValue({ name });
		}
	}

	submit(): void {
		if(this.userFormGroup.valid) {
			this.dialogRef.close(this.userFormGroup.value);
		} else {
			this.toastService.danger('Please, fill the name field', 'User creation form is invalid')
		}
	}
}
