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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClient) return;

    if (!formData.content.trim()) {
      setError("Please enter some content to share");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const encryptionKey = await SecureCrypto.generateKey();
      const keyString = await SecureCrypto.exportKey(encryptionKey);

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
