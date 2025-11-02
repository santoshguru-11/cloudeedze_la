import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Server, TestTube, Code, Cpu, Presentation, Shield, Building2 } from "lucide-react";

export interface EnvironmentConfig {
  name: string;
  type: 'production' | 'staging' | 'development' | 'testing' | 'qa' | 'demo' | 'disaster-recovery';
  description?: string;
}

interface EnvironmentSelectorProps {
  value: EnvironmentConfig;
  onChange: (value: EnvironmentConfig) => void;
}

const environmentOptions = [
  {
    value: 'production' as const,
    label: 'Production',
    icon: Server,
    color: 'bg-red-500',
    description: 'Mission-critical production workloads'
  },
  {
    value: 'staging' as const,
    label: 'Staging',
    icon: Building2,
    color: 'bg-orange-500',
    description: 'Pre-production testing environment'
  },
  {
    value: 'development' as const,
    label: 'Development',
    icon: Code,
    color: 'bg-blue-500',
    description: 'Developer sandbox environment'
  },
  {
    value: 'testing' as const,
    label: 'Testing',
    icon: TestTube,
    color: 'bg-green-500',
    description: 'Automated testing environment'
  },
  {
    value: 'qa' as const,
    label: 'QA',
    icon: Cpu,
    color: 'bg-purple-500',
    description: 'Quality assurance environment'
  },
  {
    value: 'demo' as const,
    label: 'Demo',
    icon: Presentation,
    color: 'bg-yellow-500',
    description: 'Customer demonstration environment'
  },
  {
    value: 'disaster-recovery' as const,
    label: 'Disaster Recovery',
    icon: Shield,
    color: 'bg-gray-500',
    description: 'Standby DR environment'
  }
];

export function EnvironmentSelector({ value, onChange }: EnvironmentSelectorProps) {
  const selectedOption = environmentOptions.find(opt => opt.value === value.type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="environment-type" className="text-base font-semibold">
          Environment Type
        </Label>
        {selectedOption && (
          <Badge className={`${selectedOption.color} text-white`}>
            {selectedOption.label}
          </Badge>
        )}
      </div>

      <Select
        value={value.type}
        onValueChange={(type) => onChange({ ...value, type: type as EnvironmentConfig['type'] })}
      >
        <SelectTrigger id="environment-type" className="w-full">
          <SelectValue placeholder="Select environment type">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <selectedOption.icon className="h-4 w-4" />
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {environmentOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <option.icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-2">
        <Label htmlFor="environment-name">Environment Name</Label>
        <Input
          id="environment-name"
          placeholder="e.g., Production-US-East, Dev-Team-A"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="environment-description">Description (Optional)</Label>
        <Textarea
          id="environment-description"
          placeholder="Add any additional details about this environment..."
          value={value.description || ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
