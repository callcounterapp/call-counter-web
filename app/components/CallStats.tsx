import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  // ... other project properties
}

interface Call {
  id: number;
  // ... other call properties
}


const MyComponent = ({ user }: { user: User | null }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);

        if (projectsError) {
          throw projectsError;
        }

        setProjects(projectsData || []);


        const { data: callsData, error: callsError } = await supabase
          .from('calls')
          .select('*')
          .eq('user_id', user.id);

        if (callsError) {
          throw callsError;
        }
        setCalls(callsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const deleteCall = async (id: number) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      setCalls(calls.filter((call) => call.id !== id));
      toast({
        title: "Erfolg",
        description: "Anruf erfolgreich gelöscht.",
        variant: "success",
      })
    } catch (error) {
      console.error('Fehler beim Löschen des Anrufs:', error)
      toast({
        title: "Fehler",
        description: "Anruf konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }


  // ... rest of the component
  return (
    <div>
      <h1>Projects</h1>
      {loading ? <p>Loading...</p> : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>{project.name}</li>
          ))}
        </ul>
      )}
      <h1>Calls</h1>
      {loading ? <p>Loading...</p> : (
        <ul>
          {calls.map((call) => (
            <li key={call.id}>
              <button onClick={() => deleteCall(call.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
      {error && <p>{error}</p>}
    </div>
  );
};

export default MyComponent;

