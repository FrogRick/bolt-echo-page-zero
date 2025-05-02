
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface OrganizationSelectProps {
  onSelect: (value: string | null) => void;
  selected: string | null;
}

export function OrganizationSelect({ onSelect, selected }: OrganizationSelectProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Use a direct query instead of a join to avoid recursive policy issues
        // First get the organization memberships
        const { data: memberships, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (membershipError) {
          throw membershipError;
        }

        if (!memberships || memberships.length === 0) {
          setOrganizations([]);
          return;
        }

        // Then get the organization details separately
        const orgIds = memberships.map(m => m.organization_id);
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);

        if (orgsError) {
          throw orgsError;
        }

        if (orgsData) {
          // Merge the data to create our organization objects
          const orgs: Organization[] = orgsData.map(org => {
            const membership = memberships.find(m => m.organization_id === org.id);
            return {
              id: org.id,
              name: org.name,
              role: membership?.role || 'member'
            };
          });
          setOrganizations(orgs);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [user]);
  
  const selectedOrg = organizations.find(org => org.id === selected);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading organizations...
            </div>
          ) : selected ? (
            selectedOrg?.name || "Select an organization"
          ) : (
            "Select an organization"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandEmpty>No organization found.</CommandEmpty>
          <CommandGroup>
            {organizations.map((org) => (
              <CommandItem
                key={org.id}
                value={org.id}
                onSelect={(currentValue) => {
                  onSelect(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected === org.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {org.name}
                <span className="ml-auto text-xs text-muted-foreground">({org.role})</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
