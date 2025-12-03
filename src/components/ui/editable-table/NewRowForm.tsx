
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ColumnConfig {
  key: string;
  header: string;
  type?: 'text' | 'select' | 'textarea' | 'date' | 'number' | 'boolean' | 'badge' | 'database_select' | 'custom';
  options?: string[];
  required?: boolean;
  table?: string;
  valueField?: string;
  displayField?: string;
  filterBy?: string;
  customComponent?: string;
}

interface NewRowFormProps<T extends { id: string }> {
  columns: ColumnConfig[];
  newRowData: Partial<T>;
  onDataChange: (data: Partial<T>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function NewRowForm<T extends { id: string }>({
  columns,
  newRowData,
  onDataChange,
  onSave,
  onCancel
}: NewRowFormProps<T>) {
  const renderNewRowCell = (column: ColumnConfig) => {
    let value = (newRowData as any)[column.key] || '';
    
    // Skip custom components in new row form since they need existing user ID
    if (column.type === 'custom') {
      return <div className="text-sm text-muted-foreground">Will be set after creation</div>;
    }
    
    // Set default value for implementationStatus
    if (column.key === 'implementationStatus' && !value) {
      value = 'No';
      onDataChange({ ...newRowData, [column.key]: 'No' });
    }

    if ((column.type === 'select' || column.type === 'database_select') && column.options) {
      return (
        <Select 
          value={value} 
          onValueChange={(val) => onDataChange({ ...newRowData, [column.key]: val })}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder={`Select ${column.header}`} />
          </SelectTrigger>
          <SelectContent>
            {column.options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (column.type === 'textarea') {
      return (
        <Textarea
          value={value}
          onChange={(e) => {
            // Normalize line breaks for consistent handling
            const normalizedValue = e.target.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            onDataChange({ ...newRowData, [column.key]: normalizedValue });
          }}
          placeholder={column.header}
          className="min-h-[60px]"
        />
      );
    }

    return (
      <Input
        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={(e) => onDataChange({ ...newRowData, [column.key]: e.target.value })}
        placeholder={column.header}
        className="h-8"
      />
    );
  };

  return (
    <tr className="border-b bg-blue-50">
      {columns.map((column) => (
        <td key={column.key} className="p-2 align-middle">
          {renderNewRowCell(column)}
        </td>
      ))}
      <td className="p-2 align-middle">
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
