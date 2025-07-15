import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings as SettingsIcon, Clock, Calendar, Smartphone, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

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

type WhatsAppStatus = {
  configured: boolean;
  hasAccessToken: boolean;
  hasPhoneNumberId: boolean;
  hasBusinessAccountId: boolean;
};

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // WhatsApp status query
  const { data: whatsappStatus, isLoading: whatsappStatusLoading } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 30000, // Refetch every 30 seconds
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
          <p className="text-gray-600">Configura le impostazioni del salone</p>
        </div>

        {/* WhatsApp Status Section */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Stato WhatsApp</span>
            </CardTitle>
            <CardDescription>
              Verifica la configurazione del servizio WhatsApp Business API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {whatsappStatusLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
              </div>
            ) : whatsappStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {whatsappStatus.configured ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {whatsappStatus.configured ? "WhatsApp Configurato" : "WhatsApp Non Configurato"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {whatsappStatus.configured 
                          ? "Il servizio è pronto per inviare messaggi" 
                          : "Configura le credenziali WhatsApp per abilitare l'invio"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    {whatsappStatus.hasAccessToken ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">Access Token</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    {whatsappStatus.hasPhoneNumberId ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">Phone Number ID</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    {whatsappStatus.hasBusinessAccountId ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">Business Account ID</span>
                  </div>
                </div>

                {!whatsappStatus.configured && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Configurazione Richiesta
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Aggiungi le variabili d'ambiente WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID 
                          al file deploy-config.env per abilitare l'invio di messaggi WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Impossibile caricare lo stato WhatsApp</p>
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
                  <Input placeholder="Inserisci nome salone" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Indirizzo</label>
                  <Input placeholder="Inserisci indirizzo" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefono</label>
                  <Input placeholder="Inserisci numero di telefono" className="mt-1" />
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