import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, Zap, Moon, Sun, Coffee } from "lucide-react";

export interface RunningSchedule {
  hoursPerDay: number;
  daysPerWeek: number;
  hoursPerMonth?: number;
  timezone?: string;
  schedule?: string;
}

interface ScheduleConfiguratorProps {
  value: RunningSchedule;
  onChange: (value: RunningSchedule) => void;
}

const scheduleTemplates = [
  {
    id: 'always-on',
    name: 'Always On',
    icon: Zap,
    schedule: { hoursPerDay: 24, daysPerWeek: 7, schedule: '24/7', hoursPerMonth: 730 },
    description: '24/7 operation',
    color: 'bg-green-500'
  },
  {
    id: 'business-hours',
    name: 'Business Hours',
    icon: Coffee,
    schedule: { hoursPerDay: 8, daysPerWeek: 5, schedule: '9am-5pm Mon-Fri', hoursPerMonth: 173 },
    description: '9am-5pm Mon-Fri',
    color: 'bg-blue-500'
  },
  {
    id: 'extended-business',
    name: 'Extended Business',
    icon: Sun,
    schedule: { hoursPerDay: 12, daysPerWeek: 5, schedule: '8am-8pm Mon-Fri', hoursPerMonth: 260 },
    description: '8am-8pm Mon-Fri',
    color: 'bg-orange-500'
  },
  {
    id: 'weekdays-only',
    name: 'Weekdays Only',
    icon: Calendar,
    schedule: { hoursPerDay: 24, daysPerWeek: 5, schedule: '24 hours Mon-Fri', hoursPerMonth: 520 },
    description: '24hrs Mon-Fri',
    color: 'bg-purple-500'
  },
  {
    id: 'nights-weekends',
    name: 'Nights & Weekends',
    icon: Moon,
    schedule: { hoursPerDay: 16, daysPerWeek: 2, schedule: 'Sat-Sun + nights', hoursPerMonth: 139 },
    description: 'Off-hours only',
    color: 'bg-indigo-500'
  },
  {
    id: 'development',
    name: 'Development',
    icon: Clock,
    schedule: { hoursPerDay: 10, daysPerWeek: 5, schedule: '8am-6pm Mon-Fri', hoursPerMonth: 217 },
    description: '8am-6pm Mon-Fri',
    color: 'bg-cyan-500'
  }
];

export function ScheduleConfigurator({ value, onChange }: ScheduleConfiguratorProps) {
  const [mode, setMode] = useState<'template' | 'custom'>('template');

  const calculatedHoursPerMonth = Math.round((value.hoursPerDay * (value.daysPerWeek / 7) * 30));
  const utilizationPercentage = ((calculatedHoursPerMonth / 730) * 100).toFixed(1);

  const handleTemplateSelect = (template: typeof scheduleTemplates[0]) => {
    onChange(template.schedule);
    setMode('template');
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Running Schedule</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Define when your resources will be running to optimize costs
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'template' | 'custom')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template">Quick Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduleTemplates.map((template) => {
              const isSelected =
                value.hoursPerDay === template.schedule.hoursPerDay &&
                value.daysPerWeek === template.schedule.daysPerWeek;

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <template.icon className="h-5 w-5 text-primary" />
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Hours/month:</span>
                        <span className="font-medium">{template.schedule.hoursPerMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilization:</span>
                        <span className="font-medium">
                          {((template.schedule.hoursPerMonth! / 730) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="hours-per-day">Hours Per Day</Label>
                <Badge variant="outline">{value.hoursPerDay} hours</Badge>
              </div>
              <Slider
                id="hours-per-day"
                min={1}
                max={24}
                step={1}
                value={[value.hoursPerDay]}
                onValueChange={([val]) => onChange({ ...value, hoursPerDay: val })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 hour</span>
                <span>24 hours</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="days-per-week">Days Per Week</Label>
                <Badge variant="outline">{value.daysPerWeek} days</Badge>
              </div>
              <Slider
                id="days-per-week"
                min={1}
                max={7}
                step={1}
                value={[value.daysPerWeek]}
                onValueChange={([val]) => onChange({ ...value, daysPerWeek: val })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 day</span>
                <span>7 days</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-description">Schedule Description (Optional)</Label>
              <Input
                id="schedule-description"
                placeholder="e.g., 9am-5pm Mon-Fri, Weekends only"
                value={value.schedule || ''}
                onChange={(e) => onChange({ ...value, schedule: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hours per day:</span>
            <span className="font-medium">{value.hoursPerDay} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Days per week:</span>
            <span className="font-medium">{value.daysPerWeek} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. hours per month:</span>
            <span className="font-medium">{calculatedHoursPerMonth} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Utilization:</span>
            <span className="font-medium text-primary">{utilizationPercentage}%</span>
          </div>
          {value.schedule && (
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Schedule:</span>
              <span className="font-medium">{value.schedule}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
