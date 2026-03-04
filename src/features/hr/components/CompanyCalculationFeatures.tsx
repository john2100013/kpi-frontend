/**
 * Company Calculation Features Settings
 * Allows HR to configure company-specific KPI calculation methodologies
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Switch,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Button,
  Alert,
  AlertTitle,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useCompanyFeatures } from '../../../hooks/useCompanyFeatures';


const CompanyCalculationFeatures: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { features, loading, updateFeatures, fetchFeatures } = useCompanyFeatures();

  const [localFeatures, setLocalFeatures] = useState({
    use_goal_weight_yearly: false,
    use_goal_weight_quarterly: false,
    use_actual_values_yearly: false,
    use_actual_values_quarterly: false,
    use_normal_calculation: true,
    enable_employee_self_rating_quarterly: false,
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (features) {
      setLocalFeatures({
        use_goal_weight_yearly: features.use_goal_weight_yearly,
        use_goal_weight_quarterly: features.use_goal_weight_quarterly,
        use_actual_values_yearly: features.use_actual_values_yearly,
        use_actual_values_quarterly: features.use_actual_values_quarterly,
        use_normal_calculation: features.use_normal_calculation,
        enable_employee_self_rating_quarterly: features.enable_employee_self_rating_quarterly,
      });
    }
  }, [features]);

  const handleToggle = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked;
    const newFeatures = { ...localFeatures, [field]: value };

    // Business logic: Actual values features are mutually exclusive
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

    setLocalFeatures(newFeatures);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.company_id) {
      toast.error('Company ID not found');
      return;
    }

    setSaving(true);

    const success = await updateFeatures(user.company_id, localFeatures);

    if (success) {
      toast.success('Calculation features updated successfully');
      setHasChanges(false);
      await fetchFeatures();
    } else {
      toast.error('Failed to update calculation features');
    }

    setSaving(false);
  };

  const handleReset = () => {
    if (features) {
      setLocalFeatures({
        use_goal_weight_yearly: features.use_goal_weight_yearly,
        use_goal_weight_quarterly: features.use_goal_weight_quarterly,
        use_actual_values_yearly: features.use_actual_values_yearly,
        use_actual_values_quarterly: features.use_actual_values_quarterly,
        use_normal_calculation: features.use_normal_calculation,
        enable_employee_self_rating_quarterly: features.enable_employee_self_rating_quarterly,
      });
      setHasChanges(false);
    }
  };

  if (loading && !features) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h6" component="h2">
                KPI Calculation Features
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure how KPI ratings are calculated for your company
              </Typography>
            </Box>
            {features?.is_default && (
              <Chip label="Using Default Settings" color="warning" size="small" />
            )}
          </Box>
        }
      />

      <CardContent>
        <Stack spacing={3}>
          {/* Info Alert */}
          <Alert severity="info" icon={<InfoIcon />}>
            <AlertTitle>About Calculation Methods</AlertTitle>
            <Typography variant="body2">
              Different calculation methods determine how final KPI ratings are computed.
              Choose the method that matches your organization's performance evaluation process.
            </Typography>
          </Alert>

          {/* Yearly KPI Settings */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Yearly KPI Settings
            </Typography>
            <Stack spacing={2} sx={{ pl: 2, borderLeft: 3, borderColor: 'primary.main' }}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={localFeatures.use_goal_weight_yearly}
                      onChange={handleToggle('use_goal_weight_yearly')}
                      color="primary"
                    />
                  }
                  label="Use Goal Weight Calculation"
                  labelPlacement="start"
                  sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                />
                <FormHelperText>
                  Calculate as: Σ(rating × goal_weight). Each KPI item's rating is multiplied by its goal weight percentage.
                </FormHelperText>
              </FormControl>

              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={localFeatures.use_actual_values_yearly}
                      onChange={handleToggle('use_actual_values_yearly')}
                      color="primary"
                    />
                  }
                  label="Use Actual vs Target Values"
                  labelPlacement="start"
                  sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                />
                <FormHelperText>
                  Calculate as: Σ((actual_value / target_value × 100) × goal_weight). Uses actual achievement vs targets.
                </FormHelperText>
              </FormControl>
            </Stack>
          </Box>

          <Divider />

          {/* Quarterly KPI Settings */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Quarterly KPI Settings
            </Typography>
            <Stack spacing={2} sx={{ pl: 2, borderLeft: 3, borderColor: 'success.main' }}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={localFeatures.use_goal_weight_quarterly}
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
                      checked={localFeatures.use_actual_values_quarterly}
                      onChange={handleToggle('use_actual_values_quarterly')}
                      color="success"
                    />
                  }
                  label="Use Actual vs Target Values"
                  labelPlacement="start"
                  sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                />
                <FormHelperText>
                  Calculate as: Σ((actual_value / target_value × 100) × goal_weight) for quarterly KPIs.
                </FormHelperText>
              </FormControl>

              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={localFeatures.enable_employee_self_rating_quarterly}
                      onChange={handleToggle('enable_employee_self_rating_quarterly')}
                      color="success"
                    />
                  }
                  label="Enable Employee Self-Rating"
                  labelPlacement="start"
                  sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
                />
                <FormHelperText>
                  Allow employees to rate themselves before manager rating in quarterly reviews.
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
                    checked={localFeatures.use_normal_calculation}
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

          {/* Warning Alert for Conflicts */}
          {(localFeatures.use_actual_values_yearly || localFeatures.use_actual_values_quarterly) && (
            <Alert severity="warning" icon={<WarningIcon />}>
              <AlertTitle>Calculation Method Priority</AlertTitle>
              <Typography variant="body2">
                When "Actual vs Target Values" is enabled, it takes priority over other calculation methods.
                Ensure your KPI items have target values and actual values filled in.
              </Typography>
            </Alert>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CompanyCalculationFeatures;
