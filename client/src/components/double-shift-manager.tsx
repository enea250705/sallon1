import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Sun, Moon, Coffee } from "lucide-react";

interface DoubleShiftWorkingHours {
  id?: number;
  stylistId: number;
  dayOfWeek: number;
  isWorking: boolean;
  // Single shift (legacy)
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  // Double shift (new)
  morningStart?: string;
  morningEnd?: string;
  morningBreakStart?: string;
  morningBreakEnd?: string;
  afternoonStart?: string;
  afternoonEnd?: string;
  afternoonBreakStart?: string;
  afternoonBreakEnd?: string;
}

interface DoubleShiftManagerProps {
  day: { id: number; name: string };
  hours: DoubleShiftWorkingHours;
  timeOptions: string[];
  onUpdate: (dayOfWeek: number, field: string, value: any) => void;
}

const DoubleShiftManager: React.FC<DoubleShiftManagerProps> = ({
  day,
  hours,
  timeOptions,
  onUpdate,
}) => {
  const [shiftMode, setShiftMode] = React.useState<"single" | "double">(
    hours.morningStart && hours.afternoonStart ? "double" : "single"
  );

  const handleShiftModeChange = (mode: "single" | "double") => {
    setShiftMode(mode);
    if (mode === "single") {
      // Clear double shift fields
      onUpdate(day.id, "morningStart", null);
      onUpdate(day.id, "morningEnd", null);
      onUpdate(day.id, "morningBreakStart", null);
      onUpdate(day.id, "morningBreakEnd", null);
      onUpdate(day.id, "afternoonStart", null);
      onUpdate(day.id, "afternoonEnd", null);
      onUpdate(day.id, "afternoonBreakStart", null);
      onUpdate(day.id, "afternoonBreakEnd", null);
      // Set default single shift
      onUpdate(day.id, "startTime", "08:00");
      onUpdate(day.id, "endTime", "17:00");
    } else {
      // Clear single shift fields and set double shift defaults
      onUpdate(day.id, "startTime", null);
      onUpdate(day.id, "endTime", null);
      onUpdate(day.id, "breakStartTime", null);
      onUpdate(day.id, "breakEndTime", null);
      // Set default double shift
      onUpdate(day.id, "morningStart", "08:00");
      onUpdate(day.id, "morningEnd", "12:00");
      onUpdate(day.id, "afternoonStart", "13:00");
      onUpdate(day.id, "afternoonEnd", "17:00");
    }
  };

  if (!hours.isWorking) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p>Giorno di riposo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shift Mode Selector */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <Button
          variant={shiftMode === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => handleShiftModeChange("single")}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Turno Singolo
        </Button>
        <Button
          variant={shiftMode === "double" ? "default" : "outline"}
          size="sm"
          onClick={() => handleShiftModeChange("double")}
          className="flex items-center gap-2"
        >
          <Sun className="h-4 w-4" />
          <Moon className="h-4 w-4" />
          Doppio Turno
        </Button>
      </div>

      {/* Single Shift Mode */}
      {shiftMode === "single" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orario di Inizio
              </label>
              <Select
                value={hours.startTime || ""}
                onValueChange={(value) => onUpdate(day.id, "startTime", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
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
                value={hours.endTime || ""}
                onValueChange={(value) => onUpdate(day.id, "endTime", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Single Shift Break */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Pausa (opzionale)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Inizio Pausa
                  </label>
                  <Select
                    value={hours.breakStartTime || ""}
                    onValueChange={(value) => onUpdate(day.id, "breakStartTime", value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nessuna pausa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna pausa</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Fine Pausa
                  </label>
                  <Select
                    value={hours.breakEndTime || ""}
                    onValueChange={(value) => onUpdate(day.id, "breakEndTime", value || null)}
                    disabled={!hours.breakStartTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fine pausa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Fine pausa</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Double Shift Mode */}
      {shiftMode === "double" && (
        <div className="space-y-4">
          {/* Morning Shift */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-600" />
                Turno Mattina
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inizio Mattina
                  </label>
                  <Select
                    value={hours.morningStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningStart", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fine Mattina
                  </label>
                  <Select
                    value={hours.morningEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningEnd", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario fine" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Morning Break */}
              <div className="bg-white p-3 rounded border border-yellow-300">
                <p className="text-xs font-medium text-gray-600 mb-2">Pausa Mattina (opzionale)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={hours.morningBreakStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningBreakStart", value || null)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={hours.morningBreakEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningBreakEnd", value || null)}
                    disabled={!hours.morningBreakStart}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Fine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Fine</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Afternoon Shift */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Moon className="h-4 w-4 text-orange-600" />
                Turno Pomeriggio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inizio Pomeriggio
                  </label>
                  <Select
                    value={hours.afternoonStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonStart", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fine Pomeriggio
                  </label>
                  <Select
                    value={hours.afternoonEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonEnd", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario fine" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Afternoon Break */}
              <div className="bg-white p-3 rounded border border-orange-300">
                <p className="text-xs font-medium text-gray-600 mb-2">Pausa Pomeriggio (opzionale)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={hours.afternoonBreakStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonBreakStart", value || null)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={hours.afternoonBreakEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonBreakEnd", value || null)}
                    disabled={!hours.afternoonBreakStart}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Fine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Fine</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 p-3 rounded border text-xs text-gray-600">
        <p className="font-medium mb-1">Riepilogo orari {day.name}:</p>
        {shiftMode === "single" && hours.startTime && hours.endTime && (
          <p>🕐 {hours.startTime} - {hours.endTime}</p>
        )}
        {shiftMode === "double" && (
          <div>
            {hours.morningStart && hours.morningEnd && (
              <p>🌅 Mattina: {hours.morningStart} - {hours.morningEnd}</p>
            )}
            {hours.afternoonStart && hours.afternoonEnd && (
              <p>🌇 Pomeriggio: {hours.afternoonStart} - {hours.afternoonEnd}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubleShiftManager; 
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Sun, Moon, Coffee } from "lucide-react";

interface DoubleShiftWorkingHours {
  id?: number;
  stylistId: number;
  dayOfWeek: number;
  isWorking: boolean;
  // Single shift (legacy)
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  // Double shift (new)
  morningStart?: string;
  morningEnd?: string;
  morningBreakStart?: string;
  morningBreakEnd?: string;
  afternoonStart?: string;
  afternoonEnd?: string;
  afternoonBreakStart?: string;
  afternoonBreakEnd?: string;
}

interface DoubleShiftManagerProps {
  day: { id: number; name: string };
  hours: DoubleShiftWorkingHours;
  timeOptions: string[];
  onUpdate: (dayOfWeek: number, field: string, value: any) => void;
}

const DoubleShiftManager: React.FC<DoubleShiftManagerProps> = ({
  day,
  hours,
  timeOptions,
  onUpdate,
}) => {
  const [shiftMode, setShiftMode] = React.useState<"single" | "double">(
    hours.morningStart && hours.afternoonStart ? "double" : "single"
  );

  const handleShiftModeChange = (mode: "single" | "double") => {
    setShiftMode(mode);
    if (mode === "single") {
      // Clear double shift fields
      onUpdate(day.id, "morningStart", null);
      onUpdate(day.id, "morningEnd", null);
      onUpdate(day.id, "morningBreakStart", null);
      onUpdate(day.id, "morningBreakEnd", null);
      onUpdate(day.id, "afternoonStart", null);
      onUpdate(day.id, "afternoonEnd", null);
      onUpdate(day.id, "afternoonBreakStart", null);
      onUpdate(day.id, "afternoonBreakEnd", null);
      // Set default single shift
      onUpdate(day.id, "startTime", "08:00");
      onUpdate(day.id, "endTime", "17:00");
    } else {
      // Clear single shift fields and set double shift defaults
      onUpdate(day.id, "startTime", null);
      onUpdate(day.id, "endTime", null);
      onUpdate(day.id, "breakStartTime", null);
      onUpdate(day.id, "breakEndTime", null);
      // Set default double shift
      onUpdate(day.id, "morningStart", "08:00");
      onUpdate(day.id, "morningEnd", "12:00");
      onUpdate(day.id, "afternoonStart", "13:00");
      onUpdate(day.id, "afternoonEnd", "17:00");
    }
  };

  if (!hours.isWorking) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p>Giorno di riposo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shift Mode Selector */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <Button
          variant={shiftMode === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => handleShiftModeChange("single")}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Turno Singolo
        </Button>
        <Button
          variant={shiftMode === "double" ? "default" : "outline"}
          size="sm"
          onClick={() => handleShiftModeChange("double")}
          className="flex items-center gap-2"
        >
          <Sun className="h-4 w-4" />
          <Moon className="h-4 w-4" />
          Doppio Turno
        </Button>
      </div>

      {/* Single Shift Mode */}
      {shiftMode === "single" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orario di Inizio
              </label>
              <Select
                value={hours.startTime || ""}
                onValueChange={(value) => onUpdate(day.id, "startTime", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
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
                value={hours.endTime || ""}
                onValueChange={(value) => onUpdate(day.id, "endTime", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Single Shift Break */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Pausa (opzionale)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Inizio Pausa
                  </label>
                  <Select
                    value={hours.breakStartTime || ""}
                    onValueChange={(value) => onUpdate(day.id, "breakStartTime", value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nessuna pausa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna pausa</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Fine Pausa
                  </label>
                  <Select
                    value={hours.breakEndTime || ""}
                    onValueChange={(value) => onUpdate(day.id, "breakEndTime", value || null)}
                    disabled={!hours.breakStartTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fine pausa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Fine pausa</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Double Shift Mode */}
      {shiftMode === "double" && (
        <div className="space-y-4">
          {/* Morning Shift */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-600" />
                Turno Mattina
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inizio Mattina
                  </label>
                  <Select
                    value={hours.morningStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningStart", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fine Mattina
                  </label>
                  <Select
                    value={hours.morningEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningEnd", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario fine" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Morning Break */}
              <div className="bg-white p-3 rounded border border-yellow-300">
                <p className="text-xs font-medium text-gray-600 mb-2">Pausa Mattina (opzionale)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={hours.morningBreakStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningBreakStart", value || null)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={hours.morningBreakEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "morningBreakEnd", value || null)}
                    disabled={!hours.morningBreakStart}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Fine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Fine</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Afternoon Shift */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Moon className="h-4 w-4 text-orange-600" />
                Turno Pomeriggio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inizio Pomeriggio
                  </label>
                  <Select
                    value={hours.afternoonStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonStart", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fine Pomeriggio
                  </label>
                  <Select
                    value={hours.afternoonEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonEnd", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Orario fine" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Afternoon Break */}
              <div className="bg-white p-3 rounded border border-orange-300">
                <p className="text-xs font-medium text-gray-600 mb-2">Pausa Pomeriggio (opzionale)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={hours.afternoonBreakStart || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonBreakStart", value || null)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={hours.afternoonBreakEnd || ""}
                    onValueChange={(value) => onUpdate(day.id, "afternoonBreakEnd", value || null)}
                    disabled={!hours.afternoonBreakStart}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Fine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Fine</SelectItem>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 p-3 rounded border text-xs text-gray-600">
        <p className="font-medium mb-1">Riepilogo orari {day.name}:</p>
        {shiftMode === "single" && hours.startTime && hours.endTime && (
          <p>🕐 {hours.startTime} - {hours.endTime}</p>
        )}
        {shiftMode === "double" && (
          <div>
            {hours.morningStart && hours.morningEnd && (
              <p>🌅 Mattina: {hours.morningStart} - {hours.morningEnd}</p>
            )}
            {hours.afternoonStart && hours.afternoonEnd && (
              <p>🌇 Pomeriggio: {hours.afternoonStart} - {hours.afternoonEnd}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubleShiftManager; 
 
 
 
 