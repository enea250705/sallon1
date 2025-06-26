import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, User, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";

type StylistSchedule = {
  id: number;
  stylistId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isWorking: boolean;
  breaks: any[] | null;
  notes: string | null;
};

type StylistWeeklyTemplate = {
  id: number;
  stylistId: number;
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  isWorking: boolean;
  breaks: any[] | null;
};

const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function StylistSchedules() {
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [editingTemplate, setEditingTemplate] = useState<StylistWeeklyTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stylists
  const { data: stylists, isLoading: isLoadingStylists } = useQuery<any[]>({
    queryKey: ["/api/stylists"],
  });

  // Fetch stylist weekly templates
  const { data: weeklyTemplates, isLoading: isLoadingTemplates } = useQuery<StylistWeeklyTemplate[]>({
    queryKey: ["/api/stylists", selectedStylist, "schedule", "template"],
    queryFn: () => selectedStylist ? apiRequest("GET", `/api/stylists/${selectedStylist}/schedule?template=true`) : [],
    enabled: !!selectedStylist,
  });

  // Fetch specific date schedule
  const { data: dateSchedule, isLoading: isLoadingSchedule } = useQuery<StylistSchedule>({
    queryKey: ["/api/stylists", selectedStylist, "schedule", selectedDate],
    queryFn: () => selectedStylist ? apiRequest("GET", `/api/stylists/${selectedStylist}/schedule?date=${selectedDate}`) : null,
    enabled: !!selectedStylist && !!selectedDate,
  });

  const updateTemplateMutation = useMutation({
    mutationFn: (data: { dayOfWeek: number; templateData: any }) =>
      apiRequest("POST", `/api/stylists/${selectedStylist}/schedule`, {
        template: true,
        dayOfWeek: data.dayOfWeek,
        ...data.templateData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stylists", selectedStylist, "schedule", "template"] });
      toast({ title: "Orario template aggiornato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile aggiornare l'orario template",
        variant: "destructive" 
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (scheduleData: any) =>
      apiRequest("POST", `/api/stylists/${selectedStylist}/schedule`, {
        date: selectedDate,
        ...scheduleData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stylists", selectedStylist, "schedule", selectedDate] });
      toast({ title: "Orario giornaliero aggiornato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile aggiornare l'orario giornaliero",
        variant: "destructive" 
      });
    },
  });

  const handleTemplateUpdate = (dayOfWeek: number, templateData: any) => {
    updateTemplateMutation.mutate({ dayOfWeek, templateData });
  };

  const formatBreaks = (breaks: any[] | null) => {
    if (!breaks || breaks.length === 0) return "Nessuna pausa";
    
    return breaks.map(b => {
      const type = b.type === 'lunch' ? 'Pranzo' : 'Pausa';
      return `${type}: ${b.startTime}-${b.endTime}`;
    }).join(", ");
  };

  const addBreak = (dayOfWeek: number, currentBreaks: any[] | null) => {
    const breaks = currentBreaks || [];
    const newBreak = {
      startTime: "12:30",
      endTime: "13:30",
      type: "lunch"
    };
    
    const template = weeklyTemplates?.find(t => t.dayOfWeek === dayOfWeek);
    if (template) {
      handleTemplateUpdate(dayOfWeek, {
        ...template,
        breaks: [...breaks, newBreak]
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Orari Stilisti</h1>
          <p className="text-gray-600">Gestisci gli orari di lavoro e le pause per ogni stilista</p>
        </div>

        {/* Stylist Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Seleziona Stilista</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingStylists ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                </div>
              ) : (
                stylists?.map((stylist) => (
                  <Card 
                    key={stylist.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStylist === stylist.id ? 'ring-2 ring-pink-500 bg-pink-50' : ''
                    }`}
                    onClick={() => setSelectedStylist(stylist.id)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="font-bold text-lg">{stylist.name}</div>
                        {stylist.phone && (
                          <div className="text-sm text-gray-600">{stylist.phone}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Template */}
        {selectedStylist && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Orari Settimanali Standard</span>
              </CardTitle>
              <CardDescription>
                Configura gli orari standard per ogni giorno della settimana
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayNames.map((dayName, dayIndex) => {
                    const template = weeklyTemplates?.find(t => t.dayOfWeek === dayIndex);
                    
                    return (
                      <div key={dayIndex} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-20 font-medium">{dayName}</div>
                          <Switch
                            checked={template?.isWorking || false}
                            onCheckedChange={(checked) => {
                              handleTemplateUpdate(dayIndex, {
                                isWorking: checked,
                                startTime: checked ? "08:00" : null,
                                endTime: checked ? "18:00" : null,
                                breaks: checked ? [{ startTime: "12:30", endTime: "13:30", type: "lunch" }] : null,
                              });
                            }}
                          />
                        </div>
                        
                        {template?.isWorking && (
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={template.startTime || "08:00"}
                                onChange={(e) => {
                                  handleTemplateUpdate(dayIndex, {
                                    ...template,
                                    startTime: e.target.value,
                                  });
                                }}
                                className="w-24"
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={template.endTime || "18:00"}
                                onChange={(e) => {
                                  handleTemplateUpdate(dayIndex, {
                                    ...template,
                                    endTime: e.target.value,
                                  });
                                }}
                                className="w-24"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Coffee className="h-3 w-3" />
                                <span className="text-xs">{formatBreaks(template.breaks)}</span>
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addBreak(dayIndex, template.breaks)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Specific Date Override */}
        {selectedStylist && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Orario Specifico</span>
              </CardTitle>
              <CardDescription>
                Modifica gli orari per una data specifica (sovrascrive il template settimanale)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                  <Button
                    onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                    variant="outline"
                    size="sm"
                  >
                    Oggi
                  </Button>
                </div>

                {dateSchedule ? (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium mb-2">Orario personalizzato per {format(new Date(selectedDate), "PPPP", { locale: it })}</h4>
                    <div className="space-y-2">
                      <div>Lavora: {dateSchedule.isWorking ? "Sì" : "No"}</div>
                      {dateSchedule.isWorking && (
                        <>
                          <div>Orario: {dateSchedule.startTime} - {dateSchedule.endTime}</div>
                          <div>Pause: {formatBreaks(dateSchedule.breaks)}</div>
                        </>
                      )}
                      {dateSchedule.notes && (
                        <div>Note: {dateSchedule.notes}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-600">Nessun orario personalizzato per questa data. Verrà utilizzato il template settimanale.</p>
                    <Button
                      className="mt-2"
                      onClick={() => {
                        updateScheduleMutation.mutate({
                          isWorking: true,
                          startTime: "08:00",
                          endTime: "18:00",
                          breaks: [{ startTime: "12:30", endTime: "13:30", type: "lunch" }],
                        });
                      }}
                    >
                      Crea Orario Personalizzato
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
} 