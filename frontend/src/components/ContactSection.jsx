import { useState } from 'react'
import { useInView } from '../hooks/useInView'
import './ContactSection.css'

export default function ContactSection() {
  const [ref, inView] = useInView()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      
      // Map form fields to lead API fields
      const leadData = {
        name: form.name,
        email: form.email,
        message: form.message,
        phone: form.phone || undefined,
      }
      
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })

      if (response.ok) {
        setSubmitted(true)
        setForm({ name: '', email: '', subject: '', message: '', phone: '' })
        
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to submit form. Please try again.')
      }
    } catch (err) {
      console.error('Contact form error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" ref={ref} className={'contact-section ' + (inView ? 'in-view' : '')}>
      <div className="contact-section__inner">
        <p className="contact-section__eyebrow">Get in touch</p>
        <h2 className="contact-section__title">Contact Us</h2>
        <p className="contact-section__subtitle">
          Have questions or feedback? We’d love to hear from you.
        </p>

        {submitted ? (
          <div className="contact-section__success">
            <p>Thanks for reaching out. We’ll get back to you soon.</p>
          </div>
        ) : error ? (
          <div style={{ color: '#dc2626', marginBottom: '20px', padding: '12px', borderRadius: '6px', backgroundColor: '#fee' }}>
            <p>{error}</p>
          </div>
        ) : null}
        
        {!submitted && (
          <form className="contact-section__form" onSubmit={handleSubmit}>
            <div className="contact-section__row">
              <label htmlFor="contact-name" className="contact-section__label">Name</label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="contact-section__input"
                placeholder="Your name"
                required
              />
            </div>
            <div className="contact-section__row">
              <label htmlFor="contact-email" className="contact-section__label">Email</label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="contact-section__input"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="contact-section__row">
              <label htmlFor="contact-subject" className="contact-section__label">Subject</label>
              <input
                id="contact-subject"
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="contact-section__input"
                placeholder="What is this about?"
              />
            </div>
            <div className="contact-section__row">
              <label htmlFor="contact-message" className="contact-section__label">Message</label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                className="contact-section__input contact-section__textarea"
                placeholder="Your message..."
                rows={4}
                required
              />
            </div>
            <button type="submit" className="contact-section__submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}

        <p className="contact-section__email-note">
          Or email us at <a href="mailto:support@roadguard.app">support@roadguard.app</a>
        </p>
      </div>
    </section>
  )
}
