import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings, 
  Eye,
  Copy,
  Save
} from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  order: number;
}

interface FormBuilderProps {
  initialFields?: FormField[];
  onSave?: (fields: FormField[]) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  initialFields = [],
  onSave
}) => {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'password', label: 'Password' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Group' },
    { value: 'date', label: 'Date Picker' },
    { value: 'file', label: 'File Upload' },
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const duplicateField = (field: FormField) => {
    const newField: FormField = {
      ...field,
      id: `field_${Date.now()}`,
      label: `${field.label} (Copy)`,
      order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const renderFieldEditor = (field: FormField) => (
    <Card key={field.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            <CardTitle className="text-lg">{field.label}</CardTitle>
            <Badge variant="outline">{field.type}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => duplicateField(field)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeField(field.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Field Label</Label>
            <Input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>
          <div>
            <Label>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value: FormField['type']) => 
                updateField(field.id, { type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={field.required || false}
            onCheckedChange={(checked) => updateField(field.id, { required: checked })}
          />
          <Label>Required field</Label>
        </div>

        {(field.type === 'select' || field.type === 'radio') && (
          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {(field.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = { ...option, label: e.target.value };
                      updateField(field.id, { options: newOptions });
                    }}
                    placeholder="Option label"
                  />
                  <Input
                    value={option.value}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = { ...option, value: e.target.value };
                      updateField(field.id, { options: newOptions });
                    }}
                    placeholder="Option value"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOptions = field.options?.filter((_, i) => i !== index) || [];
                      updateField(field.id, { options: newOptions });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(field.options || []), { label: '', value: '' }];
                  updateField(field.id, { options: newOptions });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderFieldPreview = (field: FormField) => {
    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {field.type === 'text' && (
          <Input
            id={field.id}
            type="text"
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
          />
        )}

        {field.type === 'email' && (
          <Input
            id={field.id}
            type="email"
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
          />
        )}

        {field.type === 'password' && (
          <Input
            id={field.id}
            type="password"
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
          />
        )}

        {field.type === 'number' && (
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
          />
        )}

        {field.type === 'select' && (
          <Select
            value={formData[field.id] || ''}
            onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'checkbox' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formData[field.id] || false}
              onCheckedChange={(checked) => setFormData({ ...formData, [field.id]: checked })}
            />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        )}

        {field.type === 'radio' && (
          <RadioGroup
            value={formData[field.id] || ''}
            onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}_${option.value}`} />
                <Label htmlFor={`${field.id}_${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field.type === 'date' && (
          <Input
            id={field.id}
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
          />
        )}

        {field.type === 'file' && (
          <Input
            id={field.id}
            type="file"
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.files?.[0] })}
            required={field.required}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Form Builder</h2>
          <p className="text-gray-600">Create dynamic forms with validation and conditional logic</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <Settings className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button onClick={() => onSave?.(fields)}>
            <Save className="w-4 h-4 mr-2" />
            Save Form
          </Button>
        </div>
      </div>

      <Separator />

      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Form Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map(renderFieldPreview)}
            <Button className="w-full">Submit Form</Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          {fields.map(renderFieldEditor)}
          <Button onClick={addField} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
}; 