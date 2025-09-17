import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateLessonAvailability, formatAvailableDate, SchedulingConfig } from '@/lib/scheduling';
import { setMockCurrentDate, clearMockDate, getCurrentDate, isUsingMockDate } from '@/lib/dateUtils';

interface TestScenario {
  name: string;
  description: string;
  config: SchedulingConfig;
  totalLessons: number;
}

// Function to create dynamic test scenarios based on current date
const createTestScenarios = (): TestScenario[] => {
  const now = getCurrentDate();
  const startDate = new Date(now); // Start from current date
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 60); // End 60 days after start
  
  return [
    {
      name: "Fixed Dates Example",
      description: `Start on ${startDate.toLocaleDateString()}, finish ${endDate.toLocaleDateString()}, 2 lessons per week`,
      config: {
        schedule_type: 'fixed_dates',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        duration_weeks: null,
        lessons_per_week: null,
        allow_all_lessons_immediately: false,
        schedule_days: undefined,
        max_lessons_per_week: null
      },
      totalLessons: 10
    },
    {
      name: "Weekly Schedule - Mon/Wed",
      description: "Start on login, finish in 5 weeks, Monday and Wednesday",
      config: {
        schedule_type: 'weekly_schedule',
        start_date: null,
        end_date: null,
        duration_weeks: 5,
        lessons_per_week: null,
        allow_all_lessons_immediately: false,
        schedule_days: [1, 3], // Monday, Wednesday
        max_lessons_per_week: null
      },
      totalLessons: 10
    },
    {
      name: "Weekly Schedule - Tue/Thu",
      description: "Start on login, finish in 5 weeks, Tuesday and Thursday",
      config: {
        schedule_type: 'weekly_schedule',
        start_date: null,
        end_date: null,
        duration_weeks: 5,
        lessons_per_week: null,
        allow_all_lessons_immediately: false,
        schedule_days: [2, 4], // Tuesday, Thursday
        max_lessons_per_week: null
      },
      totalLessons: 10
    },
    {
      name: "Duration Based",
      description: "4 weeks, 2 lessons per week",
      config: {
        schedule_type: 'duration_based',
        start_date: null,
        end_date: null,
        duration_weeks: 4,
        lessons_per_week: 2,
        allow_all_lessons_immediately: false,
        schedule_days: undefined,
        max_lessons_per_week: null
      },
      totalLessons: 8
    }
  ];
};

export const SchedulingTestPanel = () => {
  const [mockDate, setMockDate] = useState<string>('2025-04-01');
  const [userEnrollmentDate, setUserEnrollmentDate] = useState<string>('2025-04-01');
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when mock date changes
  
  // Get dynamic scenarios based on current date
  const testScenarios = createTestScenarios();
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(testScenarios[0]);

  const userProgress = {
    enrolled_at: userEnrollmentDate + 'T00:00:00Z',
    started_at: null,
    completed_at: null,
    current_lesson_order: 0
  };

  const handleSetMockDate = () => {
    console.log('Setting mock date to:', mockDate);
    setMockCurrentDate(mockDate);
    console.log('Mock date set. Current date is now:', getCurrentDate().toLocaleDateString());
    setRefreshKey(prev => prev + 1); // Force re-render
    
    // Update scenarios and reset selection when mock date changes
    const newScenarios = createTestScenarios();
    setSelectedScenario(newScenarios[0]);
  };

  const handleClearMockDate = () => {
    clearMockDate();
    setRefreshKey(prev => prev + 1); // Force re-render
  };

  const getLessonAvailability = (lessonIndex: number) => {
    return calculateLessonAvailability(
      lessonIndex,
      selectedScenario.totalLessons,
      selectedScenario.config,
      userProgress
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scheduling Test Panel</CardTitle>
          <CardDescription>
            Test different scheduling scenarios with mock dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mock Date Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mockDate">Mock Current Date</Label>
              <Input
                id="mockDate"
                type="date"
                value={mockDate}
                onChange={(e) => setMockDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="enrollmentDate">User Enrollment Date</Label>
              <Input
                id="enrollmentDate"
                type="date"
                value={userEnrollmentDate}
                onChange={(e) => setUserEnrollmentDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSetMockDate} variant="outline">
              Set Mock Date
            </Button>
            <Button onClick={handleClearMockDate} variant="outline">
              Clear Mock Date
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Current Date:</span>
            <Badge variant={isUsingMockDate() ? "default" : "secondary"}>
              {getCurrentDate().toLocaleDateString()}
              {isUsingMockDate() && " (Mocked)"}
            </Badge>
            <span className="text-xs text-muted-foreground">(Key: {refreshKey})</span>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedScenario.name} onValueChange={(value) => {
            const scenario = testScenarios.find(s => s.name === value);
            if (scenario) setSelectedScenario(scenario);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {testScenarios.map((scenario) => (
                <SelectItem key={`${scenario.name}-${refreshKey}`} value={scenario.name}>
                  {scenario.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <p className="text-sm text-muted-foreground mt-2">
            {selectedScenario.description}
          </p>
        </CardContent>
      </Card>

      {/* Lesson Availability Results */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Availability</CardTitle>
          <CardDescription>
            Showing availability for {selectedScenario.totalLessons} lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: selectedScenario.totalLessons }, (_, i) => {
              const availability = getLessonAvailability(i);
              return (
                <div key={`${i}-${refreshKey}`} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">Lesson {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={availability.available ? "default" : "secondary"}>
                      {availability.available ? "Available" : "Not Available"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatAvailableDate(availability.available_date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 