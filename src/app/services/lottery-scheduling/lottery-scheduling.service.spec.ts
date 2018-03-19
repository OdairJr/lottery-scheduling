import { TestBed, inject } from '@angular/core/testing';

import { LotterySchedulingService } from './lottery-scheduling.service';

describe('LotterySchedulingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LotterySchedulingService]
    });
  });

  it('should be created', inject([LotterySchedulingService], (service: LotterySchedulingService) => {
    expect(service).toBeTruthy();
  }));
});
