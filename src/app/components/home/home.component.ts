import { CpuStatus } from './../../enumerables/cpu-status.enum';
import { Component, OnInit } from '@angular/core';
import { Proccess } from '../../models/proccess';
import { Guid } from 'guid-typescript';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Form para adiconar processo
  public formProccess: Proccess = new Proccess();
  // Número de tickets par ao proximo processo
  public numberTickets = 1;

  // Tempo a ser executado, no máximo 5
  public counter;
  // Tempo total executado
  public timeTotal = 0;
  // Tempo total de espera calculado
  // (Soma de tempo de espera dividido pelo número de Processo)
  public totalWaitingTime = 0;
  // Variável para controlar o Status da CPU
  private _cpuStatus: BehaviorSubject<CpuStatus> = new BehaviorSubject(CpuStatus.Stoped);
  // Status da CPU Público
  public cpuStatus: CpuStatus;
  // Clock do processador
  private _cpuClock: number;
  // Array com os processos em estado PRONTO
  private _readyProccess: BehaviorSubject<Array<Proccess>> = new BehaviorSubject(new Array<Proccess>());
  // Array pública
  public readyProccess: Array<Proccess> = new Array<Proccess>();
  // Array com os processos em estado COMPLETO
  public completeProccess: Array<Proccess> = new Array<Proccess>();
  // Processo sendo executado
  public executingProccess: Proccess;
  // Bilhetes distribuidos
  private _ticketsDist: Array<Guid> = new Array<Guid>();

  constructor() { }

  ngOnInit() {
    // Ação tomada ao adicionar um processo na fila de PRONTO
    this._readyProccess.subscribe(
      value => {
        this.readyProccess = value;
        // Se a CPU estiver rodando e não tiver processo sendo executado
        if (this._cpuStatus.getValue() === CpuStatus.Running && isNullOrUndefined(this.executingProccess)) {
          this.executeProccess();
        }
      });

    this._cpuStatus.subscribe(
      value => {
        this.cpuStatus = value;
        if (value === CpuStatus.Running && isNullOrUndefined(this.executingProccess)) {
          this.executeProccess();
        }
      });
  }

  //#region Schediling methods
  // Seleciona um processo e coloca para ser executado
  executeProccess() {
    // Verificar se CPU está rodando e se não tem processo em execução
    if (this._cpuStatus.getValue() === CpuStatus.Stoped
      || this._readyProccess.getValue().length <= 0) {
      return;
    }

    // Sortear um processo
    this.sortearProcesso();

    // Verificar se processo tem instruções a serem executadas
    if (this.executingProccess.time > 0) {
      this.counter = this.executingProccess.time > 5 ? 5 : this.executingProccess.time;
      this.executeTimer();
    } else {
      // Finalizar processo
      this.endProccess();
    }
  }

  executeTimer() {
    if (this.counter > 0) {
      setTimeout(() => {
        this.executingProccess.time -= 1;
        this.executingProccess.timeExecuted += 1;
        this.counter -= 1;
        this.timeTotal += 1;
        // adiciona 1 ao tempo de espera dos outros processos
        this.addWaitingTime();
        this.executeTimer();
      }, 1);
    } else {
      this.endProccess();
    }
  }

  addWaitingTime() {
    let readyProccess: Array<Proccess>;
    readyProccess = this._readyProccess.getValue();

    readyProccess.forEach(proccess => {
      proccess.waiting_time += 1;
    });

    this._readyProccess.next(readyProccess);
  }

  endProccess() {
    if (this.executingProccess.time <= 0) {
      this.executingProccess.time = 0;
      this.completeProccess.push(this.executingProccess);
      this.discardTickets(this.executingProccess);

      // Recalcular tempo médio de execução
      this.totalWaitingTime = 0;
      this.completeProccess.forEach(proccess => {
        this.totalWaitingTime += proccess.waiting_time;
      });
      this.totalWaitingTime = this.totalWaitingTime / this.completeProccess.length;
    } else {
      let readyProccess;
      readyProccess = this._readyProccess.getValue();

      readyProccess.push(this.executingProccess);
      this._readyProccess.next(readyProccess);
    }
    this.executingProccess = undefined;

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
        this.executingProccess = proccess;
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

  addProccess() {
    let temp;
    temp = this._readyProccess.getValue();

    // Atribuir um ticket a este processo
    this.formProccess = this.ticketDist(this.formProccess);

    temp.push(this.formProccess);
    this._readyProccess.next(temp);

    this.formProccess = new Proccess();
    this.numberTickets = 1;
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

    for (let i = 0; i < this.numberTickets; i++) {
      ticket = Guid.create();
      proccess.tickets.push(ticket);
      this._ticketsDist.push(ticket);
    }

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

  onSugest() {
    this._readyProccess.next(new Array<Proccess>());

    this.addArrayProccess(new Array<Proccess>(
      new Proccess({ name: 'P1', time: 15 }),
      new Proccess({ name: 'P2', time: 5 }),
      new Proccess({ name: 'P3', time: 10 })
    ));
  }
}
