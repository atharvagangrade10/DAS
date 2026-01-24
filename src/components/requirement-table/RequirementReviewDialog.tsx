import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, Check } from "lucide-react";
import { PendingRequirementSubmission } from "@/types/course";
import { RequirementTableSubmission } from "@/types/course";

interface RequirementReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: RequirementTableSubmission | null;
  onApproveRow?: (submissionId: string, serialNumber: number, approved: boolean, remarks?: string) => void;
  onApproveAll?: (submissionId: string) => void;
  managerId: string;
}

const RequirementReviewDialog: React.FC<RequirementReviewDialogProps> = ({
  isOpen,
  onClose,
  submission,
  onApproveRow,
  onApproveAll,
  managerId,
}) => {
  const [managerNotes, setManagerNotes] = useState("");

  if (!submission) return null;

  const completedCount = submission.row_statuses.filter((r) => r.completed).length;
  const approvedCount = submission.row_statuses.filter((r) => r.approved).length;
  const totalCount = submission.row_statuses.length;
  const allCompleted = completedCount === totalCount;
  const allApproved = approvedCount === totalCount;

  const handleApproveRow = (serialNumber: number) => {
    onApproveRow?.(submission.submission_id, serialNumber, true, "Good work!");
  };

  const handleRejectRow = (serialNumber: number) => {
    onApproveRow?.(submission.submission_id, serialNumber, false, "Please improve.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Requirements</DialogTitle>
          <DialogDescription>
            Review and approve the participant's progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Completed:</span>{" "}
              <span className="font-medium">{completedCount}/{totalCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Approved:</span>{" "}
              <span className="font-medium">{approvedCount}/{totalCount}</span>
            </div>
            {allApproved && (
              <Badge className="bg-green-600">All Approved</Badge>
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Sr</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-20">Target</TableHead>
                  <TableHead className="w-20">Value</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submission.row_statuses.map((row) => (
                  <TableRow key={row.serial_number}>
                    <TableCell className="font-medium">{row.serial_number}</TableCell>
                    <TableCell>{row.activity}</TableCell>
                    <TableCell>
                      {row.target} {row.unit}
                    </TableCell>
                    <TableCell>{row.completed_value ?? "-"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{row.remarks || "-"}</p>
                        {row.approval_remarks && (
                          <p className="text-xs text-muted-foreground">
            Manager: {row.approval_remarks}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                      {row.approved && (
                        <Badge className="ml-2 bg-green-600">✓</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.completed && (
                        <div className="flex gap-1">
                          {!row.approved && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleApproveRow(row.serial_number)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleRejectRow(row.serial_number)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Manager Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Manager Notes</label>
            <Textarea
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="Add feedback for the participant..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onApproveAll && allCompleted && (
            <Button
              onClick={() => onApproveAll(submission.submission_id)}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve All
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequirementReviewDialog;
