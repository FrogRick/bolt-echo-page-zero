
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserProfileForm } from "@/components/UserProfileForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Settings, Trash, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  );
  const [activeTab, setActiveTab] = useState("profile");

  // Function to handle profile picture upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded file
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      if (data) {
        // Update user metadata with avatar URL
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: data.publicUrl }
        });

        if (updateError) {
          throw updateError;
        }

        setAvatarUrl(data.publicUrl);
        toast({
          title: "Success",
          description: "Profile picture updated successfully.",
        });
        
        // Refresh subscription data to ensure UI updates
        refreshSubscription();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error uploading avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Function to delete profile picture
  const handleDeleteAvatar = async () => {
    try {
      setUploading(true);
      
      if (!user) return;
      
      // If there's no avatar URL, nothing to delete
      if (!avatarUrl) {
        toast({
          title: "No profile picture",
          description: "You don't have a profile picture to delete.",
        });
        return;
      }
      
      // Extract the file name from the URL
      const filePathMatch = avatarUrl.match(/\/avatars\/([^?]+)/);
      if (!filePathMatch) {
        throw new Error("Could not determine avatar file path.");
      }
      
      const filePath = filePathMatch[1];
      
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Update user metadata to remove avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      setAvatarUrl(null);
      toast({
        title: "Success",
        description: "Profile picture deleted successfully.",
      });
      
      // Refresh subscription data to ensure UI updates
      refreshSubscription();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error deleting avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getUserInitials = () => {
    const firstName = user?.user_metadata?.first_name || '';
    const lastName = user?.user_metadata?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  // Function to trigger file input click
  const triggerFileInput = () => {
    document.getElementById('avatar-upload')?.click();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Settings className="h-8 w-8" />
        Settings
      </h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid grid-cols-3 sm:grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger" className="text-red-500">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Profile Information</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                <div className="relative group">
                  <Avatar 
                    className="h-24 w-24 cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-500">Upload a profile picture</p>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      disabled={uploading}
                      onClick={triggerFileInput}
                      className="flex gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Change Picture"}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex gap-2 text-red-500 border-red-200 hover:bg-red-50"
                          disabled={!avatarUrl || uploading}
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete profile picture?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your profile picture. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAvatar}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Profile Form */}
              <UserProfileForm onComplete={() => {}} initialField={null} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Appearance</CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Language</h3>
                  <select 
                    className="w-full mt-2 border rounded px-3 py-2" 
                    defaultValue="en"
                  >
                    <option value="en">English</option>
                    <option value="sv">Svenska</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Button variant="outline" className="h-20 relative">
                      Light
                      <div className="absolute bottom-2 right-2 w-3 h-3 bg-black rounded-full"></div>
                    </Button>
                    <Button variant="outline" className="h-20 relative bg-gray-900 text-white border-gray-700">
                      Dark
                      <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-full"></div>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-gray-500">Receive updates on your device</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
              <CardDescription>Actions that can't be undone</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Deleting your account will remove all your data and cannot be reversed.
              </p>
              <DeleteAccountDialog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
