import React, { useState } from 'react';
import { Button, Modal } from '../../../components/common';
import api from '../../../services/api';
import { FiLoader, FiEdit2, FiDownload, FiCheckCircle } from 'react-icons/fi';

interface AIReportGeneratorProps {
  reviewId: number;
  employeeName: string;
  formData?: {
    kpis?: any[];
    managerComments?: any;
    qualitativeComments?: any;
    overallComment?: string;
    accomplishments?: any[];
    disappointments?: string;
    improvements?: string;
    overallRating?: number;
  };
}

export const AIReportGenerator: React.FC<AIReportGeneratorProps> = ({ 
  reviewId, 
  employeeName,
  formData 
}) => {
  const [aiInstructions, setAiInstructions] = useState('');
  const [reportFocus, setReportFocus] = useState('comprehensive');
  const [generatedReport, setGeneratedReport] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [downloadable, setDownloadable] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setDownloadable(false);
    
    
    
    
    // Log detailed KPI data to verify manager ratings/comments are captured
    
    
    try {
      const response = await api.post(
        `/ai-reports/generate/${reviewId}`,
        { 
          ai_instructions: aiInstructions, 
          report_focus: reportFocus,
          form_data: formData // Send live form data if available
        },
        { timeout: 45000 } // Increase timeout to 45 seconds for AI processing
      );
      
      
      
      if (response.data.success) {
        setGeneratedReport(response.data.report);
        setPdfFileName(response.data.pdfFileName || '');
        setDownloadable(response.data.pdfAvailable || false);
        setShowPreview(true);
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } catch (err: any) {
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate AI report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(
        `/ai-reports/download/${reviewId}`,
        { responseType: 'blob' }
      );
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', pdfFileName || `AI_Report_${employeeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download PDF. Please try again.');
    }
  };

  const handleRegenerate = () => {
    setShowPreview(false);
    setDownloadable(false);
    handleGenerate();
  };

  const handleClose = () => {
    setShowPreview(false);
    setGeneratedReport('');
    setPdfFileName('');
    setDownloadable(false);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
        <div className="flex items-start mb-5">
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md mr-4">
            <span className="text-3xl">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              AI-Powered Performance Report
            </h3>
            <p className="text-sm text-gray-600">
              Generate a comprehensive one-page performance analysis report using advanced AI
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Additional Instructions */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Instructions for AI <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="E.g., Focus on leadership skills, emphasize project management capabilities, highlight technical innovations, mention specific initiatives..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
              maxLength={500}
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Provide specific areas to emphasize in the report
              </p>
              <p className={`text-xs font-medium ${aiInstructions.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                {aiInstructions.length}/500
              </p>
            </div>
          </div>

          {/* Report Focus */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Focus <span className="text-red-500">*</span>
            </label>
            <select
              value={reportFocus}
              onChange={(e) => setReportFocus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-medium"
              disabled={loading}
            >
              <option value="comprehensive">📊 Comprehensive Overview - Balanced view of all aspects</option>
              <option value="strengths">💪 Strengths & Achievements - Focus on excellence</option>
              <option value="development">📈 Development Areas - Growth opportunities</option>
              <option value="recommendations">🎯 Future Recommendations - Actionable next steps</option>
            </select>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Error generating report</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin mr-2" size={20} />
                Generating AI Report...
              </>
            ) : (
              <>
                <span className="mr-2">✨</span>
                Generate AI Performance Report
              </>
            )}
          </Button>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-1">How it works:</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  AI analyzes your entered data (ratings, comments, accomplishments) in real-time to generate 
                  a professional report. You can preview and regenerate before saving the review. The final PDF 
                  is saved separately and downloadable anytime from Completed Reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={handleClose}
        title={`AI Generated Report for ${employeeName}`}
      >
        <div className="space-y-4">
          {/* Success Message */}
          {downloadable && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <FiCheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">AI Report Generated Successfully!</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your AI-powered performance report has been generated and saved as a PDF. 
                    You can download it now or access it later from the Completed Reviews section.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Report Preview */}
          <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg p-6 bg-white">
            <div 
              className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-h3:text-lg prose-h3:font-bold prose-h3:mb-3 prose-h3:mt-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-5 prose-li:text-gray-700"
              dangerouslySetInnerHTML={{ __html: generatedReport }} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleRegenerate}
              disabled={loading}
              className="flex-1 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" size={16} />
                  Regenerating...
                </>
              ) : (
                <>
                  <FiEdit2 className="mr-2" size={16} />
                  Regenerate Report
                </>
              )}
            </Button>
            {downloadable && (
              <Button 
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center justify-center"
              >
                <FiDownload className="mr-2" size={16} />
                Download PDF Report
              </Button>
            )}
          </div>

          {/* Info Notice */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-800">
              <strong>Note:</strong> The AI report is saved separately and can be downloaded anytime from the 
              Completed Reviews section. It is not included in the main KPI review PDF.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
