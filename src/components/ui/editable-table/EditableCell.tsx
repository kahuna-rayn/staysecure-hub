
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DatabaseSelectCell } from './DatabaseSelectCell';
import { MultiDepartmentSelectCell } from './MultiDepartmentSelectCell';
import { DepartmentRolePairsDisplay } from '@/components/admin/DepartmentRolePairsDisplay';
import { DatabaseDisplayCell } from './DatabaseDisplayCell';

interface ColumnConfig {
  key: string;
  header: string;
  type?: 'text' | 'select' | 'textarea' | 'date' | 'number' | 'boolean' | 'badge' | 'database_select' | 'custom';
  options?: string[];
  editable?: boolean;
  table?: string;
  valueField?: string;
  displayField?: string;
  filterBy?: string;
  customComponent?: string;
}

interface EditableCellProps<T extends { id: string }> {
  item: T;
  column: ColumnConfig;
  isEditing: boolean;
  editingValue: string;
  onEdit: (value: string) => void;
  onSave: (value?: string) => void;
  onCancel: () => void;
  onValueChange: (value: string) => void;
  onMoveToNext: () => void;
  allData?: T[]; // For getting filter values
}

export function EditableCell<T extends { id: string }>({
  item,
  column,
  isEditing,
  editingValue,
  onEdit,
  onSave,
  onCancel,
  onValueChange,
  onMoveToNext,
  allData
}: EditableCellProps<T>) {
  const value = (item as any)[column.key];
  const displayValue = value || '';

  // Debug: Check if column object is being mutated
  if (column.key === 'org_practice') {
    console.log('org_practice column object for row', (item as any).id, ':', column, 'reference:', column === column);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onSave();
      onMoveToNext();
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      onMoveToNext();
    }
  };

  if (isEditing && column.editable) {
    if (column.type === 'custom') {
      if (column.customComponent === 'MultiDepartmentSelectCell') {
        return (
          <MultiDepartmentSelectCell
            userId={item.id}
            onSave={onSave}
            onMoveToNext={onMoveToNext}
          />
        );
      }
      
      // Handle custom render function
      if ((column as any).render) {
        return (column as any).render(item);
      }
    }

    if (column.type === 'database_select' && column.table) {
      const filterValue = column.filterBy === 'user_departments' ? item.id : (column.filterBy ? (item as any)[column.filterBy] : undefined);
      
      return (
        <DatabaseSelectCell
          value={editingValue}
          table={column.table}
          valueField={column.valueField || 'name'}
          displayField={column.displayField || 'name'}
          filterBy={column.filterBy}
          filterValue={filterValue}
          onValueChange={onValueChange}
          onSave={onSave}
          onMoveToNext={onMoveToNext}
        />
      );
    }

    if (column.type === 'select' && column.options) {
      return (
        <div className="p-3 h-full flex items-center">
          <Select 
            value={editingValue} 
            onValueChange={(val) => {
              onValueChange(val);
              onSave(val);
            }}
            onOpenChange={(open) => {
              if (!open) {
                setTimeout(() => onMoveToNext(), 0);
              }
            }}
          >
            <SelectTrigger 
              className="w-full h-8"
              onKeyDown={handleSelectKeyDown}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (column.type === 'textarea') {
      return (
        <div className="p-3 h-full">
          <Textarea
            value={editingValue}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave()}
            autoFocus
            className="w-full min-h-[60px] resize-none"
          />
        </div>
      );
    }

    return (
      <div className="p-3 h-full flex items-center">
        <Input
          type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
          value={editingValue}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onSave()}
          autoFocus
          className="w-full h-8"
        />
      </div>
    );
  }

  // Display mode
  const cellContent = () => {
    if (column.type === 'custom') {
      if (column.customComponent === 'MultiDepartmentSelectCell') {
        return (
          <MultiDepartmentSelectCell
            userId={item.id}
            onSave={() => {}}
            onMoveToNext={() => {}}
          />
        );
      }
      if (column.customComponent === 'DepartmentRolePairsDisplay') {
        return <DepartmentRolePairsDisplay userId={item.id} />;
      }
      
      // Handle custom render function
      if ((column as any).render) {
        return (column as any).render(item);
      }
    }

    if (column.type === 'badge') {
      return (
        <Badge variant="outline" className="text-xs">
          {displayValue}
        </Badge>
      );
    }

    if (column.type === 'boolean') {
      return displayValue ? 'Yes' : 'No';
    }

    if (column.type === 'textarea') {
      // Normalize line breaks to ensure consistent display
      const normalizedValue = String(displayValue || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      return (
        <div 
          className={cn(
            "whitespace-pre-wrap break-words text-sm leading-relaxed w-full overflow-hidden",
            column.editable && "cursor-pointer hover:bg-muted/50"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (column.editable) onEdit(normalizedValue);
          }}
        >
          {normalizedValue}
        </div>
      );
    }

    if (column.type === 'database_select' && column.table) {
      return (
        <DatabaseDisplayCell
          table={column.table}
          value={value}
          valueField={column.valueField || 'id'}
          displayField={column.displayField || 'name'}
        />
      );
    }

    return <span className="text-sm">{displayValue}</span>;
  };

  return (
    <div 
      className={cn(
        "p-3 h-full flex items-start w-full relative group text-left",
        column.editable && "cursor-pointer hover:bg-muted/50 border-2 border-transparent hover:border-primary/20 rounded-sm transition-all duration-200"
      )}
      onClick={() => {
        if (column.editable) {
          onEdit(String(displayValue));
        }
      }}
    >
      {column.editable && (
        <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z"/>
          </svg>
        </div>
      )}
      <div className="w-full overflow-hidden">
        {cellContent()}
      </div>
    </div>
  );
}
