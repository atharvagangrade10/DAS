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
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Requirement, RequirementTable } from "@/types/course";

interface RequirementTableBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; requirements: Requirement[] }) => void;
  initialData?: {
    name?: string;
    description?: string;
    requirements?: Requirement[];
  };
  stepId?: string;
}

const UNIT_OPTIONS = ["rounds", "chapters", "minutes", "hours", "days", "times", "attendance"];

const RequirementTableBuilder: React.FC<RequirementTableBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [requirements, setRequirements] = useState<Requirement[]>(
    initialData?.requirements || [
      { serial_number: 1, activity: "", target: 1, unit: "rounds" },
    ]
  );

  const resetForm = () => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setRequirements(initialData?.requirements || [
      { serial_number: 1, activity: "", target: 1, unit: "rounds" },
    ]);
  };

  const handleAddRequirement = () => {
    const newSerial = requirements.length + 1;
    setRequirements([
      ...requirements,
      { serial_number: newSerial, activity: "", target: 1, unit: "rounds" },
    ]);
  };

  const handleRemoveRequirement = (serialNumber: number) => {
    const filtered = requirements.filter((r) => r.serial_number !== serialNumber);
    // Re-number remaining requirements
    const renumbered = filtered.map((r, i) => ({ ...r, serial_number: i + 1 }));
    setRequirements(renumbered);
  };

  const handleUpdateRequirement = (
    serialNumber: number,
    field: keyof Requirement,
    value: string | number
  ) => {
    setRequirements(requirements.map((r) =>
      r.serial_number === serialNumber ? { ...r, [field]: value } : r
    ));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // Validate requirements
    const validRequirements = requirements.filter(
      (r) => r.activity.trim() !== ""
    );

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      requirements: validRequirements,
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Build Requirement Table</DialogTitle>
          <DialogDescription>
            Create a requirement table for participants to track their progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Table Info */}
          <div className="space-y-2">
            <Label htmlFor="table-name">Table Name *</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Sadhana Tracker"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-description">Description</Label>
            <Textarea
              id="table-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what participants should track..."
              rows={2}
            />
          </div>

          {/* Requirements Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Requirements</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRequirement}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="w-24">Target</TableHead>
                    <TableHead className="w-32">Unit</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((req) => (
                    <TableRow key={req.serial_number}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          {req.serial_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={req.activity}
                          onChange={(e) =>
                            handleUpdateRequirement(req.serial_number, "activity", e.target.value)
                          }
                          placeholder="Activity name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={req.target}
                          onChange={(e) =>
                            handleUpdateRequirement(req.serial_number, "target", parseInt(e.target.value) || 0)
                          }
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          value={req.unit}
                          onChange={(e) =>
                            handleUpdateRequirement(req.serial_number, "unit", e.target.value)
                          }
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          {UNIT_OPTIONS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRequirement(req.serial_number)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequirementTableBuilder;
