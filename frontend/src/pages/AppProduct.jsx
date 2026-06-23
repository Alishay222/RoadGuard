import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './AppProduct.css'
import AuthModal from '../components/AuthModal'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const INITIAL_MESSAGES = [
  { id: 1, role: 'assistant', text: '✨ Hello! How can I assist you today?' },
]

const THINKING_PHRASES = [
  'Encoding incidents for retrieval...',
  'Checking live safety data...',
  'Scanning incident records...',
  'Vectorizing safety query...',
  'Reviewing road conditions...',
  'Looking up emergency contacts...',
]

const SLOW_PHRASES = [
  'Taking more than expected...',
  'Low Resource / CPU spike detected...',
  'Trying to complete semantic search...',
  'Running deeper vector matching...',
]

const DEFAULT_ALERTS = [
  'Accident reported near I-8',
  'Heavy rain detected',
]

const KNOWN_CITIES = [
  'Islamabad',
  'Rawalpindi',
  'Lahore',
  'Karachi',
  'Peshawar',
  'Quetta',
  'Multan',
  'Faisalabad',
  'Gujranwala',
  'Hyderabad',
  'Sialkot',
  'Sukkur',
]

const SEVERITY_COLOR_MAP = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

function inferCityFromText(value) {
  const locationText = String(value || '').toLowerCase()
  const matchedCity = KNOWN_CITIES.find((cityName) => locationText.includes(cityName.toLowerCase()))
  return matchedCity || 'Islamabad'
}

function toIncidentKey(value) {
  return String(value || 'accident')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'accident'
}

