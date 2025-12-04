"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStudioAuth } from "@/lib/studio-auth";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  unsubscribed?: boolean;
}

interface BatchResult {
  batchNumber: number;
  sent: number;
  failed: number;
  errors?: any[];
}

interface BulkResults {
  total: number;
  sent: number;
  failed: number;
  batches: BatchResult[];
  errors: any[];
}

export default function BulkEmailPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useStudioAuth();

  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [fromName, setFromName] = useState("Doxa Threads");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Bulk send progress state
  const [bulkProgress, setBulkProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    sent: number;
    failed: number;
    percentage: number;
  } | null>(null);

  const [bulkResults, setBulkResults] = useState<BulkResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Send rate limiting
  const [maxPerHour, setMaxPerHour] = useState("");
  const [maxPerBatch, setMaxPerBatch] = useState("300");

  // Scheduling state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [showScheduledList, setShowScheduledList] = useState(false);

  // Campaign tracking state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");
  const [showCampaigns, setShowCampaigns] = useState(false);

  // Auth check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/studio/login");
    }
  }, [loading, isAuthenticated, router]);

  // Fetch contacts on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
      fetchScheduledEmails();
      fetchCampaigns();
    }
  }, [isAuthenticated]);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await fetch("/api/studio/bulk-email/get-contacts");
      const data = await response.json();

      if (response.ok) {
        setContacts(data.contacts || []);
        setTotalContacts(data.totalContacts || 0);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to fetch contacts",
        });
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setMessage({
        type: "error",
        text: "Failed to fetch contacts from Resend",
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !subject || !htmlContent) {
      setMessage({
        type: "error",
        text: "Please fill in all fields including test email",
      });
      return;
    }

    try {
      setSendingTest(true);
      setMessage(null);

      const response = await fetch("/api/studio/bulk-email/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testEmail,
          subject,
          htmlContent,
          fromName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Test email sent successfully to ${testEmail}. Variables: {{first_name}}, {{last_name}}, {{email}} will be replaced with "Test User" data.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send test email",
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      setMessage({
        type: "error",
        text: "Failed to send test email",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const fetchScheduledEmails = async () => {
    try {
      const response = await fetch("/api/studio/bulk-email/schedule");
      const data = await response.json();

      if (response.ok) {
        setScheduledEmails(data.scheduledEmails || []);
      } else {
        console.error("Failed to fetch scheduled emails:", data.error);
      }
    } catch (error) {
      console.error("Error fetching scheduled emails:", error);
    }
  };

  const handleScheduleEmail = async () => {
    if (!subject || !htmlContent) {
      setMessage({
        type: "error",
        text: "Please fill in subject and email content",
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setMessage({
        type: "error",
        text: "Please select both date and time for scheduling",
      });
      return;
    }

    const confirmSchedule = window.confirm(
      `Are you sure you want to schedule this email for ${scheduledDate} at ${scheduledTime}?\n\nIt will be sent to ${totalContacts} contacts at the scheduled time.`
    );

    if (!confirmSchedule) {
      return;
    }

    try {
      setIsScheduling(true);
      setMessage(null);

      const response = await fetch("/api/studio/bulk-email/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          htmlContent,
          scheduledDate,
          scheduledTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Email scheduled successfully for ${scheduledDate} at ${scheduledTime}`,
        });

        // Clear form on success
        setSubject("");
        setHtmlContent("");
        setScheduledDate("");
        setScheduledTime("");

        // Refresh scheduled emails list
        fetchScheduledEmails();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to schedule email",
        });
      }
    } catch (error) {
      console.error("Error scheduling email:", error);
      setMessage({
        type: "error",
        text: "Failed to schedule email",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelScheduled = async (id: string) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this scheduled email?"
    );

    if (!confirmCancel) {
      return;
    }

    try {
      const response = await fetch(
        `/api/studio/bulk-email/schedule?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Scheduled email cancelled successfully",
        });

        // Refresh scheduled emails list
        fetchScheduledEmails();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to cancel scheduled email",
        });
      }
    } catch (error) {
      console.error("Error cancelling scheduled email:", error);
      setMessage({
        type: "error",
        text: "Failed to cancel scheduled email",
      });
    }
  };

  const handleSendBulk = async (options?: { useRateCap?: boolean }) => {
    if (!subject || !htmlContent) {
      setMessage({
        type: "error",
        text: "Please fill in subject and email content",
      });
      return;
    }

    const rateCapValue =
      options?.useRateCap && maxPerHour
        ? parseInt(maxPerHour, 10)
        : undefined;

    if (options?.useRateCap) {
      if (!rateCapValue || Number.isNaN(rateCapValue) || rateCapValue <= 0) {
        setMessage({
          type: "error",
          text: "Enter a valid hourly send cap (e.g., 200)",
        });
        return;
      }
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send this email to ${totalContacts} contacts?${
        rateCapValue ? `\n\nHourly cap: ${rateCapValue} emails/hour.` : ""
      }\n\nThis action cannot be undone.\n\nEmails will be personalized with each recipient's data.`
    );

    if (!confirmSend) {
      return;
    }

    try {
      setSendingBulk(true);
      setMessage(null);
      setBulkProgress({ currentBatch: 0, totalBatches: 0, sent: 0, failed: 0, percentage: 0 });
      setBulkResults(null);
      setShowResults(false);

      // Use streaming endpoint if rate limiting is enabled, otherwise use regular endpoint
      if (rateCapValue) {
        await handleStreamingSend(rateCapValue);
      } else {
        await handleRegularSend();
      }
    } catch (error) {
      console.error("Error sending bulk emails:", error);
      setMessage({
        type: "error",
        text: "Failed to send bulk emails",
      });
    } finally {
      setSendingBulk(false);
      setBulkProgress(null);
    }
  };

  const handleStreamingSend = async (rateCapValue: number) => {
    const response = await fetch("/api/studio/bulk-email/send-bulk-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        htmlContent,
        fromName,
        maxPerHour: rateCapValue,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to start streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));

          if (data.type === "initialized") {
            setBulkProgress({
              currentBatch: 0,
              totalBatches: data.batches,
              sent: 0,
              failed: 0,
              percentage: 0,
            });
          } else if (data.type === "batch_completed") {
            setBulkProgress({
              currentBatch: data.batchNumber,
              totalBatches: data.totalBatches,
              sent: data.totalSent,
              failed: data.totalFailed,
              percentage: data.progress,
            });
          } else if (data.type === "completed") {
            setBulkResults(data.results);
            setShowResults(true);
            setMessage({
              type: "success",
              text: `Campaign complete! Sent: ${data.results.sent}, Failed: ${data.results.failed}`,
            });

            if (data.results.failed === 0) {
              setSubject("");
              setHtmlContent("");
            }
          } else if (data.type === "error") {
            setMessage({
              type: "error",
              text: data.error || "Failed to send bulk emails",
            });
          }
        }
      }
    }
  };

  const handleRegularSend = async () => {
    const response = await fetch("/api/studio/bulk-email/send-bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        htmlContent,
        fromName,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setBulkResults(data.results);
      setShowResults(true);
      setMessage({
        type: "success",
        text: `Campaign complete! Sent: ${data.results.sent}, Failed: ${data.results.failed}`,
      });

      if (data.results.failed === 0) {
        setSubject("");
        setHtmlContent("");
      }
    } else {
      setMessage({
        type: "error",
        text: data.error || "Failed to send bulk emails",
      });
    }
  };

  // Campaign management functions
  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/studio/bulk-email/campaigns");
      const data = await response.json();

      if (response.ok) {
        setCampaigns(data.campaigns || []);
      } else {
        console.error("Failed to fetch campaigns:", data.error);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const handleSendBatch = async (isResume = false) => {
    if (!isResume && !campaignName) {
      setMessage({
        type: "error",
        text: "Please enter a campaign name",
      });
      return;
    }

    if (!subject || !htmlContent) {
      setMessage({
        type: "error",
        text: "Please fill in subject and email content",
      });
      return;
    }

    const batchSize = parseInt(maxPerBatch, 10);
    if (Number.isNaN(batchSize) || batchSize <= 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid batch size (e.g., 300)",
      });
      return;
    }

    const confirmSend = window.confirm(
      isResume
        ? `Resume campaign "${activeCampaign?.name}"?\n\nThis will send up to ${batchSize} emails to recipients who haven't received this campaign yet.`
        : `Start new campaign "${campaignName}"?\n\nThis will send up to ${batchSize} emails. You can resume later to send more without duplicates.`
    );

    if (!confirmSend) {
      return;
    }

    try {
      setSendingBulk(true);
      setMessage(null);
      setBulkResults(null);
      setShowResults(false);

      const response = await fetch("/api/studio/bulk-email/campaigns/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: isResume ? activeCampaign?.id : undefined,
          name: campaignName,
          subject,
          htmlContent,
          fromName,
          maxPerBatch: batchSize,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setActiveCampaign(data.campaign);
        setMessage({
          type: "success",
          text: data.message,
        });

        setBulkResults({
          total: data.results.total,
          sent: data.results.sent,
          failed: data.results.failed,
          batches: [],
          errors: [],
        });
        setShowResults(true);

        // Refresh campaigns list
        fetchCampaigns();

        // Clear form if fully completed
        if (data.results.remaining === 0) {
          setCampaignName("");
          setSubject("");
          setHtmlContent("");
          setActiveCampaign(null);
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send campaign batch",
        });
      }
    } catch (error) {
      console.error("Error sending campaign batch:", error);
      setMessage({
        type: "error",
        text: "Failed to send campaign batch",
      });
    } finally {
      setSendingBulk(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this campaign? This will also delete all recipient tracking data."
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `/api/studio/bulk-email/campaigns?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Campaign deleted successfully",
        });
        fetchCampaigns();

        if (activeCampaign?.id === id) {
          setActiveCampaign(null);
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete campaign",
        });
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      setMessage({
        type: "error",
        text: "Failed to delete campaign",
      });
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/studio/dashboard")}
            className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-serif mb-2">Bulk Email Sender</h1>
          <p className="text-gray-400">
            Compose and send personalized emails to your entire audience
          </p>
        </div>

        {/* Contact Stats */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Audience Size</h3>
              <p className="text-gray-400">
                {loadingContacts
                  ? "Loading contacts..."
                  : `${totalContacts.toLocaleString()} active contacts will receive this email`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Personalization: Use{" "}
                <code className="text-gray-300">{'{{first_name}}'}</code>,{" "}
                <code className="text-gray-300">{'{{last_name}}'}</code>,{" "}
                <code className="text-gray-300">{'{{email}}'}</code> in your content
              </p>
            </div>
            <button
              onClick={fetchContacts}
              disabled={loadingContacts}
              className="btn-secondary"
            >
              {loadingContacts ? "Refreshing..." : "Refresh Count"}
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bulk-email-alert-success"
                : message.type === "info"
                ? "bulk-email-alert-info"
                : "bulk-email-alert-error"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Bulk Progress Indicator */}
        {sendingBulk && bulkProgress && (
          <div className="card mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Sending Campaign...</h3>
                <span className="text-sm text-gray-400">
                  {bulkProgress.sent + bulkProgress.failed} / {totalContacts} processed
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300 flex items-center justify-center text-xs font-medium"
                  style={{
                    width: `${((bulkProgress.sent + bulkProgress.failed) / totalContacts) * 100}%`,
                  }}
                >
                  {Math.round(((bulkProgress.sent + bulkProgress.failed) / totalContacts) * 100)}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Sent:</span>{" "}
                <span className="text-green-400 font-semibold">{bulkProgress.sent}</span>
              </div>
              <div>
                <span className="text-gray-400">Failed:</span>{" "}
                <span className="text-red-400 font-semibold">{bulkProgress.failed}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {showResults && bulkResults && (
          <div className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-serif">Campaign Results</h3>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background-dark p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Total Sent</div>
                <div className="text-3xl font-bold text-green-400">
                  {bulkResults.sent.toLocaleString()}
                </div>
              </div>
              <div className="bg-background-dark p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Failed</div>
                <div className="text-3xl font-bold text-red-400">
                  {bulkResults.failed.toLocaleString()}
                </div>
              </div>
              <div className="bg-background-dark p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                <div className="text-3xl font-bold">
                  {((bulkResults.sent / bulkResults.total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Batch Details */}
            {bulkResults.batches.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Batch Details</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bulkResults.batches.map((batch) => (
                    <div
                      key={batch.batchNumber}
                      className="flex justify-between items-center bg-background-dark p-3 rounded"
                    >
                      <span className="text-sm">Batch {batch.batchNumber}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-400">{batch.sent} sent</span>
                        {batch.failed > 0 && (
                          <span className="text-red-400">{batch.failed} failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Details */}
            {bulkResults.errors.length > 0 && (
              <div className="mt-4">
                <details className="cursor-pointer">
                  <summary className="font-semibold text-red-400">
                    View Errors ({bulkResults.errors.length})
                  </summary>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {bulkResults.errors.slice(0, 20).map((error, index) => (
                      <div key={index} className="text-xs text-red-300 bg-red-900/10 p-2 rounded">
                        {error.email}: {JSON.stringify(error.error)}
                      </div>
                    ))}
                    {bulkResults.errors.length > 20 && (
                      <p className="text-xs text-gray-500">
                        ... and {bulkResults.errors.length - 20} more errors
                      </p>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Campaign Tracking Section */}
        {activeCampaign && (
          <div className="card mb-6 border-2 border-accent">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-serif text-accent">Active Campaign</h3>
                <p className="text-gray-400 mt-1">{activeCampaign.name}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeCampaign.status === "completed"
                    ? "bg-green-900/50 text-green-300"
                    : activeCampaign.status === "sending"
                    ? "bg-blue-900/50 text-blue-300"
                    : "bg-yellow-900/50 text-yellow-300"
                }`}
              >
                {activeCampaign.status}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-background-dark p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Total</div>
                <div className="text-xl font-bold">{activeCampaign.total_recipients || 0}</div>
              </div>
              <div className="bg-background-dark p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Sent</div>
                <div className="text-xl font-bold text-green-400">{activeCampaign.sent_count || 0}</div>
              </div>
              <div className="bg-background-dark p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Failed</div>
                <div className="text-xl font-bold text-red-400">{activeCampaign.failed_count || 0}</div>
              </div>
              <div className="bg-background-dark p-3 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Remaining</div>
                <div className="text-xl font-bold text-accent">
                  {(activeCampaign.total_recipients || 0) - (activeCampaign.sent_count || 0) - (activeCampaign.failed_count || 0)}
                </div>
              </div>
            </div>
            {activeCampaign.status !== "completed" && (
              <button
                onClick={() => handleSendBatch(true)}
                disabled={sendingBulk}
                className="btn w-full"
              >
                Resume Campaign (Send Next {maxPerBatch} Emails)
              </button>
            )}
          </div>
        )}

        {/* Email Composer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="card">
            <h2 className="text-2xl font-serif mb-6">Compose Email</h2>

            {/* Campaign Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Holiday Sale 2025"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input"
                disabled={sendingBulk}
              />
              <p className="text-xs text-gray-500 mt-2">
                Used to track this campaign. You can resume sending to remaining recipients later.
              </p>
            </div>

            {/* Subject Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject (use {{first_name}} for personalization)"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input"
                disabled={sendingBulk}
              />
            </div>

            {/* From Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                From Name
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Doxa Threads"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input"
                disabled={sendingBulk}
              />
              <p className="text-xs text-gray-500 mt-2">
                This is what recipients will see as the sender (e.g., “Doxa Threads”).
              </p>
            </div>

            {/* Rich Text Editor */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Email Content
              </label>
              <div className="bulk-email-editor-wrapper rounded-lg">
                <ReactQuill
                  theme="snow"
                  value={htmlContent}
                  onChange={setHtmlContent}
                  placeholder="Compose your email... Use {{first_name}}, {{last_name}}, {{email}} for personalization"
                  readOnly={sendingBulk}
                  style={{ height: "300px", marginBottom: "50px" }}
                  className="bulk-email-editor"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ color: [] }, { background: [] }],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>

            {/* Test Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@gmail.com"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input"
                disabled={sendingBulk}
              />
            </div>

            {/* Scheduling Section */}
            <div className="mb-6 p-4 bg-background-dark rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Schedule Email</h3>
              <p className="text-sm text-gray-400 mb-4">
                Schedule this email to be sent at a specific date and time
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input text-sm"
                    disabled={sendingBulk || isScheduling}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-300">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input text-sm"
                    disabled={sendingBulk || isScheduling}
                  />
                </div>
              </div>
            </div>

            {/* Batch Settings */}
            <div className="mb-6 p-4 bg-background-dark rounded-lg border border-accent">
              <h3 className="text-lg font-semibold mb-3 text-accent">Batch Sending (Recommended)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Send emails in batches to warm up your domain and avoid spam filters. You can resume later to send more.
              </p>
              <div>
                <label className="block text-xs font-medium mb-2 text-gray-300">
                  Emails per batch
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={maxPerBatch}
                  onChange={(e) => setMaxPerBatch(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input text-sm"
                  disabled={sendingBulk}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 300 emails per batch. Send one batch, wait an hour, then resume for the next 300.
                </p>
              </div>
            </div>

            {/* Send Rate Limit (Advanced) */}
            <div className="mb-6 p-4 bg-background-dark rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Streaming Send (Advanced)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Alternative: Stream emails at a specific rate per hour. Requires keeping browser open.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-300">
                    Max emails per hour
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="25"
                    value={maxPerHour}
                    onChange={(e) => setMaxPerHour(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:border-accent focus:ring-0 bulk-email-input text-sm"
                    disabled={sendingBulk || isScheduling}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  <p>
                    Approx duration:{" "}
                    {maxPerHour && !Number.isNaN(parseInt(maxPerHour, 10)) && parseInt(maxPerHour, 10) > 0
                      ? `${Math.ceil(totalContacts / Math.max(1, parseInt(maxPerHour, 10)))} hour(s)`
                      : "Set a cap to see estimate"}
                  </p>
                  <p className="mt-1">
                    Note: Browser must stay open for entire duration.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSendTest}
                disabled={sendingTest || sendingBulk || !testEmail || !subject || !htmlContent}
                className="btn-secondary w-full"
              >
                {sendingTest ? "Sending Test..." : "Send Test Email (with personalization example)"}
              </button>

              <button
                onClick={() => handleSendBatch(false)}
                disabled={sendingBulk || sendingTest || !campaignName || !subject || !htmlContent || totalContacts === 0}
                className="btn w-full"
              >
                {sendingBulk
                  ? "Sending Batch..."
                  : `Send Batch (${maxPerBatch} emails) - Recommended`}
              </button>

              <button
                onClick={handleScheduleEmail}
                disabled={isScheduling || sendingBulk || sendingTest || !subject || !htmlContent || !scheduledDate || !scheduledTime || totalContacts === 0}
                className="btn-secondary w-full bg-blue-600 hover:bg-blue-700"
              >
                {isScheduling
                  ? "Scheduling..."
                  : `Schedule Email for ${scheduledDate || "Selected Date"}`}
              </button>

              <button
                onClick={() => handleSendBulk({ useRateCap: true })}
                disabled={
                  sendingBulk ||
                  sendingTest ||
                  !subject ||
                  !htmlContent ||
                  totalContacts === 0 ||
                  !maxPerHour
                }
                className="btn-secondary w-full bg-amber-700 hover:bg-amber-800"
              >
                {sendingBulk ? "Sending..." : "Streaming Send (Keep Browser Open)"}
              </button>

              <button
                onClick={handleSendBulk}
                disabled={sendingBulk || sendingTest || !subject || !htmlContent || totalContacts === 0}
                className="btn-secondary w-full"
              >
                {sendingBulk
                  ? "Sending to Audience..."
                  : `Send All Now (${totalContacts} emails)`}
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn-secondary w-full lg:hidden"
                disabled={sendingBulk}
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className={`card ${showPreview ? "block" : "hidden lg:block"}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif">Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="bg-[rgba(18,15,12,0.82)] border border-[rgba(243,232,216,0.24)] rounded-lg p-6 bulk-email-preview">
              <div className="mb-4 pb-4 border-b border-gray-700">
                <p className="text-xs text-gray-500 mb-2">From:</p>
                <p className="text-sm">
                  {fromName || "Doxa Threads"} &lt;info@doxa-threads.com&gt;
                </p>
              </div>

              {subject ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Subject:</p>
                  <p className="text-lg font-semibold">{subject}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    (<code className="text-gray-300">{'{{first_name}}'}</code> will be
                    replaced with recipient's name)
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 mb-4">No subject entered</p>
              )}

              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm text-[rgba(243,232,216,0.75)] mb-3">Email Body:</p>
                {htmlContent ? (
                  <div
                    className="bulk-email-preview leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                ) : (
                  <p className="text-[rgba(243,232,216,0.65)]">No content entered</p>
                )}

                {/* Unsubscribe footer preview */}
                <div className="mt-6 pt-5 border-t border-gray-700 text-xs text-gray-400">
                  <p className="mb-2">
                    You're receiving this email because you signed up for updates from Doxa Threads.
                  </p>
                  <p>
                    <span className="text-[rgba(243,232,216,0.75)] underline">
                      Unsubscribe
                    </span>{" "}
                    (personalized link will be added automatically)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign History */}
        {campaigns.length > 0 && (
          <div className="card mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif">Campaign History</h3>
              <button
                onClick={fetchCampaigns}
                className="text-sm text-accent hover:text-accent-dark"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Campaign Name</th>
                    <th className="text-left py-3 px-4">Subject</th>
                    <th className="text-left py-3 px-4">Progress</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const remaining = (campaign.total_recipients || 0) - (campaign.sent_count || 0) - (campaign.failed_count || 0);
                    const progress = campaign.total_recipients > 0
                      ? ((campaign.sent_count || 0) / campaign.total_recipients * 100).toFixed(1)
                      : 0;

                    return (
                      <tr
                        key={campaign.id}
                        className="border-b border-gray-800 hover:bg-background-dark"
                      >
                        <td className="py-3 px-4 font-medium">{campaign.name}</td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {campaign.subject}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2 min-w-[100px]">
                              <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {campaign.sent_count || 0}/{campaign.total_recipients || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              campaign.status === "completed"
                                ? "bg-green-900/50 text-green-300"
                                : campaign.status === "sending"
                                ? "bg-blue-900/50 text-blue-300"
                                : campaign.status === "paused"
                                ? "bg-yellow-900/50 text-yellow-300"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {campaign.status !== "completed" && remaining > 0 && (
                              <button
                                onClick={() => {
                                  setActiveCampaign(campaign);
                                  setCampaignName(campaign.name);
                                  setSubject(campaign.subject);
                                  setHtmlContent(campaign.html_content);
                                  setFromName(campaign.from_name || "Doxa Threads");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="text-sm text-accent hover:text-accent-dark"
                              >
                                Resume
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="text-sm text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scheduled Emails List */}
        {scheduledEmails.length > 0 && (
          <div className="card mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif">Scheduled Emails</h3>
              <button
                onClick={fetchScheduledEmails}
                className="text-sm text-accent hover:text-accent-dark"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Subject</th>
                    <th className="text-left py-3 px-4">Scheduled For</th>
                    <th className="text-left py-3 px-4">Recipients</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledEmails.map((email) => (
                    <tr
                      key={email.id}
                      className="border-b border-gray-800 hover:bg-background-dark"
                    >
                      <td className="py-3 px-4 max-w-xs truncate">
                        {email.subject}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(email.scheduled_datetime).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">{email.total_recipients}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            email.status === "pending"
                              ? "bg-blue-900/50 text-blue-300"
                              : email.status === "sent"
                              ? "bg-green-900/50 text-green-300"
                              : email.status === "failed"
                              ? "bg-red-900/50 text-red-300"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {email.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {email.status === "pending" && (
                          <button
                            onClick={() => handleCancelScheduled(email.id)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Cancel
                          </button>
                        )}
                        {email.status === "sent" && email.sent_count && (
                          <span className="text-sm text-gray-400">
                            Sent: {email.sent_count}
                          </span>
                        )}
                        {email.status === "failed" && (
                          <span className="text-sm text-red-400">
                            Failed: {email.failed_count || 0}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contact List Preview */}
        {contacts.length > 0 && (
          <div className="card mt-8">
            <h3 className="text-xl font-serif mb-4">
              Contact Preview (First 10)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">First Name</th>
                    <th className="text-left py-3 px-4">Last Name</th>
                    <th className="text-left py-3 px-4">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 10).map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b border-gray-800 hover:bg-background-dark"
                    >
                      <td className="py-3 px-4">{contact.email}</td>
                      <td className="py-3 px-4">
                        {contact.first_name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {contact.last_name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {contact.created_at
                          ? new Date(contact.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {contacts.length > 10 && (
              <p className="text-sm text-gray-400 mt-4">
                Showing 10 of {totalContacts} contacts
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
