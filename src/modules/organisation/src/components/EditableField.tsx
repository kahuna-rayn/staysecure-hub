
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditableFieldProps {
  isEditing: boolean;
  value: string;
  displayValue: string;
  type?: 'text' | 'select' | 'date';
  options?: string[];
  onStartEdit: () => void;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSelectChange?: (value: string) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
  isEditing,
  value,
  displayValue,
  type = 'text',
  options,
  onStartEdit,
  onValueChange,
  onBlur,
  onKeyDown,
  onSelectChange,
}) => {
  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <Select 
          value={value} 
          onValueChange={onSelectChange}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={type}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="h-6 text-sm w-32"
        autoFocus
      />
    );
  }

  return (
    <span 
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
      onClick={onStartEdit}
    >
      {displayValue}
    </span>
  );
};

export default EditableField;
