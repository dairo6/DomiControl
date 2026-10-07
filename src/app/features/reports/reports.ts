import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ClientService } from '../../core/services/client.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { PaymentService } from '../../core/services/payment.service';
import { Client } from '../../core/models/client.model';

interface ReportItem {
  type: 'delivery' | 'payment';
  date: number;
  amount: number;
  clientName: string;
  clientId?: string;
  notes?: string;
  isPaid?: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html'
})
export class ReportsComponent implements OnInit {
  private clientService = inject(ClientService);
  private deliveryService = inject(DeliveryService);
  private paymentService = inject(PaymentService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  
  allHistory: ReportItem[] = [];
  filteredHistory: ReportItem[] = [];
  clients: Client[] = [];
  
  // Totales
  totalDeliveriesValue = 0;
  totalPaymentsValue = 0;
  
  // Filtros
  startDate: string = '';
  endDate: string = '';
  selectedClientId: string = '';

  ngOnInit(): void {
    // Configurar fechas por defecto (Mes actual)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = now.toISOString().split('T')[0];

    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      clients: this.clientService.getClients(),
      deliveries: this.deliveryService.getAllDeliveries(),
      payments: this.paymentService.getAllPayments()
    }).subscribe({
      next: (data) => {
        const { clients, deliveries, payments } = data;
        this.clients = clients;
        
        // Crear mapa de clientes para acceso rápido
        const clientMap = new Map<string, string>();
        clients.forEach(c => clientMap.set(c.id, c.name));

        this.allHistory = [];

        deliveries.forEach(d => {
          this.allHistory.push({
            type: 'delivery',
            date: d.date,
            amount: d.value,
            clientName: d.clientName || clientMap.get(d.clientId) || 'Desconocido',
            notes: d.notes,
            isPaid: d.isPaid,
            clientId: d.clientId
          });
        });

        payments.forEach(p => {
          this.allHistory.push({
            type: 'payment',
            date: p.date,
            amount: p.amount,
            clientName: clientMap.get(p.clientId) || 'Desconocido',
            notes: p.notes,
            clientId: p.clientId
          });
        });

        // Ordenar globalmente
        this.allHistory.sort((a, b) => b.date - a.date);
        
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error cargando reportes', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    let filtered = this.allHistory;

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate).getTime();
      const end = new Date(this.endDate + 'T23:59:59').getTime(); // Final del día
      filtered = filtered.filter(item => item.date >= start && item.date <= end);
    }

    if (this.selectedClientId) {
      filtered = filtered.filter(item => (item as any).clientId === this.selectedClientId);
    }

    this.filteredHistory = filtered;

    this.calculateTotals();
    this.loading = false;
    this.cdr.detectChanges();
  }

  calculateTotals() {
    this.totalDeliveriesValue = 0;
    this.totalPaymentsValue = 0;

    this.filteredHistory.forEach(item => {
      if (item.type === 'delivery') {
        this.totalDeliveriesValue += item.amount;
      } else {
        this.totalPaymentsValue += item.amount;
      }
    });
  }
}
