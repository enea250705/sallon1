import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trash2, Plus, Star, Edit } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface ExtraordinaryDay {
  id: number;
  date: string;
  reason: string;
  isClosed: boolean;
  specialOpenTime?: string;
  specialCloseTime?: string;
  notes?: string;
}

export default function SalonExtraordinaryDays() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [type, setType] = useState("Festività");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [notes, setNotes] = useState("");
  const [editingDay, setEditingDay] = useState<ExtraordinaryDay | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch extraordinary days
  const { data: extraordinaryDays, refetch: refetchDays } = useQuery<ExtraordinaryDay[]>({
    queryKey: ["/api/salon-extraordinary-days"],
    queryFn: async () => {
      const response = await fetch("/api/salon-extraordinary-days");
      if (!response.ok) throw new Error("Failed to fetch extraordinary days");
      return response.json();
    },
  });

  // Add extraordinary day mutation
  const addDayMutation = useMutation({
    mutationFn: async () => {
      if (!date) {
        throw new Error("Data richiesta");
      }

      if (!type) {
        throw new Error("Tipo richiesto");
      }

      const reason = description ? `${type} - ${description}` : type;

      const payload = {
        date,
        reason,
        isClosed: !isOpen,
        specialOpenTime: isOpen ? openTime : null,
        specialCloseTime: isOpen ? closeTime : null,
        notes: notes || null,
      };

      console.log('Adding extraordinary day:', payload);

      const response = await fetch("/api/salon-extraordinary-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore salvando giorno straordinario: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Giorno straordinario aggiunto",
        description: "Il giorno straordinario è stato aggiunto con successo.",
      });
      // Reset form
      resetForm();
      // Refresh data
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ["/api/salon-extraordinary-days"] });
    },
    onError: (error: Error) => {
      console.error('Add extraordinary day error:', error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update extraordinary day mutation
  const updateDayMutation = useMutation({
    mutationFn: async () => {
      if (!editingDay) {
        throw new Error("Nessun giorno da modificare");
      }

      if (!date) {
        throw new Error("Data richiesta");
      }

      if (!type) {
        throw new Error("Tipo richiesto");
      }

      const reason = description ? `${type} - ${description}` : type;

      const payload = {
        date,
        reason,
        isClosed: !isOpen,
        specialOpenTime: isOpen ? openTime : null,
        specialCloseTime: isOpen ? closeTime : null,
        notes: notes || null,
      };

      console.log('Updating extraordinary day:', payload);

      const response = await fetch(`/api/salon-extraordinary-days/${editingDay.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore aggiornando giorno straordinario: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Giorno straordinario aggiornato",
        description: "Il giorno straordinario è stato aggiornato con successo.",
      });
      // Reset form and editing state
      resetForm();
      setIsEditing(false);
      setEditingDay(null);
      // Refresh data
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ["/api/salon-extraordinary-days"] });
    },
    onError: (error: Error) => {
      console.error('Update extraordinary day error:', error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete extraordinary day mutation
  const deleteDayMutation = useMutation({
    mutationFn: async (dayId: number) => {
      const response = await fetch(`/api/salon-extraordinary-days/${dayId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Errore eliminando giorno straordinario");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Giorno straordinario eliminato",
        description: "Il giorno straordinario è stato eliminato con successo.",
      });
      refetchDays();
      queryClient.invalidateQueries({ queryKey: ["/api/salon-extraordinary-days"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form function
  const resetForm = () => {
    setDate("");
    setType("Festività");
    setDescription("");
    setIsOpen(false);
    setOpenTime("09:00");
    setCloseTime("18:00");
    setNotes("");
  };

  // Edit day function
  const handleEditDay = (day: ExtraordinaryDay) => {
    setEditingDay(day);
    setIsEditing(true);
    
    // Parse the reason to extract type and description
    const reasonParts = day.reason.split(' - ');
    const dayType = reasonParts[0];
    const dayDescription = reasonParts.slice(1).join(' - ');
    
    setDate(day.date);
    setType(dayType);
    setDescription(dayDescription);
    setIsOpen(!day.isClosed);
    setOpenTime(day.specialOpenTime || "09:00");
    setCloseTime(day.specialCloseTime || "18:00");
    setNotes(day.notes || "");
  };

  // Cancel edit function
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingDay(null);
    resetForm();
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Sort extraordinary days by date
  const sortedDays = extraordinaryDays?.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ) || [];

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Giorni Straordinari</h1>
            <p className="text-gray-600">Gestisci festività e giorni speciali del salone</p>
          </div>
        </div>

        {/* Add/Edit Extraordinary Day Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>{isEditing ? "Modifica Giorno Straordinario" : "Aggiungi Giorno Straordinario"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Festività">Festività</SelectItem>
                    <SelectItem value="Evento Speciale">Evento Speciale</SelectItem>
                    <SelectItem value="Chiusura Straordinaria">Chiusura Straordinaria</SelectItem>
                    <SelectItem value="Orario Ridotto">Orario Ridotto</SelectItem>
                    <SelectItem value="Apertura Straordinaria">Apertura Straordinaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Descrizione</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Es. Natale, Capodanno, Evento promozionale..."
                />
              </div>

              {/* Open/Closed */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Stato</label>
                <Select value={isOpen ? "open" : "closed"} onValueChange={(value) => setIsOpen(value === "open")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed">Chiuso</SelectItem>
                    <SelectItem value="open">Aperto con orari speciali</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hours (only if open) */}
              {isOpen && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Orario Apertura</label>
                    <Input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Orario Chiusura</label>
                    <Input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Note (opzionale)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note aggiuntive..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 flex space-x-2">
                <Button 
                  onClick={() => isEditing ? updateDayMutation.mutate() : addDayMutation.mutate()}
                  disabled={(isEditing ? updateDayMutation.isPending : addDayMutation.isPending) || !date || !description}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isEditing 
                    ? (updateDayMutation.isPending ? "Aggiornando..." : "Aggiorna Giorno Straordinario")
                    : (addDayMutation.isPending ? "Aggiungendo..." : "Aggiungi Giorno Straordinario")
                  }
                </Button>
                {isEditing && (
                  <Button 
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="px-4"
                  >
                    Annulla
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extraordinary Days List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Giorni Straordinari Programmati</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedDays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun giorno straordinario programmato</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDays.map((day) => (
                  <div key={day.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold">{day.reason}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          !day.isClosed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {!day.isClosed ? 'Aperto con orari speciali' : 'Chiuso'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(day.date), 'dd MMMM yyyy', { locale: it })}
                        {!day.isClosed && day.specialOpenTime && day.specialCloseTime && 
                          ` • ${day.specialOpenTime} - ${day.specialCloseTime}`}
                        {day.notes && ` • ${day.notes}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDay(day)}
                        disabled={isEditing}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDayMutation.mutate(day.id)}
                        disabled={deleteDayMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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