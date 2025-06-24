import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MessageSquare, Edit, Trash2, Settings as SettingsIcon, Clock, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const templateSchema = z.object({
  name: z.string().min(1, "Nome è richiesto"),
  template: z.string().min(1, "Template è richiesto"),
});

const dayHoursSchema = z.object({
  openTime: z.string().min(1, "Orario di apertura è richiesto"),
  closeTime: z.string().min(1, "Orario di chiusura è richiesto"),
  isOpen: z.boolean(),
});

const weeklyHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

type MessageTemplate = {
  id: number;
  name: string;
  template: string;
  isActive: boolean;
  createdAt: string;
};

export default function Settings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      template: "",
    },
  });

  const hoursForm = useForm<z.infer<typeof weeklyHoursSchema>>({
    resolver: zodResolver(weeklyHoursSchema),
    defaultValues: {
      monday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      tuesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      wednesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      thursday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      friday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      saturday: { openTime: "09:00", closeTime: "20:00", isOpen: true },
      sunday: { openTime: "10:00", closeTime: "18:00", isOpen: false },
    },
  });

  const { data: templates, isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates"],
  });

  // Fetch opening hours
  const { data: openingHours } = useQuery({
    queryKey: ["/api/settings/hours"],
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window gets focus
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/hours");
        if (response.ok) {
          return response.json();
        }
        // Return default weekly hours on error
        return {
          monday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          tuesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          wednesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          thursday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          friday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          saturday: { openTime: "09:00", closeTime: "20:00", isOpen: true },
          sunday: { openTime: "10:00", closeTime: "18:00", isOpen: false }
        };
      } catch (error) {
        console.error("Error fetching opening hours:", error);
        // Return default weekly hours on error
        return {
          monday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          tuesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          wednesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          thursday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          friday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
          saturday: { openTime: "09:00", closeTime: "20:00", isOpen: true },
          sunday: { openTime: "10:00", closeTime: "18:00", isOpen: false }
        };
      }
    },
  });

  // Update form when data loads
  useEffect(() => {
    console.log('🔄 Settings: Opening hours data received:', openingHours);
    if (openingHours) {
      // Check if it's the new weekly format
      if (openingHours.monday) {
        console.log('✅ Settings: Using new weekly format');
        hoursForm.reset(openingHours);
      } else {
        console.log('🔄 Settings: Converting old format to weekly');
        // Old format - convert to weekly
        const defaultHours = {
          openTime: openingHours.openTime || "08:00",
          closeTime: openingHours.closeTime || "22:00",
          isOpen: true
        };
        hoursForm.reset({
          monday: defaultHours,
          tuesday: defaultHours,
          wednesday: defaultHours,
          thursday: defaultHours,
          friday: defaultHours,
          saturday: { ...defaultHours, openTime: "09:00", closeTime: "20:00" },
          sunday: { ...defaultHours, openTime: "10:00", closeTime: "18:00", isOpen: false },
        });
      }
    }
  }, [openingHours, hoursForm]);

  const createTemplateMutation = useMutation({
    mutationFn: (data: z.infer<typeof templateSchema>) => 
      apiRequest("POST", "/api/message-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Template creato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile creare il template",
        variant: "destructive" 
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof templateSchema> }) =>
      apiRequest("PUT", `/api/message-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
      toast({ title: "Template aggiornato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile aggiornare il template",
        variant: "destructive" 
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/message-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({ title: "Template eliminato con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile eliminare il template",
        variant: "destructive" 
      });
    },
  });

  const saveHoursMutation = useMutation({
    mutationFn: async (data: z.infer<typeof weeklyHoursSchema>) => {
      console.log('💾 Settings: Saving hours data:', data);
      const response = await fetch("/api/settings/hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Settings: Save failed:', errorText);
        throw new Error(errorText);
      }
      
      const result = await response.json();
      console.log('✅ Settings: Save successful:', result);
      return result;
    },
    onSuccess: () => {
      // Invalidate both settings and calendar queries to update everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/settings/hours"] });
      toast({ title: "Orari settimanali salvati con successo - Il calendario si aggiornerà automaticamente" });
    },
    onError: (error) => {
      console.error('❌ Settings: Save error:', error);
      toast({ 
        title: "Errore", 
        description: "Impossibile salvare gli orari: " + error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (values: z.infer<typeof templateSchema>) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: values });
    } else {
      createTemplateMutation.mutate(values);
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      template: template.template,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
          <p className="text-gray-600">Configura le impostazioni del salone</p>
        </div>

        {/* WhatsApp Templates Section */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Template WhatsApp</CardTitle>
                <CardDescription>
                  Gestisci i template per i messaggi automatici di promemoria
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    onClick={() => {
                      setEditingTemplate(null);
                      form.reset();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? "Modifica Template" : "Nuovo Template"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTemplate 
                        ? "Modifica il template per i messaggi WhatsApp"
                        : "Crea un nuovo template per i messaggi WhatsApp"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Template</FormLabel>
                            <FormControl>
                              <Input placeholder="Es. Promemoria Appuntamento" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="template"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Messaggio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Ciao [NOME], ti ricordiamo il tuo appuntamento di domani alle [ORA] per [SERVIZIO]. A presto! 💇‍♀️"
                                className="resize-none h-24"
                                {...field} 
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500 mt-1">
                              Variabili disponibili: [NOME], [ORA], [SERVIZIO], [STILISTA]
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                      >
                        {editingTemplate ? "Aggiorna" : "Crea"} Template
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : !templates || templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nessun template configurato</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                        {template.template}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
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

        {/* Additional Settings Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Informazioni Salone</span>
              </CardTitle>
              <CardDescription>
                Configura le informazioni di base del salone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome Salone</label>
                  <Input defaultValue="Salone di Bellezza" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Indirizzo</label>
                  <Input placeholder="Via Roma 123, Milano" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefono</label>
                  <Input placeholder="+39 02 1234567" className="mt-1" />
                </div>
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  Salva Impostazioni
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Opening Hours Section */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Orari di Apertura Settimanali</span>
            </CardTitle>
            <CardDescription>
              Configura gli orari di lavoro per ogni giorno della settimana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...hoursForm}>
              <form onSubmit={hoursForm.handleSubmit((data) => saveHoursMutation.mutate(data))} className="space-y-6">
                <div className="space-y-4">
                  {[
                    { key: 'monday', label: 'Lunedì', icon: '👔' },
                    { key: 'tuesday', label: 'Martedì', icon: '💼' },
                    { key: 'wednesday', label: 'Mercoledì', icon: '📅' },
                    { key: 'thursday', label: 'Giovedì', icon: '⭐' },
                    { key: 'friday', label: 'Venerdì', icon: '🎉' },
                    { key: 'saturday', label: 'Sabato', icon: '🌟' },
                    { key: 'sunday', label: 'Domenica', icon: '🏠' }
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{label}</h3>
                            <p className="text-sm text-gray-500">Configura orari per {label.toLowerCase()}</p>
                          </div>
                        </div>
                        <FormField
                          control={hoursForm.control}
                          name={`${key}.isOpen` as any}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-medium">
                                {field.value ? 'Aperto' : 'Chiuso'}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={hoursForm.control}
                        name={`${key}.isOpen` as any}
                        render={({ field }) => (
                          field.value && (
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={hoursForm.control}
                                name={`${key}.openTime` as any}
                                render={({ field: timeField }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center space-x-1">
                                      <Clock className="h-4 w-4" />
                                      <span>Apertura</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="time" 
                                        {...timeField}
                                        className="bg-white border-gray-300"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={hoursForm.control}
                                name={`${key}.closeTime` as any}
                                render={({ field: timeField }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center space-x-1">
                                      <Clock className="h-4 w-4" />
                                      <span>Chiusura</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="time" 
                                        {...timeField}
                                        className="bg-white border-gray-300"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )
                        )}
                      />
                    </div>
                  ))}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-3 text-lg font-semibold"
                  disabled={saveHoursMutation.isPending}
                >
                  {saveHoursMutation.isPending ? "Salvando..." : "💾 Salva Orari Settimanali"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}