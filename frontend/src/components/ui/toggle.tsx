import { useState } from 'react';
import {cn} from '../../lib/utils';

interface ToggleSwitchProps {
  initialState?: boolean;
  label?: string;
  labelAfter?: string;
  className?: string;
  onToggle: (state: boolean) => void;
}

export default function ToggleSwitch({ initialState = false, label, labelAfter, className, onToggle }: ToggleSwitchProps) {
  const [isToggled, setIsToggled] = useState(initialState);

  const handleClick = () => {
    const newState = !isToggled;
    setIsToggled(newState);
    onToggle(newState);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && <span className="">{label}</span>}
      <div
        onClick={handleClick}
        className="w-12 h-6 flex items-center rounded-full p-1 cursor-pointer bg-blue-500"
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
            isToggled ? 'translate-x-6' : 'translate-x-0'
          }`}
        ></div>
      </div>
      {labelAfter && <span className="">{labelAfter}</span>}
    </div>
  );
}
