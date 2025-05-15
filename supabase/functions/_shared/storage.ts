
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
// Note: We use SupabaseClient type from esm.sh as well
type SupabaseClient = ReturnType<typeof createClient>;

// Ensure the avatars bucket exists
export async function ensureAvatarsBucketExists(supabase: SupabaseClient) {
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === 'avatars');
  
  if (!bucketExists) {
    // Create bucket if it doesn't exist
    const { error } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });
    
    if (error) {
      console.error('Error creating avatars bucket:', error);
      return false;
    }
    
    console.log('Created avatars bucket successfully');
  }
  
  return true;
}
