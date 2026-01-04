"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { createSecureShare } from "../actions/share";
import { SecureCrypto } from "../../lib/crypto";
import { PasswordInput } from "@/components/password-input";

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);


  // Single recipient settings (when multiRecipient is false)
  const [singleRecipientSettings, setSingleRecipientSettings] = useState({
    expirationTime: "30d",
    maxViews: 0,
    password: "",
  });


  // Multi-recipient state

  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const generateSecurePassword = () => {
    if (!isClient) return;
    const password = SecureCrypto.generateSecurePassword();
    setSingleRecipientSettings({ ...singleRecipientSettings, password });
  };

  const fileToBase64 = (file: File): Promise<string> => {


    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const imageFileToCompressedBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Max size: 2MB
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error("Image too large"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");

          const MAX_WIDTH = 1000;
          const scale = Math.min(1, MAX_WIDTH / img.width);

          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas error"));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          resolve(compressedBase64);
        };

        img.onerror = reject;
        img.src = reader.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClient) return;

    if (!formData.content.trim()) {
      setError("Please enter some content to share");
      return;
    }

    if (!logoFile) {
      setError("Company logo is required");
      return;
    }


    setIsLoading(true);
    setError("");

    try {
      if (!logoFile) {
        setError("Company logo is required");
        return;
      }

      const logoBase64 = await fileToBase64(logoFile);

      const encryptionKey = await SecureCrypto.generateKey();
      const keyString = await SecureCrypto.exportKey(encryptionKey);

      let brochureEncrypted: string | undefined;
      let brochureIv: string | undefined;

      if (brochureFile) {
        try {
          const brochureBase64 = await imageFileToCompressedBase64(brochureFile);
          const encryptedBrochure = await SecureCrypto.encrypt(
            brochureBase64,
            encryptionKey
          );
          brochureEncrypted = encryptedBrochure.encrypted;
          brochureIv = encryptedBrochure.iv;
        } catch (err) {
          setError("Brochure image too large. Please use an image under 2MB.");
          setIsLoading(false);
          return;
        }
      }


      const { encrypted, iv } = await SecureCrypto.encrypt(
        formData.content,
        encryptionKey
      );


      const result = await createSecureShare({
        title: formData.title,
        encryptedContent: encrypted,
        iv,
        expirationTime: singleRecipientSettings.expirationTime,
        maxViews: singleRecipientSettings.maxViews,
        password: singleRecipientSettings.password,
        linkType: "standard",
        logoUrl: logoBase64,
        brochureEncrypted,
        brochureIv,
      });




      if (!result.success || !result.id) {
        setError(result.error || "Failed to create secure share");
        return;
      }

      window.location.href = `${window.location.origin}/view/${result.id}#${keyString}`;
    } catch (err) {
      console.error(err);
      setError("Failed to create secure share. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen p-4">




      <Card>
        <CardHeader>
          <CardTitle>Create Secure Share</CardTitle>

        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="logo">Company Logo *</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setLogoFile(file);
                }}
              />
            </div>


            <div>
              <Label htmlFor="title">Title *</Label>

              <Input
                id="title"
                required
                placeholder="e.g., Database Password, API Key"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="content" className="text-base font-medium">
                Secret Content *
              </Label>
              <Textarea
                id="content"
                placeholder="Enter your password, API key, or sensitive information here..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={4}
              />


            </div>
            <div>
              <Label htmlFor="brochure">Attach brochure (optional)</Label>
              <Input
                id="brochure"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setBrochureFile(file);
                }}
              />
            </div>

            {/* Expiration and Views - Always Visible */}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiration">Expiration Time</Label>
                <Select
                  value={singleRecipientSettings.expirationTime}
                  onValueChange={(value) =>
                    setSingleRecipientSettings({
                      ...singleRecipientSettings,
                      expirationTime: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">15 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxViews">Max Views</Label>
                <Select
                  value={singleRecipientSettings.maxViews.toString()}
                  onValueChange={(value) =>
                    setSingleRecipientSettings({
                      ...singleRecipientSettings,
                      maxViews: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      1 view (burn after reading)
                    </SelectItem>
                    <SelectItem value="3">3 views</SelectItem>
                    <SelectItem value="5">5 views</SelectItem>
                    <SelectItem value="10">10 views</SelectItem>
                    <SelectItem value="0">Unlimited views</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2 mt-1">
                <PasswordInput
                  id="password"
                  value={singleRecipientSettings.password}
                  onChange={(e) =>
                    setSingleRecipientSettings({
                      ...singleRecipientSettings,
                      password: e.target.value,
                    })
                  }
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSecurePassword}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>


            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Link"}

            </Button>
          </form>
        </CardContent>
      </Card>
    </div>

  );
}
