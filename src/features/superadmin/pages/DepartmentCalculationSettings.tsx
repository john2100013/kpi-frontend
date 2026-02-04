/**
 * Department Calculation Settings - Super Admin
 * Manage calculation features for all departments across all companies
 * NOW DEPARTMENT-LEVEL: Each department can have its own calculation method
 */

import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Switch,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Tooltip,
  MenuItem,
  Select,
  FormLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import BusinessIcon from '@mui/icons-material/Business';
import api from '../../../services/api';

interface DepartmentFeatures {
  id?: number;
  department_id: number;
  department_name: string;
  company_id: number;
  company_name: string;
  use_goal_weight_yearly: boolean;
  use_goal_weight_quarterly: boolean;
  use_actual_values_yearly: boolean;
  use_actual_values_quarterly: boolean;
  use_normal_calculation: boolean;
  enable_employee_self_rating_quarterly: boolean;
  enable_employee_self_rating_yearly: boolean;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
}

interface DepartmentFeaturesUpdatePayload {
  use_goal_weight_yearly?: boolean;
  use_goal_weight_quarterly?: boolean;
  use_actual_values_yearly?: boolean;
  use_actual_values_quarterly?: boolean;
  use_normal_calculation?: boolean;
  enable_employee_self_rating_quarterly?: boolean;
  enable_employee_self_rating_yearly?: boolean;
}

interface Company {
  id: number;
  name: string;
}

