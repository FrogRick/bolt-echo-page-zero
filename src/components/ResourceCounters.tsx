
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, FileText, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export interface ResourceCounts {
  buildings: number;
  organizations: number;
  templates: number;
  evacuationPlans: number;
}

export const ResourceCounters = () => {
  const [counts, setCounts] = useState<ResourceCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResourceCounts = async () => {
      setIsLoading(true);
      try {
        // Get buildings count
        const { count: buildingsCount } = await supabase
          .from("buildings")
          .select("*", { count: "exact", head: true });

        // Get organizations count
        const { count: orgsCount } = await supabase
          .from("organizations")
          .select("*", { count: "exact", head: true });

        // Get templates count
        const { count: templatesCount } = await supabase
          .from("templates")
          .select("*", { count: "exact", head: true });

        // Get floor plans count (representing evacuation plans)
        const { count: plansCount } = await supabase
          .from("floor_plans")
          .select("*", { count: "exact", head: true });

        setCounts({
          buildings: buildingsCount || 0,
          organizations: orgsCount || 0,
          templates: templatesCount || 0,
          evacuationPlans: plansCount || 0,
        });
      } catch (error) {
        console.error("Error fetching resource counts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourceCounts();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-8 w-8 mb-2" />
              <Skeleton className="h-6 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const resources = [
    {
      name: "Buildings",
      count: counts?.buildings || 0,
      icon: <Building className="h-6 w-6 text-blue-500" />,
    },
    {
      name: "Organizations",
      count: counts?.organizations || 0,
      icon: <Users className="h-6 w-6 text-purple-500" />,
    },
    {
      name: "Templates",
      count: counts?.templates || 0,
      icon: <FileText className="h-6 w-6 text-amber-500" />,
    },
    {
      name: "Evacuation Plans",
      count: counts?.evacuationPlans || 0,
      icon: <Package className="h-6 w-6 text-green-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {resources.map((resource) => (
        <Card key={resource.name}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {resource.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline gap-2">
              {resource.icon}
              <span className="text-2xl font-bold">{resource.count}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
