import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { UserDepartmentsRolesTable } from './UserDepartmentsRolesTable';

interface UserDepartmentsRolesManagerProps {
  userId: string;
}

export interface UserDepartmentsRolesManagerRef {
  handleAddNewRow: () => void;
}

export const UserDepartmentsRolesManager = forwardRef<UserDepartmentsRolesManagerRef, UserDepartmentsRolesManagerProps>(
  ({ userId }, ref) => {
    const tableRef = useRef<UserDepartmentsRolesManagerRef>(null);

    useImperativeHandle(ref, () => ({
      handleAddNewRow: () => tableRef.current?.handleAddNewRow?.()
    }));

    return <UserDepartmentsRolesTable userId={userId} ref={tableRef} />;
  }
);