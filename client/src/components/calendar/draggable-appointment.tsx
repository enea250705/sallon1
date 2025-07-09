import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableAppointmentProps {
  appointment: any;
  isMonthView?: boolean;
  onDelete?: (appointmentId: number) => void;
}

export function DraggableAppointment({ appointment, isMonthView = false, onDelete }: DraggableAppointmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `appointment-${appointment.id}`,
    data: {
      appointment,
    },
    disabled: isMonthView, // Disable drag in month view
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  if (isMonthView) {
    return (
      <div
        className={`
          text-xs px-1 py-0.5 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded truncate cursor-pointer
          hover:from-pink-200 hover:to-purple-200 transition-colors relative
        `}
        title={`${appointment.startTime.slice(0, 5)} - ${appointment.client.firstName} ${appointment.client.lastName} - ${appointment.service.name}${appointment.notes && appointment.notes.trim() !== '' ? ' (Ha una nota)' : ''}`}
      >
        {appointment.startTime.slice(0, 5)} {appointment.client.firstName}
        {/* Notes icon for month view */}
        {appointment.notes && appointment.notes.trim() !== '' && (
          <FileText className="h-3 w-3 text-pink-600 absolute top-0 right-0 bg-white rounded-full p-0.5" title="Questo appuntamento ha una nota" />
        )}
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(appointment.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border
        ${isDragging ? 'opacity-50' : ''}
        hover:from-pink-100 hover:to-purple-100 transition-colors
      `}
    >
      <div 
        {...listeners}
        {...attributes}
        className="flex-1 cursor-grab active:cursor-grabbing"
      >
        <div className="font-semibold text-gray-900">
          {appointment.client.firstName} {appointment.client.lastName}
        </div>
        <div className="text-sm text-gray-600">
          {appointment.service.name} • {appointment.stylist.name}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-semibold text-pink-600">
            {appointment.startTime.slice(0, 5)}
          </div>
          <div className="text-sm text-gray-500">
            {appointment.service.duration}min
          </div>
        </div>
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 