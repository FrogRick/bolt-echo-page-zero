
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserProfileForm } from "@/components/UserProfileForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Settings, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  );
  const [language, setLanguage] = useState("sv");

  // Function to handle profile picture upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user?.id}.${fileExt}`;

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

  const getUserInitials = () => {
    const firstName = user?.user_metadata?.first_name || '';
    const lastName = user?.user_metadata?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Settings className="h-8 w-8" />
        Settings
      </h1>
      
      <div className="grid gap-8">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Profile</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-gray-500">Upload a profile picture</p>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    disabled={uploading}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="flex gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Change Picture"}
                  </Button>
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
        
        {/* Language Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Language Preferences</CardTitle>
            <CardDescription>Select your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <select 
              className="w-full border rounded px-3 py-2" 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="sv">Svenska</option>
              <option value="en">English</option>
            </select>
          </CardContent>
        </Card>
        
        {/* Account Management */}
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
      </div>
    </div>
  );
}
