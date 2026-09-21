import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { formatDateOnly } from '../../utils/dateOnly';
import AttendanceCalendar from '../../components/AttendanceCalendar';

export default function WorkforceAdmin({ onLeaveNotificationsViewed }) {
  const [festivals, setFestivals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [date, setDate] = useState('');
  const [festivalDate, setFestivalDate] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const [festivalResponse, requestResponse] = await Promise.all([
      api.get('/employees/festivals'),
      api.get('/employees/leave-requests')
    ]);
    setFestivals(festivalResponse.data || []);
    setRequests(requestResponse.data || []);
    await api.post('/notifications/leave-requests/mark-read');
    onLeaveNotificationsViewed?.();
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message || 'Unable to load workforce requests.'));
  }, []);

  const saveFestival = async (event) => {
    event.preventDefault();
    try {
      await api.post('/employees/festivals', { date });
      setDate('');
      setFestivalDate('');
      setMessage('Festival saved for every employee.');
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to save festival.');
    }
  };

  const removeFestival = async (id) => {
    try {
      await api.delete(`/employees/festivals/${id}`);
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to remove festival.');
    }
  };

  const decide = async (dateId, status) => {
    try {
      await api.patch(`/employees/leave-requests/dates/${dateId}`, { status });
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to update leave request.');
    }
  };

  const decideAll = async (request, status) => {
    try {
      await api.patch(`/employees/leave-requests/${request.id}`, { status });
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to process leave request.');
    }
  };

  const deleteRequest = async (request) => {
    if (!window.confirm(`Delete ${request.full_name}'s leave request history? Attendance will not change.`)) return;
    try {
      await api.delete(`/employees/leave-requests/${request.id}/history`);
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to delete leave request history.');
    }
  };

  const deleteAll = async () => {
    if (!window.confirm('Delete all leave request history? Attendance and payroll will not change.')) return;
    try {
      await api.delete('/employees/leave-requests/history/all');
      await load();
    } catch (error) {
      setMessage(error.message || 'Unable to delete leave request history.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-bold">Office Festivals</h2>
        <AttendanceCalendar
          records={festivals.map((festival) => ({ attendance_date: festival.festival_date, status: 'Festival' }))}
          editable
          allowFuture
          allowSundays
          selectedDate={festivalDate}
          previewStatus={festivalDate ? 'Festival' : ''}
          onSelectDate={(selected) => { setFestivalDate(selected); setDate(selected); }}
        />
        <form onSubmit={saveFestival} className="mt-4 flex flex-wrap gap-3">
          <button disabled={!date} className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold disabled:opacity-40">
            Declare Festival{date ? `: ${formatDateOnly(date)}` : ''}
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {festivals.map((festival) => (
            <div key={festival.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
              <span>{formatDateOnly(festival.festival_date)} <span className="text-pink-300">Festival</span></span>
              <button type="button" title="Remove festival" onClick={() => removeFestival(festival.id)} className="text-rose-300"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Bell className="h-5 w-5 text-cyan-300" />Leave Requests</h2>
          {requests.length > 0 && <button type="button" onClick={deleteAll} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold">Delete All</button>}
        </div>
        {message && <p className="mt-3 text-sm text-rose-300">{message}</p>}
        {requests.length === 0 && <p className="mt-3 text-sm text-slate-400">No leave requests.</p>}
        {requests.map((request) => (
          <article key={request.id} className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{request.full_name}</h3>
                <p className="text-xs text-slate-400">{request.employee_code} · {request.leave_type === 'paid' ? 'Paid Leave' : 'Normal Leave'} · {request.requested_days} requested days · {request.request_status}</p>
              </div>
              <div className="flex gap-2">
                {request.request_status === 'Pending' && <><button type="button" title="Approve all" onClick={() => decideAll(request, 'Approved')} className="text-emerald-300"><Check className="h-4 w-4" /></button><button type="button" title="Reject all" onClick={() => decideAll(request, 'Rejected')} className="text-rose-300"><X className="h-4 w-4" /></button></>}
                <button type="button" title="Delete request history" onClick={() => deleteRequest(request)} className="text-slate-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {request.dates.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 px-3 py-2 text-sm">
                  <span>{formatDateOnly(item.date)} · {item.status}</span>
                  {item.status === 'Pending' && <span className="flex gap-3"><button type="button" onClick={() => decide(item.id, 'Approved')} className="text-emerald-300">Approve</button><button type="button" onClick={() => decide(item.id, 'Rejected')} className="text-rose-300">Reject</button></span>}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
