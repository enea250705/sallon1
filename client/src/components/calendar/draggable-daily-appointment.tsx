import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Scissors } from 'lucide-react';

interface DraggableDailyAppointmentProps {
  appointment: any;
  height: number;
  onAppointmentClick: (appointment: any) => void;
  isCut?: boolean;
}

export function DraggableDailyAppointment({ 
  appointment, 
  height, 
  onAppointmentClick,
  isCut = false
}: DraggableDailyAppointmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `daily-appointment-${appointment.id}`,
    data: {
      appointment,
    },
  });

  // Touch support for mobile devices
  const touchListeners = {
    ...listeners,
    onTouchStart: (e: React.TouchEvent) => {
      // Allow drag on touch devices
      if (listeners?.onTouchStart) {
        listeners.onTouchStart(e as any);
      }
    },
  };

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const combinedStyle = {
    ...style,
    height: `${height * 60 - 8}px`, // Dynamic height: each slot is 60px, minus 8px for spacing
  };

  // Calculate if duration was modified
  const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
  const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
  const actualDuration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  const serviceDuration = appointment.service?.duration || 30;
  const isDurationModified = actualDuration !== serviceDuration;

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...attributes}
      title={`${appointment.client.firstName} ${appointment.client.lastName} - ${appointment.service.name}${isDurationModified ? ' (Durata personalizzata: ' + actualDuration + 'min)' : ''}`}
      className={`relative w-full text-white text-sm rounded-lg shadow-lg transition-all duration-200 my-1 flex ${
        isDragging ? 'opacity-50 z-50' : 'z-10'
      } ${
        isCut ? 'opacity-60 border-2 border-dashed border-yellow-400' : ''
      } ${
        appointment.type === 'suggested' 
          ? 'bg-gradient-to-r from-orange-400 to-orange-500 border-l-4 border-orange-600 hover:from-orange-500 hover:to-orange-600' 
          : 'bg-gradient-to-r from-blue-500 to-blue-600 border-l-4 border-blue-700 hover:from-blue-600 hover:to-blue-700'
      }`}
    >
      {/* Large Drag Handle Area - Left Third */}
      <div
        {...touchListeners}
        className="w-1/3 cursor-grab active:cursor-grabbing hover:bg-white hover:bg-opacity-30 transition-all duration-200 flex flex-col items-center justify-center group rounded-l-lg touch-manipulation border-r border-white border-opacity-20"
        title="Trascina per spostare l'appuntamento"
      >
        <GripVertical className="h-6 w-6 opacity-80 group-hover:opacity-100 transition-opacity mb-1" />
        <div className="text-xs opacity-60 group-hover:opacity-100 transition-opacity font-medium">
          DRAG
        </div>
      </div>
      
      {/* Clickable Content Area - Right Side */}
      <div
        className="flex-1 p-2 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors relative"
        onClick={(e) => {
          e.stopPropagation();
          onAppointmentClick(appointment);
        }}
      >
        {appointment.type === 'suggested' && (
          <div className="absolute top-1 right-1 bg-white bg-opacity-20 rounded-full px-1 py-0.5">
            <span className="text-xs font-bold">💡</span>
          </div>
        )}
        {isCut && (
          <div className="absolute top-1 right-1 bg-yellow-400 bg-opacity-90 rounded-full p-1">
            <Scissors className="h-3 w-3 text-yellow-800" />
          </div>
        )}
        <div className="font-bold truncate text-sm leading-tight mb-1">
          {appointment.client.firstName} {appointment.client.lastName}
          {appointment.type === 'suggested' && (
            <span className="ml-1 text-xs opacity-90">(Suggerito)</span>
          )}
        </div>
        <div className="truncate opacity-90 text-xs leading-tight mb-1">
          {appointment.service.name}
        </div>
        {height > 1 && (
          <div className="text-xs opacity-80 leading-tight font-medium">
            {(() => {
              // Calculate actual duration from appointment times
              const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
              const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
              const actualDuration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
              const serviceDuration = appointment.service?.duration || 30;
              
              // Show if duration was manually modified
              const isModified = actualDuration !== serviceDuration;
              
              return (
                <span className={isModified ? "font-bold text-yellow-200" : ""}>
                  {actualDuration}min
                  {isModified && " ⚡"}
                </span>
              );
            })()}
          </div>
        )}
        {height > 2 && (
          <div className="text-xs opacity-75 leading-tight mt-1">
            €{(appointment.service.price / 100).toFixed(0)}
          </div>
        )}
      </div>
    </div>
  );
} 