import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileImage, QrCode, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorSymbol } from "@/types/editor";

export interface ExportSettings {
  format: string;
  quality: number;
  includeWatermark: boolean;
  includeLogo: boolean;
  logoFile?: File | null;
  includeQRCode?: boolean;
  qrCodeData?: string;
}

interface ExportOptionsProps {
  pdfFile: File | null;
  symbols: EditorSymbol[];
  project: any;
  exportSettings: ExportSettings | null;
  setExportSettings: (settings: ExportSettings) => void;
  onExport: () => void;
  customLogoAllowed?: boolean;
  qrCodeAllowed?: boolean;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  pdfFile,
  symbols,
  project,
  exportSettings,
  setExportSettings,
  onExport,
  customLogoAllowed = false,
  qrCodeAllowed = false
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pdf");
  
  // Initialize settings if they don't exist
  const settings = exportSettings || {
    format: "pdf",
    quality: 300,
    includeWatermark: true,
    includeLogo: false,
    includeQRCode: false,
    qrCodeData: ""
  };
  
  const handleSettingChange = (key: keyof ExportSettings, value: any) => {
    setExportSettings({
      ...settings,
      [key]: value
    });
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      handleSettingChange('logoFile', file);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="pdf" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pdf" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>PDF Quality</Label>
              <Select 
                value={settings.quality.toString()} 
                onValueChange={(value) => handleSettingChange('quality', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="72">Low (72 DPI)</SelectItem>
                  <SelectItem value="150">Medium (150 DPI)</SelectItem>
                  <SelectItem value="300">High (300 DPI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="include-watermark">Include Watermark</Label>
              <Switch 
                id="include-watermark" 
                checked={settings.includeWatermark}
                onCheckedChange={(checked) => handleSettingChange('includeWatermark', checked)}
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={onExport}
              disabled={!pdfFile}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </TabsContent>
          
          <TabsContent value="image" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Image Format</Label>
              <Select 
                value={settings.format} 
                onValueChange={(value) => handleSettingChange('format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Image Quality</Label>
              <Select 
                value={settings.quality.toString()} 
                onValueChange={(value) => handleSettingChange('quality', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="72">Low (72 DPI)</SelectItem>
                  <SelectItem value="150">Medium (150 DPI)</SelectItem>
                  <SelectItem value="300">High (300 DPI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={onExport}
              disabled={!pdfFile}
            >
              <FileImage className="mr-2 h-4 w-4" />
              Export Image
            </Button>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 pt-4">
            {customLogoAllowed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-logo">Include Custom Logo</Label>
                  <Switch 
                    id="include-logo" 
                    checked={settings.includeLogo}
                    onCheckedChange={(checked) => handleSettingChange('includeLogo', checked)}
                  />
                </div>
                
                {settings.includeLogo && (
                  <div className="mt-2">
                    <Label htmlFor="logo-upload" className="block mb-2">Upload Logo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="flex-1"
                      />
                      {logoFile && (
                        <div className="text-xs text-green-600">
                          {logoFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {qrCodeAllowed && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-qr">Include QR Code</Label>
                  <Switch 
                    id="include-qr" 
                    checked={settings.includeQRCode}
                    onCheckedChange={(checked) => handleSettingChange('includeQRCode', checked)}
                  />
                </div>
                
                {settings.includeQRCode && (
                  <div className="mt-2">
                    <Label htmlFor="qr-data" className="block mb-2">QR Code Data (URL or Text)</Label>
                    <Input
                      id="qr-data"
                      value={settings.qrCodeData || ''}
                      onChange={(e) => handleSettingChange('qrCodeData', e.target.value)}
                      placeholder="https://example.com/evacuation-plan"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This QR code will be added to your evacuation plan
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {!customLogoAllowed && !qrCodeAllowed && (
              <div className="bg-amber-50 p-4 rounded-md">
                <h3 className="text-amber-800 font-medium">Premium Features</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Custom logos and QR codes are available with our Premium subscription.
                </p>
                <Button variant="outline" className="mt-3 w-full">
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 border-t">
          <Button 
            className="w-full" 
            onClick={onExport}
            disabled={!pdfFile}
          >
            <Download className="mr-2 h-4 w-4" />
            Export {activeTab === "pdf" ? "PDF" : activeTab === "image" ? "Image" : "Plan"}
          </Button>
          
          {!pdfFile && (
            <p className="text-sm text-red-500 mt-2">
              Please upload a PDF file first to enable export.
            </p>
          )}
          
          {symbols.length === 0 && pdfFile && (
            <p className="text-sm text-amber-500 mt-2">
              No symbols have been added to your plan yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
