'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { CheckCircle, XCircle } from 'lucide-react'

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
  status: string;
  role: string;
  full_name?: string;
}

interface PendingUsersListProps {
  pendingUsers: PendingUser[];
  approveUser: (userId: string) => Promise<void>;
}

const PendingUsersList: React.FC<PendingUsersListProps> = ({ pendingUsers, approveUser }) => {
  const handleReject = async (userId: string) => {
    // Implementieren Sie hier die Logik zum Ablehnen eines Benutzers
    console.log('Reject user:', userId);
  };

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
                      <Button onClick={() => approveUser(user.id)}>
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

