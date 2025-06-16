import { useDroppable } from '@dnd-kit/core';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { DraggableAppointment } from './draggable-appointment';

interface DroppableDayProps {
  day: Date;
  selectedDate: Date;
  appointments: any[];
  onDayClick: (day: Date) => void;
}

export function DroppableDay({ day, selectedDate, appointments, onDayClick }: DroppableDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${format(day, 'yyyy-MM-dd')}`,
    data: {
      date: format(day, 'yyyy-MM-dd'),
    },
  });

  const isCurrentMonth = isSameMonth(day, selectedDate);
  const isSelected = isSameDay(day, selectedDate);
  const isCurrentDay = isToday(day);

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDayClick(day)}
      className={`
        min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors
        ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
        ${isSelected ? 'ring-2 ring-pink-500' : ''}
        ${isCurrentDay ? 'bg-pink-50 border-pink-200' : 'border-gray-200'}
        ${isOver && isCurrentMonth ? 'bg-green-50 border-green-300' : ''}
      `}
    >
      <div className={`text-sm font-medium mb-1 ${
        isCurrentDay ? 'text-pink-600' : 
        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
      }`}>
        {format(day, 'd')}
      </div>
      
      {/* Appointment dots */}
      <div className="space-y-1">
        {appointments.slice(0, 3).map((appointment: any) => (
          <DraggableAppointment
            key={appointment.id}
            appointment={appointment}
            isMonthView={true}
          />
        ))}
        {appointments.length > 3 && (
          <div className="text-xs text-gray-500">
            +{appointments.length - 3} altri
          </div>
        )}
      </div>
    </div>
  );
} 