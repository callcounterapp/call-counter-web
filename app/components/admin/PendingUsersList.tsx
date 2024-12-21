'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { CheckCircle, XCircle } from 'lucide-react'

interface User {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  status: string;
  role: string;
}

interface PendingUsersListProps {
  pendingUsers?: User[];
  approveUser?: (userId: string) => Promise<void>;
}

const PendingUsersList: React.FC<PendingUsersListProps> = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
  }, [user]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleApprove = async (userId: string) => {
    try {
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

  if (!user || user.role !== 'admin') {
    return <div>Sie haben keine Berechtigung, diese Seite zu sehen.</div>;
  }

  if (loading) return <div>Laden...</div>;
  if (error) return <div>Fehler: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ausstehende Benutzer</CardTitle>
        <CardDescription>Genehmigen oder ablehnen Sie ausstehende Benutzerregistrierungen</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <p>Keine ausstehenden Benutzer vorhanden.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Registriert am</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button onClick={() => handleApprove(user.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Genehmigen
                      </Button>
                      <Button variant="destructive" onClick={() => handleReject(user.id)}>
                        <XCircle className="h-4 w-4 mr-2" /> Ablehnen
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingUsersList;

