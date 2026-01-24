import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, X, Send } from "lucide-react";
import { RequirementTableSubmission } from "@/types/course";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RequirementTableViewerProps {
  submission: RequirementTableSubmission;
  onSubmit?: () => void;
  onUpdateRow?: (serialNumber: number, data: { completed: boolean; completed_value?: number; remarks?: string }) => void;
  readOnly?: boolean;
}

const RequirementTableViewer: React.FC<RequirementTableViewerProps> = ({
  submission,
  onSubmit,
  onUpdateRow,
  readOnly = false,
}) => {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [rowData, setRowData] = useState<{
    completed_value: string;
    remarks: string;
  }>({ completed_value: "", remarks: "" });

  const isApproved = submission.is_approved;
  const completedCount = submission.row_statuses.filter((r) => r.completed).length;
  const approvedCount = submission.row_statuses.filter((r) => r.approved).length;
  const totalCount = submission.row_statuses.length;

  const handleEditRow = (row: typeof submission.row_statuses[0]) => {
    setEditingRow(row.serial_number);
    setRowData({
      completed_value: row.completed_value?.toString() || "",
      remarks: row.remarks || "",
    });
  };

  const handleSaveRow = (serialNumber: number) => {
    onUpdateRow?.(serialNumber, {
      completed: true,
      completed_value: parseFloat(rowData.completed_value) || 0,
      remarks: rowData.remarks,
    });
    setEditingRow(null);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setRowData({ completed_value: "", remarks: "" });
  };

  const handleSubmit = () => {
    onSubmit?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{submission.requirement_table.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{submission.requirement_table.description}</p>
        </div>
        {isApproved && (
          <Badge className="bg-green-600">Approved</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Sr</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-24">Target</TableHead>
                <TableHead className="w-24">Value</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-24">Status</TableHead>
                {!readOnly && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {submission.row_statuses.map((row) => {
                const isEditing = editingRow === row.serial_number;

                return (
                  <TableRow key={row.serial_number}>
                    <TableCell className="font-medium">{row.serial_number}</TableCell>
                    <TableCell>{row.activity}</TableCell>
                    <TableCell>
                      {row.target} {row.unit}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={rowData.completed_value}
                          onChange={(e) => setRowData({ ...rowData, completed_value: e.target.value })}
                          placeholder="Enter value"
                        />
                      ) : (
                        <span>{row.completed_value ?? "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={rowData.remarks}
                          onChange={(e) => setRowData({ ...rowData, remarks: e.target.value })}
                          placeholder="Add remarks"
                          className="min-w-[150px]"
                        />
                      ) : (
                        <span className="text-sm">{row.remarks || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      {row.approved && (
                        <Badge className="ml-2 bg-green-600">✓</Badge>
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleSaveRow(row.serial_number)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRow(row)}
                            disabled={readOnly}
                          >
                            {row.completed ? "Edit" : "Mark"}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {completedCount}/{totalCount} completed | {approvedCount}/{totalCount} approved
        </div>

        {onSubmit && !submission.is_approved && !readOnly && (
          <Button
            onClick={handleSubmit}
            disabled={completedCount === 0 || submission.submitted_at !== undefined}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submission.submitted_at ? "Submitted" : "Submit for Approval"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RequirementTableViewer;
