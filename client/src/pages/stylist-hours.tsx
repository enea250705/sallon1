import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, RotateCcw, Users } from "lucide-react";

interface WorkingHours {
  id?: number;
  stylistId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

const DAYS = [
  { id: 1, name: "Lunedì", shortName: "Lun" },
  { id: 2, name: "Martedì", shortName: "Mar" },
  { id: 3, name: "Mercoledì", shortName: "Mer" },
  { id: 4, name: "Giovedì", shortName: "Gio" },
  { id: 5, name: "Venerdì", shortName: "Ven" },
  { id: 6, name: "Sabato", shortName: "Sab" },
  { id: 0, name: "Domenica", shortName: "Dom" },
];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
];

export default function StylistHours() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [workingHours, setWorkingHours] = useState<{ [key: number]: WorkingHours }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch stylists
  const { data: stylists } = useQuery<any[]>({
    queryKey: ["/api/stylists"],
    queryFn: async () => {
      const response = await fetch("/api/stylists");
      if (!response.ok) throw new Error("Failed to fetch stylists");
      return response.json();
    },
  });

  // Fetch working hours for selected stylist
  const { data: currentWorkingHours, refetch } = useQuery<WorkingHours[]>({
    queryKey: ["/api/stylists/working-hours", selectedStylist],
    queryFn: async () => {
      if (!selectedStylist) return [];
      const response = await fetch(`/api/stylists/working-hours?stylistId=${selectedStylist}`);
      if (!response.ok) throw new Error("Failed to fetch working hours");
      return response.json();
    },
    enabled: !!selectedStylist,
  });

  // Initialize working hours when data loads
  useEffect(() => {
    if (currentWorkingHours && selectedStylist) {
      const hoursMap: { [key: number]: WorkingHours } = {};
      
      // Initialize all days with default values
      DAYS.forEach(day => {
        const existing = currentWorkingHours.find(wh => wh.dayOfWeek === day.id);
        hoursMap[day.id] = existing || {
          stylistId: selectedStylist,
          dayOfWeek: day.id,
          startTime: "08:00",
          endTime: "17:00",
          isWorking: day.id !== 0, // Default: work Monday-Saturday, off Sunday
        };
      });
      
      setWorkingHours(hoursMap);
      setHasChanges(false);
    }
  }, [currentWorkingHours, selectedStylist]);

  // Auto-select first stylist
  useEffect(() => {
    if (stylists && stylists.length > 0 && !selectedStylist) {
      setSelectedStylist(stylists[0].id);
    }
  }, [stylists, selectedStylist]);

  // Update working hours
  const updateWorkingHours = (dayOfWeek: number, field: string, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      }
    }));
    setHasChanges(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStylist) return;
      
      const promises = Object.values(workingHours).map(async (hours) => {
        const response = await fetch("/api/stylists/working-hours", {
          method: "POST", // Use POST for upsert
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hours),
        });
        if (!response.ok) throw new Error("Failed to save working hours");
        return response.json();
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: "Orari salvati con successo!" });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/stylists/working-hours"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stylists"] }); // Refresh calendar data
      refetch();
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile salvare gli orari",
        variant: "destructive" 
      });
    },
  });

  // Reset changes
  const resetChanges = () => {
    if (currentWorkingHours && selectedStylist) {
      const hoursMap: { [key: number]: WorkingHours } = {};
      DAYS.forEach(day => {
        const existing = currentWorkingHours.find(wh => wh.dayOfWeek === day.id);
        hoursMap[day.id] = existing || {
          stylistId: selectedStylist,
          dayOfWeek: day.id,
          startTime: "08:00",
          endTime: "17:00",
          isWorking: day.id !== 0,
        };
      });
      setWorkingHours(hoursMap);
      setHasChanges(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8" />
              Orari di Lavoro
            </h1>
            <p className="text-gray-600">Gestisci gli orari di lavoro dei dipendenti</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <Button 
                variant="outline" 
                onClick={resetChanges}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Annulla
              </Button>
            )}
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salva Orari"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Seleziona Dipendente
            </CardTitle>
            <CardDescription>
              Scegli il dipendente per cui modificare gli orari di lavoro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedStylist?.toString() || ""} 
              onValueChange={(value) => setSelectedStylist(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Seleziona un dipendente" />
              </SelectTrigger>
              <SelectContent>
                {stylists?.map((stylist: any) => (
                  <SelectItem key={stylist.id} value={stylist.id.toString()}>
                    {stylist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedStylist && (
          <Card>
            <CardHeader>
              <CardTitle>
                Orari di {stylists?.find(s => s.id === selectedStylist)?.name}
              </CardTitle>
              <CardDescription>
                Modifica gli orari di lavoro per ogni giorno della settimana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const hours = workingHours[day.id];
                  if (!hours) return null;

                  return (
                    <div key={day.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{day.name}</h3>
                          <Switch
                            checked={hours.isWorking}
                            onCheckedChange={(checked) => 
                              updateWorkingHours(day.id, "isWorking", checked)
                            }
                          />
                          <span className="text-sm text-gray-600">
                            {hours.isWorking ? "Lavora" : "Libero"}
                          </span>
                        </div>
                      </div>

                      {hours.isWorking && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Orario di Inizio
                            </label>
                            <Select
                              value={hours.startTime}
                              onValueChange={(value) => 
                                updateWorkingHours(day.id, "startTime", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Orario di Fine
                            </label>
                            <Select
                              value={hours.endTime}
                              onValueChange={(value) => 
                                updateWorkingHours(day.id, "endTime", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Template Rapidi</CardTitle>
            <CardDescription>
              Applica rapidamente orari predefiniti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedStylist) return;
                  const fullTimeHours: { [key: number]: WorkingHours } = {};
                  DAYS.forEach(day => {
                    fullTimeHours[day.id] = {
                      stylistId: selectedStylist,
                      dayOfWeek: day.id,
                      startTime: day.id === 6 ? "09:00" : "08:00", // Saturday 9-17, others 8-18
                      endTime: day.id === 6 ? "17:00" : "18:00",
                      isWorking: day.id !== 0, // Work Monday-Saturday
                    };
                  });
                  setWorkingHours(fullTimeHours);
                  setHasChanges(true);
                }}
                className="h-20 flex-col"
              >
                <div className="font-semibold">Tempo Pieno</div>
                <div className="text-xs text-gray-600">Lun-Ven 8-18, Sab 9-17</div>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedStylist) return;
                  const partTimeHours: { [key: number]: WorkingHours } = {};
                  DAYS.forEach(day => {
                    partTimeHours[day.id] = {
                      stylistId: selectedStylist,
                      dayOfWeek: day.id,
                      startTime: "10:00",
                      endTime: "16:00",
                      isWorking: day.id >= 2 && day.id <= 5, // Work Tuesday-Friday
                    };
                  });
                  setWorkingHours(partTimeHours);
                  setHasChanges(true);
                }}
                className="h-20 flex-col"
              >
                <div className="font-semibold">Part Time</div>
                <div className="text-xs text-gray-600">Mar-Ven 10-16</div>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedStylist) return;
                  const weekendHours: { [key: number]: WorkingHours } = {};
                  DAYS.forEach(day => {
                    weekendHours[day.id] = {
                      stylistId: selectedStylist,
                      dayOfWeek: day.id,
                      startTime: "09:00",
                      endTime: "17:00",
                      isWorking: day.id === 6 || day.id === 0, // Work only weekends
                    };
                  });
                  setWorkingHours(weekendHours);
                  setHasChanges(true);
                }}
                className="h-20 flex-col"
              >
                <div className="font-semibold">Weekend</div>
                <div className="text-xs text-gray-600">Sab-Dom 9-17</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 