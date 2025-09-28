import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCrudDialogComponent } from './user-crud-dialog.component';

describe('UserCrudDialogComponent', () => {
  let component: UserCrudDialogComponent;
  let fixture: ComponentFixture<UserCrudDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCrudDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCrudDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
