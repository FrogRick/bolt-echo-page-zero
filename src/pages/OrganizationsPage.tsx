
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Plus, Users, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InviteUserDialog } from "@/components/InviteUserDialog";

interface Organization {
  id: string;
  name: string;
  created_at: string;
  role: string;
  memberCount?: number;
}

const OrganizationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("My Organization");

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      // Get all organizations where the current user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations(id, name, created_at)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (memberError) {
        console.error("Error fetching organizations:", memberError);
        throw memberError;
      }

      if (!memberData || memberData.length === 0) {
        setOrganizations([]);
        setIsLoading(false);
        return;
      }

      // Transform data into the expected format
      const orgs: Organization[] = memberData.map((item: any) => ({
        id: item.organizations.id,
        name: item.organizations.name,
        created_at: item.organizations.created_at,
        role: item.role,
        memberCount: 0 // We'll fetch this separately
      }));

      // Fetch member counts for each organization
      for (const org of orgs) {
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('status', 'active');
        
        org.memberCount = count || 0;
      }

      setOrganizations(orgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error loading organizations",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewOrganization = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an organization.",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreatingOrg(true);

      // Create a new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: organizationName }])
        .select();

      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw orgError;
      }

      if (!orgData || orgData.length === 0) {
        throw new Error("No organization data returned after creation");
      }

      const newOrg = orgData[0];

      // Add the current user as the owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
          status: 'active'
        }]);

      if (memberError) {
        console.error("Member creation error:", memberError);
        throw memberError;
      }

      toast({
        title: "Organization created",
        description: "Your new organization has been created successfully."
      });

      // Refresh the list
      fetchOrganizations();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error creating organization",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setCreatingOrg(false);
    }
  };
  
  const handleInvite = (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsInviteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <Button onClick={createNewOrganization} disabled={creatingOrg}>
          <Plus className="mr-2 h-4 w-4" />
          {creatingOrg ? "Creating..." : "New Organization"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-gray-100"></CardHeader>
              <CardContent className="h-16 mt-2"></CardContent>
            </Card>
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Organizations Yet</h3>
            <p className="text-gray-500 mb-6">
              Create an organization to collaborate with team members on fire safety plans.
            </p>
            <Button onClick={createNewOrganization} disabled={creatingOrg}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate">{org.name}</span>
                  {org.role === 'owner' && (
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">Owner</span>
                  )}
                  {org.role === 'admin' && (
                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">Admin</span>
                  )}
                </CardTitle>
                <CardDescription>
                  Created on {new Date(org.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{org.memberCount} members</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/organizations/${org.id}`}>
                        View Details
                      </a>
                    </Button>
                  </div>
                  
                  {/* Only show invite button for owners and admins */}
                  {(org.role === 'owner' || org.role === 'admin') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInvite(org.id)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Invite User
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedOrgId && (
        <InviteUserDialog 
          organizationId={selectedOrgId}
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          onInvited={fetchOrganizations}
        />
      )}
    </div>
  );
};

export default OrganizationsPage;
