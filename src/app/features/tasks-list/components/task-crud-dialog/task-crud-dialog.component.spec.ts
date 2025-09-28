import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCrudDialogComponent } from './task-crud-dialog.component';

describe('TaskCrudDialogComponent', () => {
  let component: TaskCrudDialogComponent;
  let fixture: ComponentFixture<TaskCrudDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCrudDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCrudDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
