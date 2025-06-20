import {useState, useRef, useEffect} from 'react'
import {generateFilename, GeneratePdfDto, Vorstosstyp, formatDate} from '@ggr-winti/lib'

function App() {
  // Link-Mode erkennen
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isLinkMode = searchParams?.has('file')

  // Eigener Name aus localStorage holen
  const getDefaultName = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vorstoss-frontend-eigener-name') || ''
    }
    return ''
  }

  const [formData, setFormData] = useState<GeneratePdfDto>({
    betreffend: '',
    eingereichtvon: getDefaultName(),
    datum: formatDate(new Date()),
    nummer: '',
    vorstosstyp: undefined,
    antrag: '',
    begruendung: '',
    dringlich: false,
    budget: false,
    unterstuetzer: 0,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value, type} = e.target
    if (name === 'eingereichtvon') {
      // Speichere den Teil vor dem ersten Komma als eigenen Namen
      const ownName = value.split(',')[0].trim()
      if (ownName) {
        localStorage.setItem('vorstoss-frontend-eigener-name', ownName)
      }
    }
    if (type === 'checkbox') {
      const {checked} = e.target as HTMLInputElement
      setFormData((prev: GeneratePdfDto) => ({...prev, [name]: checked}))
    } else if (type === 'number') {
      setFormData((prev: GeneratePdfDto) => ({...prev, [name]: Number(value)}))
    } else {
      setFormData((prev: GeneratePdfDto) => ({...prev, [name]: value}))
    }
  }

  const handleDownloadJson = () => {
    const fileName = `${generateFilename(formData)}.json`
    const jsonString = JSON.stringify(formData, null, 2)
    const blob = new Blob([jsonString], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        setFormData((prev: GeneratePdfDto) => ({...prev, ...json}))
      } catch (err) {
        alert('Ungültige JSON-Datei!')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be uploaded again
    e.target.value = ''
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  // Wenn localStorage sich ändert (z.B. durch Upload), setze den eigenen Namen als Default, falls das Feld leer ist
  useEffect(() => {
    // file-parameter auswerten
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const fileParam = params.get('file')
      if (fileParam) {
        try {
          const json = JSON.parse(decodeURIComponent(escape(atob(fileParam))))
          setFormData((prev: GeneratePdfDto) => ({...prev, ...json}))
        } catch (err) {
          alert('Ungültiger Link: Datei-Parameter konnte nicht gelesen werden!')
        }
      } else if (!formData.eingereichtvon) {
        // wie bisher: eigenen Namen aus localStorage setzen
        const ownName = getDefaultName()
        if (ownName) {
          setFormData((prev: GeneratePdfDto) => ({...prev, eingereichtvon: ownName}))
        }
      }
    }
    // eslint-disable-next-line
  }, [])

  const handleCopyLink = async () => {
    try {
      // JSON serialisieren und base64-encodieren
      const jsonString = JSON.stringify(formData)
      const base64 = btoa(unescape(encodeURIComponent(jsonString)))
      const url = `${window.location.origin}${window.location.pathname}?file=${base64}`
      await navigator.clipboard.writeText(url)
    } catch (err) {
      alert('Kopieren fehlgeschlagen!')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Fehler beim PDF-Download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generateFilename(formData)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('PDF-Download fehlgeschlagen!')
    }
  }

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          {/* Placeholder for left logo */}
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="12" fill="#E2001A" />
            <path d="M30 70V30L50 50L70 30V70L50 50L30 70Z" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M35 50H65" stroke="white" strokeWidth="10" strokeLinecap="round" />
          </svg>
        </div>
        <div className="header-title">
          <h1>Vorstoss-Frontend</h1>
          <p>by Marc</p>
        </div>
        <div className="logo">
          {/* Placeholder for right logo */}
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#E2001A" />
            <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif" transform="rotate(10, 50, 50)">
              REEL
            </text>
            <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif" transform="rotate(-170, 50, 50)">
              AMSY
            </text>
          </svg>
        </div>
      </header>
      <main>
        <form onSubmit={(e) => e.preventDefault()}>
          <h2 className="form-title">Parlamentarischer Vorstoss</h2>

          <div className="form-row form-row-aligned">
            <div className="form-group">
              <label htmlFor="vorstosstyp">Typ</label>
              <select id="vorstosstyp" name="vorstosstyp" value={formData.vorstosstyp as string} onChange={handleChange} required disabled={isLinkMode}>
                <option value="">Bitte wählen...</option>
                {(Object.values(Vorstosstyp) as string[]).map((typ: string) => (
                  <option key={typ} value={typ}>
                    {typ.charAt(0).toUpperCase() + typ.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="checkbox-stack">
              <div className="form-group-checkbox">
                <input type="checkbox" id="dringlich" name="dringlich" checked={formData.dringlich} onChange={handleChange} disabled={isLinkMode} />
                <label htmlFor="dringlich">Dringlich</label>
              </div>
              <div className="form-group-checkbox">
                <input type="checkbox" id="budget" name="budget" checked={formData.budget} onChange={handleChange} disabled={isLinkMode} />
                <label htmlFor="budget">Budget</label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="betreffend">Betreff</label>
            <input type="text" id="betreffend" name="betreffend" value={formData.betreffend} onChange={handleChange} required disabled={isLinkMode} />
          </div>

          <div className="form-group">
            <label htmlFor="eingereichtvon">Eingereicht von</label>
            <input type="text" id="eingereichtvon" name="eingereichtvon" value={formData.eingereichtvon} onChange={handleChange} required disabled={isLinkMode} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="datum">Datum</label>
              <input type="date" id="datum" name="datum" value={formData.datum} onChange={handleChange} disabled={false} />
            </div>
            <div className="form-group">
              <label htmlFor="nummer">Geschäfts-Nr.</label>
              <input type="text" id="nummer" name="nummer" value={formData.nummer} onChange={handleChange} disabled={!isLinkMode} />
            </div>
            <div className="form-group">
              <label htmlFor="unterstuetzer">Anz. Unterstützer</label>
              <input type="number" id="unterstuetzer" name="unterstuetzer" value={formData.unterstuetzer} onChange={handleChange} min="0" disabled={!isLinkMode} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="antrag">Antrag</label>
            <textarea id="antrag" name="antrag" value={formData.antrag} onChange={handleChange} rows={4} disabled={isLinkMode}></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="begruendung">Begründung</label>
            <textarea id="begruendung" name="begruendung" value={formData.begruendung} onChange={handleChange} rows={8} disabled={isLinkMode}></textarea>
          </div>
        </form>
        <input type="file" accept="application/json" style={{display: 'none'}} ref={fileInputRef} onChange={handleUploadJson} />
      </main>
      <footer>
        <button className="action-button" onClick={triggerUpload}>
          JSON hochladen
        </button>
        <button className="action-button" onClick={handleDownloadJson}>
          JSON herunterladen
        </button>
        <button className="action-button" onClick={handleDownloadPdf}>
          PDF herunterladen
        </button>
        <button className="action-button" onClick={handleCopyLink}>
          Link kopieren
        </button>
        <div className="filename-preview">
          Vorschau Dateiname (JSON): <strong>{generateFilename(formData, true)}.json</strong>
          <br />
          Vorschau Dateiname (PDF): <strong>{generateFilename(formData, true)}.pdf</strong>
        </div>
      </footer>
    </div>
  )
}

export default App
