import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2 } from "lucide-react";

interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_email: string;
  building_id: string;
}

interface BuildingNotesProps {
  buildingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuildingNotes({ buildingId, open, onOpenChange }: BuildingNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Load notes when dialog opens
  useEffect(() => {
    if (open && buildingId) {
      loadNotes();
    }
  }, [open, buildingId]);

  const loadNotes = async () => {
    if (!buildingId || !user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Get notes without joining to profiles first for stability
      const { data, error } = await supabase
        .from('building_notes')
        .select(`
          id,
          content,
          created_at,
          user_id,
          building_id
        `)
        .eq('building_id', buildingId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Format notes for display with user info
      const formattedNotes = await Promise.all(data.map(async (note: any) => {
        let userEmail = 'Unknown user';
        
        // Try to get user email if it's the current user
        if (note.user_id === user.id) {
          userEmail = user.email || 'You';
        } else {
          // Try to fetch the email from profiles
          try {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', note.user_id)
              .single();
            
            if (!userError && userData) {
              userEmail = userData.email;
            }
          } catch (e) {
            console.warn("Could not fetch user email:", e);
          }
        }
        
        return {
          ...note,
          user_email: userEmail
        };
      }));
      
      setNotes(formattedNotes);
    } catch (error: any) {
      console.error('Error loading notes:', error);
      setError("Failed to load notes. Please try again.");
      console.log("Failed to load notes:", error.message || "Please try again later");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !buildingId || !user) return;
    
    setSubmitting(true);
    setError(null);
    try {
      // Add the note to the database
      const { data, error } = await supabase
        .from('building_notes')
        .insert({
          content: newNote.trim(),
          building_id: buildingId,
          user_id: user.id
        })
        .select();
      
      if (error) throw error;
      
      // Update local state with the new note
      if (data && data[0]) {
        const addedNote = data[0];
        const newNoteWithUser = {
          ...addedNote,
          user_email: user.email || 'You'
        };
        
        setNotes([newNoteWithUser, ...notes]);
        setNewNote("");
        
        console.log("Note added successfully");
      }
    } catch (error: any) {
      console.error('Error adding note:', error);
      setError("Failed to add note. Please try again.");
      console.log("Failed to add note:", error.message || "Please try again later");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId || !user) return;
    
    setDeleting(true);
    try {
      // Delete the note from the database
      const { error } = await supabase
        .from('building_notes')
        .delete()
        .eq('id', deleteNoteId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setNotes(notes.filter(note => note.id !== deleteNoteId));
      setDeleteNoteId(null);
      
      console.log("Note deleted successfully");
    } catch (error: any) {
      console.error('Error deleting note:', error);
      console.log("Failed to delete note:", error.message || "Please try again later");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Building Notes</DialogTitle>
            <DialogDescription>
              Add comments or notes about this building
            </DialogDescription>
          </DialogHeader>
          
          {/* New note form */}
          <div className="space-y-4 my-4">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleAddNote} 
              disabled={submitting || !newNote.trim() || !user}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Note'
              )}
            </Button>
          </div>
          
          {/* Notes list */}
          <div className="space-y-4 mt-6">
            <h3 className="font-medium text-lg">Notes</h3>
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-center">
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={loadNotes}
                >
                  Try Again
                </Button>
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No notes yet. Be the first to add a note!
              </p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {notes.map((note) => (
                  <div 
                    key={note.id} 
                    className="bg-muted p-4 rounded-lg relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm text-primary">
                        {note.user_email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(note.created_at)}
                      </div>
                    </div>
                    <div className="mt-2 text-sm whitespace-pre-wrap">
                      {note.content}
                    </div>
                    
                    {/* Delete button (only shown for owner) */}
                    {user && note.user_id === user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteNoteId(note.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!deleteNoteId} 
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
