import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import ProjectSetup from "../components/ProjectSetup"
import DailyOffer from "../components/DailyOffer"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "../contexts/AuthContext"

// Define the Project type
interface Project {
  id: string;
  internal_name: string;
  display_name: string;
  payment_model: 'perMinute' | 'perCall' | 'custom';
  min_duration: number;
  round_up_minutes: boolean;
  per_minute_rate?: number;
  per_call_rate?: number;
  custom_rates?: { minDuration: number; maxDuration: number; rate: number }[];
  user_id: string;
}

export default function DashboardContent() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.id && supabase) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching projects:', error)
        } else {
          setProjects(data as Project[] || [])
        }
      }
    }

    fetchProjects()
  }, [user])

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="projects">Projekte</TabsTrigger>
        <TabsTrigger value="dailyoffer">Tagesangebot</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="projects">
        <ProjectSetup projects={projects} />
      </TabsContent>
      <TabsContent value="dailyoffer">
        <DailyOffer />
      </TabsContent>
    </Tabs>
  )
}

