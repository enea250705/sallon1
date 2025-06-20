import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableDailyAppointmentProps {
  appointment: any;
  height: number;
  onAppointmentClick: (appointment: any) => void;
}

export function DraggableDailyAppointment({ 
  appointment, 
  height, 
  onAppointmentClick 
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

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const combinedStyle = {
    ...style,
    height: `${height * 60 - 4}px`,
    top: '2px'
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...attributes}
      className={`absolute inset-x-2 text-white text-sm rounded-lg shadow-lg transition-all duration-200 ${
        isDragging ? 'opacity-50 z-50' : 'z-10'
      } ${
        appointment.type === 'suggested' 
          ? 'bg-gradient-to-r from-orange-400 to-orange-500 border-l-4 border-orange-600 hover:from-orange-500 hover:to-orange-600' 
          : 'bg-gradient-to-r from-blue-500 to-blue-600 border-l-4 border-blue-700 hover:from-blue-600 hover:to-blue-700'
      }`}
    >
      {/* Drag Handle Area - Left Side */}
      <div
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-6 cursor-grab active:cursor-grabbing hover:bg-white hover:bg-opacity-10 transition-colors flex items-center justify-center"
        title="Trascina per spostare"
      >
        <GripVertical className="h-4 w-4 opacity-80" />
      </div>
      
      {/* Clickable Content Area */}
      <div
        className="ml-6 p-3 cursor-pointer hover:scale-105 transform transition-transform"
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
            {Math.round(appointment.service.duration / 60 * 100) / 100}h
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