import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './client-list.html',
  styleUrl: './client-list.scss'
})
export class ClientList implements OnInit {
  private clientService = inject(ClientService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm = '';
  loading = true;

  // Form Modal State
  showModal = false;
  isEditing = false;
  editingClientId = '';
  savingClient = false;
  clientForm: FormGroup;

  constructor() {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        
        if (this.searchTerm) {
          this.filteredClients = this.clients.filter(c => 
            c.name.toLowerCase().includes(this.searchTerm) || 
            (c.phone && c.phone.toLowerCase().includes(this.searchTerm))
          );
        } else {
          this.filteredClients = data;
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando clientes', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = term;
    if (!term) {
      this.filteredClients = this.clients;
    } else {
      this.filteredClients = this.clients.filter(c => 
        c.name.toLowerCase().includes(term) || 
        (c.phone && c.phone.toLowerCase().includes(term))
      );
    }
  }

  async toggleStatus(client: Client) {
    await this.clientService.toggleClientActive(client.id, !client.active);
    this.loadClients(); // Reload to reflect changes
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingClientId = '';
    this.clientForm.reset();
    this.showModal = true;
  }

  openEditModal(client: Client) {
    this.isEditing = true;
    this.editingClientId = client.id;
    this.clientForm.patchValue({
      name: client.name,
      phone: client.phone || '',
      address: client.address || ''
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveClient() {
    if (this.clientForm.invalid) return;
    this.savingClient = true;
    
    try {
      if (this.isEditing) {
        await this.clientService.updateClient(this.editingClientId, this.clientForm.value);
      } else {
        await this.clientService.createClient(this.clientForm.value);
      }
      this.closeModal();
      this.loadClients();
    } catch (error) {
      console.error('Error guardando cliente', error);
      alert('Error guardando cliente');
    } finally {
      this.savingClient = false;
      this.cdr.detectChanges();
    }
  }
}
