import { useDroppable } from '@dnd-kit/core';
import { Plus, Clipboard, Coffee, X } from 'lucide-react';

interface DroppableTimeSlotProps {
  time: string;
  stylistId: number;
  isOccupied: boolean;
  isBreakTime?: boolean;
  isWorkingHour?: boolean;
  children: React.ReactNode;
  onEmptyClick: () => void;
  hasPendingPaste?: boolean;
}

export function DroppableTimeSlot({ 
  time, 
  stylistId, 
  isOccupied,
  isBreakTime = false,
  isWorkingHour = true,
  children, 
  onEmptyClick,
  hasPendingPaste = false
}: DroppableTimeSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `time-slot-${stylistId}-${time}`,
    data: {
      time: time,
      stylistId: stylistId,
    },
  });

  // Only disable interactions if not working hours (but allow during break time)
  if (!isWorkingHour) {
    return (
      <div className="relative w-full h-full bg-gray-100 border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <X className="h-4 w-4 mx-auto mb-1 text-gray-400" />
            <div className="text-xs font-medium text-gray-400">Non lavora</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className={`relative w-full h-full cursor-pointer transition-all duration-200 group ${
        isOver && !isOccupied ? 'bg-green-100 border-green-400' : 
        hasPendingPaste && !isOccupied ? 'bg-orange-50 hover:bg-orange-100 border-orange-200' :
        isBreakTime && !isOccupied ? 'hover:bg-orange-100' : // Special hover for break time
        'hover:bg-blue-50'
      }`}
      onClick={() => !isOccupied && onEmptyClick()}
    >
      {children}
      
      {/* Visual indicator for empty cells */}
      {!isOccupied && (
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
          isOver ? 'opacity-100 bg-green-50 border border-green-300 border-dashed rounded-lg m-2' :
          hasPendingPaste ? 'opacity-100 bg-orange-50 border border-orange-300 border-dashed rounded-lg m-2' :
          isBreakTime ? 'opacity-100 bg-orange-50 group-hover:bg-orange-100 border border-orange-300 border-dashed rounded-lg m-2' :
          'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 border-dashed rounded-lg m-2'
        }`}>
          <div className="text-center">
            {hasPendingPaste ? (
              <>
                <Clipboard className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                <div className="text-xs font-medium text-orange-600">Incolla qui</div>
              </>
            ) : isBreakTime ? (
              <>
                <Coffee className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                <div className="text-xs font-medium text-orange-600">Pausa</div>
                <div className="text-xs text-orange-500 mt-1">Clicca per sovrascrivere</div>
              </>
            ) : (
              <>
                <Plus className={`h-6 w-6 mx-auto mb-1 ${isOver ? 'text-green-500' : 'text-blue-500'}`} />
                <div className={`text-xs font-medium ${isOver ? 'text-green-600' : 'text-blue-600'}`}>
                  {isOver ? 'Rilascia qui' : 'Nuovo'}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Drop zone indicator when dragging over occupied slot */}
      {isOver && isOccupied && (
        <div className="absolute inset-0 bg-red-100 border border-red-300 border-dashed rounded-lg m-2 flex items-center justify-center opacity-75">
          <div className="text-center">
            <div className="text-xs font-medium text-red-600">Slot occupato</div>
          </div>
        </div>
      )}
    </div>
  );
} 