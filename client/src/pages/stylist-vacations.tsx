import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trash2, Plus, MapPin } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Vacation {
  id: number;
  stylistId: number;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
  stylist?: {
    id: number;
    name: string;
  };
}

export default function StylistVacations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("Ferie");
  const [notes, setNotes] = useState("");

  // Fetch stylists
  const { data: stylists } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/stylists"],
    queryFn: async () => {
      const response = await fetch("/api/stylists");
      if (!response.ok) throw new Error("Failed to fetch stylists");
      return response.json();
    },
  });

  // Fetch all vacations
  const { data: vacations, refetch: refetchVacations } = useQuery<Vacation[]>({
    queryKey: ["/api/stylists/vacations"],
    queryFn: async () => {
      const response = await fetch("/api/stylists/vacations");
      if (!response.ok) throw new Error("Failed to fetch vacations");
      return response.json();
    },
  });

  // Auto-select first stylist
  useEffect(() => {
    if (stylists && stylists.length > 0 && !selectedStylist) {
      setSelectedStylist(stylists[0].id);
    }
  }, [stylists, selectedStylist]);

  // Add vacation mutation
  const addVacationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStylist || !startDate || !endDate) {
        throw new Error("Tutti i campi sono richiesti");
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error("La data di inizio deve essere precedente alla data di fine");
      }

      const payload = {
        stylistId: selectedStylist,
        startDate,
        endDate,
        reason,
        notes: notes || null,
      };

      console.log('Adding vacation:', payload);

      const response = await fetch("/api/stylists/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore salvando ferie: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ferie aggiunte",
        description: "Le ferie sono state aggiunte con successo.",
      });
      // Reset form
      setStartDate("");
      setEndDate("");
      setReason("Ferie");
      setNotes("");
      // Refresh data
      refetchVacations();
      queryClient.invalidateQueries({ queryKey: ["/api/stylists/vacations"] });
    },
    onError: (error: Error) => {
      console.error('Add vacation error:', error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete vacation mutation
  const deleteVacationMutation = useMutation({
    mutationFn: async (vacationId: number) => {
      const response = await fetch(`/api/stylists/vacations/${vacationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Errore eliminando ferie");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ferie eliminate",
        description: "Le ferie sono state eliminate con successo.",
      });
      refetchVacations();
      queryClient.invalidateQueries({ queryKey: ["/api/stylists/vacations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Filter vacations for selected stylist
  const stylistVacations = vacations?.filter(v => 
    selectedStylist ? v.stylistId === selectedStylist : true
  ) || [];

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestione Ferie</h1>
            <p className="text-gray-600">Aggiungi e gestisci le ferie dei dipendenti</p>
          </div>
        </div>

        {/* Add Vacation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Aggiungi Ferie</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stylist Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dipendente</label>
                <Select
                  value={selectedStylist?.toString()}
                  onValueChange={(value) => setSelectedStylist(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona dipendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {stylists?.map((stylist) => (
                      <SelectItem key={stylist.id} value={stylist.id.toString()}>
                        {stylist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ferie">Ferie</SelectItem>
                    <SelectItem value="Malattia">Malattia</SelectItem>
                    <SelectItem value="Permesso">Permesso</SelectItem>
                    <SelectItem value="Congedo">Congedo</SelectItem>
                    <SelectItem value="Altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inizio</label>
                <Input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fine</label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

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

              {/* Add Button */}
              <div className="md:col-span-2">
                <Button 
                  onClick={() => addVacationMutation.mutate()}
                  disabled={addVacationMutation.isPending || !selectedStylist || !startDate || !endDate}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addVacationMutation.isPending ? "Aggiungendo..." : "Aggiungi Ferie"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Ferie Programmate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stylistVacations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessuna ferie programmata</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stylistVacations.map((vacation) => (
                  <div key={vacation.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold">
                          {vacation.stylist?.name || 
                           stylists?.find(s => s.id === vacation.stylistId)?.name || 
                           `Dipendente ${vacation.stylistId}`}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vacation.reason === 'Ferie' ? 'bg-blue-100 text-blue-800' :
                          vacation.reason === 'Malattia' ? 'bg-red-100 text-red-800' :
                          vacation.reason === 'Permesso' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {vacation.reason}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(vacation.startDate), 'dd MMMM yyyy', { locale: it })} - {' '}
                        {format(new Date(vacation.endDate), 'dd MMMM yyyy', { locale: it })}
                        {vacation.notes && ` • ${vacation.notes}`}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteVacationMutation.mutate(vacation.id)}
                      disabled={deleteVacationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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