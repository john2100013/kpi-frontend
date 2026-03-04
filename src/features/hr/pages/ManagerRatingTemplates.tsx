import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiFileText } from 'react-icons/fi';
import { ManagerRatingNav } from '../components';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  fetchTemplates, 
  deleteTemplate,
  selectTemplates, 
  selectTemplatesLoading, 
  selectTemplatesError 
} from '../../../store/slices/managerRatingSlice';

/**
 * HR Manager Rating Templates List Page
 * Shows all manager rating templates
 */
export const ManagerRatingTemplates: React.FC = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const templates = useAppSelector(selectTemplates);
  const loading = useAppSelector(selectTemplatesLoading);
  const error = useAppSelector(selectTemplatesError);

  useEffect(() => {
    dispatch(fetchTemplates(false));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  const handleDelete = async (templateId: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await dispatch(deleteTemplate(templateId)).unwrap();
      toast.success('Template deleted successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to delete template');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Manager Rating"
        subtitle="Create and manage manager rating templates"
        actions={
          <Link to="/hr/manager-rating/templates/create">
            <Button variant="primary" icon={FiPlus}>
              Create Template
            </Button>
          </Link>
        }
      />
      <ManagerRatingNav />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first manager rating template.</p>
              <Link to="/hr/manager-rating/templates/create">
                <Button variant="primary">
                  <FiPlus className="mr-2" />
                  Create Template
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.template_name}</h3>
                {template.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <FiFileText className="h-4 w-4" />
                    {template.section_count || 0} sections
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers className="h-4 w-4" />
                    {template.assignment_count || 0} assignments
                  </span>
                </div>

                {template.period && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {template.period} {template.quarter && `- ${template.quarter}`} {template.year}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link to={`/hr/manager-rating/templates/${template.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <FiEdit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  );
};

export default ManagerRatingTemplates;
