import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: (reason: string) => Promise<void>;
  loading?: boolean;
}

export const DeleteUserDialog = ({
  open,
  onOpenChange,
  userName,
  onConfirm,
  loading = false,
}: DeleteUserDialogProps) => {
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    await onConfirm(reason);
    setReason("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Delete User</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to permanently delete {userName}? This action cannot be undone and will remove the user from the system completely.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Label htmlFor="reason" className="text-sm font-medium text-foreground">
            Please provide a reason for deleting this user (optional):
          </Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason..."
            className="mt-2"
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};