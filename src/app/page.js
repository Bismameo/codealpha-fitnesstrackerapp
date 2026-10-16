'use client';

import { useEffect, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  CircleHelp, Dumbbell, Flame, Footprints, Heart, MoreHorizontal, Plus,
  Timer, Trash2, X,
} from 'lucide-react';

const storageKey = 'stride-fitness-activities-v1';
const dailyGoal = 10000;
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const sampleActivities = [
  { id: 'sample-1', name: 'Morning run', type: 'Run', duration: 32, calories: 286, time: '8:15 AM', steps: 3840 },
  { id: 'sample-2', name: 'Strength training', type: 'Strength', duration: 45, calories: 214, time: '12:30 PM', steps: 0 },
  { id: 'sample-3', name: 'Lunch walk', type: 'Walk', duration: 18, calories: 92, time: '1:05 PM', steps: 2160 },
];

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(dateKey, offset) {
  const date = new Date(`${dateKey}T12:00:00`);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset + offset * 7);
  return weekdayLabels.map((day) => {
    const key = getDateKey(date);
    date.setDate(date.getDate() + 1);
    return { day, key };
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function ActivityIcon({ type }) {
  const Icon = type === 'Strength' ? Dumbbell : type === 'Run' ? Activity : Footprints;
  return <Icon size={18} strokeWidth={1.8} aria-hidden="true" />;
}

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [ready, setReady] = useState(false);
  const [todayKey, setTodayKey] = useState('');
  const [todayLabel, setTodayLabel] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [period, setPeriod] = useState('This week');
  const [form, setForm] = useState({ name: '', type: 'Run', duration: '', calories: '', steps: '', date: getDateKey(new Date()) });

  useEffect(() => {
    let savedActivities = [];
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) savedActivities = parsed;
      }
    } catch {
      savedActivities = [];
    }
    const frame = window.requestAnimationFrame(() => {
      const now = new Date();
      setActivities(savedActivities);
      setTodayKey(getDateKey(now));
      setTodayLabel(new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(now));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(activities));
  }, [activities, ready]);

  const todayActivities = activities.filter((activity) => activity.date === todayKey);
  const totals = todayActivities.reduce((sum, activity) => ({
    steps: sum.steps + Number(activity.steps || 0),
    calories: sum.calories + Number(activity.calories || 0),
    minutes: sum.minutes + Number(activity.duration || 0),
  }), { steps: 0, calories: 0, minutes: 0 });
  const stepProgress = Math.min((totals.steps / dailyGoal) * 100, 100);
  const usingSamples = activities.some((activity) => String(activity.id).startsWith('sample-'));
  const chartData = getWeekDates(todayKey || getDateKey(new Date()), period === 'Last week' ? -1 : 0).map(({ day, key }) => ({
    day,
    key,
    steps: activities.filter((activity) => activity.date === key).reduce((sum, activity) => sum + Number(activity.steps || 0), 0),
  }));
  const weeklyAverage = Math.round(chartData.reduce((sum, item) => sum + item.steps, 0) / chartData.length);

  function saveActivity(event) {
    event.preventDefault();
    const entry = {
      id: crypto.randomUUID(), date: form.date, name: form.name.trim(), type: form.type,
      duration: Number(form.duration) || 0, calories: Number(form.calories) || 0,
      steps: Number(form.steps) || 0,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date()),
    };
    setActivities((current) => [entry, ...current]);
    setForm({ name: '', type: 'Run', duration: '', calories: '', steps: '', date: todayKey });
    setShowForm(false);
  }

  function openForm() {
    setForm((current) => ({ ...current, date: current.date || todayKey || getDateKey(new Date()) }));
    setShowForm(true);
  }

  function toggleSamples() {
    if (usingSamples) {
      setActivities((current) => current.filter((activity) => !String(activity.id).startsWith('sample-')));
      setShowSamples(false);
      return;
    }
    setActivities((current) => [...sampleActivities.map((activity) => ({ ...activity, date: todayKey })), ...current]);
    setShowSamples(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Stride home"><span className="brand-mark"><Activity size={20} strokeWidth={2.2} /></span><span>stride<span className="brand-period">.</span></span></a>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><Activity size={18} /> Overview</a>
          <a className="nav-item" href="#activity"><CalendarDays size={18} /> Activity log</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="streak-card"><div className="streak-top"><span className="streak-icon"><Flame size={17} /></span><span>YOUR STREAK</span></div><div className="streak-number">4 <span>days</span></div><p>You&apos;re building a great habit.</p><div className="streak-dots" aria-label="Four day activity streak"><i /><i /><i /><i /><i /><i /><i /></div></div>
          <button className="profile-button" type="button" aria-label="Profile menu"><span className="avatar">JD</span><span className="profile-copy"><strong>Jordan Davis</strong><small>Personal account</small></span><MoreHorizontal size={19} /></button>
        </div>
      </aside>

      <section className="main-content" id="overview">
        <header className="topbar"><div className="breadcrumb">My workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-actions"><span className="today-label"><span className="status-dot" />{todayLabel || 'Today'}</span><button className="help-button" title="Help" aria-label="Help"><CircleHelp size={19} /></button></div></header>
        <div className="page-content">
          <section className="welcome-row"><div><div className="eyebrow">{todayLabel ? todayLabel.toUpperCase() : 'TODAY'}</div><h1>Good afternoon, Jordan<span>.</span></h1><p>Small steps add up. Here&apos;s how you&apos;re moving today.</p></div><button className="primary-button" type="button" onClick={openForm}><Plus size={18} /> Log activity</button></section>

          <section className="metric-grid" aria-label="Today's fitness metrics">
            <article className="metric-card steps-card"><div className="metric-heading"><span className="metric-icon coral"><Footprints size={19} /></span><span>Steps</span><button className="more-button" aria-label="Steps options"><MoreHorizontal size={19} /></button></div><div className="metric-value">{formatNumber(totals.steps)}<small> / {formatNumber(dailyGoal)}</small></div><div className="progress-track"><span className="progress-fill" style={{ width: `${stepProgress}%` }} /></div><div className="metric-foot"><span>{Math.round(stepProgress)}% of daily goal</span><span className="trend up"><ArrowUpRight size={14} /> 8.2%</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span className="metric-icon yellow"><Flame size={19} /></span><span>Calories burned</span><button className="more-button" aria-label="Calories options"><MoreHorizontal size={19} /></button></div><div className="metric-value">{formatNumber(totals.calories)}<small> kcal</small></div><div className="metric-foot metric-foot-spaced"><span>Daily target: 600 kcal</span><span className="trend up"><ArrowUpRight size={14} /> 12.4%</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span className="metric-icon mint"><Timer size={19} /></span><span>Active time</span><button className="more-button" aria-label="Active time options"><MoreHorizontal size={19} /></button></div><div className="metric-value">{totals.minutes}<small> min</small></div><div className="metric-foot metric-foot-spaced"><span>Goal: 60 min</span><span className="trend down"><ArrowDownRight size={14} /> 3.1%</span></div></article>
            <article className="metric-card"><div className="metric-heading"><span className="metric-icon blue"><Heart size={19} /></span><span>Workouts</span><button className="more-button" aria-label="Workouts options"><MoreHorizontal size={19} /></button></div><div className="metric-value">{todayActivities.filter((activity) => activity.duration > 0).length}<small> sessions</small></div><div className="metric-foot metric-foot-spaced"><span>Weekly goal: 5 sessions</span><span className="trend neutral">This week</span></div></article>
          </section>

          <section className="middle-grid">
            <article className="panel chart-panel"><div className="panel-heading"><div><h2>Activity</h2><p>Your movement over time</p></div><label className="select-wrap"><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Activity time period"><option>This week</option><option>Last week</option></select><ChevronDown size={15} /></label></div><div className="chart-legend"><span><i className="legend-dot steps-legend" /> Steps</span><span className="chart-summary">Daily average <strong>{formatNumber(weeklyAverage)}</strong> <small>steps / day</small></span></div><div className="chart-area" role="img" aria-label={`Bar chart showing steps ${period.toLowerCase()}`}><div className="y-axis"><span>15k</span><span>10k</span><span>5k</span><span>0</span></div><div className="chart-grid"><i /><i /><i /><i /></div><div className="bars">{chartData.map((item) => <div className={`bar-column ${item.key === todayKey && period === 'This week' ? 'current' : ''}`} key={item.key}><div className="bar-track"><span className="bar" style={{ height: `${Math.min(item.steps / 15000 * 100, 100)}%` }} title={`${formatNumber(item.steps)} steps`} /></div><span className="bar-label">{item.day}</span></div>)}</div></div><div className="chart-note"><span className="note-check"><Check size={14} /></span> Step totals are based on activities you&apos;ve logged.</div></article>
            <article className="panel goal-panel"><div className="panel-heading"><div><h2>Daily goal</h2><p>One step at a time</p></div><button className="more-button" aria-label="Daily goal options"><MoreHorizontal size={19} /></button></div><div className="goal-visual"><svg className="goal-ring" viewBox="0 0 180 180" role="img" aria-label={`${Math.round(stepProgress)} percent of step goal complete`}><circle className="ring-bg" cx="90" cy="90" r="76" /><circle className="ring-progress" cx="90" cy="90" r="76" style={{ strokeDasharray: `${stepProgress * 4.775} 477.5` }} /></svg><div className="ring-label"><strong>{Math.round(stepProgress)}<small>%</small></strong><span>completed</span></div></div><div className="goal-count"><strong>{formatNumber(totals.steps)}</strong><span>of {formatNumber(dailyGoal)} steps</span></div><div className="goal-remaining">{formatNumber(Math.max(dailyGoal - totals.steps, 0))} steps to go</div><div className="goal-divider" /><div className="goal-footer"><span className="goal-spark">✳</span><span>At this pace, you&apos;ll reach your goal by <strong>6:42 PM</strong></span></div></article>
          </section>

          <section className="panel activity-panel" id="activity"><div className="activity-panel-heading"><div><h2>Today&apos;s activity</h2><p>Your logged sessions for today</p></div><div className="activity-actions"><button className="text-button" type="button" onClick={toggleSamples}>{usingSamples ? 'Remove sample data' : 'Load sample data'}</button><button className="secondary-button" type="button" onClick={() => setShowForm(true)}><Plus size={16} /> Add entry</button></div></div>
            {todayActivities.length ? <div className="activity-table-wrap"><table className="activity-table"><thead><tr><th>ACTIVITY</th><th>TYPE</th><th>DURATION</th><th>CALORIES</th><th>TIME</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{todayActivities.map((activity) => <tr key={activity.id}><td><span className={`activity-symbol ${activity.type.toLowerCase()}`}><ActivityIcon type={activity.type} /></span><strong>{activity.name}</strong></td><td><span className="type-label">{activity.type}</span></td><td>{activity.duration} min</td><td>{activity.calories} kcal</td><td>{activity.time}</td><td><button className="delete-button" type="button" title={`Delete ${activity.name}`} aria-label={`Delete ${activity.name}`} onClick={() => setActivities((current) => current.filter((item) => item.id !== activity.id))}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="empty-icon"><Footprints size={22} /></span><strong>No activity logged yet</strong><p>Add your first activity to start tracking today&apos;s progress.</p><button className="secondary-button" type="button" onClick={() => setShowForm(true)}><Plus size={16} /> Log an activity</button></div>}
            <div className="activity-panel-footer"><span><span className="saved-dot" /> Your activity is saved on this device</span><button type="button" className="view-all-button" onClick={() => setShowForm(true)}>Log another <ArrowUpRight size={14} /></button></div>
          </section>
          <footer className="page-footer"><span>STRIDE <span>·</span> YOUR DAILY MOVEMENT, IN FOCUS</span><span>Made for showing up.</span></footer>
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section className="activity-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-heading"><div><div className="eyebrow">ACTIVITY LOG</div><h2 id="modal-title">Add an activity</h2></div><button className="modal-close" type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={19} /></button></div>
            <form onSubmit={saveActivity}>
              <label className="form-field full-field">Activity name<input autoFocus required maxLength={50} placeholder="e.g. Evening cycle" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label className="form-field full-field">Exercise type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Run</option><option>Walk</option><option>Strength</option><option>Cycling</option><option>Yoga</option><option>Other</option></select></label>
              <label className="form-field full-field">Date<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
              <div className="form-row"><label className="form-field">Duration <span>(minutes)</span><input type="number" min="0" max="1440" placeholder="30" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></label><label className="form-field">Calories <span>(kcal)</span><input type="number" min="0" max="10000" placeholder="200" value={form.calories} onChange={(event) => setForm({ ...form, calories: event.target.value })} /></label></div>
              <label className="form-field full-field">Steps <span>(optional)</span><input type="number" min="0" max="100000" placeholder="0" value={form.steps} onChange={(event) => setForm({ ...form, steps: event.target.value })} /></label>
              <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={17} /> Save activity</button></div>
            </form>
          </section>
        </div>
      )}
      <span className="sample-status" aria-live="polite">{showSamples ? 'Example activities loaded' : ''}</span>
    </main>
  );
}