import { Routes, Route } from 'react-router-dom';
import App from './App';
import SummaryPage from './SummaryPage';
import WaitingPage from './WaitingPage';
import ResultPage from './ResultPage';
import ThankYouPage from './ThankYouPage';
import PrivateRoute from './PrivateRoute';
import FormEditor from './FormEditor';
import FormPage from './FormPage';
import Login from './Login';
import Register from './Register';

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><App /></PrivateRoute>} />
      <Route path="/admin/form/:id/summary" element={<PrivateRoute isAdminRoute={true}><SummaryPage /></PrivateRoute>} />
      <Route path="/waiting" element={<PrivateRoute><WaitingPage /></PrivateRoute>} />
      <Route path="/result" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
      <Route path="/thank-you" element={<PrivateRoute><ThankYouPage /></PrivateRoute>} />
      <Route path="/form/:id" element={<PrivateRoute><FormPage /></PrivateRoute>} />
      <Route path="/admin/form/:id" element={<PrivateRoute isAdminRoute={true}><FormEditor /></PrivateRoute>} />
    </Routes>
  );
}
