import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Save } from "lucide-react";

const DAYS = [
  { key: 'monday', label: 'Lunedì', dayOfWeek: 1 },
  { key: 'tuesday', label: 'Martedì', dayOfWeek: 2 },
  { key: 'wednesday', label: 'Mercoledì', dayOfWeek: 3 },
  { key: 'thursday', label: 'Giovedì', dayOfWeek: 4 },
  { key: 'friday', label: 'Venerdì', dayOfWeek: 5 },
  { key: 'saturday', label: 'Sabato', dayOfWeek: 6 },
  { key: 'sunday', label: 'Domenica', dayOfWeek: 0 }
];

interface WorkingDay {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

export default function StylistHours() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);

  // Fetch stylists
  const { data: stylists } = useQuery({
    queryKey: ["/api/stylists"],
    queryFn: async () => {
      const response = await fetch("/api/stylists");
      if (!response.ok) throw new Error("Failed to fetch stylists");
      return response.json();
    },
  });

  // Fetch existing working hours for selected stylist
  const { data: existingWorkingHours, isLoading: loadingHours } = useQuery({
    queryKey: ["/api/stylists/working-hours", selectedStylist],
    queryFn: async () => {
      if (!selectedStylist) return null;
      const response = await fetch(`/api/stylists/working-hours?stylistId=${selectedStylist}`);
      if (!response.ok) throw new Error("Failed to fetch working hours");
      return response.json();
    },
    enabled: !!selectedStylist,
  });

  // Initialize working days when stylist changes or existing hours are loaded
  useEffect(() => {
    if (selectedStylist) {
      if (existingWorkingHours && existingWorkingHours.length > 0) {
        // Use existing hours from database
        const workingDaysFromDB = DAYS.map(day => {
          const existingDay = existingWorkingHours.find((wh: any) => wh.dayOfWeek === day.dayOfWeek);
          if (existingDay) {
            return {
              dayOfWeek: day.dayOfWeek,
              isWorking: existingDay.isWorking,
              startTime: existingDay.startTime,
              endTime: existingDay.endTime,
              breakStartTime: existingDay.breakStartTime || "13:00",
              breakEndTime: existingDay.breakEndTime || "14:00"
            };
          } else {
            // Default for days not found in database
            return {
              dayOfWeek: day.dayOfWeek,
              isWorking: day.dayOfWeek >= 1 && day.dayOfWeek <= 6, // Monday to Saturday
              startTime: "09:00",
              endTime: "18:00",
              breakStartTime: "13:00",
              breakEndTime: "14:00"
            };
          }
        });
        setWorkingDays(workingDaysFromDB);
      } else if (!loadingHours) {
        // No existing hours found, use defaults
      const defaultDays = DAYS.map(day => ({
        dayOfWeek: day.dayOfWeek,
        isWorking: day.dayOfWeek >= 1 && day.dayOfWeek <= 6, // Monday to Saturday
        startTime: "09:00",
        endTime: "18:00",
        breakStartTime: "13:00",
        breakEndTime: "14:00"
      }));
      setWorkingDays(defaultDays);
    }
    }
  }, [selectedStylist, existingWorkingHours, loadingHours]);

  // Auto-select first stylist
  useEffect(() => {
    if (stylists?.length > 0 && !selectedStylist) {
      setSelectedStylist(stylists[0].id);
    }
  }, [stylists, selectedStylist]);

  // Save working hours
  const saveHoursMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStylist) throw new Error("No stylist selected");

      const promises = workingDays.map(async (day) => {
        const payload = {
          stylistId: selectedStylist,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          breakStartTime: day.isWorking ? day.breakStartTime : null,
          breakEndTime: day.isWorking ? day.breakEndTime : null,
          isWorking: day.isWorking,
        };

        console.log('Saving day:', payload);
        
        try {
          const response = await fetch("/api/stylists/working-hours", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
          });

          // Check if response is HTML (404 page)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error('API endpoint not found - getting HTML instead of JSON');
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Save failed:', errorText);
            throw new Error(`Failed to save ${DAYS.find(d => d.dayOfWeek === day.dayOfWeek)?.label} hours: ${response.status}`);
          }

          return await response.json();
        } catch (error) {
          console.error('Network error:', error);
          throw new Error(`Network error saving ${DAYS.find(d => d.dayOfWeek === day.dayOfWeek)?.label} hours: ${error.message}`);
        }
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ 
        title: "Orari salvati",
        description: "Gli orari di lavoro sono stati salvati con successo.",
      });
      // Invalidate and refetch working hours
      queryClient.invalidateQueries({ 
        queryKey: ["/api/stylists/working-hours", selectedStylist] 
      });
    },
    onError: (error: Error) => {
      console.error('Save error:', error);
      toast({ 
        title: "Errore API",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update working day
  const updateWorkingDay = (dayOfWeek: number, field: keyof WorkingDay, value: any) => {
    setWorkingDays(prev => prev.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { ...day, [field]: value }
        : day
    ));
  };

  // Apply templates
  const applyFullTime = () => {
    const fullTimeDays = DAYS.map(day => ({
      dayOfWeek: day.dayOfWeek,
      isWorking: day.dayOfWeek >= 1 && day.dayOfWeek <= 6,
      startTime: "09:00",
      endTime: "18:00",
      breakStartTime: "13:00",
      breakEndTime: "14:00"
    }));
    setWorkingDays(fullTimeDays);
  };

  const applyPartTime = () => {
    const partTimeDays = DAYS.map(day => ({
      dayOfWeek: day.dayOfWeek,
      isWorking: day.dayOfWeek >= 2 && day.dayOfWeek <= 5, // Tuesday to Friday
      startTime: "10:00",
      endTime: "15:00",
      breakStartTime: "12:30",
      breakEndTime: "13:00"
    }));
    setWorkingDays(partTimeDays);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orari di Lavoro</h1>
            <p className="text-gray-600">Gestisci gli orari di lavoro dei dipendenti</p>
          </div>
          <Button 
            onClick={() => saveHoursMutation.mutate()}
            disabled={saveHoursMutation.isPending || !selectedStylist}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveHoursMutation.isPending ? "Salvando..." : "Salva Orari"}
          </Button>
        </div>

        {/* Stylist Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleziona Dipendente</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedStylist?.toString()}
              onValueChange={(value) => setSelectedStylist(parseInt(value))}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Seleziona un dipendente" />
              </SelectTrigger>
              <SelectContent>
                {stylists?.map((stylist) => (
                  <SelectItem key={stylist.id} value={stylist.id.toString()}>
                    {stylist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Templates */}
        <div className="flex gap-4">
          <Button onClick={applyFullTime} variant="outline">
            Tempo Pieno (Lun-Sab 9-18)
          </Button>
          <Button onClick={applyPartTime} variant="outline">
            Part Time (Mar-Ven 10-15)
          </Button>
        </div>

        {/* Working Hours */}
        {selectedStylist && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Orari Settimanali</span>
                {loadingHours && (
                  <span className="text-sm text-gray-500">Caricamento...</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const workingDay = workingDays.find(wd => wd.dayOfWeek === day.dayOfWeek);
                  if (!workingDay) return null;

                  return (
                    <div key={day.key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{day.label}</h3>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={workingDay.isWorking}
                            onCheckedChange={(checked) => 
                              updateWorkingDay(day.dayOfWeek, 'isWorking', checked)
                            }
                          />
                          <span className="text-sm">
                            {workingDay.isWorking ? 'Lavora' : 'Libero'}
                          </span>
                        </div>
                      </div>
                      
                      {workingDay.isWorking && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium">Inizio</label>
                            <Input
                              type="time"
                              value={workingDay.startTime}
                              onChange={(e) => 
                                updateWorkingDay(day.dayOfWeek, 'startTime', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Fine</label>
                            <Input
                              type="time"
                              value={workingDay.endTime}
                              onChange={(e) => 
                                updateWorkingDay(day.dayOfWeek, 'endTime', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Pausa Inizio</label>
                            <Input
                              type="time"
                              value={workingDay.breakStartTime}
                              onChange={(e) => 
                                updateWorkingDay(day.dayOfWeek, 'breakStartTime', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Pausa Fine</label>
                            <Input
                              type="time"
                              value={workingDay.breakEndTime}
                              onChange={(e) => 
                                updateWorkingDay(day.dayOfWeek, 'breakEndTime', e.target.value)
                              }
                            />
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
      </div>
    </Layout>
  );
} 