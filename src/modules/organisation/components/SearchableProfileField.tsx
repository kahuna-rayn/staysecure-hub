import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  email?: string;
}

interface SearchableProfileFieldProps {
  value?: string;
  onSelect: (profile: Profile | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableProfileField: React.FC<SearchableProfileFieldProps> = ({
  value,
  onSelect,
  placeholder = "Select profile...",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .not('full_name', 'is', null)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProfile = profiles.find(profile => profile.full_name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {value}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search profiles..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No profiles found."}
            </CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value=""
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Clear selection
                </CommandItem>
              )}
              {filteredProfiles.map((profile) => (
                <CommandItem
                  key={profile.id}
                  value={profile.full_name}
                  onSelect={(currentValue) => {
                    const selected = profiles.find(p => p.full_name === currentValue);
                    onSelect(selected || null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === profile.full_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{profile.full_name}</span>
                    {profile.username && (
                      <span className="text-sm text-muted-foreground">@{profile.username}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableProfileField;