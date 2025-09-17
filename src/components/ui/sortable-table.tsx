
import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface SortableTableContextType {
  sortConfig: SortConfig | null;
  requestSort: (key: string) => void;
}

const SortableTableContext = React.createContext<SortableTableContextType | null>(null);

const useSortableTable = () => {
  const context = React.useContext(SortableTableContext);
  if (!context) {
    throw new Error('useSortableTable must be used within a SortableTableProvider');
  }
  return context;
};

interface SortableTableProps {
  children: React.ReactNode;
  data: any[];
  onSort: (sortedData: any[]) => void;
}

const SortableTable = React.forwardRef<
  HTMLTableElement,
  SortableTableProps & React.HTMLAttributes<HTMLTableElement>
>(({ className, children, data, onSort, ...props }, ref) => {
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(null);

  const requestSort = React.useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  React.useEffect(() => {
    if (sortConfig && data.length > 0) {
      const sortedData = [...data].sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      onSort(sortedData);
    }
  }, [sortConfig, data, onSort]);

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  return (
    <SortableTableContext.Provider value={{ sortConfig, requestSort }}>
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    </SortableTableContext.Provider>
  );
});
SortableTable.displayName = "SortableTable";

const SortableTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
SortableTableHeader.displayName = "SortableTableHeader";

const SortableTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
SortableTableBody.displayName = "SortableTableBody";

const SortableTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
SortableTableRow.displayName = "SortableTableRow";

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey?: string;
  children: React.ReactNode;
}

const SortableTableHead = React.forwardRef<
  HTMLTableCellElement,
  SortableTableHeadProps
>(({ className, sortKey, children, ...props }, ref) => {
  const { sortConfig, requestSort } = useSortableTable();

  const handleSort = () => {
    if (sortKey) {
      requestSort(sortKey);
    }
  };

  const getSortIcon = () => {
    if (!sortKey || !sortConfig || sortConfig.key !== sortKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        sortKey && "cursor-pointer hover:bg-muted/50 select-none",
        className
      )}
      onClick={handleSort}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
});
SortableTableHead.displayName = "SortableTableHead";

const SortableTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
SortableTableCell.displayName = "SortableTableCell";

export {
  SortableTable,
  SortableTableHeader,
  SortableTableBody,
  SortableTableRow,
  SortableTableHead,
  SortableTableCell,
};
