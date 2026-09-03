'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type Course = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  deposit_cents: number | null;
};

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  courseId: string;
  date: string;
  time: string;
  ridingLevel: string;
  hasOwnMotorcycle: boolean;
  notes: string;
  consent: boolean;
  website: string;
};

const initialForm: FormState = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  courseId: '',
  date: '',
  time: '',
  ridingLevel: 'beginner',
  hasOwnMotorcycle: false,
  notes: '',
  consent: false,
  website: '',
};

const fallbackCourses = [
  { name: 'Beginner Rider Introduction', duration: '60 min', price: 'R850', copy: 'Start with the controls, balance and low-speed confidence.' },
  { name: 'Learner Licence Preparation', duration: '90 min', price: 'R1 200', copy: 'Build the road knowledge and judgement your learner journey needs.' },
  { name: 'Practical Riding Skills', duration: '120 min', price: 'R1 800', copy: 'Sharper control, road positioning and real-world riding technique.' },
  { name: 'Licence Test Preparation', duration: '90 min', price: 'R1 500', copy: 'Focused preparation for your test, with clear correction and repetition.' },
];

const courseCopy: Record<string, string> = Object.fromEntries(
  fallbackCourses.map((course) => [course.name, course.copy]),
);

function money(cents: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(cents / 100);
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    fetch('/api/public/bookings')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load courses');
        return response.json();
      })
      .then((data) => setCourses(data.courses ?? []))
      .catch(() => setCourses([]));
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.courseId),
    [courses, form.courseId],
  );

  const minimumDate = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    return value.toISOString().slice(0, 10);
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseCourse(courseId: string) {
    setField('courseId', courseId);
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    setMessage('');

    try {
      const response = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit your request.');
      setReference(data.reference);
      setMessage(data.message);
      setState('success');
      setForm(initialForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit your request.');
      setState('error');
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Bike Savvy home">
          <span className="brand-mark">BS</span>
          <span>BIKE SAVVY</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#courses">Training</a>
          <a href="#why">Why Bike Savvy</a>
          <a href="#process">How it works</a>
        </nav>
        <a className="nav-cta" href="#book">BOOK A LESSON <ArrowIcon /></a>
      </header>

      <section className="hero" id="top">
        <Image
          src="/bike-savvy-hero.jpg"
          alt="Motorcyclist riding confidently on an open road at sunset"
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow light">MOTORCYCLE TRAINING · CAPE TOWN</p>
          <h1>RIDE READY.<br /><span>ROAD CONFIDENT.</span></h1>
          <p className="hero-copy">
            Clear, practical motorcycle training built around your experience, your pace and the road ahead.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#book">BOOK YOUR LESSON <ArrowIcon /></a>
            <a className="button ghost" href="#courses">EXPLORE TRAINING</a>
          </div>
        </div>
        <div className="hero-proof" aria-label="Training highlights">
          <div><strong>01</strong><span>One-to-one<br />guidance</span></div>
          <div><strong>02</strong><span>Beginner<br />friendly</span></div>
          <div><strong>03</strong><span>Cape Town<br />training</span></div>
        </div>
      </section>

      <section className="section courses" id="courses">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CHOOSE YOUR NEXT MOVE</p>
            <h2>TRAINING THAT MEETS<br />YOU WHERE YOU ARE.</h2>
          </div>
          <p>From your first introduction to focused licence-test preparation, choose the session that matches your next riding goal.</p>
        </div>

        <div className="course-grid">
          {(courses.length ? courses : fallbackCourses).map((item, index) => {
            const live = 'id' in item;
            const name = item.name;
            const duration = live ? `${item.duration_minutes} min` : item.duration;
            const price = live ? money(item.price_cents) : item.price;
            const copy = live ? courseCopy[item.name] || 'Practical, confidence-building motorcycle training.' : item.copy;
            return (
              <article className="course-card" key={live ? item.id : name}>
                <div className="course-number">0{index + 1}</div>
                <p className="course-duration">{duration}</p>
                <h3>{name}</h3>
                <p>{copy}</p>
                <div className="course-footer">
                  <strong>{price}</strong>
                  <button type="button" onClick={() => live ? chooseCourse(item.id) : document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}>
                    SELECT <ArrowIcon />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="split-section" id="why">
        <div className="split-image">
          <Image src="/road.jpg" alt="Performance motorcycle prepared for the road" fill sizes="(max-width: 800px) 100vw, 50vw" />
          <div className="image-label">CONTROL STARTS<br />BEFORE THE ROAD.</div>
        </div>
        <div className="split-copy">
          <p className="eyebrow light">WHY BIKE SAVVY</p>
          <h2>CALM COACHING.<br />REAL PROGRESS.</h2>
          <p className="lead">You do not need to arrive confident. That is what the training is for.</p>
          <div className="benefit-list">
            <div><CheckIcon /><span><strong>Built around your level</strong>We start from what you know—not what we assume.</span></div>
            <div><CheckIcon /><span><strong>Skills you can feel</strong>Clear instruction, purposeful repetition and usable feedback.</span></div>
            <div><CheckIcon /><span><strong>A safer way forward</strong>Control, awareness and road judgement stay at the centre.</span></div>
          </div>
          <a href="#book" className="text-link">START YOUR RIDING JOURNEY <ArrowIcon /></a>
        </div>
      </section>

      <section className="section process" id="process">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">SIMPLE FROM THE START</p>
            <h2>BOOK IN THREE STEPS.</h2>
          </div>
        </div>
        <div className="steps">
          <article><span>01</span><h3>Choose your training</h3><p>Select the course that matches your current riding goal.</p></article>
          <article><span>02</span><h3>Request a session</h3><p>Share your preferred date and time using the form below.</p></article>
          <article><span>03</span><h3>Get confirmed</h3><p>Bike Savvy confirms availability and sends your payment details.</p></article>
        </div>
      </section>

      <section className="booking-section" id="book">
        <div className="booking-intro">
          <p className="eyebrow light">YOUR NEXT RIDE STARTS HERE</p>
          <h2>REQUEST<br />YOUR LESSON.</h2>
          <p>Choose your preferred session. We’ll confirm instructor availability and payment details before your booking is final.</p>
          <div className="request-note">
            <span>PLEASE NOTE</span>
            <p>This is a booking request. Your lesson is secured once Bike Savvy confirms your slot and payment.</p>
          </div>
        </div>

        <div className="booking-panel">
          {state === 'success' ? (
            <div className="success-state" role="status">
              <div className="success-icon"><CheckIcon /></div>
              <p className="eyebrow">REQUEST RECEIVED</p>
              <h3>WE’LL TAKE IT<br />FROM HERE.</h3>
              <p>{message}</p>
              <div className="reference"><span>REFERENCE</span><strong>{reference}</strong></div>
              <button type="button" className="button dark" onClick={() => { setState('idle'); setReference(''); }}>MAKE ANOTHER REQUEST</button>
            </div>
          ) : (
            <form onSubmit={submitBooking} noValidate>
              <div className="form-progress"><span>BOOKING REQUEST</span><strong>01 — DETAILS</strong></div>
              <div className="field-grid">
                <label>First name *<input required autoComplete="given-name" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} /></label>
                <label>Last name *<input required autoComplete="family-name" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} /></label>
                <label>WhatsApp / phone *<input required type="tel" autoComplete="tel" placeholder="+27" value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></label>
                <label>Email <input type="email" autoComplete="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></label>
                <label className="wide">Course *
                  <select required value={form.courseId} onChange={(e) => setField('courseId', e.target.value)}>
                    <option value="">Select a training session</option>
                    {courses.map((course) => <option value={course.id} key={course.id}>{course.name} — {money(course.price_cents)}</option>)}
                  </select>
                </label>
                <label>Preferred date *<input required type="date" min={minimumDate} value={form.date} onChange={(e) => setField('date', e.target.value)} /></label>
                <label>Preferred time *<input required type="time" min="07:00" max="17:30" step="1800" value={form.time} onChange={(e) => setField('time', e.target.value)} /></label>
                <label>Riding experience
                  <select value={form.ridingLevel} onChange={(e) => setField('ridingLevel', e.target.value)}>
                    <option value="beginner">First-time / beginner</option>
                    <option value="intermediate">Some riding experience</option>
                    <option value="advanced">Experienced rider</option>
                  </select>
                </label>
                <label className="check-field"><input type="checkbox" checked={form.hasOwnMotorcycle} onChange={(e) => setField('hasOwnMotorcycle', e.target.checked)} /><span>I have my own motorcycle</span></label>
                <label className="wide">Anything we should know?<textarea rows={3} placeholder="Your goals, concerns or questions" value={form.notes} onChange={(e) => setField('notes', e.target.value)} /></label>
                <label className="website-field" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setField('website', e.target.value)} /></label>
                <label className="check-field consent wide"><input required type="checkbox" checked={form.consent} onChange={(e) => setField('consent', e.target.checked)} /><span>I agree that Bike Savvy may contact me about this booking request. *</span></label>
              </div>

              {selectedCourse && (
                <div className="selection-summary">
                  <span>YOUR SELECTION</span>
                  <strong>{selectedCourse.name}</strong>
                  <p>{selectedCourse.duration_minutes} minutes · {money(selectedCourse.price_cents)}</p>
                </div>
              )}

              {state === 'error' && <p className="form-error" role="alert">{message}</p>}
              <button className="button submit" type="submit" disabled={state === 'loading' || courses.length === 0}>
                {state === 'loading' ? 'SENDING REQUEST…' : 'REQUEST MY LESSON'} {state !== 'loading' && <ArrowIcon />}
              </button>
              <p className="form-footnote">No payment is taken at this stage.</p>
            </form>
          )}
        </div>
      </section>

      <section className="final-cta">
        <div><p className="eyebrow light">NOT SURE WHERE TO START?</p><h2>START WITH A CONVERSATION.</h2></div>
        <a href="#book" className="button primary">TELL US YOUR GOAL <ArrowIcon /></a>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">BS</span><span>BIKE SAVVY</span></a>
        <p>Practical motorcycle training in Cape Town, South Africa.</p>
        <p>© {new Date().getFullYear()} Bike Savvy</p>
      </footer>
    </main>
  );
}
