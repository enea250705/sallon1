import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Phone, Mail, Edit, Trash2, User, Bell, ChevronDown, ChevronUp, Calendar, Clock, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { formatPhoneForDisplay } from "@/lib/phone-utils";

const clientSchema = z.object({
  firstName: z.string().min(1, "Nome è richiesto"),
  lastName: z.string().min(1, "Cognome è richiesto"),
  phone: z.string().min(1, "Telefono è richiesto"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type Client = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

type Appointment = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  service: {
    id: number;
    name: string;
    duration: number;
    price: number;
  };
  stylist: {
    id: number;
    name: string;
  };
  notes: string | null;
};

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createClientMutation = useMutation({
    mutationFn: (data: z.infer<typeof clientSchema>) => 
      apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Cliente creato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile creare il cliente",
        variant: "destructive" 
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof clientSchema> }) =>
      apiRequest("PUT", `/api/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
      toast({ title: "Cliente aggiornato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile aggiornare il cliente",
        variant: "destructive" 
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Cliente eliminato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile eliminare il cliente",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (values: z.infer<typeof clientSchema>) => {
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, data: values });
    } else {
      createClientMutation.mutate(values);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || "",
      notes: client.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo cliente?")) {
      deleteClientMutation.mutate(id);
    }
  };

  const filteredClients = clients?.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
            <p className="text-gray-600">Gestisci i tuoi clienti e le loro informazioni</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                onClick={() => {
                  setEditingClient(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md w-full mx-2 sm:mx-4">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Modifica Cliente" : "Nuovo Cliente"}
                </DialogTitle>
                <DialogDescription>
                  {editingClient 
                    ? "Modifica le informazioni del cliente"
                    : "Aggiungi un nuovo cliente alla tua lista"
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cognome</FormLabel>
                          <FormControl>
                            <Input placeholder="Cognome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md text-gray-600">
                              +39
                            </div>
                            <Input 
                              placeholder="376 102 4089" 
                              {...field}
                              className="rounded-l-none"
                              onChange={(e) => {
                                // Remove any non-digit characters and format
                                const value = e.target.value.replace(/[^\d]/g, '');
                                // Format as XXX XXX XXXX
                                const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
                                field.onChange(value.length <= 10 ? formatted : field.value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (opzionale)</FormLabel>
                        <FormControl>
                          <Input placeholder="email@esempio.it" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Preferenze, allergie, prodotti utilizzati..."
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    disabled={createClientMutation.isPending || updateClientMutation.isPending}
                  >
                    {editingClient ? "Aggiorna" : "Crea"} Cliente
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca per nome, telefono o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>Tutti i Clienti ({filteredClients.length})</CardTitle>
            <CardDescription>
              Lista completa dei tuoi clienti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nessun cliente trovato</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Client Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-2 sm:p-3 rounded-full flex-shrink-0">
                          <span className="text-white font-semibold text-xs sm:text-sm">
                            {client.firstName[0]}{client.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {client.firstName} {client.lastName}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="truncate">{formatPhoneForDisplay(client.phone)}</span>
                            </div>
                            {client.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/recurring-reminders?client=${client.id}`, '_blank')}
                        title="Gestisci promemoria ricorrenti"
                          className="text-blue-600 hover:text-blue-700 h-8 w-8 sm:h-9 sm:w-9"
                      >
                          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(client)}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 sm:h-9 sm:w-9"
                      >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      </div>
                    </div>

                    {/* Client Notes */}
                    {client.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-blue-900">Note: </span>
                          {client.notes}
                        </p>
                      </div>
                    )}

                    {/* Appointment History Component */}
                    <ClientAppointmentHistory clientId={client.id} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Component to show appointment history for a client
function ClientAppointmentHistory({ clientId }: { clientId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Unica query per gli appuntamenti (sempre attiva per mostrare il conteggio)
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/client", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?clientId=${clientId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  // Separate past and future appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pastAppointments = appointments?.filter(apt => new Date(apt.date) < today) || [];
  const futureAppointments = appointments?.filter(apt => new Date(apt.date) >= today) || [];
  
  const appointmentCount = appointments?.length || 0;
  const totalSpent = pastAppointments.reduce((sum, apt) => sum + apt.service.price, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-0 h-auto">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              Appuntamenti {isLoading ? (
                <span className="text-gray-400">(...)</span>
              ) : (
                `(${appointmentCount})`
              )}
            </span>
            {futureAppointments.length > 0 && !isLoading && (
              <span className="text-blue-600 font-medium">
                {futureAppointments.length} prossimi
              </span>
            )}
            {totalSpent > 0 && !isLoading && (
              <span className="text-green-600 font-medium">
                €{(totalSpent / 100).toFixed(2)} totale
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Nessun appuntamento trovato</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Future Appointments Section */}
            {futureAppointments.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="h-px bg-blue-200 flex-1"></div>
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    PROSSIMI APPUNTAMENTI ({futureAppointments.length})
                  </span>
                  <div className="h-px bg-blue-200 flex-1"></div>
                </div>
                <div className="space-y-2">
                  {futureAppointments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-blue-900">
                              {format(new Date(appointment.date), "d MMM yyyy", { locale: it })}
                            </div>
                            <div className="flex items-center space-x-1 text-blue-700">
                              <Clock className="h-3 w-3" />
                              <span>{appointment.startTime.slice(0, 5)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1 text-blue-700">
                              <Scissors className="h-3 w-3" />
                              <span>{appointment.service.name}</span>
                            </div>
                            <span className="text-blue-400">•</span>
                            <span className="text-blue-700">{appointment.stylist.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-blue-700">
                            €{(appointment.service.price / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-blue-600">
                            {appointment.service.duration}min
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Past Appointments Section */}
            {pastAppointments.length > 0 && (
              <div>
                {futureAppointments.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      STORICO ({pastAppointments.length})
                    </span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                )}
                <div className="space-y-2">
                  {pastAppointments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">
                              {format(new Date(appointment.date), "d MMM yyyy", { locale: it })}
                            </div>
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>{appointment.startTime.slice(0, 5)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Scissors className="h-3 w-3" />
                              <span>{appointment.service.name}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{appointment.stylist.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            €{(appointment.service.price / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.service.duration}min
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* No future appointments message */}
            {futureAppointments.length === 0 && pastAppointments.length > 0 && (
              <div className="text-center py-2 text-gray-500 text-sm bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p>Nessun appuntamento futuro prenotato</p>
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}