import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialTypeEnum, Material, MaterialCreate, RequirementTable } from "@/types/course";
import { fetchRequirementTables, createRequirementTable } from "@/utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import RequirementTableBuilder from "@/components/requirement-table/RequirementTableBuilder";

interface MaterialFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MaterialCreate) => void;
  stepId: string;
  material?: Material;
}

const UNIT_OPTIONS = ["rounds", "chapters", "minutes", "hours", "days", "times", "attendance"];

const MaterialFormDialog: React.FC<MaterialFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  stepId,
  material,
}) => {
  const queryClient = useQueryClient();

  const [materialType, setMaterialType] = useState<MaterialTypeEnum>(MaterialTypeEnum.VIDEO);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);
  const [requirementTableId, setRequirementTableId] = useState("");
  const [isRequirementBuilderOpen, setIsRequirementBuilderOpen] = useState(false);
  const [requirementTableMode, setRequirementTableMode] = useState<"select" | "create">("select");

  // Fetch requirement tables
  const { data: requirementTables = [] } = useQuery({
    queryKey: ["requirementTables", stepId],
    queryFn: () => fetchRequirementTables(stepId),
    enabled: isOpen,
  });

  // Create requirement table mutation
  const createRequirementTableMutation = useMutation({
    mutationFn: (data: any) => {
      return createRequirementTable({ ...data, step_id: stepId });
    },
    onSuccess: (data) => {
      toast.success("Requirement table created successfully");
      setRequirementTableId(data.id);
      setIsRequirementBuilderOpen(false);
      queryClient.invalidateQueries({ queryKey: ["requirementTables"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to create requirement table", { description: error.message });
    },
  });

  // Reset form when dialog opens/closes or material changes
  useEffect(() => {
    if (material) {
      setMaterialType(material.material_type);
      setTitle(material.title);
      setDescription(material.description);
      setUrl(material.content.url || "");
      setIsMandatory(material.is_mandatory);
      setOrderIndex(material.order_index);
      setRequirementTableId(material.content.requirement_table_id || "");
    } else {
      setMaterialType(MaterialTypeEnum.VIDEO);
      setTitle("");
      setDescription("");
      setUrl("");
      setIsMandatory(true);
      setOrderIndex(0);
      setRequirementTableId("");
      setRequirementTableMode("select");
      setIsRequirementBuilderOpen(false);
    }
  }, [material, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }

    let content: any = { url };

    switch (materialType) {
      case MaterialTypeEnum.VIDEO:
      case MaterialTypeEnum.DOCUMENT:
      case MaterialTypeEnum.AUDIO:
        content = { url };
        break;
      case MaterialTypeEnum.BOOK_LINK:
        content = { url, title };
        break;
      case MaterialTypeEnum.REQUIREMENT_TABLE:
        content = { requirement_table_id: requirementTableId };
        break;
    }

    onSave({
      material_type: materialType,
      title: title.trim(),
      description: description.trim(),
      content,
      order_index: orderIndex,
      is_mandatory: isMandatory,
    });
  };

  const getTypeLabel = (type: MaterialTypeEnum) => {
    switch (type) {
      case MaterialTypeEnum.VIDEO:
        return "Video";
      case MaterialTypeEnum.BOOK_LINK:
        return "Book Link";
      case MaterialTypeEnum.DOCUMENT:
        return "Document";
      case MaterialTypeEnum.AUDIO:
        return "Audio";
      case MaterialTypeEnum.REQUIREMENT_TABLE:
        return "Requirement Table";
      default:
        return "Unknown";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{material ? "Edit Material" : "Add Material"}</DialogTitle>
            <DialogDescription>
              {material ? "Update material information" : "Add a learning material to this step"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Material Type Selector */}
            <div className="space-y-2">
              <Label>Material Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(MaterialTypeEnum).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMaterialType(type)}
                    className={`p-3 text-left rounded-lg border transition-colors ${materialType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:bg-muted"
                      }`}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="material-title">Title *</Label>
              <Input
                id="material-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Material title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="material-description">Description</Label>
              <Textarea
                id="material-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            {/* URL / Content */}
            {materialType !== MaterialTypeEnum.REQUIREMENT_TABLE && (
              <div className="space-y-2">
                <Label htmlFor="material-url">URL *</Label>
                <Input
                  id="material-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={
                    materialType === MaterialTypeEnum.VIDEO
                      ? "https://youtube.com/watch?v=..."
                      : materialType === MaterialTypeEnum.BOOK_LINK
                        ? "https://..."
                        : "https://..."
                  }
                />
              </div>
            )}

            {materialType === MaterialTypeEnum.REQUIREMENT_TABLE && (
              <div className="space-y-3">
                {requirementTableMode === "select" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="requirement-table">Select Requirement Table</Label>
                      <Select value={requirementTableId || "none"} onValueChange={(value) => setRequirementTableId(value === "none" ? "" : value)}>
                        <SelectTrigger id="requirement-table">
                          <SelectValue placeholder="Select a requirement table" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {requirementTables.map((table: RequirementTable) => (
                            <SelectItem key={table.id} value={table.id}>
                              {table.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRequirementTableMode("create")}
                      className="w-full gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Create New Requirement Table
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Create New Requirement Table</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click below to create a new requirement table, then select it from the list.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => setIsRequirementBuilderOpen(true)}
                        className="flex-1 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Open Builder
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRequirementTableMode("select")}
                        className="flex-1"
                      >
                        Select Existing
                      </Button>
                    </div>
                    {requirementTableId && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400">
                        ✓ Selected: {requirementTables.find((t: RequirementTable) => t.id === requirementTableId)?.name || "Custom table"}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Is Mandatory */}
            <div className="flex items-center gap-2">
              <Switch
                id="is-mandatory"
                checked={isMandatory}
                onCheckedChange={setIsMandatory}
              />
              <Label htmlFor="is-mandatory">This material is mandatory</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              {material ? "Update" : "Add"} Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requirement Table Builder Dialog */}
      <RequirementTableBuilder
        isOpen={isRequirementBuilderOpen}
        onClose={() => setIsRequirementBuilderOpen(false)}
        onSave={(data) => {
          createRequirementTableMutation.mutate(data);
        }}
      />
    </>
  );
};

export default MaterialFormDialog;
