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

  const handleSendBulk = async () => {
    if (!subject || !htmlContent) {
      setMessage({
        type: "error",
        text: "Please fill in subject and email content",
      });
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send this email to ${totalContacts} contacts?\n\nThis action cannot be undone.\n\nEmails will be personalized with each recipient's data.`
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

      const response = await fetch("/api/studio/bulk-email/send-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          htmlContent,
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

        // Clear form on success
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

        {/* Email Composer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="card">
            <h2 className="text-2xl font-serif mb-6">Compose Email</h2>

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
                onClick={handleSendBulk}
                disabled={sendingBulk || sendingTest || !subject || !htmlContent || totalContacts === 0}
                className="btn w-full"
              >
                {sendingBulk
                  ? "Sending to Audience..."
                  : `Send to Entire Audience (${totalContacts} contacts)`}
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
                <p className="text-sm">Doxa Threads &lt;info@doxa-threads.com&gt;</p>
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
              </div>
            </div>
          </div>
        </div>

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
