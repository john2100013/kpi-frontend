import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployeeLayout from '../layouts/EmployeeLayout';
import Dashboard from '../features/employee/pages/Dashboard';
import AcknowledgeList from '../features/employee/pages/AcknowledgeList'; // RENAMED
import KPIAcknowledgement from '../features/shared/pages/KPIAcknowledgementSign';
import Reviews from '../features/employee/pages/Reviews.tsx';
import KPISettingCompleted from '../features/shared/pages/KPISettingCompleted';
import CompletedReviews from '../features/shared/pages/CompletedReviews';
import SelfRating from '../features/employee/pages/SelfRating';

const EmployeeRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployeeLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* CLEAR ROUTING: List page vs Form page */}
        <Route path="acknowledge" element={<AcknowledgeList />} />
        <Route path="kpiacknowledgement/:id" element={<KPIAcknowledgement />} />
        
        <Route path="reviews" element={<Reviews />} />
        <Route path="kpi-setting-completed" element={<KPISettingCompleted />} />
        <Route path="completed-reviews" element={<CompletedReviews />} />
        <Route path="self-rating/:reviewId" element={<SelfRating />} />
      </Route>
    </Routes>
  );
};

export default EmployeeRoutes;
