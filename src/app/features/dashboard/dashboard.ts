import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClientService } from '../../core/services/client.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private clientService = inject(ClientService);
  private deliveryService = inject(DeliveryService);
  private paymentService = inject(PaymentService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  totalClients = 0;
  totalDebtGeneral = 0;
  deliveriesToday = 0;
  deliveriesMonth = 0;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    forkJoin({
      clients: this.clientService.getClients(),
      deliveries: this.deliveryService.getAllDeliveries(),
      payments: this.paymentService.getAllPayments()
    }).subscribe({
      next: (data) => {
        const { clients, deliveries, payments } = data;
        
        // Total clientes (activos)
        this.totalClients = clients.filter(c => c.active).length;

        // Calcular domicilios hoy y este mes
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        this.deliveriesToday = deliveries.filter(d => d.date >= startOfToday).length;
        this.deliveriesMonth = deliveries.filter(d => d.date >= startOfMonth).length;

        // Calcular deuda global
        const totalDeliveriesDebt = deliveries.filter(d => !d.isPaid).reduce((sum, d) => sum + d.value, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        this.totalDebtGeneral = totalDeliveriesDebt - totalPayments;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando dashboard', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
