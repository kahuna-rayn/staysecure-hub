import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Variable, Clock, Building, User, Mail, Phone } from 'lucide-react';
import { getAvailableVariables, TemplateVariable } from '@/lib/variableSubstitution';

interface TextSubstitutionProps {
  onVariableInsert: (variable: string) => void;
}

// Icon mapping for categories
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    'Organization': Building,
    'User': User,
    'IT': Phone,
    'Key Personnel': User,
    'System': Clock,
    'DPO': User, // Legacy support
  };
  return iconMap[category] || Variable;
};

export const TextSubstitution = ({ onVariableInsert }: TextSubstitutionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVariables = async () => {
      try {
        const fetchedVariables = await getAvailableVariables('en');
        setVariables(fetchedVariables);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(fetchedVariables.map(v => v.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error loading variables:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVariables();
  }, []);

  const filteredVariables = selectedCategory 
    ? variables.filter(v => v.category === selectedCategory)
    : variables;

  const handleVariableClick = (variableKey: string) => {
    onVariableInsert(`{{${variableKey}}}`);
    setIsOpen(false);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Organization': 'bg-blue-100 text-blue-800',
      'User': 'bg-green-100 text-green-800',
      'IT': 'bg-purple-100 text-purple-800',
      'DPO': 'bg-orange-100 text-orange-800',
      'System': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <Variable className="w-4 h-4 mr-2" />
          Variables
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dynamic Variables</CardTitle>
            <CardDescription className="text-xs">
              Insert variables that will be replaced with actual values
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="h-6 px-2 text-xs"
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="h-6 px-2 text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Variables List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-xs text-muted-foreground text-center py-4">Loading variables...</div>
              ) : filteredVariables.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No variables available</div>
              ) : (
                filteredVariables.map((variable) => {
                  const Icon = getCategoryIcon(variable.category);
                  return (
                    <div
                      key={variable.key}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleVariableClick(variable.key)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-xs font-medium">{variable.display_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {`{{${variable.key}}}`}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(variable.category)}`}
                      >
                        {variable.category}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Click on a variable to insert it into your content
              </p>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};