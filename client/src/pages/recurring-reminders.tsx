import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, Scissors, Bell, Trash2, Edit, Play } from "lucide-react";
import type { RecurringReminderWithDetails, Client, Service, Stylist, InsertRecurringReminder } from "@shared/schema";
import { Layout } from "@/components/layout/layout";

export default function RecurringReminders() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<RecurringReminderWithDetails | null>(null);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: reminders = [], isLoading: loadingReminders } = useQuery<RecurringReminderWithDetails[]>({
    queryKey: ["recurring-reminders"],
    queryFn: async () => {
      const response = await fetch("/api/recurring-reminders");
      if (!response.ok) throw new Error("Failed to fetch recurring reminders");
      return response.json();
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    },
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  const { data: stylists = [] } = useQuery<Stylist[]>({
    queryKey: ["stylists"],
    queryFn: async () => {
      const response = await fetch("/api/stylists");
      if (!response.ok) throw new Error("Failed to fetch stylists");
      return response.json();
    },
  });

  // Create mutation
  const createReminderMutation = useMutation({
    mutationFn: async (reminderData: InsertRecurringReminder) => {
      const response = await fetch("/api/recurring-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminderData),
      });
      if (!response.ok) throw new Error("Failed to create recurring reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-reminders"] });
      setShowCreateForm(false);
    },
  });

  // Update mutation
  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRecurringReminder> }) => {
      const response = await fetch(`/api/recurring-reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update recurring reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-reminders"] });
      setEditingReminder(null);
    },
  });

  // Delete mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/recurring-reminders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete recurring reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-reminders"] });
    },
  });

  // Test service mutation
  const testServiceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/recurring-reminders/service/trigger", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to trigger reminder check");
      return response.json();
    },
    onSuccess: () => {
      alert("Test dei promemoria avviato! Controlla la console del server per i dettagli.");
    },
    onError: () => {
      alert("Errore durante il test dei promemoria.");
    },
  });

  const handleDeleteReminder = (reminder: RecurringReminderWithDetails) => {
    if (confirm(`Sei sicuro di voler eliminare il promemoria ricorrente per ${reminder.client.firstName} ${reminder.client.lastName}?`)) {
      deleteReminderMutation.mutate(reminder.id);
    }
  };

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Settimanale';
      case 'biweekly': return 'Ogni 2 settimane';
      case 'monthly': return 'Mensile';
      default: return frequency;
    }
  };

  const formatDayOfWeek = (dayOfWeek: number | null) => {
    if (dayOfWeek === null) return '';
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[dayOfWeek];
  };

  if (loadingReminders) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento promemoria ricorrenti...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-pink-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Promemoria Ricorrenti</h1>
                <p className="text-gray-600">Gestisci i promemoria automatici per i clienti abituali</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => testServiceMutation.mutate()}
                disabled={testServiceMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
                title="Testa il servizio di promemoria ricorrenti"
              >
                <Play className="h-5 w-5" />
                <span>{testServiceMutation.isPending ? 'Testing...' : 'Test Servizio'}</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Nuovo Promemoria</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingReminder) && (
          <ReminderForm
            reminder={editingReminder}
            clients={clients}
            services={services}
            stylists={stylists}
            onSubmit={(data) => {
              if (editingReminder) {
                updateReminderMutation.mutate({ id: editingReminder.id, data });
              } else {
                createReminderMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingReminder(null);
            }}
            isLoading={createReminderMutation.isPending || updateReminderMutation.isPending}
          />
        )}

        {/* Reminders List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Promemoria Attivi ({reminders.length})
            </h2>
          </div>
          
          {reminders.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun promemoria ricorrente</h3>
              <p className="text-gray-600 mb-4">
                Crea il primo promemoria automatico per i tuoi clienti abituali
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
              >
                Crea Promemoria
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="p-4 sm:p-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {reminder.client.firstName} {reminder.client.lastName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 text-sm sm:text-base truncate">{reminder.service.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 text-sm sm:text-base truncate">{reminder.stylist.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{formatFrequency(reminder.frequency)}</span>
                          {reminder.dayOfWeek !== null && (
                            <span>- {formatDayOfWeek(reminder.dayOfWeek)}</span>
                          )}
                          {reminder.dayOfMonth !== null && (
                            <span>- Giorno {reminder.dayOfMonth}</span>
                          )}
                        </div>
                        {reminder.preferredTime && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{reminder.preferredTime}</span>
                          </div>
                        )}
                        {reminder.nextReminderDate && (
                          <div className="flex items-center space-x-2">
                            <Bell className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>Prossimo: {new Date(reminder.nextReminderDate).toLocaleDateString('it-IT')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setEditingReminder(reminder)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifica promemoria"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(reminder)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Elimina promemoria"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Form Component
interface ReminderFormProps {
  reminder?: RecurringReminderWithDetails | null;
  clients: Client[];
  services: Service[];
  stylists: Stylist[];
  onSubmit: (data: InsertRecurringReminder) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ReminderForm({ reminder, clients, services, stylists, onSubmit, onCancel, isLoading }: ReminderFormProps) {
  const [formData, setFormData] = useState<InsertRecurringReminder>({
    clientId: reminder?.clientId || 0,
    serviceId: reminder?.serviceId || 0,
    stylistId: reminder?.stylistId || 0,
    frequency: reminder?.frequency || 'weekly',
    dayOfWeek: reminder?.dayOfWeek || null,
    dayOfMonth: reminder?.dayOfMonth || null,
    preferredTime: reminder?.preferredTime || null,
    isActive: reminder?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    
    // Validate required fields
    if (!formData.clientId || formData.clientId === 0) {
      alert('Seleziona un cliente');
      return;
    }
    if (!formData.serviceId || formData.serviceId === 0) {
      alert('Seleziona un servizio');
      return;
    }
    if (!formData.stylistId || formData.stylistId === 0) {
      alert('Seleziona un parrucchiere');
      return;
    }
    
    console.log('Submitting form data:', formData);
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {reminder ? 'Modifica Promemoria' : 'Nuovo Promemoria Ricorrente'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value={0}>Seleziona cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servizio *
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value={0}>Seleziona servizio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stylist Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parrucchiere *
            </label>
            <select
              value={formData.stylistId}
              onChange={(e) => setFormData({ ...formData, stylistId: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value={0}>Seleziona parrucchiere</option>
              {stylists.map((stylist) => (
                <option key={stylist.id} value={stylist.id}>
                  {stylist.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequenza *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ 
                ...formData, 
                frequency: e.target.value,
                dayOfWeek: e.target.value === 'monthly' ? null : formData.dayOfWeek,
                dayOfMonth: e.target.value === 'monthly' ? formData.dayOfMonth : null
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value="weekly">Settimanale</option>
              <option value="biweekly">Ogni 2 settimane</option>
              <option value="monthly">Mensile</option>
            </select>
          </div>

          {/* Day of Week (for weekly/biweekly) */}
          {(formData.frequency === 'weekly' || formData.frequency === 'biweekly') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giorno della settimana
              </label>
              <select
                value={formData.dayOfWeek || ''}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Seleziona giorno</option>
                <option value={1}>Lunedì</option>
                <option value={2}>Martedì</option>
                <option value={3}>Mercoledì</option>
                <option value={4}>Giovedì</option>
                <option value={5}>Venerdì</option>
                <option value={6}>Sabato</option>
                <option value={0}>Domenica</option>
              </select>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {formData.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giorno del mese
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dayOfMonth || ''}
                onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Es. 15"
              />
            </div>
          )}

          {/* Preferred Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orario preferito
            </label>
            <input
              type="time"
              value={formData.preferredTime || ''}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value || null })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.clientId || !formData.serviceId || !formData.stylistId}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Salvando...' : (reminder ? 'Aggiorna' : 'Crea Promemoria')}
          </button>
        </div>
      </form>
    </div>
  );
} 