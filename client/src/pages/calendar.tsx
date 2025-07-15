import React, { useState, useEffect } from "react";
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
import { Plus, Calendar as CalendarIcon, Clock, User, Scissors, ChevronLeft, ChevronRight, X, Check, Trash2, Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { DraggableAppointment } from "@/components/calendar/draggable-appointment";
import { DroppableDay } from "@/components/calendar/droppable-day";
import { DroppableTimeSlot } from "@/components/calendar/droppable-time-slot";
import { DraggableDailyAppointment } from "@/components/calendar/draggable-daily-appointment";
import { ClientSelector } from "@/components/client-selector";
import { formatPhoneForDisplay, extractPhoneDigits } from "@/lib/phone-utils";

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
  notes: z.string().optional(),
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
  // Cut & Paste state
  const [clipboardAppointment, setClipboardAppointment] = useState<any>(null);
  const [isCutMode, setIsCutMode] = useState(false);
  // Client selector state
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();



  const form = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientType: "new",
      clientName: "",
      clientPhone: "",
      clientId: undefined,
      date: format(selectedDate, "yyyy-MM-dd"),
      startHour: 9,
      startMinute: 0,
      notes: "",
    },
  });

  // Watch for clientType changes to clear other fields
  const clientType = form.watch("clientType");
  const selectedServiceId = form.watch("serviceId");

  // Fetch appointments based on view mode
  const { data: appointments, isLoading, refetch: refetchAppointments } = useQuery<any[]>({
    queryKey: ["/api/appointments", viewMode, format(selectedDate, viewMode === 'month' ? "yyyy-MM" : "yyyy-MM-dd"), selectedDate.getTime()],
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

  // Fetch suggested appointments from recurring reminders
  const { data: suggestedAppointments, isLoading: isLoadingSuggested, refetch: refetchSuggested } = useQuery<any[]>({
    queryKey: ["/api/appointments/suggested", viewMode, format(selectedDate, viewMode === 'month' ? "yyyy-MM" : "yyyy-MM-dd"), selectedDate.getTime()],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (viewMode === 'month') {
        params.set('startDate', format(startOfMonth(selectedDate), "yyyy-MM-dd"));
        params.set('endDate', format(endOfMonth(selectedDate), "yyyy-MM-dd"));
      } else {
        params.set('date', format(selectedDate, "yyyy-MM-dd"));
      }
      
      const response = await fetch(`/api/appointments/suggested?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  // Force refetch when viewMode or selectedDate changes
  useEffect(() => {
    console.log('Calendar refetch triggered:', { viewMode, selectedDate: format(selectedDate, 'yyyy-MM-dd') });
    refetchAppointments();
    refetchSuggested();
  }, [viewMode, selectedDate, refetchAppointments, refetchSuggested]);

  // Combine real appointments with suggested ones
  const allAppointments = [
    ...(appointments || []),
    ...(suggestedAppointments || [])
  ];

  const { data: stylists } = useQuery<any[]>({
    queryKey: ["/api/stylists"],
  });

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });

  // Fetch working hours for all stylists
  const { data: stylistWorkingHours, refetch: refetchWorkingHours } = useQuery<{ [key: number]: any[] }>({
    queryKey: ["/api/stylists/working-hours", stylists?.map(s => s.id)],
    queryFn: async () => {
      if (!stylists || stylists.length === 0) return {};
      
      const workingHoursMap: { [key: number]: any[] } = {};
      
      for (const stylist of stylists) {
        try {
          const response = await fetch(`/api/stylists/working-hours?stylistId=${stylist.id}`);
          if (response.ok) {
            const hours = await response.json();
            workingHoursMap[stylist.id] = hours;
          } else {
            console.warn(`Failed to fetch working hours for stylist ${stylist.id}`);
            workingHoursMap[stylist.id] = [];
          }
        } catch (error) {
          console.error(`Error fetching working hours for stylist ${stylist.id}:`, error);
          workingHoursMap[stylist.id] = [];
        }
      }
      
      return workingHoursMap;
    },
    enabled: !!stylists && stylists.length > 0,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch stylist vacations
  const { data: stylistVacations } = useQuery({
    queryKey: ["/api/stylists/vacations"],
    queryFn: async () => {
      const response = await fetch("/api/stylists/vacations");
      if (!response.ok) throw new Error("Failed to fetch vacations");
      return response.json();
    },
  });

  // Fetch salon extraordinary days
  const { data: extraordinaryDays } = useQuery({
    queryKey: ["/api/salon-extraordinary-days"],
    queryFn: async () => {
      const response = await fetch("/api/salon-extraordinary-days");
      if (!response.ok) throw new Error("Failed to fetch extraordinary days");
      return response.json();
    },
  });

  // Auto-refetch working hours when stylists change
  useEffect(() => {
    if (stylists && stylists.length > 0) {
      refetchWorkingHours();
    }
  }, [stylists, refetchWorkingHours]);

  // Track the last service ID to prevent duration reset on re-renders
  const [lastServiceId, setLastServiceId] = useState<number | null>(null);

  // Auto-update duration when service changes (unless manually overridden)
  useEffect(() => {
    if (selectedServiceId && services && selectedServiceId !== lastServiceId) {
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (selectedService && selectedService.duration) {
        setMainServiceDuration(`${selectedService.duration}m`);
        setManualDurationOverride(false);
        setLastServiceId(selectedServiceId);
      }
    }
  }, [selectedServiceId, services, lastServiceId]);

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch opening hours for calendar time slots
  const { data: openingHours, refetch: refetchHours } = useQuery({
    queryKey: ["/api/settings/hours"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/hours");
        if (response.ok) {
          return response.json();
        }
        // Return default weekly hours on error
        return {
          monday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          tuesday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          wednesday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          thursday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          friday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          saturday: { openTime: "09:00", closeTime: "18:00", isOpen: true },
          sunday: { openTime: "10:00", closeTime: "16:00", isOpen: true }
        };
      } catch (error) {
        return {
          monday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          tuesday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          wednesday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          thursday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          friday: { openTime: "08:00", closeTime: "20:00", isOpen: true },
          saturday: { openTime: "09:00", closeTime: "18:00", isOpen: true },
          sunday: { openTime: "10:00", closeTime: "16:00", isOpen: true }
        };
      }
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Force refresh hours when user navigates to calendar
  useEffect(() => {
    refetchHours();
  }, [viewMode, refetchHours]);

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
      
      // Get duration from manual override or service default
      const durationMinutes = parseInt((mainServiceDuration || '30m').replace('m', '')) || 30;
      
      const endTimeMinutes = startTimeMinutes + durationMinutes;
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
        notes: data.notes || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/suggested"] });
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



  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/appointments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/suggested"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/suggested"] });
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

  const updateExistingAppointment = async (data: AppointmentForm) => {
    try {
      // If client name was changed, update the client first
      if (data.clientName && editingAppointment.client) {
        const currentFullName = `${editingAppointment.client.firstName} ${editingAppointment.client.lastName}`;
        if (data.clientName !== currentFullName) {
          const nameParts = data.clientName.split(' ');
          const firstName = nameParts[0] || data.clientName;
          const lastName = nameParts.slice(1).join(' ') || "";
          
          await apiRequest("PUT", `/api/clients/${editingAppointment.clientId}`, {
            firstName,
            lastName,
            phone: data.clientPhone || editingAppointment.client.phone,
            email: editingAppointment.client.email || "",
            notes: editingAppointment.client.notes || "",
          });
        }
      }

    // Calculate start and end times
    const startTime = `${data.startHour.toString().padStart(2, '0')}:${data.startMinute.toString().padStart(2, '0')}`;
    const startTimeMinutes = data.startHour * 60 + data.startMinute;
    
    // Get duration from manual override or service
    const durationMinutes = parseInt((mainServiceDuration || '30m').replace('m', '')) || 30;
    
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
      notes: data.notes || "",
    };

    updateAppointmentMutation.mutate({ 
      id: editingAppointment.id, 
      data: updateData 
    });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare i dati del cliente",
        variant: "destructive",
      });
    }
  };

  const cancelAppointment = (appointmentId: number) => {
    const appointment = appointments?.find(apt => apt.id === appointmentId);
    const clientName = appointment ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'questo cliente';
    
    if (confirm(`Sei sicuro di voler cancellare l'appuntamento di ${clientName}?`)) {
      deleteAppointmentMutation.mutate(appointmentId);
      // Close dialogs after deletion
      setIsDialogOpen(false);
      setIsAppointmentDetailOpen(false);
      setEditingAppointment(null);
      setSelectedAppointment(null);
    }
  };

  // Cut & Paste functions
  const cutAppointment = (appointment: any) => {
    setClipboardAppointment(appointment);
    setIsCutMode(true);
    setIsAppointmentDetailOpen(false);
    
    // Check if duration was modified for feedback
    const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
    const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
    const actualDuration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    const serviceDuration = appointment.service?.duration || 30;
    const isDurationModified = actualDuration !== serviceDuration;
    
    toast({
      title: "Appuntamento tagliato",
      description: `${appointment.client.firstName} ${appointment.client.lastName} - Vai su un altro giorno e clicca "Incolla"${isDurationModified ? ' (durata personalizzata)' : ''}`,
    });
  };

  const pasteAppointment = (targetDate: string, targetStylistId?: number, targetTime?: string) => {
    if (!clipboardAppointment) return;

    const newData: any = {
      date: targetDate,
      clientId: clipboardAppointment.clientId,
      serviceId: clipboardAppointment.serviceId,
      stylistId: targetStylistId || clipboardAppointment.stylistId,
    };

    // If specific time is provided, use it; otherwise keep original time
    if (targetTime) {
      const [hours, minutes] = targetTime.split(':').map(Number);
      
      // Calculate actual duration from the original appointment (maintains manual duration changes)
      const [originalStartHours, originalStartMinutes] = clipboardAppointment.startTime.split(':').map(Number);
      const [originalEndHours, originalEndMinutes] = clipboardAppointment.endTime.split(':').map(Number);
      const actualDuration = (originalEndHours * 60 + originalEndMinutes) - (originalStartHours * 60 + originalStartMinutes);
      
      const endMinutes = minutes + actualDuration;
      const endHours = hours + Math.floor(endMinutes / 60);
      const finalMinutes = endMinutes % 60;
      
      newData.startTime = targetTime;
      newData.endTime = `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
    } else {
      newData.startTime = clipboardAppointment.startTime;
      newData.endTime = clipboardAppointment.endTime;
    }

    // Update the appointment
    updateAppointmentMutation.mutate({
      id: clipboardAppointment.id,
      data: newData
    });

    // Clear clipboard
    setClipboardAppointment(null);
    setIsCutMode(false);
    
    // Check if duration was modified for feedback
    const [originalStartHours, originalStartMinutes] = clipboardAppointment.startTime.split(':').map(Number);
    const [originalEndHours, originalEndMinutes] = clipboardAppointment.endTime.split(':').map(Number);
    const actualDuration = (originalEndHours * 60 + originalEndMinutes) - (originalStartHours * 60 + originalStartMinutes);
    const serviceDuration = clipboardAppointment.service?.duration || 30;
    const isDurationModified = actualDuration !== serviceDuration;

    toast({
      title: "Appuntamento incollato",
      description: `${clipboardAppointment.client.firstName} ${clipboardAppointment.client.lastName} spostato con successo${isDurationModified ? ' (durata personalizzata mantenuta)' : ''}`,
    });
  };

  const cancelCut = () => {
    setClipboardAppointment(null);
    setIsCutMode(false);
    toast({
      title: "Operazione annullata",
      description: "Taglia e incolla annullato",
    });
  };

  // Function to handle client selection from client selector
  const handleClientSelection = (client: any) => {
    form.setValue("clientId", client.id);
    form.setValue("clientName", `${client.firstName} ${client.lastName}`);
    form.setValue("clientPhone", extractPhoneDigits(client.phone));
    setIsClientSelectorOpen(false);
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
    if (!allAppointments) return [];
    const dateString = format(date, "yyyy-MM-dd");
    return allAppointments.filter(apt => apt.date === dateString);
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
    const newTime = over.data.current?.time;
    const newStylistId = over.data.current?.stylistId;
    
    // Handle date change (monthly view)
    if (newDate && !newTime) {
    // Check if we're actually moving to a different date
    const currentDate = draggedAppointment.date;
    if (currentDate === newDate) {
      setDraggedAppointment(null);
      return;
    }

    // Update the appointment with the new date (maintaining original endTime)
    updateAppointmentMutation.mutate({
      id: appointmentId,
      data: {
        date: newDate,
        startTime: draggedAppointment.startTime,
        endTime: draggedAppointment.endTime,
        clientId: draggedAppointment.clientId,
        serviceId: draggedAppointment.serviceId,
        stylistId: draggedAppointment.stylistId,
      }
    });
    }
    
    // Handle time change (daily view)
    if (newTime && newStylistId !== undefined) {
      // Check if we're actually moving to a different time or stylist
      const currentTime = draggedAppointment.startTime;
      const currentStylistId = draggedAppointment.stylistId;
      
      if (currentTime === newTime && currentStylistId === newStylistId) {
        setDraggedAppointment(null);
        return;
      }

      // Calculate duration from the actual appointment (maintains manual duration changes)
      const [startHours, startMinutes] = draggedAppointment.startTime.split(':').map(Number);
      const [endHours, endMinutes] = draggedAppointment.endTime.split(':').map(Number);
      const currentDuration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
      
      // Calculate new end time maintaining the same duration
      const [newHours, newMinutes] = newTime.split(':').map(Number);
      const newEndMinutes = newMinutes + currentDuration;
      const newEndHours = newHours + Math.floor(newEndMinutes / 60);
      const finalNewEndMinutes = newEndMinutes % 60;
      const endTime = `${newEndHours.toString().padStart(2, '0')}:${finalNewEndMinutes.toString().padStart(2, '0')}`;

      // Update the appointment with the new time and stylist
      updateAppointmentMutation.mutate({
        id: appointmentId,
        data: {
          date: draggedAppointment.date,
          startTime: newTime,
          endTime: endTime,
          clientId: draggedAppointment.clientId,
          serviceId: draggedAppointment.serviceId,
          stylistId: newStylistId,
        }
      });
    }

    setDraggedAppointment(null);
  };

  // Generate calendar days for monthly view
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filter appointments for the selected date
  const dayAppointments = allAppointments?.filter(app => app.date === format(selectedDate, "yyyy-MM-dd")) || [];

  // Force re-render when opening hours change
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    if (openingHours) {
      console.log('🕒 Opening hours changed:', openingHours);
      setForceUpdate(prev => prev + 1);
    }
  }, [openingHours]);

  // Helper function to get day name from date
  const getDayName = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Generate time slots based on opening hours for the selected day (15min intervals)
  const timeSlots = React.useMemo(() => {
    // Get the day name for the selected date
    const currentDay = getDayName(selectedDate);
    
    // Get hours for the current day
    let dayHours;
    if (openingHours && openingHours[currentDay]) {
      dayHours = openingHours[currentDay];
    } else if (openingHours && openingHours.openTime) {
      // Old format fallback
      dayHours = { openTime: openingHours.openTime, closeTime: openingHours.closeTime, isOpen: true };
    } else {
      // Default fallback
      dayHours = { openTime: "08:00", closeTime: "20:00", isOpen: true };
    }
    
    // If the salon is closed this day, return empty slots
    if (!dayHours.isOpen) {
      return [];
    }
    
    const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);
    
    const openTimeMinutes = openHour * 60 + openMinute;
    const closeTimeMinutes = closeHour * 60 + closeMinute;
    
    const slots = [];
    for (let minutes = openTimeMinutes; minutes < closeTimeMinutes; minutes += 15) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
    
    return slots;
  }, [openingHours, selectedDate, forceUpdate]);

  // Filter stylists based on selection
  const filteredStylists = selectedStylistFilter === 'all' 
    ? stylists || []
    : stylists?.filter(s => s.id === selectedStylistFilter) || [];

  // Helper function to convert time to grid position
  const timeToPosition = (time: string) => {
    if (!time || typeof time !== 'string') {
      return 0;
    }
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return 0;
    }
    
    // Get the day name for the selected date
    const currentDay = getDayName(selectedDate);
    
    // Get hours for the current day
    let dayHours;
    if (openingHours && openingHours[currentDay]) {
      dayHours = openingHours[currentDay];
    } else if (openingHours && openingHours.openTime) {
      // Old format fallback
      dayHours = { openTime: openingHours.openTime, closeTime: openingHours.closeTime, isOpen: true };
    } else {
      // Default fallback
      dayHours = { openTime: "08:00", closeTime: "20:00", isOpen: true };
    }
    
    const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMinute;
    const timeMinutes = hours * 60 + minutes;
    
    const relativeMinutes = timeMinutes - openTimeMinutes;
    return Math.max(0, relativeMinutes / 15); // Each slot is 15 minutes
  };

  // Helper function to get appointment height based on duration
  const getAppointmentHeight = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    // Each time slot is 15 minutes, so calculate how many slots the appointment spans
    return Math.max(1, Math.ceil(durationMinutes / 15));
  };

  // Helper function to check if a time slot is occupied by any appointment (starting or extending)
  const isTimeSlotOccupied = (stylistId: number, timeIndex: number, appointments: any[]) => {
    return appointments.some(apt => {
      if (!apt.stylistId || !apt.startTime || !apt.endTime || apt.stylistId !== stylistId) {
        return false;
      }
      
      const startPosition = timeToPosition(apt.startTime);
      const height = getAppointmentHeight(apt.startTime, apt.endTime);
      const endPosition = startPosition + height - 1;
      
      // Check if the current timeIndex falls within this appointment's range
      return timeIndex >= startPosition && timeIndex <= endPosition;
    });
  };

  // Helper function to check if a stylist is working at a specific time
  const isStylistWorkingAtTime = (stylistId: number, time: string): boolean => {
    if (!stylistWorkingHours || !stylistWorkingHours[stylistId]) {
      return false; // Default to not working if no hours are set
    }

    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const workingHours = stylistWorkingHours[stylistId];
    const dayHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

    if (!dayHours || !dayHours.isWorking) {
      return false; // Not working this day
    }

    // Convert time to minutes for comparison
    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;

    const [startHour, startMinute] = dayHours.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = dayHours.endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  };

  // Helper function to check if a stylist is on break at a specific time
  const isStylistOnBreak = (stylistId: number, time: string): boolean => {
    if (!stylistWorkingHours || !stylistWorkingHours[stylistId]) {
      return false; // Default to not on break if no hours are set
    }

    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const workingHours = stylistWorkingHours[stylistId];
    const dayHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

    if (!dayHours || !dayHours.isWorking || !dayHours.breakStartTime || !dayHours.breakEndTime) {
      return false; // Not working this day or no break time set
    }

    // Convert time to minutes for comparison
    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;

    // First check if it's within working hours
    const [startHour, startMinute] = dayHours.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = dayHours.endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    const isWithinWorkingHours = timeMinutes >= startMinutes && timeMinutes < endMinutes;
    
    if (!isWithinWorkingHours) {
      return false; // Not even in working hours
    }

    // Check if time is during break time
    const [breakStartHour, breakStartMinute] = dayHours.breakStartTime.split(':').map(Number);
    const breakStartMinutes = breakStartHour * 60 + breakStartMinute;

    const [breakEndHour, breakEndMinute] = dayHours.breakEndTime.split(':').map(Number);
    const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

    return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
  };

  // Helper function to check if a stylist is on vacation on a specific date
  const isStylistOnVacation = (stylistId: number, date: Date): boolean => {
    if (!stylistVacations || stylistVacations.length === 0) {
      return false;
    }

    const targetDate = format(date, 'yyyy-MM-dd');
    
    return stylistVacations.some((vacation: any) => {
      if (!vacation.isActive || vacation.stylistId !== stylistId) {
        return false;
      }
      
      // Check if the target date falls within the vacation period
      return vacation.startDate <= targetDate && vacation.endDate >= targetDate;
    });
  };

  // Helper function to get salon extraordinary day for a specific date
  const getSalonExtraordinaryDay = (date: Date) => {
    if (!extraordinaryDays || extraordinaryDays.length === 0) {
      return null;
    }

    const targetDate = format(date, 'yyyy-MM-dd');
    
    return extraordinaryDays.find((day: any) => day.date === targetDate) || null;
  };

  // Function to handle appointment click - opens edit directly
  const handleAppointmentClick = (appointment: any) => {
    handleEditAppointment(appointment);
  };

  // Function to handle appointment details (for viewing details)
  const handleAppointmentDetails = (appointment: any) => {
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
      clientPhone: extractPhoneDigits(appointment.client.phone || ""),
      notes: appointment.notes || "",
    });

    // Set duration based on appointment
    const appointmentDuration = appointment.service?.duration || 30;
    setMainServiceDuration(`${appointmentDuration}m`);
    setManualDurationOverride(false);
    setLastServiceId(appointment.serviceId);
    
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
    // Check if stylist is working at this time
    const isWorking = isStylistWorkingAtTime(stylistId, timeSlot);
    const isOnBreak = isStylistOnBreak(stylistId, timeSlot);
    
    if (!isWorking) {
      toast({
        title: "Dipendente non disponibile",
        description: isOnBreak ? "Il dipendente è in pausa" : "Il dipendente non lavora in questo orario",
        variant: "destructive"
      });
      return;
    }

    // If there's something in clipboard, paste it
    if (clipboardAppointment) {
      pasteAppointment(format(selectedDate, "yyyy-MM-dd"), stylistId, timeSlot);
      return;
    }
    
    // Otherwise set default values for creating new appointment
    const [hours, minutes] = timeSlot.split(':').map(Number);
    form.reset({
      date: format(selectedDate, "yyyy-MM-dd"),
      startHour: hours,
      startMinute: minutes,
      stylistId: stylistId,
      clientType: "new",
      clientName: "",
      clientPhone: "",
      clientId: undefined,
      serviceId: undefined, // Set to undefined to show placeholder
      notes: "",
    });
    // Reset additional services and durations
    setAdditionalServices([]);
    setMainServiceDuration("30m");
    setCleaningTime("0m");
    setManualDurationOverride(false);
    setLastServiceId(null);
    setEditingAppointment(null);
    setIsDialogOpen(true);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-close-button > button:last-child {
            display: none !important;
          }
        `
      }} />
      <Layout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appuntamenti</h1>
            <p className="text-gray-600">Gestisci tutti gli appuntamenti del salone</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Paste Button - only visible when there's something to paste */}
            {clipboardAppointment && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline"
                  className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                  onClick={() => pasteAppointment(format(selectedDate, "yyyy-MM-dd"))}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Incolla qui
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={cancelCut}
                  title="Annulla taglia e incolla"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Appuntamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] p-0 hide-close-button">
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
                    {editingAppointment && (
                      <button 
                        type="button"
                        onClick={() => cutAppointment(editingAppointment)}
                        className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center"
                        title="Taglia appuntamento"
                      >
                        <Scissors className="h-4 w-4 text-white" />
                      </button>
                    )}
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
                      
                      {/* Client Selection/Name field - FIRST */}
                      <div className="space-y-2">
                    <FormField
                      control={form.control}
                          name="clientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange("existing");
                                      form.setValue("clientName", "");
                                      form.setValue("clientPhone", "");
                                    }}
                                    className={`flex-1 h-12 px-4 rounded-full text-base font-medium transition-all ${
                                      field.value === "existing" 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    Cliente Esistente
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange("new");
                                      form.setValue("clientId", undefined);
                                      form.setValue("clientName", "");
                                      form.setValue("clientPhone", "");
                                    }}
                                    className={`flex-1 h-12 px-4 rounded-full text-base font-medium transition-all ${
                                      field.value === "new" 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    Nuovo Cliente
                                  </button>
                                </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                        {/* Existing Client Selection - Browse Button */}
                        {form.watch("clientType") === "existing" && (
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsClientSelectorOpen(true)}
                              className="w-full h-12 px-4 bg-gray-100 border-0 rounded-full text-base font-medium hover:bg-gray-200 transition-colors"
                            >
                              <User className="h-4 w-4 mr-2" />
                              {form.watch("clientName") || "Sfoglia Rubrica Clienti"}
                            </Button>
                            {form.watch("clientId") && (
                        <div className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    form.setValue("clientId", undefined);
                                    form.setValue("clientName", "");
                                    form.setValue("clientPhone", "");
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  Deseleziona cliente
                                </Button>
                          </div>
                            )}
                        </div>
                        )}

                        {/* Client Name Input - Always visible and editable */}
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                              <FormControl>
                              <input 
                                {...field}
                                  placeholder={
                                    form.watch("clientType") === "existing" 
                                      ? "Nome e cognome cliente (editabile)" 
                                      : "Nome e cognome del nuovo cliente"
                                  }
                                  className="w-full h-12 px-4 bg-white border border-gray-300 rounded-full text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                          </FormControl>
                              <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>

                      {/* Phone field - SECOND */}
                      <div className="space-y-2">
                      <FormField
                        control={form.control}
                          name="clientPhone"
                        render={({ field }) => (
                          <FormItem>
                              <FormControl>
                              <div className="flex w-full h-12 bg-gray-100 rounded-full border-0 focus-within:ring-2 focus-within:ring-blue-200">
                                <div className="flex items-center px-4 text-gray-600 font-medium">
                                  +39
                                </div>
                                <input 
                                  {...field}
                                  placeholder="376 102 4089" 
                                  className="flex-1 bg-transparent text-base placeholder-gray-500 focus:outline-none pr-4"
                                  readOnly={form.watch("clientType") === "existing" && Boolean(form.watch("clientId"))}
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
                          </FormItem>
                        )}
                      />

                      </div>

                      {/* Time display - THIRD */}
                      <div className="space-y-2">
                      <div className="text-left">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Orario</label>
                          <div className="flex space-x-2">
                            <div className="flex-1">
                      <FormField
                        control={form.control}
                                name="startHour"
                        render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                      <select 
                                {...field}
                                        value={field.value || 9}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        className="w-full h-12 px-4 bg-gray-100 border-0 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none"
                                      >
                                        {(() => {
                                          // Get current day's opening hours
                                          const selectedDay = selectedDate ? format(selectedDate, 'EEEE').toLowerCase() : 'monday';
                                          const dayHours = openingHours?.[selectedDay] || { openTime: '08:00', closeTime: '22:00', isOpen: true };
                                          
                                          if (!dayHours.isOpen) {
                                            return <option value={9}>09</option>; // Fallback if closed
                                          }
                                          
                                          // Parse opening and closing hours
                                          const openHour = parseInt(dayHours.openTime.split(':')[0]);
                                          const closeHour = parseInt(dayHours.closeTime.split(':')[0]);
                                          
                                          // Generate hours from open to close
                                          const hours = [];
                                          for (let hour = openHour; hour <= closeHour; hour++) {
                                            hours.push(hour);
                                          }
                                          
                                          return hours.map(hour => (
                                            <option key={hour} value={hour}>
                                              {hour.toString().padStart(2, '0')}
                                            </option>
                                          ));
                                        })()}
                                      </select>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex items-center text-lg font-medium text-gray-600">:</div>
                            <div className="flex-1">
                              <FormField
                                control={form.control}
                                name="startMinute"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <select 
                                        {...field}
                                        value={field.value || 0}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        className="w-full h-12 px-4 bg-gray-100 border-0 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none"
                                      >
                                        {[0, 15, 30, 45].map(minute => (
                                          <option key={minute} value={minute}>
                                            {minute.toString().padStart(2, '0')}
                                          </option>
                                        ))}
                                      </select>
                              </FormControl>
                          </FormItem>
                        )}
                      />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service box - FOURTH */}
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
                                    setLastServiceId(selectedService.id);
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
                            {editingAppointment && (
                              <button 
                                type="button" 
                                onClick={() => cancelAppointment(editingAppointment.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Cancella appuntamento"
                              >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            )}
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

                      {/* Notes field */}
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Note (opzionale)
                              </label>
                              <FormControl>
                                <textarea 
                                  {...field}
                                  placeholder="Aggiungi note per questo appuntamento..."
                                  className="w-full h-20 px-4 py-3 bg-gray-100 border-0 rounded-lg text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                  </div>
                </form>
              </Form>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Calendar Navigation */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            {/* Mobile Header */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={navigatePrevious} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold truncate">
                    {viewMode === 'month' 
                      ? format(selectedDate, "MMM yyyy", { locale: it })
                      : format(selectedDate, "d MMM", { locale: it })
                    }
                  </h2>
                  <Button variant="outline" onClick={navigateNext} className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={navigateToday} className="h-8 px-3 text-xs">
                  Oggi
                </Button>
              </div>
              
              <div className="flex flex-col space-y-2">
                {/* Day view filters - Mobile */}
                {viewMode === 'day' && (
                  <Select value={selectedStylistFilter.toString()} onValueChange={(value) => setSelectedStylistFilter(value === 'all' ? 'all' : Number(value))}>
                    <SelectTrigger className="w-full h-10">
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
                
            <div className="flex items-center justify-between">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1 flex-1 mr-2">
                    <Button
                      variant={viewMode === 'month' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('month')}
                      className="h-8 px-3 text-xs flex-1"
                    >
                      Mese
                    </Button>
                    <Button
                      variant={viewMode === 'day' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('day')}
                      className="h-8 px-3 text-xs flex-1"
                    >
                      Giorno
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop/Tablet Header */}
            <div className="hidden sm:flex items-center justify-between flex-wrap gap-4">
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
                
                {/* Color Legend - only in day view */}
                {viewMode === 'day' && (
                  <div className="flex items-center space-x-3 text-xs bg-gray-50 px-3 py-2 rounded-lg border">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-purple-300 rounded"></div>
                      <span>Ferie</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-300 rounded"></div>
                      <span>Chiuso</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                      <span>Orario Speciale</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-200 rounded"></div>
                      <span>Pausa</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-400 rounded"></div>
                      <span>Non Lavora</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(isLoading || isLoadingSuggested) ? (
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
              <div className="w-full">
                {/* Check if salon is closed today */}
                {timeSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Salone Chiuso</h3>
                    <p className="text-gray-600 mb-4">
                      Il salone è chiuso {format(selectedDate, 'EEEE d MMMM', { locale: it })}
                    </p>
                    <Button 
                      onClick={() => {
                        setSelectedDate(new Date());
                      }}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      Vai a Oggi
                    </Button>
                  </div>
                ) : (
                  <div>
                {/* Mobile Day View */}
                <div className="block sm:hidden">
                  <div className="space-y-4 p-4">
                    {filteredStylists.map((stylist: any) => (
                      <div key={stylist.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Stylist Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-gray-200">
                          <h3 className="font-bold text-lg text-gray-900">{stylist.name.toUpperCase()}</h3>
                </div>
                        
                        {/* Time slots for this stylist */}
                        <div className="divide-y divide-gray-100">
                          {timeSlots.map((time, timeIndex) => {
                            const appointmentAtStart = dayAppointments.find(apt => {
                              // Validate appointment has required fields
                              if (!apt.stylistId || !apt.startTime) {
                                return false;
                              }
                              
                              return apt.stylistId === stylist.id &&
                                timeToPosition(apt.startTime) === timeIndex;
                            });
                            
                            const isOccupied = appointmentAtStart !== undefined || isTimeSlotOccupied(stylist.id, timeIndex, dayAppointments);
                            const isStylistWorking = isStylistWorkingAtTime(stylist.id, time);
                            const isStylistOnBreakTime = isStylistOnBreak(stylist.id, time);
                            const isStylistOnVacationToday = isStylistOnVacation(stylist.id, selectedDate);
                            const extraordinaryDay = getSalonExtraordinaryDay(selectedDate);
                            
                            // Determine cell background color based on status
                            let cellClasses = "flex-1 min-h-[60px] relative overflow-visible";
                            if (isStylistOnVacationToday) {
                              cellClasses += " bg-purple-300 bg-opacity-80"; // Purple for vacation
                            } else if (extraordinaryDay) {
                              if (!extraordinaryDay.isClosed) {
                                cellClasses += " bg-yellow-200 bg-opacity-80"; // Yellow for extraordinary open day
                              } else {
                                cellClasses += " bg-red-300 bg-opacity-80"; // Red for extraordinary closed day
                              }
                            } else if (isStylistOnBreakTime) {
                              cellClasses += " bg-orange-200 bg-opacity-70"; // Orange for break time
                            } else if (!isStylistWorking) {
                              cellClasses += " bg-gray-400 bg-opacity-70"; // Gray for not working
                            }
                            
                            return (
                              <div key={time} className="flex">
                                <div className="w-16 bg-gray-50 px-3 py-4 border-r border-gray-200 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-sm font-medium text-gray-700">{time}</div>
                                  </div>
                                </div>
                                <DroppableTimeSlot
                                  time={time}
                                  stylistId={stylist.id}
                                  isOccupied={isOccupied}
                                  isWorkingHour={isStylistWorking}
                                  isBreakTime={isStylistOnBreakTime}
                                  onEmptyClick={() => handleEmptyCellClick(stylist.id, time)}
                                  hasPendingPaste={!!clipboardAppointment}
                                >
                                  <div className={cellClasses}>
                                  {appointmentAtStart && (
                                      <DraggableDailyAppointment
                                        appointment={appointmentAtStart}
                                        height={getAppointmentHeight(appointmentAtStart.startTime, appointmentAtStart.endTime)}
                                        onAppointmentClick={handleAppointmentClick}
                                        isCut={clipboardAppointment?.id === appointmentAtStart.id}
                                      />
                                        )}
                                      </div>
                                </DroppableTimeSlot>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                  ))}
                </div>
                </div>

                {/* Desktop/Tablet Day View */}
                <div className="hidden sm:block w-full">
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
                            <div className="font-bold text-base">{time}</div>
                          </div>
                        </div>
                        
                        {/* Stylist columns */}
                        {filteredStylists.map((stylist: any, stylistIndex) => {
                          // Find appointments for this stylist that START at this exact time
                          const appointmentAtStart = dayAppointments.find(apt => {
                            // Validate appointment has required fields
                            if (!apt.stylistId || !apt.startTime) {
                              return false;
                            }
                            
                            return apt.stylistId === stylist.id &&
                              timeToPosition(apt.startTime) === timeIndex;
                          });
                          
                          // Check if this cell is occupied by an appointment starting here or extending from previous slots
                          const isOccupied = appointmentAtStart !== undefined || isTimeSlotOccupied(stylist.id, timeIndex, dayAppointments);
                          const isStylistWorking = isStylistWorkingAtTime(stylist.id, time);
                          const isStylistOnBreakTime = isStylistOnBreak(stylist.id, time);
                          const isStylistOnVacationToday = isStylistOnVacation(stylist.id, selectedDate);
                          const extraordinaryDay = getSalonExtraordinaryDay(selectedDate);
                          
                          // Determine cell background color based on status
                          let cellClasses = "relative border-r border-gray-300";
                          
                          // Priority order: vacation > extraordinary day > break > not working > working
                          if (isStylistOnVacationToday) {
                            cellClasses += " bg-purple-300 bg-opacity-80"; // Purple for vacation
                          } else if (extraordinaryDay) {
                            if (!extraordinaryDay.isClosed) {
                              cellClasses += " bg-yellow-200 bg-opacity-80"; // Yellow for extraordinary open day
                            } else {
                              cellClasses += " bg-red-300 bg-opacity-80"; // Red for extraordinary closed day
                            }
                          } else if (isStylistOnBreakTime) {
                            cellClasses += " bg-orange-200 bg-opacity-70"; // Orange for break time
                          } else if (!isStylistWorking) {
                            cellClasses += " bg-gray-400 bg-opacity-70"; // Gray for not working
                          }
                          
                          return (
                            <div
                              key={stylist.id}
                              className={cellClasses}
                            >
                              <DroppableTimeSlot
                                time={time}
                                stylistId={stylist.id}
                                isOccupied={isOccupied}
                                isWorkingHour={isStylistWorking}
                                isBreakTime={isStylistOnBreakTime}
                                onEmptyClick={() => handleEmptyCellClick(stylist.id, time)}
                                hasPendingPaste={!!clipboardAppointment}
                              >
                                <div className="absolute inset-0 overflow-visible">
                                  {appointmentAtStart && (
                                    <DraggableDailyAppointment
                                      appointment={appointmentAtStart}
                                      height={getAppointmentHeight(appointmentAtStart.startTime, appointmentAtStart.endTime)}
                                      onAppointmentClick={handleAppointmentClick}
                                      isCut={clipboardAppointment?.id === appointmentAtStart.id}
                                    />
                                  )}
                                </div>
                                {/* Time indicator lines */}
                                {timeIndex % 2 === 0 && (
                                  <div className="absolute left-0 right-0 top-0 h-px bg-gray-300"></div>
                                )}
                              </DroppableTimeSlot>
                            </div>
                          );
                        })}
                </div>
                    ))}
                  </div>
                </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Detailed Appointment Modal */}
        <Dialog open={isAppointmentDetailOpen} onOpenChange={setIsAppointmentDetailOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto hide-close-button">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
                <span className="font-bold truncate mr-2">{selectedAppointment?.client?.firstName} {selectedAppointment?.client?.lastName}</span>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 sm:h-10 sm:px-4 text-xs sm:text-sm"
                    onClick={() => selectedAppointment && handleEditAppointment(selectedAppointment)}
                  >
                    Modifica
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-gray-100"
                    onClick={() => setIsAppointmentDetailOpen(false)}
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
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
                        value={formatPhoneForDisplay(selectedAppointment.client?.phone || '')} 
                        placeholder="Telefono"
                        readOnly
                        className="bg-gray-50 h-12 text-base"
                      />

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
                  
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="font-bold text-sm sm:text-base">{selectedAppointment.service?.name}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          CON {selectedAppointment.stylist?.name?.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-2">
                        <Select defaultValue="0.30h">
                          <SelectTrigger className="w-20 sm:w-24 h-8 sm:h-10 text-xs sm:text-sm">
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 sm:h-10 sm:w-10 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => selectedAppointment && cancelAppointment(selectedAppointment.id)}
                          title="Cancella appuntamento"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cleaning Time */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 bg-gray-50 p-3 sm:p-4 rounded-lg border">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <span className="text-base sm:text-lg text-gray-600">⚡</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Tempo di pulizia</span>
                    </div>
                    <Select defaultValue="0.00h">
                      <SelectTrigger className="w-20 sm:w-24 h-8 sm:h-10 text-xs sm:text-sm">
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

        {/* Client Selector Modal */}
        <ClientSelector
          isOpen={isClientSelectorOpen}
          onClose={() => setIsClientSelectorOpen(false)}
          onSelectClient={handleClientSelection}
          clients={clients || []}
        />
      </div>
    </Layout>
    </DndContext>
  );
}