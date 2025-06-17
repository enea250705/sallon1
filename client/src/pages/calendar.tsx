import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar as CalendarIcon, Clock, User, Scissors, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { DraggableAppointment } from "@/components/calendar/draggable-appointment";
import { DroppableDay } from "@/components/calendar/droppable-day";

const appointmentSchema = z.object({
  clientType: z.enum(["new", "existing"], { required_error: "Tipo cliente è richiesto" }),
  clientId: z.number().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  stylistId: z.number({ required_error: "Stilista è richiesto" }),
  serviceId: z.number({ required_error: "Servizio è richiesto" }),
  date: z.string().min(1, "Data è richiesta"),
  startHour: z.number({ required_error: "Ora è richiesta" }),
  startMinute: z.number({ required_error: "Minuti sono richiesti" }),
}).refine((data) => {
  if (data.clientType === "new") {
    return data.clientName && data.clientName.length > 0 && data.clientPhone && data.clientPhone.length > 0;
  }
  if (data.clientType === "existing") {
    return data.clientId && data.clientId > 0;
  }
  return false;
}, {
  message: "Dati cliente richiesti",
  path: ["clientName"]
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "day">("month");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedAppointment, setDraggedAppointment] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientType: "new",
      clientName: "",
      clientPhone: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      startHour: 9,
      startMinute: 0,
    },
  });

  // Watch for clientType changes to clear other fields
  const clientType = form.watch("clientType");

  // Fetch appointments based on view mode
  const { data: appointments, isLoading } = useQuery<any[]>({
    queryKey: viewMode === 'month' 
      ? ["/api/appointments", "month", format(selectedDate, "yyyy-MM")]
      : ["/api/appointments", "day", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (viewMode === 'month') {
        params.set('startDate', format(startOfMonth(selectedDate), "yyyy-MM-dd"));
        params.set('endDate', format(endOfMonth(selectedDate), "yyyy-MM-dd"));
      } else {
        params.set('date', format(selectedDate, "yyyy-MM-dd"));
      }
      
      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const { data: stylists } = useQuery<any[]>({
    queryKey: ["/api/stylists"],
  });

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentForm) => {
      let clientId: number;
      
      if (data.clientType === "new") {
        // Create client with just the name (split into first and last name)
        const nameParts = data.clientName!.split(' ');
        const firstName = nameParts[0] || data.clientName!;
        const lastName = nameParts.slice(1).join(' ') || "";
        
        const clientResponse = await apiRequest("POST", "/api/clients", {
          firstName,
          lastName,
          phone: data.clientPhone!,
          email: "",
          notes: "",
        });
        const newClient = await clientResponse.json();
        clientId = newClient.id;
      } else {
        clientId = data.clientId!;
      }

      // Calculate start and end times
      const startTime = `${data.startHour.toString().padStart(2, '0')}:${data.startMinute.toString().padStart(2, '0')}`;
      const startTimeMinutes = data.startHour * 60 + data.startMinute;
      
      // Get service duration
      const service = services?.find(s => s.id === data.serviceId);
      const duration = service?.duration || 30; // default to 30 minutes if not found
      
      const endTimeMinutes = startTimeMinutes + duration;
      const endHours = Math.floor(endTimeMinutes / 60);
      const endMins = endTimeMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Create the appointment with the client
      return apiRequest("POST", "/api/appointments", {
        clientId: clientId,
        stylistId: data.stylistId,
        serviceId: data.serviceId,
        date: data.date,
        startTime: startTime,
        endTime: endTime,
        notes: "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Appuntamento creato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile creare l'appuntamento",
        variant: "destructive" 
      });
    },
  });

  const triggerRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reminders");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Test Promemoria",
        description: "Controllo promemoria WhatsApp avviato - controlla i log del server",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore durante il test dei promemoria",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/appointments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appuntamento aggiornato",
        description: "L'appuntamento è stato spostato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'appuntamento",
        variant: "destructive",
      });
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      return apiRequest("DELETE", `/api/appointments/${appointmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ 
        title: "Appuntamento cancellato", 
        description: "L'appuntamento è stato cancellato con successo" 
      });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile cancellare l'appuntamento",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: AppointmentForm) => {
    createAppointmentMutation.mutate(data);
  };

  const cancelAppointment = (appointmentId: number) => {
    const appointment = appointments?.find(apt => apt.id === appointmentId);
    const clientName = appointment ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'questo cliente';
    
    if (confirm(`Sei sicuro di voler cancellare l'appuntamento di ${clientName}?`)) {
      deleteAppointmentMutation.mutate(appointmentId);
    }
  };

  // Navigation functions
  const navigateToday = () => setSelectedDate(new Date());
  const navigatePrevious = () => {
    if (viewMode === "day") {
      setSelectedDate(subDays(selectedDate, 1));
    } else if (viewMode === "month") {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };
  const navigateNext = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === "month") {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  // Helper function to get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    const dateString = format(date, "yyyy-MM-dd");
    return appointments.filter(apt => apt.date === dateString);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const appointment = event.active.data.current?.appointment;
    setDraggedAppointment(appointment);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedAppointment) {
      setDraggedAppointment(null);
      return;
    }

    const appointmentId = draggedAppointment.id;
    const newDate = over.data.current?.date;
    
    if (!newDate) {
      setDraggedAppointment(null);
      return;
    }

    // Check if we're actually moving to a different date
    const currentDate = draggedAppointment.date;
    if (currentDate === newDate) {
      setDraggedAppointment(null);
      return;
    }

    // Update the appointment with the new date
    updateAppointmentMutation.mutate({
      id: appointmentId,
      data: {
        date: newDate,
        startTime: draggedAppointment.startTime,
        clientId: draggedAppointment.clientId,
        serviceId: draggedAppointment.serviceId,
        stylistId: draggedAppointment.stylistId,
      }
    });

    setDraggedAppointment(null);
  };

  // Generate calendar days for monthly view
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Generate time slots for the day view
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 9 + i; // Start from 9 AM
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Filter appointments for the selected date
  const dayAppointments = appointments?.filter(app => app.date === format(selectedDate, "yyyy-MM-dd")) || [];

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Layout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appuntamenti</h1>
            <p className="text-gray-600">Gestisci tutti gli appuntamenti del salone</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Appuntamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nuovo Appuntamento</DialogTitle>
                <DialogDescription>
                  Inserisci i dettagli per creare un nuovo appuntamento.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="startHour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ora</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ora" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 11 }, (_, i) => i + 8).map((hour) => (
                                  <SelectItem key={hour} value={hour.toString()}>
                                    {hour.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startMinute"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minuti</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[0, 15, 30, 45].map((minute) => (
                                  <SelectItem key={minute} value={minute.toString()}>
                                    {minute.toString().padStart(2, '0')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Tipo Cliente Selection */}
                  <FormField
                    control={form.control}
                    name="clientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Nuovo Cliente</SelectItem>
                            <SelectItem value="existing">Cliente Esistente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional Client Fields */}
                  {clientType === "existing" ? (
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seleziona Cliente</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Scegli dalla rubrica" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.firstName} {client.lastName} - {client.phone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Cliente</FormLabel>
                            <FormControl>
                              <Input placeholder="Inserisci nome cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="clientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numero di Telefono</FormLabel>
                            <FormControl>
                              <Input placeholder="+39 123 456 7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="stylistId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stilista</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona stilista" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stylists?.map((stylist: any) => (
                              <SelectItem key={stylist.id} value={stylist.id.toString()}>
                                {stylist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servizio</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona servizio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services?.map((service: any) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name} ({service.duration}min - €{(service.price / 100).toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annulla
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createAppointmentMutation.isPending}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      {createAppointmentMutation.isPending ? "Creazione..." : "Crea Appuntamento"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Navigation */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={navigatePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {viewMode === 'month' 
                    ? format(selectedDate, "MMMM yyyy", { locale: it })
                    : format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })
                  }
                </h2>
                <Button variant="outline" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="h-8"
                  >
                    Mese
                  </Button>
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                    className="h-8"
                  >
                    Giorno
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={navigateToday}>
                  Oggi
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => triggerRemindersMutation.mutate()}
                  disabled={triggerRemindersMutation.isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {triggerRemindersMutation.isPending ? "Invio..." : "Test WhatsApp"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : viewMode === 'month' ? (
              <div className="space-y-4">
                {/* Month Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <DroppableDay
                      key={index}
                      day={day}
                      selectedDate={selectedDate}
                      appointments={getAppointmentsForDate(day)}
                      onDayClick={(day) => {
                        setSelectedDate(day);
                        setViewMode('day');
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Day view
              !dayAppointments || dayAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nessun appuntamento per {format(selectedDate, "d MMMM", { locale: it })}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayAppointments.map((appointment: any) => (
                    <DraggableAppointment
                      key={appointment.id}
                      appointment={appointment}
                      isMonthView={false}
                      onDelete={cancelAppointment}
                    />
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
        
        {/* Drag Overlay */}
        <DragOverlay>
          {draggedAppointment ? (
            <DraggableAppointment
              appointment={draggedAppointment}
              isMonthView={viewMode === 'month'}
            />
          ) : null}
        </DragOverlay>
      </div>
    </Layout>
    </DndContext>
  );
}