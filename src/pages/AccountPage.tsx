
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { ExternalLink, Settings, Building, PlusCircle, CreditCard, RefreshCcw, Loader2, Edit } from "lucide-react";
import { UserProfileForm } from "@/components/UserProfileForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { ResourceCounters } from "@/components/ResourceCounters";
import { Badge } from "@/components/ui/badge";

const AccountPage = () => {
  const {
    user,
    subscription,
    buildingUsage,
    refreshSubscription,
    createCustomerPortalSession
  } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [editingField, setEditingField] = useState<"email" | "name" | "password" | null>(null);

  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  const handleRefreshSubscription = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setIsRefreshing(false);
  };
  
  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    try {
      const url = await createCustomerPortalSession();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating customer portal session:", error);
    } finally {
      setIsRedirecting(false);
    }
  };

  // Calculate percentages for progress bars
  const totalBuildingsPercentage = Math.min(buildingUsage.total / buildingUsage.limits.total * 100, 100);
  const monthlyBuildingsPercentage = Math.min(buildingUsage.monthly / buildingUsage.limits.monthly * 100, 100);
  
  return <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Account</h1>

      {/* Subscription Tier Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Current Plan: 
            <Badge className="text-lg py-1 px-3 bg-primary/20 text-primary hover:bg-primary/30">
              {subscription.tier.toUpperCase()}
            </Badge>
            {subscription.isTrial && (
              <Badge variant="outline" className="ml-1">Trial</Badge>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            Status: <span className="font-medium capitalize">{subscription.status}</span>
            {subscription.endDate && (
              <span className="ml-2">
                • {subscription.isTrial ? "Trial ends" : "Renews"} on {new Date(subscription.endDate).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleManageSubscription} 
          disabled={subscription.tier === "free" || isRedirecting}
          className="whitespace-nowrap"
        >
          {isRedirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          {subscription.tier === "free" ? "Upgrade Plan" : "Manage Plan"}
        </Button>
      </div>

      {/* Resource Counters */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Your Resources</h2>
        <ResourceCounters />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Account Information</CardTitle>
            <CardDescription>Your personal details and account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{user.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditingField(editingField === "email" ? null : "email")}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit Email</span>
              </Button>
            </div>

            {editingField === "email" && (
              <UserProfileForm 
                initialField="email" 
                onComplete={() => setEditingField(null)} 
              />
            )}

            {user.user_metadata?.first_name && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p>{`${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingField(editingField === "name" ? null : "name")}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit Name</span>
                </Button>
              </div>
            )}

            {editingField === "name" && (
              <UserProfileForm 
                initialField="name" 
                onComplete={() => setEditingField(null)} 
              />
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setEditingField(editingField === "password" ? null : "password")}>
              {editingField === "password" ? "Cancel" : "Change Password"}
            </Button>
            
            {editingField === "password" && <ChangePasswordForm onComplete={() => setEditingField(null)} />}
            
            <DeleteAccountDialog />
          </CardFooter>
        </Card>

        {/* Subscription Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Subscription</CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshSubscription} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Current Plan</p>
                <p className="text-2xl font-bold capitalize">{subscription.tier}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription.status === "active" ? "bg-[#1cdd86]/10 text-[#1cdd86]" : subscription.status === "trialing" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {subscription.status}
                </div>
              </div>
            </div>

            {/* Building usage */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Total Buildings</p>
                  <p className="text-sm text-gray-500">{buildingUsage.total} / {buildingUsage.limits.total}</p>
                </div>
                <Progress value={totalBuildingsPercentage} />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Monthly New Buildings</p>
                  <p className="text-sm text-gray-500">{buildingUsage.monthly} / {buildingUsage.limits.monthly}</p>
                </div>
                <Progress value={monthlyBuildingsPercentage} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" onClick={handleManageSubscription} disabled={subscription.tier === "free" || isRedirecting}>
              {isRedirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              {subscription.tier === "free" ? "No subscription to manage" : "Manage Subscription"}
            </Button>
            
            {subscription.tier === "free" && <Button variant="outline" className="w-full" asChild>
                <a href="/pricing">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Upgrade your plan
                </a>
              </Button>}
          </CardFooter>
        </Card>
      </div>
    </div>;
};
export default AccountPage;
