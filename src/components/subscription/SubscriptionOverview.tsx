
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceCounters } from "@/components/ResourceCounters";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BuildingUsage } from "@/types/subscription";

interface SubscriptionOverviewProps {
  subscription: {
    tier: string;
    status: string;
    endDate?: string;
    isTrial: boolean;
  };
  buildingUsage: BuildingUsage;
  currentTier?: {
    name: string;
    price: {
      monthly: number | null;
      yearly: number | null;
    };
  };
}

const SubscriptionOverview: React.FC<SubscriptionOverviewProps> = ({
  subscription,
  buildingUsage,
  currentTier,
}) => {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Your Resources</h2>
        <ResourceCounters />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Plan</TableCell>
                  <TableCell className="capitalize">{subscription.tier}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell className="capitalize">{subscription.status}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Price</TableCell>
                  <TableCell>
                    {currentTier?.price.monthly && `$${currentTier.price.monthly}/month`}
                  </TableCell>
                </TableRow>
                {subscription.endDate && (
                  <TableRow>
                    <TableCell className="font-medium">
                      {subscription.isTrial ? "Trial End Date" : "Next Billing Date"}
                    </TableCell>
                    <TableCell>
                      {new Date(subscription.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Current Building Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Total Buildings</span>
                  <span className="font-medium">{buildingUsage.total} / {buildingUsage.limits.total}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((buildingUsage.total / buildingUsage.limits.total) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>New Buildings This Month</span>
                  <span className="font-medium">{buildingUsage.monthly} / {buildingUsage.limits.monthly}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((buildingUsage.monthly / buildingUsage.limits.monthly) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SubscriptionOverview;
