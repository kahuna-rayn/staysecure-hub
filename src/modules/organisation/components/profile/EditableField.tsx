import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditableFieldProps {
  value: string;
  fieldKey?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  locationId?: string;
  isEditing: boolean;
  onEdit: (field: string) => void;
  onSave: (field: string, value: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  type?: 'text' | 'select' | 'date';
  options?: string[];
  asyncOptions?: { value: string; label: string; id?: string }[];
  isLoading?: boolean;
  onSelectChange?: (value: string, selectedOption?: { value: string; label: string; id?: string }) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  fieldKey,
  label,
  placeholder,
  className,
  inputClassName,
  locationId,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  type = 'text',
  options,
  asyncOptions,
  isLoading,
  onSelectChange,
}) => {
  const [editValue, setEditValue] = React.useState(value);

  React.useEffect(() => {
    setEditValue(value);
  }, [value, isEditing]);

  // Phone number validation function
  const validatePhoneInput = (input: string): string => {
    // Only allow numbers, +, spaces, and common phone separators
    return input.replace(/[^0-9+\s\-\(\)]/g, '');
  };

  const handleSave = async () => {
    if (fieldKey) {
      await onSave(fieldKey, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Handle input change with phone validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Apply phone validation only for phone fields
    if (fieldKey === 'phone') {
      const validatedValue = validatePhoneInput(newValue);
      setEditValue(validatedValue);
    } else {
      setEditValue(newValue);
    }
  };

  if (isEditing) {
    if (type === 'select' && (options || asyncOptions)) {
      const selectOptions = asyncOptions || options?.map(opt => ({ value: opt, label: opt })) || [];
      
      return (
        <Select 
          value={editValue} 
          onValueChange={(newValue) => {
            setEditValue(newValue);
            const selectedOption = selectOptions.find(opt => opt.value === newValue);
            if (onSelectChange && selectedOption) {
              onSelectChange(newValue, selectedOption);
            } else {
              handleSave();
            }
          }}
          disabled={isLoading}
        >
          <SelectTrigger className={inputClassName || "w-48"}>
            <SelectValue placeholder={isLoading ? "Loading..." : "Select location"} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.length === 0 && !isLoading && (
              <SelectItem value="none" disabled>No locations assigned</SelectItem>
            )}
            {selectOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={type}
        value={editValue}
        placeholder={placeholder}
        onChange={handleInputChange} // Use the new handler
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={inputClassName || "h-6 text-sm w-32"}
        autoFocus
      />
    );
  }

  return (
    <div className={className}>
      {label && <span className="text-sm text-muted-foreground mr-2">{label}</span>}
      <span 
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
        onClick={() => fieldKey && onEdit(fieldKey)}
      >
        {value || placeholder}
      </span>
    </div>
  );
};

export default EditableField;