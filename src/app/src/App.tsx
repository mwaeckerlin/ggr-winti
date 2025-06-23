import {useState, useRef, useEffect, useMemo} from 'react'
import {generateFilename, GeneratePdfDto, Vorstosstyp, formatDate, getVorstossName} from '@ggr-winti/lib'
import {Toaster, toast} from 'react-hot-toast'
import Button from './components/Button'

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
    vorstosstyp: Vorstosstyp.INTERPELLATION,
    antrag: '',
    begruendung: '',
    dringlich: false,
    budget: false,
    unterstuetzer: 0,
  })

  const generatedFileName = useMemo(() => generateFilename(formData), [formData])

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
    const fileName = `${generatedFileName}.json`
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

  const handleUploadClick = () => {
    return new Promise<void>((resolve, reject) => {
      const fileInput = fileInputRef.current
      if (!fileInput) {
        return reject(new Error('File input not found.'))
      }

      const handleFileChange = (event: Event) => {
        const target = event.target as HTMLInputElement
        const file = target.files?.[0]
        // Clean up the event listener
        fileInput.removeEventListener('change', handleFileChange)
        if (!file) {
          return resolve() // User cancelled the dialog
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string)
            setFormData((prev: GeneratePdfDto) => ({...prev, ...json}))
            resolve()
          } catch (err) {
            toast.error('Ungültige Datei.')
            reject(err)
          } finally {
            target.value = '' // Reset input
          }
        }
        reader.onerror = (err) => {
          toast.error('Die Datei konnte nicht gelesen werden.')
          reject(err)
        }
        reader.readAsText(file)
      }

      fileInput.addEventListener('change', handleFileChange, {once: true})
      fileInput.click()
    })
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
          toast.error('Die Daten aus dem Link konnten nicht geladen werden.')
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
      toast.success('Link wurde in die Zwischenablage kopiert.')
    } catch (err) {
      toast.error('Der Link konnte nicht in die Zwischenablage kopiert werden.')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      // Use VITE_SERVER for local dev, otherwise use a relative path for production
      const apiUrl = import.meta.env.VITE_SERVER ?? '/app/v1'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        let message = 'Die PDF-Erstellung ist fehlgeschlagen.'
        try {
          const errorData = await response.json()
          const serverMessage = errorData.message
          if (serverMessage) {
            message = Array.isArray(serverMessage) ? serverMessage.join(' ') : serverMessage
          }
        } catch (e) {
          // ignore if response is not json
        }
        throw new Error(message)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedFileName}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err.message || 'Ein unbekannter Fehler ist aufgetreten.')
    }
  }

  return (
    <div className="app-container">
      <Toaster position="top-center" />
      <header>
        <div className="logo">
          <img src="/logo-mrw.png" alt="MRW" />
        </div>
        <div className="header-title">
          <h1>Vorstoss-Frontend</h1>
          <p>by Marc</p>
        </div>
        <div className="logo">
          <img src="/logo-parl.png" alt="Parlament Winterthur" />
        </div>
      </header>
      <main>
        <form onSubmit={(e) => e.preventDefault()}>
          <h2 className="form-title">Parlamentarischer Vorstoss</h2>

          <div className="form-row form-row-aligned">
            <div className="form-group">
              <label htmlFor="vorstosstyp">Typ</label>
              <select id="vorstosstyp" name="vorstosstyp" value={formData.vorstosstyp as string} onChange={handleChange} required disabled={isLinkMode}>
                {(Object.values(Vorstosstyp) as Vorstosstyp[]).map((typ) => (
                  <option key={typ} value={typ}>
                    {getVorstossName(typ).typ}
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
        <input type="file" accept="application/json" style={{display: 'none'}} ref={fileInputRef} />
      </main>
      <footer>
        <Button onClick={handleUploadClick}>JSON hochladen</Button>
        <Button onClick={handleDownloadJson}>JSON herunterladen</Button>
        <Button onClick={handleDownloadPdf}>PDF herunterladen</Button>
        <Button onClick={handleCopyLink}>Link kopieren</Button>
      </footer>
    </div>
  )
}

export default App
