
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateSubscriptionTiers } from "@/scripts/updateSubscriptionTiers";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminPage = () => {
  const [isUpdatingTiers, setIsUpdatingTiers] = useState(false);
  const { toast } = useToast();

  const handleUpdateSubscriptionTiers = async () => {
    setIsUpdatingTiers(true);
    try {
      await updateSubscriptionTiers();
      toast({
        title: "Subscription tiers updated",
        description: "The subscription tiers have been successfully synchronized with the database.",
      });
    } catch (error) {
      console.error("Error updating subscription tiers:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the subscription tiers.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTiers(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Database Management</CardTitle>
            <CardDescription>Manage subscription tiers and database content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Update subscription tiers in the database to match the application's configuration.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpdateSubscriptionTiers}
              disabled={isUpdatingTiers}
              className="w-full"
            >
              {isUpdatingTiers ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Subscription Tiers
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
