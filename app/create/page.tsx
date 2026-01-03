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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Key, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createSecureShare } from "../actions/share";
import { SecureCrypto } from "../../lib/crypto";
import { SecurityTips } from "@/components/security-tips";
import { InlineTip } from "@/components/inline-tip";
import { PasswordInput } from "@/components/password-input";
import { Header } from "@/components/header";

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // Single recipient settings (when multiRecipient is false)
  const [singleRecipientSettings, setSingleRecipientSettings] = useState({
    expirationTime: "30d",
    maxViews: 0,
    requirePassword: false,
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
        requirePassword: singleRecipientSettings.requirePassword,
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
          <p>Loading secure encryption...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <Header />
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-6">
          <Link href="/">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <SecurityTips />

        <Card>
          <CardHeader>
            <CardTitle>Create Secure Share</CardTitle>
            <CardDescription>
              Encrypt and share sensitive information with client-side AES-256
              encryption
            </CardDescription>
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
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
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
                <p className="text-xs text-gray-500 mt-1">
                  This content will be encrypted with AES-256 in your browser
                  before transmission.
                </p>
                <InlineTip className="mt-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Pro tip:</strong> For login credentials, consider
                    sharing the username, password, and server details in
                    separate links for enhanced security isolation.
                  </span>
                </InlineTip>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requirePassword">Require Password</Label>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Switch
                    id="requirePassword"
                    checked={singleRecipientSettings.requirePassword}
                    onCheckedChange={(checked) =>
                      setSingleRecipientSettings({
                        ...singleRecipientSettings,
                        requirePassword: checked,
                      })
                    }
                  />
                </div>

                {singleRecipientSettings.requirePassword && (
                  <div>
                    <Label htmlFor="password">Access Password</Label>
                    <div className="flex gap-2 mt-1">
                      <PasswordInput
                        id="password"
                        placeholder="Enter a password to protect this secret"
                        value={singleRecipientSettings.password}
                        onChange={(e) =>
                          setSingleRecipientSettings({
                            ...singleRecipientSettings,
                            password: e.target.value,
                          })
                        }
                        required={singleRecipientSettings.requirePassword}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => generateSecurePassword()}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Click the refresh button to generate a secure random
                      password. Use the eye icon to view the password.
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating Secure Link..." : "Create Secure Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