async function requestBackend(path, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders || {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`)
  }

  return response.json()
}

function getAssistantReply(message) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('accident') || normalizedMessage.includes('crash')) {
    return 'I can help. Please share your location and whether anyone is injured. I can guide you to emergency contacts immediately.'
  }

  if (normalizedMessage.includes('pothole') || normalizedMessage.includes('road')) {
    return 'Noted. You can report the hazard with landmark details so nearby drivers can be alerted in real time.'
  }

  if (normalizedMessage.includes('rain') || normalizedMessage.includes('weather')) {
    return 'Weather risk is elevated. Drive slower, increase following distance, and avoid sudden braking on wet roads.'
  }

  if (normalizedMessage.includes('sos') || normalizedMessage.includes('emergency')) {
    return 'If this is urgent, tap SOS immediately. I can also provide police, ambulance, and roadside helpline options.'
  }

  if (normalizedMessage.includes('where am i') || normalizedMessage.includes('my location') || normalizedMessage.includes('current location') || normalizedMessage.includes('what is my location') || normalizedMessage.includes('what\'s my location') || normalizedMessage.includes('my city') || normalizedMessage.includes('current city')) {
    return '📍 Checking your GPS location now. I can show you nearby alerts and incidents for your area.'
  }

  return 'I can help with safety alerts, incidents, weather risks, and emergency actions. Tell me what is happening around you.'
}

export default function AppProduct() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, token } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [contactsOpen, setContactsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home') // 'home' | 'chat' | 'report' | 'contacts'
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportForm, setReportForm] = useState({
    incidentType: 'Accident',
    location: '',
    details: '',
  })
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState(INITIAL_MESSAGES)
  const [chatTyping, setChatTyping] = useState(false)
  const [thinkingPhrase, setThinkingPhrase] = useState(THINKING_PHRASES[0])
  const [chatSuggestions, setChatSuggestions] = useState([
    'Show alerts near me',
    'Recent incidents in my city',
    'Need SOS emergency contact',
  ])
  const [currentAddress, setCurrentAddress] = useState('Detecting your current location...')
  const [currentLocationUpdatedAt, setCurrentLocationUpdatedAt] = useState('Updated just now')
  const [currentCoordinates, setCurrentCoordinates] = useState(null)
  const [currentCity, setCurrentCity] = useState('Islamabad')
  const [safetyAlerts, setSafetyAlerts] = useState(DEFAULT_ALERTS)
  const [incidents, setIncidents] = useState([])
  const [sosContact, setSosContact] = useState(null)
  const [livePopup, setLivePopup] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const chatMessagesRef = useRef(null)
  const chatBottomRef = useRef(null)
  const mainMapContainerRef = useRef(null)
  const miniMapContainerRef = useRef(null)
  const mainMapInstanceRef = useRef(null)
  const miniMapInstanceRef = useRef(null)
  const mainMarkerRef = useRef(null)
  const miniMarkerRef = useRef(null)
  const mainIncidentsLayerRef = useRef(null)
  const miniIncidentsLayerRef = useRef(null)
  const geoWatchIdRef = useRef(null)
  const lastGeocodeKeyRef = useRef('')
  const emergencyContactsListRef = useRef(null)

  const handleLocationSearch = async (query) => {
    if (!query.trim()) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const results = await response.json()

      if (results.length > 0) {
        const { lat, lon, display_name } = results[0]
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lon)

        setCurrentCoordinates({ latitude, longitude })
        mainMarkerRef.current?.setLatLng([latitude, longitude])
        miniMarkerRef.current?.setLatLng([latitude, longitude])
        mainMapInstanceRef.current?.setView([latitude, longitude], 15)
        miniMapInstanceRef.current?.setView([latitude, longitude], 14)

        setCurrentAddress(display_name)
        setCurrentCity(inferCityFromText(display_name))
        setCurrentLocationUpdatedAt('Updated just now')
      }
    } catch (error) {
      console.error('Location search error:', error)
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLocationSearch(searchInput)
    }
  }

  useEffect(() => {
    if (!mainMapContainerRef.current || !miniMapContainerRef.current) {
      return
    }

    const defaultCenter = [33.6844, 73.0479]

    const sharedMapOptions = {
      zoomControl: false,
      attributionControl: true,
    }

    mainMapInstanceRef.current = L.map(mainMapContainerRef.current, sharedMapOptions).setView(defaultCenter, 13)
    miniMapInstanceRef.current = L.map(miniMapContainerRef.current, sharedMapOptions).setView(defaultCenter, 12)

    const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    const tileAttribution = '&copy; OpenStreetMap contributors'

    L.tileLayer(tileLayerUrl, { attribution: tileAttribution, maxZoom: 19 }).addTo(mainMapInstanceRef.current)
    L.tileLayer(tileLayerUrl, { attribution: tileAttribution, maxZoom: 19 }).addTo(miniMapInstanceRef.current)

    const markerStyle = {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#22c55e',
      fillOpacity: 1,
    }

    mainMarkerRef.current = L.circleMarker(defaultCenter, markerStyle).addTo(mainMapInstanceRef.current)
    miniMarkerRef.current = L.circleMarker(defaultCenter, markerStyle).addTo(miniMapInstanceRef.current)
    mainIncidentsLayerRef.current = L.layerGroup().addTo(mainMapInstanceRef.current)
    miniIncidentsLayerRef.current = L.layerGroup().addTo(miniMapInstanceRef.current)

    let isMounted = true

    const fetchAddress = async (latitude, longitude) => {
      const geocodeKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`

      if (lastGeocodeKeyRef.current === geocodeKey) {
        return
      }

      lastGeocodeKeyRef.current = geocodeKey

      try {
        const reverseResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!reverseResponse.ok) {
          throw new Error('Unable to resolve address')
        }

        const reverseData = await reverseResponse.json()

        if (isMounted) {
          const resolvedAddress = reverseData?.display_name || `Lat ${latitude.toFixed(5)}, Lon ${longitude.toFixed(5)}`
          setCurrentAddress(resolvedAddress)
          setCurrentLocationUpdatedAt('Updated just now')
          setCurrentCity(inferCityFromText(resolvedAddress))

          const areaLabel = resolvedAddress.split(',').slice(0, 3).join(',').trim()
          setSafetyAlerts([
            `Location-aware alert: monitor traffic near ${areaLabel}`,
            `Reduced road grip risk around your area due to current weather`,
            'Drive with caution and maintain safe following distance',
          ])
        }
      } catch {
        if (isMounted) {
          const fallbackLocation = `Lat ${latitude.toFixed(5)}, Lon ${longitude.toFixed(5)}`
          setCurrentAddress(fallbackLocation)
          setCurrentLocationUpdatedAt('Updated just now')
          setCurrentCity('Islamabad')
          setSafetyAlerts([
            `Live location update: ${fallbackLocation}`,
            'Nearby hazard data may be limited; proceed carefully',
            'Keep headlights on and report incidents in real time',
          ])
        }
      }
    }

    const updateTrackedLocation = (latitude, longitude) => {
      const newCenter = [latitude, longitude]
      setCurrentCoordinates({ latitude, longitude })
      mainMarkerRef.current?.setLatLng(newCenter)
      miniMarkerRef.current?.setLatLng(newCenter)
      mainMapInstanceRef.current?.setView(newCenter, 15)
      miniMapInstanceRef.current?.setView(newCenter, 14)
      fetchAddress(latitude, longitude)
    }

    if (navigator.geolocation) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          updateTrackedLocation(coords.latitude, coords.longitude)
        },
        () => {
          updateTrackedLocation(defaultCenter[0], defaultCenter[1])
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 15000,
        },
      )
    }

    return () => {
      isMounted = false

      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current)
      }

      mainMapInstanceRef.current?.remove()
      miniMapInstanceRef.current?.remove()
      mainMapInstanceRef.current = null
      miniMapInstanceRef.current = null
      mainIncidentsLayerRef.current = null
      miniIncidentsLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const loadAlertsAndIncidents = async () => {
      try {
        const [alertsResponse, incidentsResponse] = await Promise.all([
          requestBackend(`/api/alerts?city=${encodeURIComponent(currentCity)}&limit=8`),
          requestBackend(`/api/incidents?city=${encodeURIComponent(currentCity)}&days=730&limit=140`),
        ])

        if (!isActive) {
          return
        }

        const alertItems = Array.isArray(alertsResponse?.items) ? alertsResponse.items : []
        const incidentItems = Array.isArray(incidentsResponse?.items) ? incidentsResponse.items : []

        const formattedAlerts = alertItems.slice(0, 8).map((item) => {
          const title = item?.title || item?.type || 'Safety Alert'
          const place = item?.location ? ` (${item.location})` : ''
          return `${title}${place}`
        })

        setSafetyAlerts(formattedAlerts.length ? formattedAlerts : DEFAULT_ALERTS)
        setIncidents(incidentItems)
      } catch {
        if (!isActive) {
          return
        }

        setSafetyAlerts((existingAlerts) => (
          existingAlerts.length ? existingAlerts : DEFAULT_ALERTS
        ))
        setIncidents([])
      }
    }

    loadAlertsAndIncidents()

    return () => {
      isActive = false
    }
  }, [currentCity])

  useEffect(() => {
    if (incidents.length === 0 && safetyAlerts === DEFAULT_ALERTS) return

    const triggerPopup = () => {
      let popupMsg = ''
      if (incidents.length > 0 && Math.random() > 0.4) {
        const inc = incidents[Math.floor(Math.random() * Math.min(incidents.length, 4))]
        const title = inc.title || inc.type || 'Hazard'
        const severity = String(inc.severity || '').toLowerCase()
        const warning = severity === 'high' ? 'Watch Out !' : 'Be Cautious !'
        popupMsg = `${title} reported ahead, ${warning}`
      } else if (safetyAlerts.length > 0 && safetyAlerts !== DEFAULT_ALERTS) {
        const alertStr = safetyAlerts[Math.floor(Math.random() * Math.min(safetyAlerts.length, 3))]
        const cleanedAlert = alertStr.split(' (')[0]
        popupMsg = `${cleanedAlert} nearby, Watch Out !`
      }
      
      if (popupMsg) {
        setLivePopup(popupMsg)
        setTimeout(() => setLivePopup(null), 6000)
      }
    }

    const initTimer = setTimeout(triggerPopup, 2500)
    const intervalTimer = setInterval(triggerPopup, 16000)

    return () => {
      clearTimeout(initTimer)
      clearInterval(intervalTimer)
    }
  }, [incidents, safetyAlerts])

  useEffect(() => {
    if (!mainIncidentsLayerRef.current || !miniIncidentsLayerRef.current) {
      return
    }

    mainIncidentsLayerRef.current.clearLayers()
    miniIncidentsLayerRef.current.clearLayers()

    incidents.forEach((incident) => {
      const lat = Number(incident?.lat)
      const lng = Number(incident?.lng)

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return
      }

      const severity = String(incident?.severity || '').toLowerCase()
      const markerColor = SEVERITY_COLOR_MAP[severity] || '#f97316'
      const markerOptions = {
        radius: 7,
        color: '#ffffff',
        weight: 1.5,
        fillColor: markerColor,
        fillOpacity: 0.95,
      }
      const tooltipText = `${incident?.title || incident?.type || 'Incident'}${incident?.location ? ` — ${incident.location}` : ''}`
      const tooltipOptions = { permanent: false, direction: 'top', opacity: 0.92 }

      L.circleMarker([lat, lng], markerOptions).bindTooltip(tooltipText, tooltipOptions).addTo(mainIncidentsLayerRef.current)
      L.circleMarker([lat, lng], markerOptions).bindTooltip(tooltipText, tooltipOptions).addTo(miniIncidentsLayerRef.current)
    })
  }, [incidents])

  useEffect(() => {
    if (!chatOpen || !chatBottomRef.current) return
    const id = setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)
    return () => clearTimeout(id)
  }, [chatMessages, chatTyping, chatOpen])

  useEffect(() => {
    const emergencyList = emergencyContactsListRef.current

    if (!emergencyList) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (emergencyList.scrollHeight <= emergencyList.clientHeight) {
        return
      }

      const reachedBottom = emergencyList.scrollTop + emergencyList.clientHeight >= emergencyList.scrollHeight - 1

      if (reachedBottom) {
        emergencyList.scrollTop = 0
        return
      }

      emergencyList.scrollTop += 1
    }, 95)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const sendChatMessage = async (messageText) => {
    const trimmedInput = String(messageText || '').trim()

    if (!trimmedInput) {
      return
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmedInput,
    }

    setChatMessages((prevMessages) => [...prevMessages, userMessage])
    setChatInput('')
    setChatSuggestions([])
    setThinkingPhrase(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)])
    setChatTyping(true)

    const thinkingStart = Date.now()

    const thinkingInterval = setInterval(() => {
      const elapsed = Date.now() - thinkingStart
      const pool = elapsed > 3500 ? SLOW_PHRASES : THINKING_PHRASES
      setThinkingPhrase(pool[Math.floor(Math.random() * pool.length)])
    }, 1500)

    const MIN_THINKING_MS = 1200

    try {
      const chatResponse = await requestBackend('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          text: trimmedInput,
          city: currentCity,
          address: currentAddress,
        }),
      })

      const backendMessage = chatResponse?.message || getAssistantReply(trimmedInput)
      const responseData = chatResponse?.data || {}
      const extraHints = []

      if (Array.isArray(responseData.alerts) && responseData.alerts.length) {
        extraHints.push(`${responseData.alerts.length} live alert(s) found.`)
      }
      if (Array.isArray(responseData.incidents) && responseData.incidents.length) {
        extraHints.push(`${responseData.incidents.length} related incident(s) found.`)
      }
      if (responseData.contact?.phone_number) {
        extraHints.push(`Emergency: ${responseData.contact.service} (${responseData.contact.phone_number})`)
      }

      if (Array.isArray(responseData.suggestions) && responseData.suggestions.length) {
        setChatSuggestions(responseData.suggestions.slice(0, 4))
      }

      const elapsed = Date.now() - thinkingStart
      const remaining = MIN_THINKING_MS - elapsed
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: [backendMessage, ...extraHints].join('\n'),
      }

      setChatMessages((prevMessages) => [...prevMessages, assistantMessage])
    } catch {
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: getAssistantReply(trimmedInput),
      }

      setChatMessages((prevMessages) => [...prevMessages, assistantMessage])
      setChatSuggestions([
        'Show alerts near me',
        'Show recent accidents',
        'Need SOS help',
      ])
    } finally {
      clearInterval(thinkingInterval)
      setChatTyping(false)
    }
  }

  const handleSendMessage = () => {
    sendChatMessage(chatInput)
  }

  const handleSuggestionClick = (suggestion) => {
    if (chatTyping) {
      return
    }
    sendChatMessage(suggestion)
  }

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleReportFieldChange = (event) => {
    const { name, value } = event.target
    setReportForm((previousData) => ({ ...previousData, [name]: value }))
  }

  const handleReportSubmit = async (event) => {
    event.preventDefault()
    setReportError('')
    setReportSubmitting(true)
    try {
      await requestBackend('/api/incidents/report', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          incidentType: reportForm.incidentType,
          location: reportForm.location,
          details: reportForm.details,
          lat: currentCoordinates?.latitude ?? null,
          lng: currentCoordinates?.longitude ?? null,
        }),
      })
      setReportSubmitted(true)
    } catch {
      setReportError('Failed to submit report. Please try again.')
    } finally {
      setReportSubmitting(false)
    }
  }

  const handleCloseReport = () => {
    setReportOpen(false)
    setReportSubmitted(false)
    setReportError('')
    setReportForm({
      incidentType: 'Accident',
      location: '',
      details: '',
    })
    setActiveTab('home')
  }

  const handleAuthAction = () => {
    if (isLoggedIn) {
      logout()
    } else {
      setAuthModalOpen(true)
    }
    setProfileOpen(false)
  }

  const handleSosShare = async () => {
    const emergencyMessage = "Hi It's emergency I need help"
    const primaryIncidentType = incidents[0]?.type || reportForm.incidentType || 'accident'
    const incidentKey = toIncidentKey(primaryIncidentType)

    let contactFromApi = null

    try {
      contactFromApi = await requestBackend('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          incident_key: incidentKey,
          city: currentCity,
        }),
      })
      setSosContact(contactFromApi)
    } catch {
      contactFromApi = null
    }

    const locationLine = currentAddress ? `Current location: ${currentAddress}` : 'Current location is being detected.'
    const mapsLink = currentCoordinates
      ? `https://www.google.com/maps?q=${currentCoordinates.latitude},${currentCoordinates.longitude}`
      : ''
    const contactLine = contactFromApi?.phone_number
      ? `Emergency contact: ${contactFromApi.service || 'Support'} - ${contactFromApi.phone_number}`
      : ''

    const shareText = [emergencyMessage, locationLine, contactLine, mapsLink].filter(Boolean).join('\n')

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'RoadGuard SOS',
          text: shareText,
        })
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText)
      }

      window.alert('SOS message with your current location is ready to share.')
    } catch {
      window.alert('Unable to share SOS message right now. Please try again.')
    }
  }

  const handleSelectTab = (tab) => {
    setActiveTab(tab)
    setContactsOpen(false)
    if (tab === 'home') {
      setChatOpen(false)
      setReportOpen(false)
    }

    if (tab === 'chat') {
      setChatOpen(true)
      setReportOpen(false)
    }

    if (tab === 'report') {
      if (isLoggedIn) {
        setReportOpen(true)
      } else {
        setAuthModalOpen(true)
      }
      setChatOpen(false)
    }

    if (tab === 'contacts') {
      setContactsOpen(true)
      setChatOpen(false)
      setReportOpen(false)
    }
  }

  return (
    <div className="app-product" aria-label="Traffic Safety & Alert app screen">
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          reason="Sign in to report an incident."
        />
      )}
      {livePopup && (
        <div className="app-product__live-popup" role="alert">
          <span className="app-product__live-popup-icon">🚨</span>
          <p className="app-product__live-popup-text">{livePopup}</p>
          <button 
            type="button" 
            className="app-product__live-popup-close"
            onClick={() => setLivePopup(null)} 
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      <div className={`app-product__phone ${activeTab === 'home' ? '' : 'is-tab-active'}`}>
        <div className={`app-product__main-wrapper ${activeTab === 'home' ? '' : 'is-hidden'}`}>
          <header className="app-product__header-shell">
          <div className="app-product__topbar">
            <div className="app-product__topbar-inner">
              <button
                type="button"
                className="app-product__brand"
                aria-label="RoadGuard home"
                onClick={() => navigate('/')}
                style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
              >
                <img src="/RoadGuardLogo.png" alt="RoadGuard" className="app-product__logo-img" />
              </button>
              <div className="app-product__top-actions">
                <button
                  type="button"
                  className="app-product__icon-btn app-product__icon-btn--filled"
                  aria-label="Profile"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen((previous) => !previous)}
                >
                  <svg className="app-product__icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0v.5h-15V20Z" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="app-product__profile-menu">
                    <button type="button" className="app-product__profile-item" onClick={handleAuthAction}>
                      {isLoggedIn ? 'Logout' : 'Login'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="app-product__search-wrap">
            <div className="app-product__search-inner">
              <label htmlFor="location-search" className="sr-only">Search location</label>
              <input
                id="location-search"
                type="text"
                placeholder="Search location..."
                className="app-product__search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          </div>
          </header>

          <main className="app-product__content">
          <section className="app-product__map app-product__map--large" aria-label="Main map preview">
            <div ref={mainMapContainerRef} className="app-product__leaflet-map" />
          </section>

          <section className="app-product__lower-grid">
            <article className="card card--location">
              <div className="card__title-row">
                <h2 className="card__title">Current Location</h2>
                <p className="card__location-meta">{currentLocationUpdatedAt}</p>
              </div>
              <p className="card__location-text">{currentAddress}</p>
            </article>

            <div className="app-product__left-half">
              <div className="app-product__actions">
                <button
                  type="button"
                  className="action-btn action-btn--report"
                  onClick={() => {
                    if (isLoggedIn) {
                      setReportOpen(true)
                    } else {
                      setAuthModalOpen(true)
                    }
                  }}
                >
                  ❗ Report Incident
                </button>
                <button type="button" className="action-btn action-btn--sos" onClick={handleSosShare}>📞 SOS</button>
              </div>
              <div className="app-product__left-panel">
              <article className="card card--contacts card--contacts-inline">
                <h2 className="card__title">Emergency Contacts</h2>
                <ul ref={emergencyContactsListRef} className="card__list">
                  {sosContact?.phone_number && (
                    <li>
                      <span className="card__contact-main"><span>{sosContact.service || 'SOS Contact'}</span><strong>{sosContact.phone_number}</strong></span>
                      <a href={`tel:${sosContact.phone_number}`} className="card__call-btn" aria-label={`Call ${sosContact.service || 'SOS Contact'}`}>📞</a>
                    </li>
                  )}
                  <li><span className="card__contact-main"><span> Police</span><strong>15</strong></span><a href="tel:15" className="card__call-btn" aria-label="Call Police">📞</a></li>
                  <li><span className="card__contact-main"><span>Ambulance</span><strong>1122</strong></span><a href="tel:1122" className="card__call-btn" aria-label="Call Ambulance">📞</a></li>
                  <li><span className="card__contact-main"><span>Roadside Help</span><strong>130</strong></span><a href="tel:130" className="card__call-btn" aria-label="Call Roadside Help">📞</a></li>
                  <li><span className="card__contact-main"><span>Traffic Police</span><strong>1915</strong></span><a href="tel:1915" className="card__call-btn" aria-label="Call Traffic Police">📞</a></li>
                  <li><span className="card__contact-main"><span>Fire Brigade</span><strong>16</strong></span><a href="tel:16" className="card__call-btn" aria-label="Call Fire Brigade">📞</a></li>
                  <li><span className="card__contact-main"><span>Rescue Helpline</span><strong>1122</strong></span><a href="tel:1122" className="card__call-btn" aria-label="Call Rescue Helpline">📞</a></li>
                  <li><span className="card__contact-main"><span>Highway Patrol</span><strong>130</strong></span><a href="tel:130" className="card__call-btn" aria-label="Call Highway Patrol">📞</a></li>
                </ul>
              </article>
              </div>
            </div>

            <div className="app-product__right-half">
              <div className="app-product__right-panel">
              <section className="app-product__map app-product__map--small" aria-label="Secondary map preview">
                <div ref={miniMapContainerRef} className="app-product__leaflet-map" />
                <div className="tag tag--safe" style={{ top: '8%', left: '4%' }}>{currentCity}</div>
              </section>
              <article className="card card--alerts">
                <h2 className="card__title card__title--warning">⚠ Safety Alerts:</h2>
                <div style={{ overflow: 'hidden', maxHeight: '140px', position: 'relative', maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}>
                  <ul className="card__bullets" style={{ animation: 'scrollUp 20s linear infinite', margin: 0 }}>
                    {safetyAlerts.map((alertItem, idx) => (<li key={`orig-${idx}`} className="card__alert-item"><span className="card__alert-sign" aria-hidden="true">!</span><span>{alertItem}</span></li>))}
                    {safetyAlerts.map((alertItem, idx) => (<li key={`dup-${idx}`} className="card__alert-item"><span className="card__alert-sign" aria-hidden="true">!</span><span>{alertItem}</span></li>))}
                  </ul>
                  <style>{`@keyframes scrollUp{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}.card__bullets:hover{animation-play-state:paused!important}`}</style>
                </div>
              </article>
              </div>
            </div>
          </section>
          </main>
        </div>

        {reportOpen && (
          <div className={`app-product__report-overlay ${activeTab === 'report' ? 'is-fullscreen' : ''}`} role="dialog" aria-label="Report Incident form">
            <div className="app-product__report-backdrop" onClick={handleCloseReport} />
            <div className={`app-product__report-modal ${activeTab === 'report' ? 'is-fullscreen' : ''}`}>
              <div className="app-product__report-header">
                <h3>Report Incident</h3>
              </div>

              {reportSubmitted ? (
                <div className="app-product__report-success">
                  <p>Your incident report has been submitted successfully.</p>
                  <button type="button" className="app-product__report-submit app-product__report-submit--compact" onClick={handleCloseReport}>Done</button>
                </div>
              ) : (
                <form className="app-product__report-form" onSubmit={handleReportSubmit}>
                  <label className="app-product__report-label" htmlFor="incidentType">Incident Type</label>
                  <select
                    id="incidentType"
                    name="incidentType"
                    className="app-product__report-input"
                    value={reportForm.incidentType}
                    onChange={handleReportFieldChange}
                  >
                    <option>Accident</option>
                    <option>Pothole</option>
                    <option>Reckless Driver</option>
                    <option>Road Block</option>
                    <option>Other</option>
                  </select>

                  <label className="app-product__report-label" htmlFor="incidentLocation">Location</label>
                  <input
                    id="incidentLocation"
                    name="location"
                    className="app-product__report-input"
                    placeholder="Enter location"
                    value={reportForm.location}
                    onChange={handleReportFieldChange}
                    required
                  />

                  <label className="app-product__report-label" htmlFor="incidentDetails">Details</label>
                  <textarea
                    id="incidentDetails"
                    name="details"
                    rows={4}
                    className="app-product__report-input app-product__report-textarea"
                    placeholder="Describe what happened"
                    value={reportForm.details}
                    onChange={handleReportFieldChange}
                    required
                  />

                  {reportError && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.4rem 0.6rem' }}>
                      {reportError}
                    </p>
                  )}

                  <button type="submit" className="app-product__report-submit app-product__report-submit--compact" disabled={reportSubmitting}>
                    {reportSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="app-product__chat">
          {chatOpen && (
            <div className={`app-product__chat-panel ${activeTab === 'chat' ? 'is-fullscreen' : ''}`} role="dialog" aria-label="Chat assistant">
              <div className="app-product__chat-header">
                <strong>RoadGuard Assistant</strong>
              </div>

              <div className="app-product__chat-messages" ref={chatMessagesRef}>
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`app-product__chat-message app-product__chat-message--${message.role}`}
                  >
                    {String(message.text).split('\n').map((line, idx) => (
                      <span key={idx}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                ))}
                {chatTyping && (
                  <div className="app-product__chat-message app-product__chat-message--assistant app-product__chat-thinking">
                    <span className="app-product__thinking-dots" aria-hidden="true" style={{ display: 'inline-block', marginRight: '6px' }}>
                      <span /><span /><span />
                    </span>
                    <span style={{ fontSize: '0.85em', opacity: 0.6, fontStyle: 'italic', display: 'inline-block', transform: 'translateY(-1px)' }}>
                      {thinkingPhrase}
                    </span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {chatSuggestions.length > 0 && (
                <div className="app-product__chat-suggestions" aria-label="Suggested chat prompts">
                  {chatSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="app-product__suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={chatTyping}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div className="app-product__chat-composer">
                <textarea
                  rows={1}
                  className="app-product__chat-input"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                />
                <button type="button" className="app-product__chat-send" onClick={handleSendMessage} disabled={chatTyping}>
                  Send
                </button>
              </div>


            </div>
          )}

          <div className="app-product__chat-trigger">
            <span className="app-product__chat-caption">How can I help you in your journey !</span>
            <button
              type="button"
              className="app-product__chat-fab"
              aria-label="Open chatbot"
              aria-expanded={chatOpen}
              onClick={() => setChatOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', display: 'block' }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </button>
          </div>
        </div>
        {/* Bottom tabs for mobile */}
        <nav className="app-product__bottom-tabs" aria-label="Primary mobile navigation">
          <button
            type="button"
            className={`app-product__tab-btn ${activeTab === 'home' ? 'is-active' : ''}`}
            onClick={() => handleSelectTab('home')}
            aria-label="Home"
          >
            🏠
            <span className="app-product__tab-label">Home</span>
          </button>

          <button
            type="button"
            className={`app-product__tab-btn ${activeTab === 'chat' ? 'is-active' : ''}`}
            onClick={() => handleSelectTab('chat')}
            aria-label="Chat"
          >
            💬
            <span className="app-product__tab-label">Chat</span>
          </button>

          <button
            type="button"
            className={`app-product__tab-btn ${activeTab === 'report' ? 'is-active' : ''}`}
            onClick={() => handleSelectTab('report')}
            aria-label="Report"
          >
            ❗
            <span className="app-product__tab-label">Report</span>
          </button>

          <button
            type="button"
            className={`app-product__tab-btn ${activeTab === 'contacts' ? 'is-active' : ''}`}
            onClick={() => handleSelectTab('contacts')}
            aria-label="Contacts"
          >
            📞
            <span className="app-product__tab-label">Contacts</span>
          </button>
        </nav>

        {/* Contacts slide-up panel */}
        {contactsOpen && (
          <div className={`app-product__contacts-panel ${activeTab === 'contacts' ? 'is-fullscreen' : ''}`} role="dialog" aria-label="Emergency contacts">
            <div className="app-product__contacts-backdrop" onClick={() => setContactsOpen(false)} />
            <div className="app-product__contacts-inner">
              <div className="app-product__contacts-header">
                <strong>Emergency Contacts</strong>
              </div>
              <ul className="app-product__contacts-list">
                {sosContact && (
                  <li>
                    <span>{sosContact.service || 'SOS Contact'}</span>
                    <strong>{sosContact.phone_number}</strong>
                    <a href={`tel:${sosContact.phone_number}`}>📞</a>
                  </li>
                )}
                <li><span>Police</span><strong>15</strong><a href="tel:15">📞</a></li>
                <li><span>Ambulance</span><strong>1122</strong><a href="tel:1122">📞</a></li>
                <li><span>Roadside Help</span><strong>130</strong><a href="tel:130">📞</a></li>
                <li><span>Traffic Police</span><strong>1915</strong><a href="tel:1915">📞</a></li>
                <li><span>Fire Brigade</span><strong>16</strong><a href="tel:16">📞</a></li>
                <li><span>Rescue Helpline</span><strong>1122</strong><a href="tel:1122">📞</a></li>
                <li><span>Highway Patrol</span><strong>130</strong><a href="tel:130">📞</a></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
