import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap error messages
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const registerStep1 = (data)          => api.post('/auth/register/step1', data);
export const verifyOTP     = (data)          => api.post('/auth/register/verify', data);
export const getMe         = ()              => api.get('/auth/me');
export const createAdmin   = (data)          => api.post('/auth/admin/create', data);

// ── Gyms ──────────────────────────────────────────────────────
export const getGyms           = (params)      => api.get('/gyms', { params });
export const getGym            = (gymId)       => api.get(`/gyms/${gymId}`);
export const updateGym         = (gymId, data) => api.put(`/gyms/${gymId}`, data);
export const getSlotAvailability = (gymId, date) => api.get(`/gyms/${gymId}/availability`, { params: { date } });
export const getGymBookings    = (gymId, date) => api.get(`/gyms/${gymId}/bookings`, { params: { date } });
export const getGymAttendance  = (gymId, date) => api.get(`/gyms/${gymId}/attendance`, { params: date ? { date } : {} });
export const getGymSubscriptions = (gymId)    => api.get(`/gyms/${gymId}/subscriptions`);
export const getGymComplaints  = (gymId)       => api.get(`/gyms/${gymId}/complaints`);

// ── Bookings ──────────────────────────────────────────────────
export const createBooking  = (data)           => api.post('/bookings', data);
export const getMyBookings  = ()               => api.get('/bookings/mine');
export const cancelBooking  = (bookingId)      => api.delete(`/bookings/${bookingId}`);

// ── QR ────────────────────────────────────────────────────────
export const getMyQR        = ()               => api.get('/qr/mine');
export const scanQR         = (qrToken)        => api.post('/qr/scan', { qrToken });

// ── Subscriptions ─────────────────────────────────────────────
export const getMySubscription   = ()          => api.get('/subscriptions/mine');
export const activateSubscription = (data)     => api.post('/subscriptions/activate', data);
export const searchStudent       = (rollNo)    => api.get('/subscriptions/search', { params: { rollNo } });
export const unbanStudent        = (userId)    => api.post(`/subscriptions/unban/${userId}`);

// ── Notifications ─────────────────────────────────────────────
export const getNotifications    = (gymId)     => api.get('/notifications', { params: gymId ? { gymId } : {} });
export const createNotification  = (data)      => api.post('/notifications', data);
export const deleteNotification  = (id)        => api.delete(`/notifications/${id}`);

// ── Complaints ────────────────────────────────────────────────
export const createComplaint     = (data)      => api.post('/complaints', data);
export const getMyComplaints     = ()          => api.get('/complaints/mine');
export const updateComplaint     = (id, data)  => api.put(`/complaints/${id}`, data);

// ── Attendance ────────────────────────────────────────────────
export const getMyAttendance     = ()          => api.get('/attendance/mine');

export default api;

// ── Super Admin ───────────────────────────────────────────────
export const saGetStats         = ()           => api.get('/sa/stats');
export const saGetConfig        = ()           => api.get('/sa/config');
export const saUpdateConfig     = (data)       => api.put('/sa/config', data);

export const saCreateGym        = (data)       => api.post('/sa/gyms', data);
export const saDeleteGym        = (gymId)      => api.delete(`/sa/gyms/${gymId}`);
export const saReactivateGym    = (gymId)      => api.put(`/sa/gyms/${gymId}/reactivate`);

export const saGetAdmins        = ()           => api.get('/sa/admins');
export const saCreateAdmin      = (data)       => api.post('/sa/admins', data);
export const saRevokeAdmin      = (uid)        => api.put(`/sa/admins/${uid}/revoke`);
export const saReinstateAdmin   = (uid)        => api.put(`/sa/admins/${uid}/reinstate`);
export const saResetAdminPass   = (uid, data)  => api.put(`/sa/admins/${uid}/password`, data);
export const saReassignAdmin    = (uid, data)  => api.put(`/sa/admins/${uid}/reassign`, data);

export const saGetUsers         = (params)     => api.get('/sa/users', { params });
export const saGetUser          = (uid)        => api.get(`/sa/users/${uid}`);
export const saBanUser          = (uid, data)  => api.put(`/sa/users/${uid}/ban`, data);
export const saUnbanUser        = (uid)        => api.put(`/sa/users/${uid}/unban`);
export const saResetUserStats   = (uid, data)  => api.put(`/sa/users/${uid}/reset`, data);

export const saGetSubscriptions = (params)     => api.get('/sa/subscriptions', { params });
export const saGetComplaints    = (params)     => api.get('/sa/complaints', { params });
export const saResolveComplaint = (id, data)   => api.put(`/sa/complaints/${id}`, data);
export const saGetAttendance    = (params)     => api.get('/sa/attendance', { params });
