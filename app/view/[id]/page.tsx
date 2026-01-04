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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Eye, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import {
  getSecureShare,
  getShareMetadata,
  testShareExists,
} from "../../actions/share";
import { SecureCrypto } from "../../../lib/crypto";
import { PasswordInput } from "@/components/password-input";

interface SecureShare {
  id: string;
  title: string;
  encryptedContent: string;
  iv: string;
  expiresAt: string;
  maxViews: number;
  currentViews: number;
  requirePassword: boolean;
}

interface ShareMetadata {
  id: string;
  title: string;
  expiresAt: string;
  maxViews: number;
  currentViews: number;
  requirePassword: boolean;
}

export default function ViewPage({ params }: { params: { id: string } }) {
  const [shareId, setShareId] = useState<string>("");
  const [share, setShare] = useState<SecureShare | null>(null);
  const [metadata, setMetadata] = useState<ShareMetadata | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    const initializePage = async () => {
      setIsClient(true);

      const id = params.id;
      setShareId(id);

      if (id) {
        loadMetadata(id);
        loadEncryptionKey();
      }
    };

    initializePage();
  }, [params.id]);

  const loadMetadata = async (id: string) => {
    try {
      // First, let's test if the share exists at all
      const existsResult = await testShareExists(id);

      const result = await getShareMetadata(id);

      if (result.success && result.data) {
        setMetadata(result.data as ShareMetadata);
      } else {
        // If metadata fails, try to get the full share data as a fallback
        const shareResult = await getSecureShare(id);

        if (shareResult.success && shareResult.data) {
          // Convert share data to metadata format
          const shareData = shareResult.data as any;
          setMetadata({
            id: shareData.id,
            title: shareData.title,
            expiresAt: shareData.expiresAt,
            maxViews: shareData.maxViews,
            currentViews: shareData.currentViews,
            requirePassword: shareData.requirePassword,
          });
        } else {
          setError(result.error || "Failed to load share metadata");
        }
      }
    } catch (error) {
      setError("Failed to load share metadata");
    }
  };

  const loadEncryptionKey = async () => {
    if (typeof window !== "undefined") {
      const fullUrl = window.location.href;
      const hashPart = window.location.hash;
      let keyFromUrl = hashPart.substring(1); // Remove #

      // If no key in hash, try to extract from URL manually (in case fragment was lost)
      if (!keyFromUrl && fullUrl.includes("#")) {
        const urlParts = fullUrl.split("#");
        if (urlParts.length > 1) {
          keyFromUrl = urlParts[1];
        }
      }

      if (keyFromUrl) {
        try {
          const key = await SecureCrypto.importKey(keyFromUrl);
          setEncryptionKey(key);

          // *** VULNERABILITY FIX ***
          // After storing the key, remove it from the URL to prevent it from being
          // included in the Next.js router state and sent to the server.
          const urlWithoutHash =
            window.location.pathname + window.location.search;
          window.history.replaceState({}, document.title, urlWithoutHash);
        } catch (error) {
          setError("Invalid or corrupted encryption key in URL");
        }
      } else {
        setError("Please open the complete link you received.");

      }
    }
  };

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptionKey) {
      setError("Encryption key not available");
      return;
    }

    if (!shareId) {
      setError("Share ID not available");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getSecureShare(shareId, password);

      if (result.success && result.data) {
        const shareData = result.data as SecureShare;
        setShare(shareData);

        // Decrypt content client-side
        try {
          const decrypted = await SecureCrypto.decrypt(
            shareData.encryptedContent,
            encryptionKey,
            shareData.iv
          );

          setDecryptedContent(decrypted);
          setShowContent(true);
        } catch (decryptError) {
          setError("Unable to open this content. Please check the password.");

        }
      } else {
        setError(result.error || "Failed to access secure share");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (decryptedContent) {
      await navigator.clipboard.writeText(decryptedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const totalSeconds = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // 1️⃣ Days + hours (30d, 7d, etc.)
    if (days > 0) {
      return hours > 0
        ? `${days}d ${hours}h remaining`
        : `${days}d remaining`;
    }

    // 2️⃣ Hours + minutes
    if (hours > 0) {
      return minutes > 0
        ? `${hours}h ${minutes}m remaining`
        : `${hours}h remaining`;
    }

    // 3️⃣ Minutes only
    if (minutes > 0) {
      return `${minutes}m remaining`;
    }

    // 4️⃣ Seconds only
    return `${seconds}s remaining`;
  };


  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (showContent && share) {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-2xl py-16">
          <Card>
            <CardHeader>

              <CardTitle className="text-center text-2xl font-semibold">
                {share.title}
              </CardTitle>


            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {formatTimeRemaining(share.expiresAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {share.maxViews === 0
                      ? "Unlimited views"
                      : `${share.currentViews}/${share.maxViews} views`}
                  </span>
                </div>
              </div>

              <div>

                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <div className="flex justify-between items-start gap-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm flex-1 break-all text-gray-900 dark:text-gray-100">
                      {decryptedContent}
                    </pre>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-2">
                      Copied to clipboard!
                    </p>
                  )}
                </div>
              </div>



            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-md py-16">
        <Card>
          <CardHeader className="text-center">

            <CardTitle className="text-xl font-semibold">
              {metadata?.title}
            </CardTitle>


          </CardHeader>
          <CardContent>


            {metadata && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {formatTimeRemaining(metadata.expiresAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {metadata.maxViews === 0
                        ? "Unlimited views"
                        : `${metadata.currentViews}/${metadata.maxViews} views`}
                    </span>

                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleAccess} className="space-y-4">

              <div>
                <Label htmlFor="password">Password</Label>

                <PasswordInput
                  id="password"
                  placeholder="Enter the required password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>


              {!encryptionKey && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please open the complete link you received.
                  </AlertDescription>
                </Alert>
              )}


              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !encryptionKey}
              >
                {isLoading ? "Opening..." : "Open"}

              </Button>
            </form>




          </CardContent>
        </Card>
      </div>
    </div>
  );
}
