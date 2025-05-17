
import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ResourceUsage {
  used: number;
  total: number;
}

interface ResourceStatistics {
  buildings: ResourceUsage;
  organizations: ResourceUsage;
  templates: ResourceUsage;
  evacuationPlans: ResourceUsage;
}

interface BuildingUsage {
  total: number;
  monthly: number;
  limits: {
    total: number;
    monthly: number;
  };
}

interface ResourceUsageTableProps {
  resourceStats: ResourceStatistics;
  buildingUsage: BuildingUsage;
}

const ResourceUsageTable: React.FC<ResourceUsageTableProps> = ({ resourceStats, buildingUsage }) => {
  const calculatePercentage = (used: number, total: number): number => {
    return Math.min(Math.round((used / total) * 100), 100);
  };

  const hasReachedLimit = 
    buildingUsage.total >= buildingUsage.limits.total || 
    buildingUsage.monthly >= buildingUsage.limits.monthly ||
    resourceStats.organizations.used >= resourceStats.organizations.total ||
    resourceStats.templates.used >= resourceStats.templates.total ||
    resourceStats.evacuationPlans.used >= resourceStats.evacuationPlans.total;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
        <CardDescription>Overview of your resource usage compared to limits</CardDescription>
      </CardHeader>
      <CardContent>
        {hasReachedLimit && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Usage Limit Reached</AlertTitle>
            <AlertDescription>
              You've reached one or more of your plan's usage limits. Consider upgrading your plan to add more resources.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-muted-foreground mb-6">
          Your plan includes limits for various resources. Here's your current usage:
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Buildings</TableCell>
              <TableCell>{resourceStats.buildings.used}</TableCell>
              <TableCell>{resourceStats.buildings.total}</TableCell>
              <TableCell>{resourceStats.buildings.total - resourceStats.buildings.used}</TableCell>
              <TableCell>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${calculatePercentage(resourceStats.buildings.used, resourceStats.buildings.total)}%` }}
                  />
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Organizations</TableCell>
              <TableCell>{resourceStats.organizations.used}</TableCell>
              <TableCell>{resourceStats.organizations.total}</TableCell>
              <TableCell>{resourceStats.organizations.total - resourceStats.organizations.used}</TableCell>
              <TableCell>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${calculatePercentage(resourceStats.organizations.used, resourceStats.organizations.total)}%` }}
                  />
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Templates</TableCell>
              <TableCell>{resourceStats.templates.used}</TableCell>
              <TableCell>{resourceStats.templates.total}</TableCell>
              <TableCell>{resourceStats.templates.total - resourceStats.templates.used}</TableCell>
              <TableCell>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${calculatePercentage(resourceStats.templates.used, resourceStats.templates.total)}%` }}
                  />
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Evacuation Plans</TableCell>
              <TableCell>{resourceStats.evacuationPlans.used}</TableCell>
              <TableCell>{resourceStats.evacuationPlans.total}</TableCell>
              <TableCell>{resourceStats.evacuationPlans.total - resourceStats.evacuationPlans.used}</TableCell>
              <TableCell>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${calculatePercentage(resourceStats.evacuationPlans.used, resourceStats.evacuationPlans.total)}%` }}
                  />
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Monthly New Buildings</TableCell>
              <TableCell>{buildingUsage.monthly}</TableCell>
              <TableCell>{buildingUsage.limits.monthly}</TableCell>
              <TableCell>{buildingUsage.limits.monthly - buildingUsage.monthly}</TableCell>
              <TableCell>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${calculatePercentage(buildingUsage.monthly, buildingUsage.limits.monthly)}%` }}
                  />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ResourceUsageTable;
