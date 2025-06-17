import { useState, useEffect } from "react";
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
import { Plus, Calendar as CalendarIcon, Clock, User, Scissors, ChevronLeft, ChevronRight, X, Check, Trash2 } from "lucide-react";
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
  // New state for professional day view
  const [selectedStylistFilter, setSelectedStylistFilter] = useState<number | 'all'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);
  const [additionalServices, setAdditionalServices] = useState<Array<{id: number, serviceId: number, duration: string}>>([]);
  const [mainServiceDuration, setMainServiceDuration] = useState("30m");
  const [cleaningTime, setCleaningTime] = useState("0m");
  const [manualDurationOverride, setManualDurationOverride] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

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
  const selectedServiceId = form.watch("serviceId");

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

  // Auto-update duration when service changes (unless manually overridden)
  useEffect(() => {
    if (selectedServiceId && services && !manualDurationOverride) {
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (selectedService && selectedService.duration) {
        setMainServiceDuration(`${selectedService.duration}m`);
      }
    }
  }, [selectedServiceId, services, manualDurationOverride]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/client"] });
      setIsDialogOpen(false);
      setEditingAppointment(null);
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
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/client"] });
      setIsDialogOpen(false);
      setEditingAppointment(null);
      form.reset();
      toast({
        title: "Appuntamento aggiornato",
        description: "L'appuntamento è stato modificato con successo",
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
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/client"] });
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
    if (editingAppointment) {
      // Update existing appointment
      updateExistingAppointment(data);
    } else {
      // Create new appointment
      createAppointmentMutation.mutate(data);
    }
  };

  const updateExistingAppointment = (data: AppointmentForm) => {
    // Calculate start and end times
    const startTime = `${data.startHour.toString().padStart(2, '0')}:${data.startMinute.toString().padStart(2, '0')}`;
    const startTimeMinutes = data.startHour * 60 + data.startMinute;
    
    // Get duration from manual override or service
    const durationMinutes = parseInt(mainServiceDuration.replace('m', ''));
    
    const endTimeMinutes = startTimeMinutes + durationMinutes;
    const endHours = Math.floor(endTimeMinutes / 60);
    const endMins = endTimeMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    const updateData = {
      clientId: data.clientId || editingAppointment.clientId,
      stylistId: data.stylistId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: startTime,
      endTime: endTime,
      notes: editingAppointment.notes || "",
    };

    updateAppointmentMutation.mutate({ 
      id: editingAppointment.id, 
      data: updateData 
    });
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

  // Filter appointments for the selected date
  const dayAppointments = appointments?.filter(app => app.date === format(selectedDate, "yyyy-MM-dd")) || [];

  // Generate time slots for professional day view (08:00 - 20:00, 30min intervals)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  // Filter stylists based on selection
  const filteredStylists = selectedStylistFilter === 'all' 
    ? stylists || []
    : stylists?.filter(s => s.id === selectedStylistFilter) || [];

  // Helper function to convert time to grid position
  const timeToPosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = (hours - 8) * 60 + minutes;
    return totalMinutes / 30; // Each slot is 30 minutes
  };

  // Helper function to get appointment height based on duration
  const getAppointmentHeight = (startTime: string, endTime: string) => {
    const start = timeToPosition(startTime);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const endTotalMinutes = (endHours - 8) * 60 + endMinutes;
    const end = endTotalMinutes / 30;
    return Math.max(1, end - start); // Minimum 1 slot height
  };

  // Function to handle appointment click
  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailOpen(true);
  };

  // Function to edit appointment (opens the creation modal in edit mode)
  const handleEditAppointment = (appointment: any) => {
    // Parse start time
    const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
    
    // Set form values for editing
    form.reset({
      date: appointment.date,
      startHour: startHours,
      startMinute: startMinutes,
      stylistId: appointment.stylistId,
      serviceId: appointment.serviceId,
      clientType: "existing",
      clientId: appointment.clientId,
      clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
      clientPhone: appointment.client.phone || "",
    });

    // Set duration based on appointment
    const appointmentDuration = appointment.service?.duration || 30;
    setMainServiceDuration(`${appointmentDuration}m`);
    setManualDurationOverride(false);
    
    // Reset other states
    setAdditionalServices([]);
    setCleaningTime("0m");
    
    // Set editing mode
    setEditingAppointment(appointment);
    
    // Close detail modal and open edit modal
    setIsAppointmentDetailOpen(false);
    setIsDialogOpen(true);
  };

  // Function to add additional service
  const addAdditionalService = () => {
    const newId = Date.now(); // Simple ID generation
    setAdditionalServices(prev => [...prev, { id: newId, serviceId: 0, duration: "30m" }]);
  };

  // Function to remove additional service
  const removeAdditionalService = (id: number) => {
    setAdditionalServices(prev => prev.filter(service => service.id !== id));
  };

  // Function to update additional service
  const updateAdditionalService = (id: number, field: string, value: any) => {
    setAdditionalServices(prev => prev.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  // Most used services (you can customize this list)
  const mostUsedServices = [
    { id: 'colore', name: 'Colore', icon: 'C' },
    { id: 'lavaggio', name: 'Lavaggio', icon: 'L' },
    { id: 'piega', name: 'Piega', icon: 'P' },
    { id: 'taglio', name: 'Taglio+Barba', icon: 'T+B' }
  ];

  // Function to add most used service
  const addMostUsedService = (serviceName: string) => {
    const service = services?.find(s => s.name.toLowerCase().includes(serviceName.toLowerCase()));
    if (service) {
      const currentServiceId = form.watch('serviceId');
      if (!currentServiceId) {
        // If no main service, set as main service
        form.setValue('serviceId', service.id);
      } else {
        // Add as additional service
        const newId = Date.now();
        const newService = { id: newId, serviceId: service.id, duration: "30m" };
        setAdditionalServices(prev => [...prev, newService]);
      }
    }
  };

  // Function to handle empty cell click for new appointment
  const handleEmptyCellClick = (stylistId: number, timeSlot: string) => {
    // Set default values for creating new appointment
    const [hours, minutes] = timeSlot.split(':').map(Number);
    form.reset({
      date: format(selectedDate, "yyyy-MM-dd"),
      startHour: hours,
      startMinute: minutes,
      stylistId: stylistId,
      clientType: "new",
      clientName: "",
      clientPhone: "",
      serviceId: undefined, // Set to undefined to show placeholder
    });
    // Reset additional services and durations
    setAdditionalServices([]);
    setMainServiceDuration("30m");
    setCleaningTime("0m");
    setManualDurationOverride(false);
    setEditingAppointment(null);
    setIsDialogOpen(true);
  };

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
            <DialogContent className="sm:max-w-[420px] p-0 [&>button]:hidden">
              <div className="bg-white rounded-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                      editingAppointment 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {editingAppointment ? 'MODIFICA' : 'NUOVO'}
                    </div>
                    <span className="text-lg font-normal text-gray-700">
                      {form.watch('clientName') || (editingAppointment ? 'Modifica Appuntamento' : 'Nuovo Cliente')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      type="button" 
                      className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                    <button 
                      type="submit" 
                      form="appointment-form"
                      className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Date and Time - dynamic from form */}
                  <div className="text-center">
                    <div className="text-base font-medium text-gray-700">
                      {(() => {
                        const formDate = form.watch('date');
                        const formHour = form.watch('startHour');
                        const formMinute = form.watch('startMinute');
                        
                        if (formDate && formHour !== undefined && formMinute !== undefined) {
                          try {
                            const dateObj = new Date(formDate);
                            const dayName = format(dateObj, "EEE", { locale: it }).toUpperCase();
                            const dayNumber = format(dateObj, "dd");
                            const timeString = `${formHour.toString().padStart(2, '0')}:${formMinute.toString().padStart(2, '0')}`;
                            return `${dayName} ${dayNumber} - ${timeString}`;
                          } catch (error) {
                            return 'DATA NON VALIDA';
                          }
                        }
                        
                        // Fallback to current selected date if form is empty
                        const dayName = format(selectedDate, "EEE", { locale: it }).toUpperCase();
                        const dayNumber = format(selectedDate, "dd");
                        return `${dayName} ${dayNumber} - 09:00`;
                      })()}
                    </div>
                  </div>

              <Form {...form}>
                    <form id="appointment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Phone field - real data */}
                      <div className="space-y-2">
                    <FormField
                      control={form.control}
                          name="clientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                                <input 
                                  {...field}
                                  placeholder="Telefono" 
                                  className="w-full h-12 px-4 bg-gray-100 border-0 rounded-full text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                        <div className="text-center">
                          <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            COMPILA QUI PER RACCOGLIERE PIÙ RECENSIONI!
                          </div>
                        </div>
                      </div>

                      {/* Email/Name field - real data */}
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input 
                                {...field}
                                placeholder="Nome Cliente" 
                                className="w-full h-12 px-4 bg-gray-100 border-0 rounded-full text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Time display - dynamic */}
                      <div className="text-left">
                        <div className="text-lg font-medium text-gray-800">
                          {form.watch('startHour') !== undefined && form.watch('startMinute') !== undefined
                            ? `${form.watch('startHour')?.toString().padStart(2, '0')}:${form.watch('startMinute')?.toString().padStart(2, '0')}`
                            : '09:00'
                          }
                        </div>
                      </div>

                      {/* Service box - real data */}
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                      <FormField
                        control={form.control}
                              name="serviceId"
                        render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                    <div className="relative">
                                      <select 
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          field.onChange(value ? Number(value) : undefined);
                                        }}
                                        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full cursor-pointer"
                                      >
                                        <option value="">Seleziona servizio</option>
                                        {services && services.length > 0 ? (
                                          services.map((service: any) => (
                                            <option key={service.id} value={service.id}>
                                              {service.name}
                                            </option>
                                          ))
                                        ) : (
                                          <option disabled>Caricamento servizi...</option>
                                        )}
                                      </select>
                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </div>
                                    </div>
                              </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="text-sm text-gray-600 mt-2">
                              CON{" "}
                              <FormField
                                control={form.control}
                                name="stylistId"
                                render={({ field }) => (
                                  <FormItem className="inline">
                                    <FormControl>
                                      <div className="relative inline-block">
                                        <select 
                                          {...field}
                                          value={field.value || ""}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            field.onChange(value ? Number(value) : undefined);
                                          }}
                                          className="appearance-none bg-white border border-gray-300 rounded px-2 py-1 text-sm font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer pr-6"
                                        >
                                          <option value="">Seleziona</option>
                                          {stylists?.map((stylist: any) => (
                                            <option key={stylist.id} value={stylist.id}>
                                              {stylist.name.toUpperCase()}
                                            </option>
                                          ))}
                                        </select>
                                        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>
                                    </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                          <div className="flex items-center space-x-3 ml-4">
                            {/* Duration dropdown - professional with manual override */}
                            <div className="relative">
                              <select 
                                value={mainServiceDuration}
                                onChange={(e) => {
                                  setMainServiceDuration(e.target.value);
                                  setManualDurationOverride(true);
                                }}
                                className={`appearance-none bg-white border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer pr-8 ${
                                  manualDurationOverride 
                                    ? 'border-orange-300 text-orange-700 bg-orange-50' 
                                    : 'border-gray-300 text-gray-700'
                                }`}
                                title={manualDurationOverride ? 'Durata personalizzata' : 'Durata dal servizio'}
                              >
                                <option value="15m">0.15h</option>
                                <option value="30m">0.30h</option>
                                <option value="45m">0.45h</option>
                                <option value="60m">1.00h</option>
                                <option value="75m">1.15h</option>
                                <option value="90m">1.30h</option>
                                <option value="105m">1.45h</option>
                                <option value="120m">2.00h</option>
                                <option value="135m">2.15h</option>
                                <option value="150m">2.30h</option>
                                <option value="180m">3.00h</option>
                              </select>
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center space-x-1">
                                {manualDurationOverride && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full" title="Personalizzato"></div>
                                )}
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Reset duration button (only show if manually overridden) */}
                            {manualDurationOverride && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  const selectedService = services?.find(s => s.id === form.watch('serviceId'));
                                  if (selectedService && selectedService.duration) {
                                    setMainServiceDuration(`${selectedService.duration}m`);
                                    setManualDurationOverride(false);
                                  }
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                title="Ripristina durata del servizio"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                            
                            {/* Delete button */}
                            <button type="button" className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Additional Services */}
                      {additionalServices.map((additionalService) => (
                        <div key={additionalService.id} className="bg-gray-100 rounded-lg p-4 border-l-4 border-blue-400">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="relative">
                                <select 
                                  value={additionalService.serviceId}
                                  onChange={(e) => updateAdditionalService(additionalService.id, 'serviceId', parseInt(e.target.value))}
                                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full cursor-pointer"
                                >
                                  <option value={0}>Seleziona servizio aggiuntivo</option>
                                  {services && services.length > 0 ? (
                                    services.map((service: any) => (
                                      <option key={service.id} value={service.id}>
                                        {service.name}
                                      </option>
                                    ))
                                  ) : (
                                    <option disabled>Caricamento servizi...</option>
                                  )}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mt-2">
                                SERVIZIO AGGIUNTIVO
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 ml-4">
                              {/* Duration dropdown for additional service */}
                              <div className="relative">
                                                                 <select 
                                   value={additionalService.duration}
                                   onChange={(e) => updateAdditionalService(additionalService.id, 'duration', e.target.value)}
                                   className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer pr-8"
                                 >
                                   <option value="15m">0.15h</option>
                                   <option value="30m">0.30h</option>
                                   <option value="45m">0.45h</option>
                                   <option value="60m">1.00h</option>
                                   <option value="75m">1.15h</option>
                                   <option value="90m">1.30h</option>
                                   <option value="105m">1.45h</option>
                                   <option value="120m">2.00h</option>
                                 </select>
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              {/* Delete button for additional service */}
                              <button 
                                type="button" 
                                onClick={() => removeAdditionalService(additionalService.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Rimuovi servizio"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Cleaning time - professional */}
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg text-gray-600">⚡</span>
                            <span className="text-sm font-medium text-gray-700">Tempo di pulizia</span>
                          </div>
                          <div className="relative">
                            <select 
                              value={cleaningTime}
                              onChange={(e) => setCleaningTime(e.target.value)}
                              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer pr-8"
                            >
                              <option value="0m">0.00h</option>
                              <option value="15m">0.15h</option>
                              <option value="30m">0.30h</option>
                            </select>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Next appointment time - calculated dynamically */}
                      <div className="text-left">
                        <div className="text-base font-medium text-gray-800">
                          {(() => {
                            // Get start time
                            const startHour = form.watch('startHour') ?? 9;
                            const startMinute = form.watch('startMinute') ?? 0;
                            
                            // Convert main service duration to minutes
                            const mainDurationMinutes = parseInt(mainServiceDuration.replace('m', ''));
                            
                            // Add additional services duration
                            let additionalDuration = 0;
                            additionalServices.forEach(addService => {
                              const minutes = parseInt(addService.duration.replace('m', ''));
                              additionalDuration += minutes;
                            });
                            
                            // Add cleaning time duration  
                            const cleaningDurationMinutes = parseInt(cleaningTime.replace('m', ''));
                            
                            // Calculate total end time
                            const startTotalMinutes = startHour * 60 + startMinute;
                            const totalDurationMinutes = mainDurationMinutes + additionalDuration + cleaningDurationMinutes;
                            const endTotalMinutes = startTotalMinutes + totalDurationMinutes;
                            
                            const endHour = Math.floor(endTotalMinutes / 60);
                            const endMinute = endTotalMinutes % 60;
                            
                            return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
                          })()}
                        </div>
                      </div>

                      {/* Add service button */}
                      <div className="text-left">
                        <button 
                          type="button" 
                          onClick={addAdditionalService}
                          className="text-blue-500 text-sm font-medium hover:underline"
                        >
                          + AGGIUNGI SERVIZIO
                        </button>
                      </div>

                      {/* Most used services - horizontal buttons */}
                      <div className="text-left">
                        <div className="text-blue-500 text-sm underline mb-2">Più usati</div>
                        <div className="flex flex-wrap gap-2">
                          {mostUsedServices.map((service) => (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => addMostUsedService(service.name)}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
                            >
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {service.icon}
                              </div>
                              <span>{service.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hidden fields for form validation */}
                      <div className="hidden">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="startHour"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="startMinute"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="clientType"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} value="new" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                </form>
              </Form>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Navigation */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={navigatePrevious} className="h-10 w-10 p-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl md:text-2xl font-semibold min-w-0">
                  {viewMode === 'month' 
                    ? format(selectedDate, "MMMM yyyy", { locale: it })
                    : format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })
                  }
                </h2>
                <Button variant="outline" onClick={navigateNext} className="h-10 w-10 p-0">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center space-x-2 flex-wrap">
                {/* Day view filters */}
                {viewMode === 'day' && (
                  <Select value={selectedStylistFilter.toString()} onValueChange={(value) => setSelectedStylistFilter(value === 'all' ? 'all' : Number(value))}>
                    <SelectTrigger className="w-48 md:w-56 h-10">
                      <SelectValue placeholder="Tutti i Collaboratori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i Collaboratori</SelectItem>
                      {stylists?.map((stylist: any) => (
                        <SelectItem key={stylist.id} value={stylist.id.toString()}>
                          {stylist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="h-9 px-4"
                  >
                    Mese
                  </Button>
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                    className="h-9 px-4"
                  >
                    Giornaliera
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={navigateToday} className="h-9 px-4">
                  Oggi
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => triggerRemindersMutation.mutate()}
                  disabled={triggerRemindersMutation.isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-9 px-4"
                >
                  {triggerRemindersMutation.isPending ? "Invio..." : "Test WhatsApp"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : viewMode === 'month' ? (
              <div className="space-y-4 p-6">
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
              // Professional Day View Grid - Optimized for iPad
              <div className="w-full overflow-x-auto">
                <div className="min-w-full" style={{ minWidth: filteredStylists.length > 2 ? '1000px' : '800px' }}>
                  {/* Header with stylist names */}
                  <div className="grid border-b border-gray-300" style={{ gridTemplateColumns: '120px repeat(' + filteredStylists.length + ', 1fr)' }}>
                    <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-r border-gray-300 font-bold text-base text-gray-800 flex items-center justify-center">
                      {format(selectedDate, "MMM dd", { locale: it }).toUpperCase()}
                </div>
                    {filteredStylists.map((stylist: any) => (
                      <div key={stylist.id} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-r border-gray-300 text-center font-bold text-base text-gray-900 flex items-center justify-center">
                        {stylist.name.toUpperCase()}
                      </div>
                  ))}
                </div>
                  
                  {/* Time grid */}
                  <div className="relative bg-white">
                    {timeSlots.map((time, timeIndex) => (
                      <div key={time} className="grid border-b border-gray-200 hover:bg-gray-50" style={{ gridTemplateColumns: '120px repeat(' + filteredStylists.length + ', 1fr)', height: '60px' }}>
                        {/* Time label */}
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-300 text-sm font-medium text-gray-700 flex items-center justify-center">
                          <div className="text-center">
                            <div className="font-bold">{time}</div>
                            {timeIndex % 2 === 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.floor(timeIndex / 2) + 8}:00
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Stylist columns */}
                        {filteredStylists.map((stylist: any, stylistIndex) => {
                          // Find appointments for this stylist at this time
                          const stylistAppointments = dayAppointments.filter(apt => 
                            apt.stylistId === stylist.id &&
                            timeToPosition(apt.startTime) <= timeIndex &&
                            timeToPosition(apt.endTime) > timeIndex
                          );
                          
                          // Only render appointment block at start time
                          const appointmentAtStart = stylistAppointments.find(apt => 
                            timeToPosition(apt.startTime) === timeIndex
                          );
                          
                          // Check if this cell is occupied by any appointment
                          const isOccupied = stylistAppointments.length > 0;
                          
                          return (
                            <div 
                              key={stylist.id} 
                              className="relative border-r border-gray-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
                              onClick={() => !isOccupied && handleEmptyCellClick(stylist.id, time)}
                            >
                              {appointmentAtStart && (
                                <div
                                  className="absolute inset-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm p-3 rounded-lg shadow-lg border-l-4 border-blue-700 z-10 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                                  style={{
                                    height: `${getAppointmentHeight(appointmentAtStart.startTime, appointmentAtStart.endTime) * 60 - 4}px`,
                                    top: '2px'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppointmentClick(appointmentAtStart);
                                  }}
                                >
                                  <div className="font-bold truncate text-sm leading-tight mb-1">
                                    {appointmentAtStart.client.firstName} {appointmentAtStart.client.lastName}
                                  </div>
                                  <div className="truncate opacity-90 text-xs leading-tight mb-1">
                                    {appointmentAtStart.service.name}
                                  </div>
                                  {getAppointmentHeight(appointmentAtStart.startTime, appointmentAtStart.endTime) > 1 && (
                                    <div className="text-xs opacity-80 leading-tight font-medium">
                                      {Math.round(appointmentAtStart.service.duration / 60 * 100) / 100}h
                                    </div>
                                  )}
                                  {getAppointmentHeight(appointmentAtStart.startTime, appointmentAtStart.endTime) > 2 && (
                                    <div className="text-xs opacity-75 leading-tight mt-1">
                                      €{(appointmentAtStart.service.price / 100).toFixed(0)}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Visual indicator for empty cells */}
                              {!isOccupied && (
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 border-dashed rounded-lg m-2 flex items-center justify-center transition-all duration-200">
                                  <div className="text-center">
                                    <Plus className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                                    <div className="text-xs text-blue-600 font-medium">Nuovo</div>
                                  </div>
                                </div>
                              )}
                              {/* Time indicator lines */}
                              {timeIndex % 2 === 0 && (
                                <div className="absolute left-0 right-0 top-0 h-px bg-gray-300"></div>
                              )}
                            </div>
                          );
                        })}
                </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Detailed Appointment Modal */}
        <Dialog open={isAppointmentDetailOpen} onOpenChange={setIsAppointmentDetailOpen}>
          <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl w-full mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-lg">
                <span className="font-bold">{selectedAppointment?.client?.firstName} {selectedAppointment?.client?.lastName}</span>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 px-4"
                    onClick={() => selectedAppointment && handleEditAppointment(selectedAppointment)}
                  >
                    Modifica
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 w-10 p-0 hover:bg-gray-100"
                    onClick={() => setIsAppointmentDetailOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedAppointment && (
              <div className="space-y-6">
                {/* Date and Time */}
                <div className="text-base text-gray-600 font-medium">
                  {format(new Date(selectedAppointment.date), 'EEEE, d MMMM yyyy', { locale: it })} - {selectedAppointment.startTime}
                </div>
                
                {/* Client Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-full">
                      <Input 
                        value={selectedAppointment.client?.phone || ''} 
                        placeholder="Telefono"
                        readOnly
                        className="bg-gray-50 h-12 text-base"
                      />
                      <div className="text-sm text-green-600 mt-2 font-medium">COMPILA QUI PER RACCOGLIERE PIÙ RECENSIONI!</div>
                    </div>
                  </div>
                  <Input 
                    value={selectedAppointment.client?.email || ''} 
                    placeholder="Email"
                    readOnly
                    className="bg-gray-50 h-12 text-base"
                  />
                </div>
                
                {/* Service Details */}
                <div className="space-y-4">
                  <div className="text-base font-bold text-gray-700">
                    {selectedAppointment.startTime}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-base">{selectedAppointment.service?.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          CON {selectedAppointment.stylist?.name?.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select defaultValue="0.30h">
                          <SelectTrigger className="w-24 h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.15h">0.15h</SelectItem>
                            <SelectItem value="0.30h">0.30h</SelectItem>
                            <SelectItem value="0.45h">0.45h</SelectItem>
                            <SelectItem value="1.00h">1.00h</SelectItem>
                            <SelectItem value="1.15h">1.15h</SelectItem>
                            <SelectItem value="1.30h">1.30h</SelectItem>
                            <SelectItem value="1.45h">1.45h</SelectItem>
                            <SelectItem value="2.00h">2.00h</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cleaning Time */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg text-gray-600">⚡</span>
                      <span className="text-sm font-medium text-gray-700">Tempo di pulizia</span>
                    </div>
                    <Select defaultValue="0.00h">
                      <SelectTrigger className="w-24 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.00h">0.00h</SelectItem>
                        <SelectItem value="0.15h">0.15h</SelectItem>
                        <SelectItem value="0.30h">0.30h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Next appointment time */}
                  <div className="text-base text-gray-600 font-medium">
                    {(() => {
                      const startTime = selectedAppointment.startTime;
                      const [hours, minutes] = startTime.split(':').map(Number);
                      const duration = selectedAppointment.service?.duration || 30;
                      const endMinutes = minutes + duration;
                      const endHours = hours + Math.floor(endMinutes / 60);
                      const finalMinutes = endMinutes % 60;
                      return `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
                    })()}
                  </div>
                  
                  {/* Add Service Button */}
                  <Button variant="link" className="p-0 h-auto text-blue-500 text-base font-medium">
                    + AGGIUNGI SERVIZIO
                  </Button>
                  
                  {/* Most Used Services */}
                  <div className="text-base text-blue-500 underline cursor-pointer font-medium">
                    Più usati
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
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