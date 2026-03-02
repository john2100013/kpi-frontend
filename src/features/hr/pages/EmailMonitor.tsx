/**
 * Email Monitor Page
 * Allows HR to view email queue statistics and manage failed emails
 */

import { useState, useEffect } from 'react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { Card, Button, LoadingSpinner } from '../../../components/common';
import { useToast } from '../../../context/ToastContext';
import {
  getEmailQueueStats,
  getFailedEmails,
  retryFailedEmail,
  retryFailedEmails,
  type EmailQueueStats,
  type FailedEmail,
} from '../../../services/emailQueueApi';

const EmailMonitor = () => {
  const toast = useToast();
  const [stats, setStats] = useState<EmailQueueStats | null>(null);
  const [failedEmails, setFailedEmails] = useState<FailedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsData = await getEmailQueueStats();
      setStats(statsData);

      // Fetch failed emails
      const failedData = await getFailedEmails({ page, limit });
      setFailedEmails(failedData.data);
      setTotal(failedData.pagination.total);
      setTotalPages(failedData.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to load email data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (queueId: number, emailAddress: string) => {
    try {
      setRetrying(queueId);
      await retryFailedEmail(queueId);
      toast.success(`Email to ${emailAddress} queued for retry`);
      
      // Refresh data after short delay
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry email. Please try again.');
    } finally {
      setRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    if (failedEmails.length === 0) return;

    try {
      setRetryingAll(true);
      const queueIds = failedEmails.map((email) => email.id);
      const result = await retryFailedEmails(queueIds);
      
      toast.success(
        `${result.success} email${result.success !== 1 ? 's' : ''} queued for retry`,
        5000
      );

      if (result.failed > 0) {
        toast.warning(`${result.failed} email${result.failed !== 1 ? 's' : ''} could not be queued`);
      }

      // Refresh data after short delay
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry emails. Please try again.');
    } finally {
      setRetryingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !stats) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Email Monitor"
        subtitle="Monitor email queue status and manage failed emails"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600 font-medium">Pending</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {stats?.pending || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Waiting to send</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 font-medium">Processing</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {stats?.processing || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Currently sending</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 font-medium">Sent</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {stats?.sent || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Successfully sent</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 font-medium">Failed</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {stats?.failed || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Need attention</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 font-medium">Total</div>
          <div className="text-3xl font-bold text-gray-800 mt-2">
            {stats?.total || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">All emails</div>
        </Card>
      </div>

      {/* Failed Emails Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Failed Emails
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {total > 0
                  ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total} failed emails`
                  : 'No failed emails'}
              </p>
            </div>
            {failedEmails.length > 0 && (
              <Button
                onClick={handleRetryAll}
                disabled={retryingAll}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {retryingAll ? (
                  <>
                    <span className="mr-2">
                      <LoadingSpinner size="sm" />
                    </span>
                    Retrying...
                  </>
                ) : (
                  `Retry All (${failedEmails.length})`
                )}
              </Button>
            )}
          </div>

          {failedEmails.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg font-medium text-gray-600">
                No Failed Emails
              </p>
              <p className="text-sm text-gray-500 mt-2">
                All emails are being sent successfully
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attempts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Failed At
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {failedEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {email.to_email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {email.template_type}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {email.subject}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className="text-sm text-red-600 max-w-md"
                            title={email.error_message}
                          >
                            <div className="line-clamp-2">
                              {email.error_message}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {email.attempts} / {email.max_attempts}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(email.processed_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            onClick={() => handleRetry(email.id, email.to_email)}
                            disabled={retrying === email.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {retrying === email.id ? (
                              <>
                                <span className="mr-1">
                                  <LoadingSpinner size="sm" />
                                </span>
                                Retrying...
                              </>
                            ) : (
                              'Retry'
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      variant="secondary"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      variant="secondary"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            ℹ️ Email Queue Information
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Emails are processed automatically every 10 seconds</li>
            <li>• Failed emails are automatically retried up to 3 times</li>
            <li>• You can manually retry failed emails using the buttons above</li>
            <li>
              • Common failures: Invalid email addresses, SMTP errors, network
              issues
            </li>
            <li>• Old emails (sent/failed) are cleaned up after 30 days</li>
          </ul>
        </div>
      </Card>
    </PageContainer>
  );
};

export default EmailMonitor;
