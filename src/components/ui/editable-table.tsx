
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { EditableCell } from './editable-table/EditableCell';
import { NewRowForm } from './editable-table/NewRowForm';

interface ColumnConfig {
  key: string;
  header: string;
  type?: 'text' | 'select' | 'textarea' | 'date' | 'number' | 'boolean' | 'badge' | 'database_select' | 'custom';
  options?: string[];
  width?: string;
  className?: string;
  editable?: boolean;
  required?: boolean;
  sortable?: boolean;
  table?: string;
  valueField?: string;
  displayField?: string;
  filterBy?: string;
  customComponent?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface EditableTableProps<T extends { id: string; uniqueKey?: string }> {
  data: T[];
  columns: ColumnConfig[];
  onUpdate: (id: string, updates: Partial<T>) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCreate?: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>;
  onViewUser?: (item: T) => void;
  className?: string;
  allowAdd?: boolean;
  allowDelete?: boolean;
  allowView?: boolean;
}

export function EditableTable<T extends { id: string }>({
  data,
  columns,
  onUpdate,
  onDelete,
  onCreate,
  onViewUser,
  className,
  allowAdd = true,
  allowDelete = true,
  allowView = false
}: EditableTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<T>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Sort the data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle different data types
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column || column.sortable === false) return;

    setSortConfig(prevSort => {
      if (prevSort?.key === columnKey) {
        if (prevSort.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else {
          return null; // Remove sorting
        }
      } else {
        return { key: columnKey, direction: 'asc' };
      }
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const handleCellEdit = (rowId: string, columnKey: string, currentValue: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.editable) return;

    setEditingCell({ rowId, columnKey });
    setEditingValue(currentValue);
  };

  const handleSave = async (valueOverride?: string) => {
    if (!editingCell) return;

    const { rowId, columnKey } = editingCell;
    let finalValue = valueOverride !== undefined ? valueOverride : editingValue;
    
    // Normalize line breaks for textarea fields to ensure consistent storage
    const column = columns.find(col => col.key === columnKey);
    if (column?.type === 'textarea' && typeof finalValue === 'string') {
      finalValue = finalValue.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    
    const updates = { [columnKey]: finalValue } as Partial<T>;
    
    const result = await onUpdate(rowId, updates);
    
    if (result.success) {
      toast({
        title: "Updated successfully",
        description: "The value has been updated.",
      });
    } else {
      toast({
        title: "Update failed",
        description: result.error || "Failed to update the value.",
        variant: "destructive",
      });
    }
    
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const moveToNextCell = () => {
    if (!editingCell) return;

    const { rowId, columnKey } = editingCell;
    const currentRowIndex = sortedData.findIndex(item => (item.id || (item as any).uniqueKey) === rowId);
    const currentColumnIndex = columns.findIndex(col => col.key === columnKey);
    
    // Find next editable cell
    let nextRowIndex = currentRowIndex;
    let nextColumnIndex = currentColumnIndex + 1;
    
    // If we're at the end of the row, move to the first column of the next row
    if (nextColumnIndex >= columns.length) {
      nextColumnIndex = 0;
      nextRowIndex = currentRowIndex + 1;
    }
    
    // If we're at the end of the table, don't move
    if (nextRowIndex >= sortedData.length) {
      return;
    }
    
    // Find the next editable column
    while (nextColumnIndex < columns.length && !columns[nextColumnIndex].editable) {
      nextColumnIndex++;
    }
    
    // If no editable column found in current row, try next row
    if (nextColumnIndex >= columns.length) {
      nextRowIndex++;
      nextColumnIndex = 0;
      while (nextColumnIndex < columns.length && !columns[nextColumnIndex].editable) {
        nextColumnIndex++;
      }
    }
    
    // If we found a valid next cell, edit it
    if (nextRowIndex < sortedData.length && nextColumnIndex < columns.length) {
      const nextItem = sortedData[nextRowIndex];
      const nextColumn = columns[nextColumnIndex];
      const nextValue = (nextItem as any)[nextColumn.key];
      
      setTimeout(() => {
        handleCellEdit(nextItem.id, nextColumn.key, String(nextValue || ''));
      }, 0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    if (confirm('Are you sure you want to delete this item?')) {
      const result = await onDelete(id);
      
      if (result.success) {
        toast({
          title: "Deleted successfully",
          description: "The item has been deleted.",
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete the item.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddRow = async () => {
    if (!onCreate) return;

    const result = await onCreate(newRowData);
    
    if (result.success) {
      toast({
        title: "Created successfully",
        description: "The new item has been created.",
      });
      setNewRowData({});
      setIsAdding(false);
    } else {
      toast({
        title: "Create failed",
        description: result.error || "Failed to create the item.",
        variant: "destructive",
      });
    }
  };

  const handleRowDoubleClick = (item: T) => {
    if (onViewUser) {
      onViewUser(item);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {allowAdd && onCreate && (
        <div className="flex justify-end">
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            size="icon"
            variant={isAdding ? "outline" : "default"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className={cn(
                    "p-3 text-left text-sm font-medium text-muted-foreground border-r border-muted/20 last:border-r-0",
                    column.sortable !== false && "cursor-pointer hover:bg-muted/70 select-none",
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {(allowDelete || allowView) && (
                <th className="p-3 text-left text-sm font-medium text-muted-foreground w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <NewRowForm
                columns={columns}
                newRowData={newRowData}
                onDataChange={setNewRowData}
                onSave={handleAddRow}
                onCancel={() => setIsAdding(false)}
              />
            )}
            {sortedData.map((item, index) => (
              <tr 
                key={item.id || (item as any).uniqueKey || `row-${index}`} 
                className="border-b hover:bg-muted/20"
                onDoubleClick={() => handleRowDoubleClick(item)}
              >
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={cn("p-0 align-top text-left border-r border-muted/20 last:border-r-0", column.className)}
                    style={{ width: column.width }}
                  >
                    <EditableCell
                      item={item}
                      column={column}
                      isEditing={editingCell?.rowId === item.id && editingCell?.columnKey === column.key}
                      editingValue={editingValue}
                      onEdit={(value) => handleCellEdit(item.id, column.key, value)}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onValueChange={setEditingValue}
                      onMoveToNext={moveToNextCell}
                      allData={sortedData}
                    />
                  </td>
                ))}
                <td className="p-2 align-middle">
                  <div className="flex items-center gap-2">
                    {allowView && onViewUser && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewUser(item);
                        }}
                        className="h-8 w-8 p-0"
                        title="View details"
                      >
                        <div className="h-4 w-4 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </div>
                      </Button>
                    )}
                    {allowDelete && onDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="h-8 w-8 p-0"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
