import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Scissors, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

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

  // Track window width for responsive design
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive height based on device
  const getSlotHeight = () => {
    const isMobile = windowWidth <= 768;
    const isTablet = windowWidth > 768 && windowWidth <= 1024;
    
    if (isMobile) {
      return 60; // 60px slots for mobile to match grid height
    } else if (isTablet) {
      return 60; // 60px slots for tablets to match grid height
    } else {
      return 60; // 60px slots for desktop (15-minute slots) to match grid height
    }
  };

  const slotHeight = getSlotHeight();

  const combinedStyle = {
    ...style,
    height: `${height * slotHeight - 2}px`, // Dynamic height based on device and 15-minute slots
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
      className={`relative w-full text-white rounded-lg shadow-lg transition-all duration-200 ${
        height === 1 ? 'my-0.5 text-xs' : height === 2 ? 'my-0.5 text-xs' : 'my-1 text-sm'
      } flex ${
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
        <GripVertical className={`${height === 1 ? 'h-4 w-4' : 'h-6 w-6'} opacity-80 group-hover:opacity-100 transition-opacity ${height === 1 ? '' : 'mb-1'}`} />
        {height > 1 && (
        <div className="text-xs opacity-60 group-hover:opacity-100 transition-opacity font-medium">
          DRAG
        </div>
        )}
      </div>
      
      {/* Clickable Content Area - Right Side */}
      <div
        className={`flex-1 ${height === 1 ? 'p-1' : 'p-2'} cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors relative`}
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
        {/* Notes icon */}
        {appointment.notes && appointment.notes.trim() !== '' && !appointment.type && !isCut && (
          <div className="absolute top-1 right-1 bg-white bg-opacity-20 rounded-full p-1" title="Questo appuntamento ha una nota">
            <FileText className="h-3 w-3 text-white" />
          </div>
        )}
        <div className={`font-bold truncate ${height === 1 ? 'text-xs' : 'text-sm'} leading-tight ${height === 1 ? 'mb-0.5' : 'mb-1'}`}>
          {appointment.client.firstName} {appointment.client.lastName}
          {appointment.type === 'suggested' && (
            <span className="ml-1 text-xs opacity-90">(Suggerito)</span>
          )}
        </div>
        <div className={`truncate opacity-90 ${height === 1 ? 'text-xs' : 'text-xs'} leading-tight flex justify-between items-center`}>
          <span className="truncate flex-1">{appointment.service.name}</span>
          <span className={`ml-1 text-xs opacity-80 font-medium ${
            (() => {
              const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
              const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
              const actualDuration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
              const serviceDuration = appointment.service?.duration || 30;
              return actualDuration !== serviceDuration ? "text-yellow-200 font-bold" : "";
            })()
          }`}>
            {(() => {
              const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
              const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
              const actualDuration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
              const serviceDuration = appointment.service?.duration || 30;
              const isModified = actualDuration !== serviceDuration;
              return `${actualDuration}'${isModified ? " ⚡" : ""}`;
            })()}
          </span>
          </div>
        {height > 2 && (
          <div className="text-xs opacity-75 leading-tight mt-1">
            €{(appointment.service.price / 100).toFixed(0)}
          </div>
        )}
      </div>
    </div>
  );
} 