const DepartmentCalculationSettings: React.FC = () => {
  const toast = useToast();
  const [departments, setDepartments] = useState<DepartmentFeatures[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentFeatures | null>(null);
  const [editedFeatures, setEditedFeatures] = useState<DepartmentFeaturesUpdatePayload>({});
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Load all departments with their features
   */
  const loadDepartments = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/department-features/all');

      setDepartments(response.data);

      // Extract unique companies
      const uniqueCompanies = response.data.reduce((acc: Company[], dept: DepartmentFeatures) => {
        if (!acc.find(c => c.id === dept.company_id)) {
          acc.push({ id: dept.company_id, name: dept.company_name });
        }
        return acc;
      }, []);
      
      setCompanies(uniqueCompanies);
    } catch (error) {
      toast.error('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save department features
   */
  const saveDepartmentFeatures = async (
    departmentId: number,
    features: DepartmentFeaturesUpdatePayload
  ): Promise<boolean> => {
    try {
      setSaving(true);
      
      await api.put(`/department-features/${departmentId}`, features);

      // Reload departments to get updated data
      await loadDepartments();
      return true;
    } catch (error) {
      toast.error('Failed to save department features. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Get method name for display
   */
  const getMethodName = (dept: DepartmentFeatures, type: 'yearly' | 'quarterly'): string => {
    if (type === 'yearly') {
      if (dept.use_actual_values_yearly) return 'Actual vs Target Values';
      if (dept.use_goal_weight_yearly) return 'Goal Weight';
      return 'Normal Calculation';
    } else {
      if (dept.use_actual_values_quarterly) return 'Actual vs Target Values';
      if (dept.use_goal_weight_quarterly) return 'Goal Weight';
      return 'Normal Calculation';
    }
  };

  /**
   * Open edit dialog for a department
   */
  const handleEdit = (department: DepartmentFeatures) => {
    setSelectedDepartment(department);
    setEditedFeatures({
      use_goal_weight_yearly: department.use_goal_weight_yearly,
      use_goal_weight_quarterly: department.use_goal_weight_quarterly,
      use_actual_values_yearly: department.use_actual_values_yearly,
      use_actual_values_quarterly: department.use_actual_values_quarterly,
      use_normal_calculation: department.use_normal_calculation,
      enable_employee_self_rating_quarterly: department.enable_employee_self_rating_quarterly,
      enable_employee_self_rating_yearly: department.enable_employee_self_rating_yearly,
    });
    setHasChanges(false);
    setEditDialogOpen(true);
  };

  /**
   * Close edit dialog
   */
  const handleClose = () => {
    setEditDialogOpen(false);
    setSelectedDepartment(null);
    setEditedFeatures({});
    setHasChanges(false);
  };

  /**
   * Toggle a feature flag
   */
  const handleToggle = (field: keyof DepartmentFeaturesUpdatePayload) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.checked;

    const newFeatures = { ...editedFeatures, [field]: value };

    // Business logic: Actual values features are mutually exclusive with other methods
    if (field === 'use_actual_values_yearly' && value) {

      newFeatures.use_goal_weight_yearly = false;
      newFeatures.use_normal_calculation = false;
    }

    if (field === 'use_actual_values_quarterly' && value) {

      newFeatures.use_goal_weight_quarterly = false;
      newFeatures.use_normal_calculation = false;
    }

    // If enabling goal weight, disable normal calculation
    if ((field === 'use_goal_weight_yearly' || field === 'use_goal_weight_quarterly') && value) {

      newFeatures.use_normal_calculation = false;
    }

    // If all specific features are disabled, enable normal calculation
    if (
      !newFeatures.use_goal_weight_yearly &&
      !newFeatures.use_goal_weight_quarterly &&
      !newFeatures.use_actual_values_yearly &&
      !newFeatures.use_actual_values_quarterly
    ) {

      newFeatures.use_normal_calculation = true;
    }


    setEditedFeatures(newFeatures);
    setHasChanges(true);
  };

  /**
   * Save changes
   */
  const handleSave = async () => {
    if (!selectedDepartment) {

      return;
    }





    const success = await saveDepartmentFeatures(selectedDepartment.department_id, editedFeatures);

    
    if (success) {

      handleClose();
    } else {
      toast.error('Failed to save department features.');
    }
  };

  /**
   * Get calculation method chip color
   */
  const getMethodColor = (method: string): 'primary' | 'success' | 'warning' | 'default' => {
    if (method === 'Actual vs Target Values') return 'success';
    if (method === 'Goal Weight') return 'primary';
    if (method === 'Normal Calculation') return 'warning';
    return 'default';
  };

  /**
   * Filter departments by selected company
   */
  const filteredDepartments = selectedCompanyFilter === 'all'
    ? departments
    : departments.filter(d => d.company_id === selectedCompanyFilter);

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  if (loading && departments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Card>
        <CardHeader
          title={
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h5" component="h1">
                  Department Calculation Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Configure KPI calculation methods for each department
                </Typography>
              </Box>
              <Tooltip title="Refresh">
                <IconButton onClick={loadDepartments} disabled={loading} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />

        <CardContent>
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
            <AlertTitle>Department-Level Configuration</AlertTitle>
            <Typography variant="body2">
              Each department can now use different calculation methods for yearly and quarterly KPIs.
              The system supports: <strong>Normal Calculation</strong>, <strong>Goal Weight</strong>,
              and <strong>Actual vs Target Values</strong>. This allows flexibility across departments within the same company.
            </Typography>
          </Alert>

          {/* Company Filter */}
          <Box mb={3}>
            <FormControl fullWidth variant="outlined" size="small" sx={{ maxWidth: 300 }}>
              <FormLabel sx={{ mb: 1 }}>Filter by Company</FormLabel>
              <Select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value as number | 'all')}
                startAdornment={<BusinessIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="all">All Companies</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Company</strong></TableCell>
                  <TableCell><strong>Department</strong></TableCell>
                  <TableCell><strong>Yearly KPI Method</strong></TableCell>
                  <TableCell><strong>Quarterly KPI Method</strong></TableCell>
                  <TableCell><strong>Employee Self-Rating</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No departments found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((department) => (
                    <TableRow key={department.department_id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {department.company_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {department.department_name}
                          </Typography>
                          {department.is_default && (
                            <Chip label="Default" size="small" color="warning" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getMethodName(department, 'yearly')}
                          size="small"
                          color={getMethodColor(getMethodName(department, 'yearly'))}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getMethodName(department, 'quarterly')}
                          size="small"
                          color={getMethodColor(getMethodName(department, 'quarterly'))}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="column" spacing={0.5}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 65 }}>
                              Quarterly:
                            </Typography>
                            {department.enable_employee_self_rating_quarterly ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Enabled"
                                size="small"
                                color="success"
                              />
                            ) : (
                              <Chip label="Disabled" size="small" color="default" />
                            )}
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 65 }}>
                              Yearly:
                            </Typography>
                            {department.enable_employee_self_rating_yearly ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Enabled"
                                size="small"
                                color="success"
                              />
                            ) : (
                              <Chip label="Disabled" size="small" color="default" />
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Settings">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(department)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div">
            Edit Calculation Features
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            {selectedDepartment?.company_name} - {selectedDepartment?.department_name}
          </Typography>
        </Box>

        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Info Alert */}
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2">
                Configure which calculation methods this department uses for their KPI evaluations.
              </Typography>
            </Alert>

            {/* Yearly KPI Settings */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Yearly KPI Settings
              </Typography>
              <Stack spacing={2} sx={{ pl: 2, borderLeft: 3, borderColor: 'primary.main' }}>
                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedFeatures.use_goal_weight_yearly || false}
                        onChange={handleToggle('use_goal_weight_yearly')}
                        color="primary"
                      />
                    }
                    label="Use Goal Weight Calculation"
                    labelPlacement="start"
                    sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                  />
                  <FormHelperText>
                    Calculate as: Σ(rating × goal_weight). Each KPI item's rating multiplied by its goal weight.
                  </FormHelperText>
                </FormControl>

                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedFeatures.use_actual_values_yearly || false}
                        onChange={handleToggle('use_actual_values_yearly')}
                        color="primary"
                      />
                    }
                    label="Use Actual vs Target Values"
                    labelPlacement="start"
                    sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                  />
                  <FormHelperText>
                    Calculate as: Σ((actual_value / target_value × 100) × goal_weight).
                  </FormHelperText>
                </FormControl>

                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedFeatures.enable_employee_self_rating_yearly || false}
                        onChange={handleToggle('enable_employee_self_rating_yearly')}
                        color="primary"
                      />
                    }
                    label="Enable Employee Self-Rating"
                    labelPlacement="start"
                    sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                  />
                  <FormHelperText>
                    Allow employees to rate themselves before manager rating for yearly KPIs.
                  </FormHelperText>
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            {/* Quarterly KPI Settings */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Quarterly KPI Settings
              </Typography>
              <Stack spacing={2} sx={{ pl: 2, borderLeft: 3, borderColor: 'success.main' }}>
                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedFeatures.use_goal_weight_quarterly || false}
                        onChange={handleToggle('use_goal_weight_quarterly')}
                        color="success"
                      />
                    }
                    label="Use Goal Weight Calculation"
                    labelPlacement="start"
                    sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                  />
                  <FormHelperText>
                    Calculate as: Σ(rating × goal_weight) for quarterly KPIs.
                  </FormHelperText>
                </FormControl>

                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedFeatures.use_actual_values_quarterly || false}
                        onChange={handleToggle('use_actual_values_quarterly')}
                        color="success"
                      />
                    }
                    label="Use Actual vs Target Values"
                    labelPlacement="start"
                    sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                  />
                  <FormHelperText>
                    Calculate as: Σ((actual_value / target_value × 100) × goal_weight).
                  </FormHelperText>
                </FormControl>

                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedFeatures.enable_employee_self_rating_quarterly || false}
                        onChange={handleToggle('enable_employee_self_rating_quarterly')}
                        color="success"
                      />
                    }
                    label="Enable Employee Self-Rating"
                    labelPlacement="start"
                    sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                  />
                  <FormHelperText>
                    Allow employees to rate themselves before manager rating for quarterly KPIs.
                  </FormHelperText>
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            {/* Normal Calculation Info */}
            <Box>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={editedFeatures.use_normal_calculation || false}
                      disabled
                      color="default"
                    />
                  }
                  label="Normal Calculation (Default)"
                  labelPlacement="start"
                  sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                />
                <FormHelperText>
                  Calculate as: (Σ manager_rating / Σ max_rating) × 100. Used when no other method is active.
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Warning for Actual Values */}
            {(editedFeatures.use_actual_values_yearly || editedFeatures.use_actual_values_quarterly) && (
              <Alert severity="warning" icon={<WarningIcon />}>
                <AlertTitle>Important</AlertTitle>
                <Typography variant="body2">
                  When "Actual vs Target Values" is enabled, ensure KPI items have target_value and actual_value fields filled in.
                  This method takes priority over other calculation methods.
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentCalculationSettings;
