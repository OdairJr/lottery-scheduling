import { Guid } from 'guid-typescript';

export class Proccess {
  name: string;
  time: number;
  timeExecuted = 0;
  tickets: Array<Guid> = new Array<Guid>();
  waiting_time = 0;

  public constructor(init?: Partial<Proccess>) {
    Object.assign(this, init);
  }
}
