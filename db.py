import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create and return a Supabase client instance."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
    
    return create_client(supabase_url, supabase_key)

def get_db_connection():
    """Get a database connection using Supabase client."""
    supabase = get_supabase_client()
    return supabase.table("")  # You can specify the table name when needed

# Example usage:
if __name__ == "__main__":
    try:
        db = get_db_connection()
        print("Successfully connected to Supabase database!")
    except Exception as e:
        print(f"Error connecting to database: {e}")
