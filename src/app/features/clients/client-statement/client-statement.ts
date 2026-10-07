import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ClientService } from '../../../core/services/client.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Client } from '../../../core/models/client.model';
import { Delivery } from '../../../core/models/delivery.model';
import { Payment } from '../../../core/models/payment.model';

interface HistoryItem {
  type: 'delivery' | 'payment';
  id: string;
  date: number;
  amount: number;
  isPaid?: boolean; // solo domicilios
  notes?: string;
  originalRef: any;
}

@Component({
  selector: 'app-client-statement',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './client-statement.html',
  styleUrl: './client-statement.scss'
})
export class ClientStatement implements OnInit {
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);
  private deliveryService = inject(DeliveryService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  clientId: string = '';
  client: Client | null = null;
  
  deliveries: Delivery[] = [];
  payments: Payment[] = [];
  history: HistoryItem[] = [];
  
  loading = true;
  addingDelivery = false;
  addingPayment = false;
  
  deliveryForm: FormGroup;
  paymentForm: FormGroup;
  
  totalDebt = 0;
  activeTab: 'delivery' | 'payment' = 'delivery'; // Controla qué formulario se muestra

  constructor() {
    this.deliveryForm = this.fb.group({
      value: [5000, [Validators.required, Validators.min(0)]],
      isPaid: [false],
      notes: ['']
    });

    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    if (this.clientId) {
      this.loadClientData();
    }
    
    this.authService.currentUser$.subscribe(user => {
      if (user && user.defaultDeliveryValue) {
        this.deliveryForm.patchValue({ value: user.defaultDeliveryValue });
      }
    });
  }

  loadClientData() {
    this.clientService.getClient(this.clientId).subscribe({
      next: (clientData) => {
        this.client = clientData;
        this.loadHistory();
      },
      error: (err) => {
        console.error('Error cargando cliente', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory() {
    forkJoin({
      deliveries: this.deliveryService.getDeliveriesByClient(this.clientId),
      payments: this.paymentService.getPaymentsByClient(this.clientId)
    }).subscribe({
      next: (result) => {
        this.deliveries = result.deliveries;
        this.payments = result.payments;
        this.buildHistoryAndTotals();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando historial', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildHistoryAndTotals() {
    this.history = [];
    
    let totalDeliveriesDebt = 0;
    
    this.deliveries.forEach(d => {
      if (!d.isPaid) totalDeliveriesDebt += d.value;
      this.history.push({
        type: 'delivery',
        id: d.id,
        date: d.date,
        amount: d.value,
        isPaid: d.isPaid,
        notes: d.notes,
        originalRef: d
      });
    });

    let totalPayments = 0;
    this.payments.forEach(p => {
      totalPayments += p.amount;
      this.history.push({
        type: 'payment',
        id: p.id,
        date: p.date,
        amount: p.amount,
        notes: p.notes,
        originalRef: p
      });
    });

    // Ordenar de más reciente a más antiguo
    this.history.sort((a, b) => b.date - a.date);

    // Calcular deuda real
    this.totalDebt = totalDeliveriesDebt - totalPayments;
  }

  async onSubmitDelivery() {
    if (this.deliveryForm.invalid || !this.client) return;

    this.addingDelivery = true;
    try {
      const formVal = this.deliveryForm.value;
      await this.deliveryService.addDelivery({
        clientId: this.client.id,
        clientName: this.client.name,
        value: formVal.value,
        isPaid: formVal.isPaid,
        notes: formVal.notes
      });
      
      this.deliveryForm.patchValue({ isPaid: false, notes: '' });
      this.loadHistory();
    } catch (error) {
      console.error('Error agregando domicilio', error);
      alert('Hubo un error al guardar el domicilio');
    } finally {
      this.addingDelivery = false;
      this.cdr.detectChanges();
    }
  }

  async onSubmitPayment() {
    if (this.paymentForm.invalid || !this.client) return;

    this.addingPayment = true;
    try {
      const formVal = this.paymentForm.value;
      await this.paymentService.addPayment({
        clientId: this.client.id,
        amount: formVal.amount,
        notes: formVal.notes
      });
      
      this.paymentForm.reset();
      this.loadHistory();
    } catch (error) {
      console.error('Error agregando abono', error);
      alert('Hubo un error al guardar el abono');
    } finally {
      this.addingPayment = false;
      this.cdr.detectChanges();
    }
  }

  async togglePaid(delivery: Delivery) {
    try {
      await this.deliveryService.togglePaidStatus(delivery.id, !delivery.isPaid);
      this.loadHistory();
    } catch (error) {
      console.error('Error actualizando pago', error);
    }
  }

  async deleteItem(item: HistoryItem) {
    if (confirm(`¿Estás seguro de que deseas eliminar este ${item.type === 'delivery' ? 'domicilio' : 'abono'}?`)) {
      try {
        if (item.type === 'delivery') {
          await this.deliveryService.deleteDelivery(item.id);
        } else {
          await this.paymentService.deletePayment(item.id);
        }
        this.loadHistory();
      } catch (error) {
        console.error('Error eliminando', error);
      }
    }
  }
}
