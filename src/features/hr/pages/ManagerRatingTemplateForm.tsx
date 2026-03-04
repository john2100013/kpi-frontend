import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { 
  FiArrowLeft, 
  FiSave, 
  FiPlus, 
  FiTrash2, 
  FiMove,
  FiAlertCircle 
} from 'react-icons/fi';
import { ManagerRatingNav } from '../components';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchRatingOptions,
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  selectRatingScales,
  selectCurrentTemplate,
  clearCurrentTemplate
} from '../../../store/slices/managerRatingSlice';

interface Question {
  id?: number;
  question_text: string;
  rating_scale_name: string;
  question_order: number;
  is_required: boolean;
}

interface Section {
  id?: number;
  section_name: string;
  section_order: number;
  questions: Question[];
}

/**
 * HR Manager Rating Template Form Page
 * Create or edit manager rating templates
 */
export const ManagerRatingTemplateForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useAppDispatch();
  
  // Redux selectors - use cached rating options
  const ratingScalesData = useAppSelector(selectRatingScales);
  const currentTemplate = useAppSelector(selectCurrentTemplate);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Extract scale names from Redux
  const ratingScales = ratingScalesData.map(scale => scale.scaleName);
  
  // Form state
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<'quarterly' | 'yearly'>('quarterly');
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [sections, setSections] = useState<Section[]>([
    {
      section_name: '',
      section_order: 1,
      questions: [
        {
          question_text: '',
          rating_scale_name: '',
          question_order: 1,
          is_required: true
        }
      ]
    }
  ]);

  const isEditMode = !!id;

  useEffect(() => {
    // Fetch rating options from Redux (will use cache if available)
    dispatch(fetchRatingOptions(false));
    
    if (id) {
      dispatch(fetchTemplateById(Number(id)));
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentTemplate());
    };
  }, [id, dispatch]);

  // Update form when template is loaded from Redux
  useEffect(() => {
    if (currentTemplate && id) {
      setTemplateName(currentTemplate.template_name);
      setDescription(currentTemplate.description || '');
      // Handle period type - convert 'annual' to 'yearly'
      const templatePeriod = currentTemplate.period === 'annual' ? 'yearly' : (currentTemplate.period || 'quarterly');
      setPeriod(templatePeriod as 'quarterly' | 'yearly');
      setQuarter(currentTemplate.quarter || 'Q1');
      setYear(currentTemplate.year || new Date().getFullYear());
      
      // Note: Sections would need to be fetched separately or included in template
      // For now, keep the existing API call for sections if needed
      fetchTemplateSections();
    }
  }, [currentTemplate, id]);

  const fetchTemplateSections = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/manager-rating/templates/${id}`);
      const template = response.data.data.template;
      
      if (template.sections && template.sections.length > 0) {
        setSections(template.sections);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch template sections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        section_name: '',
        section_order: sections.length + 1,
        questions: [
          {
            question_text: '',
            rating_scale_name: ratingScales[0] || '',
            question_order: 1,
            is_required: true
          }
        ]
      }
    ]);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (sections.length === 1) {
      toast.error('Template must have at least one section');
      return;
    }
    
    const updatedSections = sections.filter((_, index) => index !== sectionIndex);
    // Re-order sections
    updatedSections.forEach((section, index) => {
      section.section_order = index + 1;
    });
    setSections(updatedSections);
  };

  const handleSectionChange = (sectionIndex: number, field: string, value: any) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      [field]: value
    };
    setSections(updatedSections);
  };

  const handleAddQuestion = (sectionIndex: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions.push({
      question_text: '',
      rating_scale_name: ratingScales[0] || '',
      question_order: updatedSections[sectionIndex].questions.length + 1,
      is_required: true
    });
    setSections(updatedSections);
  };

  const handleRemoveQuestion = (sectionIndex: number, questionIndex: number) => {
    const updatedSections = [...sections];
    
    if (updatedSections[sectionIndex].questions.length === 1) {
      toast.error('Section must have at least one question');
      return;
    }
    
    updatedSections[sectionIndex].questions = updatedSections[sectionIndex].questions.filter(
      (_, index) => index !== questionIndex
    );
    
    // Re-order questions
    updatedSections[sectionIndex].questions.forEach((question, index) => {
      question.question_order = index + 1;
    });
    
    setSections(updatedSections);
  };

  const handleQuestionChange = (
    sectionIndex: number,
    questionIndex: number,
    field: string,
    value: any
  ) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex] = {
      ...updatedSections[sectionIndex].questions[questionIndex],
      [field]: value
    };
    setSections(updatedSections);
  };

  const validateForm = (): boolean => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return false;
    }

    if (sections.length === 0) {
      toast.error('Template must have at least one section');
      return false;
    }

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      if (!section.section_name.trim()) {
        toast.error(`Section ${i + 1} must have a name`);
        return false;
      }

      if (section.questions.length === 0) {
        toast.error(`Section "${section.section_name}" must have at least one question`);
        return false;
      }

      for (let j = 0; j < section.questions.length; j++) {
        const question = section.questions[j];
        
        if (!question.question_text.trim()) {
          toast.error(`Question ${j + 1} in section "${section.section_name}" must have text`);
          return false;
        }

        if (!question.rating_scale_name) {
          toast.error(`Question ${j + 1} in section "${section.section_name}" must have a rating scale`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const templateData = {
        template_name: templateName.trim(),
        description: description.trim(),
        period,
        quarter: period === 'quarterly' ? quarter : null,
        year,
        sections: sections.map((section, sIndex) => ({
          ...section,
          section_order: sIndex + 1,
          questions: section.questions.map((question, qIndex) => ({
            ...question,
            question_order: qIndex + 1
          }))
        }))
      };

      if (isEditMode) {
        await dispatch(updateTemplate({ id: Number(id), data: templateData })).unwrap();
        toast.success('Template updated successfully');
      } else {
        await dispatch(createTemplate(templateData)).unwrap();
        toast.success('Template created successfully');
      }

      navigate('/hr/manager-rating/templates');
    } catch (error: any) {
      toast.error(error || `Failed to ${isEditMode ? 'update' : 'create'} template`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/hr/manager-rating/templates');
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);

  return (
    <PageContainer>
      <ManagerRatingNav />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBack} variant="ghost" icon={FiArrowLeft} className="p-2" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Manager Rating Template' : 'Create Manager Rating Template'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isEditMode ? 'Update template details' : 'Create a new manager rating template'}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={saving} 
            variant="primary" 
            icon={FiSave} 
            loading={saving}
          >
            {isEditMode ? 'Update Template' : 'Create Template'}
          </Button>
        </div>

        {/* Template Information */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Q1 2026 Manager Performance Evaluation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this rating template..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period *
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as 'quarterly' | 'yearly')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {period === 'quarterly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quarter *
                    </label>
                    <select
                      value={quarter}
                      onChange={(e) => setQuarter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Q1">Q1 (Jan-Mar)</option>
                      <option value="Q2">Q2 (Apr-Jun)</option>
                      <option value="Q3">Q3 (Jul-Sep)</option>
                      <option value="Q4">Q4 (Oct-Dec)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min={2020}
                    max={2100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sections */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sections & Questions</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {sections.length} section{sections.length !== 1 ? 's' : ''} · {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={handleAddSection} variant="secondary" icon={FiPlus}>
                Add Section
              </Button>
            </div>

            <div className="space-y-6">
              {sections.map((section, sectionIndex) => (
                <div 
                  key={sectionIndex} 
                  className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                >
                  {/* Section Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FiMove className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          Section {sectionIndex + 1}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={section.section_name}
                        onChange={(e) => handleSectionChange(sectionIndex, 'section_name', e.target.value)}
                        placeholder="e.g., Quality of Work, Communication, Leadership"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <Button
                      onClick={() => handleRemoveSection(sectionIndex)}
                      variant="ghost"
                      icon={FiTrash2}
                      className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={sections.length === 1}
                    />
                  </div>

                  {/* Questions */}
                  <div className="space-y-3 ml-6">
                    {section.questions.map((question, questionIndex) => (
                      <div 
                        key={questionIndex}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Question {questionIndex + 1}
                              </label>
                              <input
                                type="text"
                                value={question.question_text}
                                onChange={(e) => handleQuestionChange(
                                  sectionIndex,
                                  questionIndex,
                                  'question_text',
                                  e.target.value
                                )}
                                placeholder="e.g., My manager provides clear direction and guidance"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Rating Scale *
                                </label>
                                <select
                                  value={question.rating_scale_name}
                                  onChange={(e) => handleQuestionChange(
                                    sectionIndex,
                                    questionIndex,
                                    'rating_scale_name',
                                    e.target.value
                                  )}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                  {ratingScales.length === 0 ? (
                                    <option value="">Loading...</option>
                                  ) : (
                                    <>
                                      <option value="">Select scale</option>
                                      {ratingScales.map((scale) => (
                                        <option key={scale} value={scale}>
                                          {scale}
                                        </option>
                                      ))}
                                    </>
                                  )}
                                </select>
                              </div>

                              <div>
                                <label className="flex items-center space-x-2 cursor-pointer mt-6">
                                  <input
                                    type="checkbox"
                                    checked={question.is_required}
                                    onChange={(e) => handleQuestionChange(
                                      sectionIndex,
                                      questionIndex,
                                      'is_required',
                                      e.target.checked
                                    )}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">Required</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleRemoveQuestion(sectionIndex, questionIndex)}
                            variant="ghost"
                            icon={FiTrash2}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-5"
                            disabled={section.questions.length === 1}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={() => handleAddQuestion(sectionIndex)}
                      variant="outline"
                      icon={FiPlus}
                      className="w-full"
                    >
                      Add Question to Section
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card>
          <div className="p-6">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="text-blue-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Template Summary</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You are creating a template with {sections.length} section{sections.length !== 1 ? 's' : ''} 
                  {' '}and {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}. 
                  Once assigned to departments, all employees will receive this rating form to evaluate their managers.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Group related questions into sections for better organization. 
                  Use clear, specific questions for more accurate feedback.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ManagerRatingTemplateForm;
