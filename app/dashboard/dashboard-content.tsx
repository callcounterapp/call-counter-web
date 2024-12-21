import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProjectSetup from "../components/ProjectSetup"
import DailyOffer from "../components/DailyOffer"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "../contexts/AuthContext"

export default function DashboardContent() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching projects:', error)
        } else {
          setProjects(data || [])
        }
      }
    }

    fetchProjects()
  }, [user])

  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching projects:', error)
        } else {
          setProjects(data || [])
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

