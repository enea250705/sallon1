import { useDroppable } from '@dnd-kit/core';
import { Plus, Clipboard, Coffee, Clock } from 'lucide-react';

interface DroppableTimeSlotProps {
  time: string;
  stylistId: number;
  isOccupied: boolean;
  isBreakTime?: boolean;
  isUnavailable?: boolean;
  breakType?: string;
  children: React.ReactNode;
  onEmptyClick: () => void;
  hasPendingPaste?: boolean;
}

export function DroppableTimeSlot({ 
  time, 
  stylistId, 
  isOccupied, 
  isBreakTime = false,
  isUnavailable = false,
  breakType = 'break',
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

  // Determine if this slot is clickable (not occupied, not break time, not unavailable)
  const isClickable = !isOccupied && !isBreakTime && !isUnavailable;

  // Function to get break icon based on type
  const getBreakIcon = (type: string) => {
    switch (type) {
      case 'lunch':
        return <Coffee className="h-4 w-4 text-orange-600" />;
      case 'break':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get background color and styles based on state
  const getSlotStyle = () => {
    if (isBreakTime) {
      return breakType === 'lunch' 
        ? 'bg-orange-100 border-orange-200' 
        : 'bg-blue-100 border-blue-200';
    }
    
    if (isUnavailable) {
      return 'bg-gray-200 border-gray-300';
    }
    
    if (isOver && isClickable) {
      return 'bg-green-100 border-green-400';
    }
    
    if (hasPendingPaste && isClickable) {
      return 'bg-orange-50 hover:bg-orange-100 border-orange-200';
    }
    
    return 'hover:bg-blue-50';
  };

  return (
    <div 
      ref={setNodeRef}
      className={`relative w-full h-full transition-all duration-200 group ${getSlotStyle()} ${
        isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
      onClick={() => isClickable && onEmptyClick()}
    >
      {children}
      
      {/* Break/Unavailable indicator */}
      {(isBreakTime || isUnavailable) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center p-1 rounded-lg ${
            isBreakTime 
              ? (breakType === 'lunch' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800')
              : 'bg-gray-300 text-gray-700'
          }`}>
            {isBreakTime ? (
              <>
                {getBreakIcon(breakType)}
                <div className="text-xs font-medium mt-1">
                  {breakType === 'lunch' ? 'Pranzo' : 'Pausa'}
                </div>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-gray-600" />
                <div className="text-xs font-medium mt-1">Non disponibile</div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Visual indicator for empty and available cells */}
      {isClickable && (
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
          isOver ? 'opacity-100 bg-green-50 border border-green-300 border-dashed rounded-lg m-2' :
          hasPendingPaste ? 'opacity-100 bg-orange-50 border border-orange-300 border-dashed rounded-lg m-2' :
          'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 border-dashed rounded-lg m-2'
        }`}>
          <div className="text-center">
            {hasPendingPaste ? (
              <>
                <Clipboard className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                <div className="text-xs font-medium text-orange-600">Incolla qui</div>
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
      
      {/* Drop zone indicator when dragging over occupied/unavailable slot */}
      {isOver && !isClickable && (
        <div className="absolute inset-0 bg-red-100 border border-red-300 border-dashed rounded-lg m-2 flex items-center justify-center opacity-75">
          <div className="text-center">
            <div className="text-xs font-medium text-red-600">
              {isOccupied ? 'Slot occupato' : isBreakTime ? 'In pausa' : 'Non disponibile'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 