import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Proccess } from './../../models/proccess';

import { CpuStatus } from './../../enumerables/cpu-status.enum';
import { isNullOrUndefined } from 'util';
import { Guid } from 'guid-typescript';

@Injectable()
export class LotterySchedulingService {

  // Variável para controlar o Status da CPU
  private _cpuStatus: BehaviorSubject<CpuStatus> = new BehaviorSubject(CpuStatus.Stoped);
  // Clock do processador
  private _cpuClock: number;
  // Array com os processos em estado PRONTO
  private _readyProccess: BehaviorSubject<Array<Proccess>> = new BehaviorSubject(new Array<Proccess>());
  // Array com os processos em estado COMPLETO
  private _completeProccess: Array<Proccess> = new Array<Proccess>();
  // Processo sendo executado
  private _executingProccess: Proccess;
  // Bilhetes distribuidos
  private _ticketsDist: Array<Guid> = new Array<Guid>();

  constructor() {
    // Ação tomada ao adicionar um processo na fila de PRONTO
    this._readyProccess.subscribe(
      value => {
        // Se a CPU estiver rodando e não tiver processo sendo executado
        if (this._cpuStatus.getValue() === CpuStatus.Running && isNullOrUndefined(this._executingProccess)) {
          this.executeProccess();
        }
      });

    this._cpuStatus.subscribe(
      value => {
        if (value === CpuStatus.Running && isNullOrUndefined(this._executingProccess)) {
          this.executeProccess();
        }
      });
  }

  //#region Schediling methods
  // Seleciona um processo e coloca para ser executado
  executeProccess() {
    if (this._cpuStatus.getValue() === CpuStatus.Stoped
      || this._readyProccess.getValue().length <= 0) {
      return;
    }

    this.sortearProcesso();

    if (this._executingProccess.time > 0) {
      this._executingProccess.time -= 5;
      // Setar timeout
    }

    if (this._executingProccess.time <= 0) {
      this._executingProccess.time = 0;
      this._completeProccess.push(this._executingProccess);
      this.discardTickets(this._executingProccess);
    } else {
      let readyProccess;
      readyProccess = this._readyProccess.getValue();

      readyProccess.push(this._executingProccess);
      this._readyProccess.next(readyProccess);
    }
    this._executingProccess = undefined;

    this.executeProccess();
  }

  // Sorteia um dos processos para ser executado
  sortearProcesso() {
    // Array de processos PRONTOS
    let readyProccess: Array<Proccess>;
    readyProccess = this._readyProccess.getValue();

    // Número randomico para o ticket selecionado
    let selectedTicket: number;
    selectedTicket = this.getRandomNumber(this._ticketsDist.length);

    let selectedProccess;

    readyProccess.forEach(proccess => {
      selectedProccess = proccess.tickets.find(x => x === this._ticketsDist[selectedTicket]);

      if (!isNullOrUndefined(selectedProccess)) {
        readyProccess.splice(readyProccess.indexOf(proccess), 1);
        this._executingProccess = proccess;
        this._readyProccess.next(readyProccess);

        return;
      }
    });
  }

  /**
   * Sorteia um valor randomicamente entre 0 e o valormáximo.
   * @param max Valor máximo que pode ser sorteado randomicamente
   */
  getRandomNumber(max: number): number {
    return Math.floor(Math.random() * max);
  }

  addProccess(newProccess: Proccess) {
    let temp;
    temp = this._readyProccess.getValue();

    // Atribuir um ticket a este processo
    newProccess = this.ticketDist(newProccess);

    temp.push(newProccess);
    this._readyProccess.next(temp);
  }

  addArrayProccess(newsProccess: Array<Proccess>) {
    let temp: Array<Proccess>;
    temp = this._readyProccess.getValue();

    // Atribuir um ticket a este processo
    newsProccess.forEach(proccess => {
      proccess = this.ticketDist(proccess);
    });

    temp = temp.concat(newsProccess);
    this._readyProccess.next(temp);
  }

  ticketDist(proccess: Proccess): Proccess {
    let ticket;
    ticket = Guid.create();
    proccess.tickets.push(ticket);
    this._ticketsDist.push(ticket);
    return proccess;
  }

  discardTickets(proccess: Proccess) {
    proccess.tickets.forEach(ticket => {
      this._ticketsDist.splice(this._ticketsDist.indexOf(ticket), 1);
    });
  }
  //#endregion

  //#region CPU methods
  getCpuStatus() {
    return this._cpuStatus;
  }

  alterCptuStatus() {
    if (this._cpuStatus.getValue() === CpuStatus.Running) {
      this._cpuStatus.next(CpuStatus.Stoped);
    } else {
      this._cpuStatus.next(CpuStatus.Running);
    }
  }
  //#endregion
}
