import { useCallback, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface User {
  id: string;
  // ... other user properties
}

interface Profile {
  id: string;
  status: 'pending' | 'active' | 'rejected';
  // ... other profile properties
}

const usePendingUsers = (supabase: SupabaseClient | null, user: User | null) => {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!user?.id) {
      console.error('No user ID available');
      setError('Benutzer nicht authentifiziert');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching pending users...');
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched pending users:', data);
      setPendingUsers(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setError('Failed to fetch pending users: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const handleApprove = async (userId: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers(); // Reload the list after approval
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Failed to approve user: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleReject = async (userId: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers(); // Reload the list after rejection
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Failed to reject user: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return { pendingUsers, loading, error, loadUsers, handleApprove, handleReject };
};

export default usePendingUsers;

