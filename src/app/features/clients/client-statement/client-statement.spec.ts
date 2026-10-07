import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientStatement } from './client-statement';

describe('ClientStatement', () => {
  let component: ClientStatement;
  let fixture: ComponentFixture<ClientStatement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientStatement],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientStatement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
