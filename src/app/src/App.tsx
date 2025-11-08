import {useState, useRef, useEffect, useMemo} from 'react'
import {generateFilename, GeneratePdfDto, Vorstosstyp, formatDate, getVorstossName, memberToLabel} from '@ggr-winti/lib'
import type {Member, ParlamentarierStatus} from '@ggr-winti/lib'
import {Toaster, toast} from 'react-hot-toast'
import Button from './components/Button'
import Tab from './components/Tab'
import FormGroup from './components/FormGroup'

function App() {
  const [mitglieder, setMitglieder] = useState<Member[]>([])
  const [ersteinreicher, setErsteinreicher] = useState<Member | null>(null)
  const [miteinreicher, setMiteinreicher] = useState<Member[]>([])
  const [parlamentarier, setParlamentarier] = useState<ParlamentarierStatus[]>([])
  const [linkMode, setLinkMode] = useState(false)

  // Link-Mode erkennen
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isLinkMode = searchParams?.has('file') || linkMode

  // Eigener Ersteinreicher aus localStorage holen
  const getDefaultMember = (): Member | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vorstoss-frontend-eigener-name')
      if (stored) {
        try {
          return JSON.parse(stored) as Member
        } catch {
          return null
        }
      }
    }
    return null
  }

  const [formData, setFormData] = useState<GeneratePdfDto>({
    betreffend: '',
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

  const [tabIndex, setTabIndex] = useState(0) // 0: Getrennt, 1: Zusammen

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value, type} = e.target
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

            setErsteinreicher(json.eingereichtvon)
            setMiteinreicher(Array.isArray(json.miteinreicher) ? json.miteinreicher : [])
            setParlamentarier(Array.isArray(json.parlamentarier) ? json.parlamentarier : [])
            if (json.nummer || (json.parlamentarier && json.parlamentarier.length > 0)) {
              setLinkMode(true)
            }

            // Ergänze fehlende Mitglieder in der Liste
            const neue = [json.eingereichtvon, ...(json.miteinreicher || [])]
              .filter((m) => m && (m.vorname || m.name)) // Filter leere Objekte
            if (neue.length) {
              setMitglieder((prev) => {
                const exists = new Set(prev.map((m) => `${m.vorname}||${m.name}||${m.partei}`))
                const toAdd = (neue as Member[])
                  .filter((m) => !exists.has(`${m.vorname}||${m.name}||${m.partei}`))
                  .map((m) => ({ vorname: m.vorname || '', name: m.name || '', partei: m.partei || '' }))
                return [...toAdd, ...prev]
              })
            }
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
          setErsteinreicher(json.eingereichtvon)
          setMiteinreicher(Array.isArray(json.miteinreicher) ? json.miteinreicher : [])
          setParlamentarier(Array.isArray(json.parlamentarier) ? json.parlamentarier : [])
          if (typeof json.tabIndex === 'number') setTabIndex(json.tabIndex)
        } catch (err) {
          toast.error('Die Daten aus dem Link konnten nicht geladen werden.')
        }
      } else if (!formData.eingereichtvon) {
        // wie bisher: eigenen Ersteinreicher aus localStorage setzen
        const defaultMember = getDefaultMember()
        if (defaultMember) {
          setErsteinreicher(defaultMember)
        }
      }
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    fetch('/api/v1/mitglieder')
      .then((res) => res.json())
      .then((data) => {
        // data: { [partei]: [{ vorname, name }] }
        const flat: Member[] = []
        Object.entries(data).forEach(([partei, arr]: [string, any]) => {
          arr.forEach((m: any) => {
            // Nur vorname, name, partei behalten
            flat.push({
              vorname: m.vorname || '',
              name: m.name || '',
              partei: partei || ''
            })
          })
        })
        setMitglieder(flat)
        if (isLinkMode && parlamentarier.length === 0) {
          setParlamentarier(flat.map((m) => ({member: m, eingesehen: false, unterstuetzung: false})))
        }
      })
  }, [])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      eingereichtvon: ersteinreicher || undefined,
      miteinreicher: miteinreicher.length > 0 ? miteinreicher : undefined,
      unterstuetzer: miteinreicher.length + (ersteinreicher ? 1 : 0),
      parlamentarier: parlamentarier.length > 0 ? parlamentarier : undefined,
    }))
  }, [ersteinreicher, miteinreicher, parlamentarier])

  const handleCopyLink = async () => {
    try {
      // Frisches Objekt mit allen Feldern bauen
      const fullData = {
        ...formData,
        eingereichtvon: ersteinreicher || undefined,
        miteinreicher: miteinreicher.length > 0 ? miteinreicher : undefined,
        unterstuetzer: miteinreicher.length + (ersteinreicher ? 1 : 0),
        parlamentarier: parlamentarier.length > 0 ? parlamentarier : undefined,
      }
      const jsonString = JSON.stringify(fullData)
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
      const apiUrl = import.meta.env.VITE_SERVER ?? '/api/v1'

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
            <FormGroup>
              <label htmlFor="vorstosstyp">Typ</label>
              <select id="vorstosstyp" name="vorstosstyp" value={formData.vorstosstyp as string} onChange={handleChange} required disabled={isLinkMode}>
                {(Object.values(Vorstosstyp) as Vorstosstyp[]).map((typ) => (
                  <option key={typ} value={typ}>
                    {getVorstossName(typ).typ}
                  </option>
                ))}
              </select>
            </FormGroup>
            <div className="checkbox-stack">
              <FormGroup>
                <input type="checkbox" id="dringlich" name="dringlich" checked={formData.dringlich} onChange={handleChange} disabled={isLinkMode} />
                <label htmlFor="dringlich">Dringlich</label>
              </FormGroup>
              <FormGroup>
                <input type="checkbox" id="budget" name="budget" checked={formData.budget} onChange={handleChange} disabled={isLinkMode} />
                <label htmlFor="budget">Budget</label>
              </FormGroup>
            </div>
          </div>

          <FormGroup>
            <label htmlFor="betreffend">Betreff</label>
            <input type="text" id="betreffend" name="betreffend" value={formData.betreffend} onChange={handleChange} required disabled={isLinkMode} />
          </FormGroup>

          <div className="form-row">
            <FormGroup>
              <label htmlFor="ersteinreicher">Ersteinreicher</label>
              <select
                  id="ersteinreicher"
                  name="ersteinreicher"
                  value={ersteinreicher ? JSON.stringify(ersteinreicher) : ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (!val) {
                      setErsteinreicher(null)
                      localStorage.removeItem('vorstoss-frontend-eigener-name')
                      return
                    }
                    const obj = JSON.parse(val) as Member
                    setErsteinreicher(obj)
                    // Speichere Member-Objekt in localStorage
                    localStorage.setItem('vorstoss-frontend-eigener-name', JSON.stringify(obj))
                    setMiteinreicher((prev) => prev.filter((m) => JSON.stringify(m) !== val))
                  }}
                  required
                  disabled={isLinkMode}
                >
                  <option value="">Bitte wählen</option>
                  {mitglieder.map((m) => {
                    const label = memberToLabel(m)
                    return (
                      <option key={label} value={JSON.stringify(m)}>
                        {label}
                      </option>
                    )
                  })}
                </select>
            </FormGroup>
          </div>

          <div className="form-row">
            {!isLinkMode && (
              <FormGroup>
                <label>Miteinreicher (klicken zum auswählen/abwählen)</label>
                <div className="selectable-list">
                  {mitglieder
                    .filter((m) => (ersteinreicher ? JSON.stringify(m) !== JSON.stringify(ersteinreicher) : true))
                    .map((m) => {
                      const label = memberToLabel(m)
                      const isSelected = miteinreicher.some((sel) => JSON.stringify(sel) === JSON.stringify(m))
                      return (
                        <div
                          key={label}
                          className={`selectable-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setMiteinreicher((prev) => prev.filter((sel) => JSON.stringify(sel) !== JSON.stringify(m)))
                            } else {
                              setMiteinreicher((prev) => [...prev, m])
                            }
                          }}
                        >
                          {isSelected ? '✓ ' : ''}{label}
                        </div>
                      )
                    })}
                </div>
              </FormGroup>
            )}
            <FormGroup>
              <label>{isLinkMode ? 'Miteinreicher' : 'Reihenfolge der Miteinreicher'}</label>
              {miteinreicher.length > 0 ? (
                <div className="order-list">
                  {miteinreicher.map((m, idx) => (
                    <div
                      key={idx}
                      className="order-row"
                    >
                      <div className="order-row__index">
                        {idx + 1}.
                      </div>
                      <div className="order-row__name">
                        {memberToLabel(m)}
                      </div>
                      {!isLinkMode && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (idx > 0) {
                                const newList = [...miteinreicher]
                                ;[newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]]
                                setMiteinreicher(newList)
                              }
                            }}
                            disabled={idx === 0}
                            className="order-row__btn"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (idx < miteinreicher.length - 1) {
                                const newList = [...miteinreicher]
                                ;[newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]]
                                setMiteinreicher(newList)
                              }
                            }}
                            disabled={idx === miteinreicher.length - 1}
                            className="order-row__btn"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMiteinreicher((prev) => prev.filter((_, i) => i !== idx))
                            }}
                            className="order-row__btn order-row__btn--danger"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Keine Miteinreicher ausgewählt</p>
              )}
            </FormGroup>
          </div>

          <div className="form-row">
            <FormGroup>
              <label htmlFor="datum">Datum</label>
              <input type="date" id="datum" name="datum" value={formData.datum} onChange={handleChange} disabled={false} />
            </FormGroup>
            <FormGroup>
              <label htmlFor="nummer">Geschäfts-Nr.</label>
              <input type="text" id="nummer" name="nummer" value={formData.nummer} onChange={handleChange} disabled={!isLinkMode} />
            </FormGroup>
          </div>

          {/* ===================== Felder je nach Tab ===================== */}
          <FormGroup>
            {!isLinkMode && (
              <Tab
                tabs={["Antrag & Begründung getrennt", "Beides zusammen (Freitext)"]}
                selectedTab={tabIndex}
                onTabChange={setTabIndex}
              />
            )}
            {tabIndex === 0 ? (
              <>
                <FormGroup>
                  <label htmlFor="antrag">{formData.vorstosstyp === Vorstosstyp.ANFRAGE ? 'Einleitung' : 'Antrag'}</label>
                  <textarea id="antrag" name="antrag" value={formData.antrag} onChange={handleChange} rows={8} disabled={isLinkMode}></textarea>
                </FormGroup>
                <FormGroup>
                  <label htmlFor="begruendung">{formData.vorstosstyp === Vorstosstyp.ANFRAGE ? 'Fragen' : 'Begründung'}</label>
                  <textarea id="begruendung" name="begruendung" value={formData.begruendung} onChange={handleChange} rows={16} disabled={isLinkMode}></textarea>
                </FormGroup>
              </>
            ) : (
              <FormGroup>
                <label htmlFor="text">{formData.vorstosstyp === Vorstosstyp.ANFRAGE ? 'Einleitung und Fragen (Freitext)' : 'Antrag und Begründung (Freitext)'}</label>
                <textarea id="text" name="text" value={formData.text || ''} onChange={handleChange} rows={27} disabled={isLinkMode}></textarea>
              </FormGroup>
            )}
          </FormGroup>
        </form>

        {isLinkMode && parlamentarier.length > 0 && (
          <div className="parlamentarier-liste">
            <h2 className="form-title">Parlamentarier</h2>
            <div className="parlamentarier-grid">
              {parlamentarier.map((p, idx) => (
                <div key={idx} className="parlamentarier-row">
                  <div className="parlamentarier-cell">
                    <input
                      type="checkbox"
                      checked={p.eingesehen}
                      onChange={(e) => {
                        const updated = [...parlamentarier]
                        updated[idx].eingesehen = e.target.checked
                        setParlamentarier(updated)
                      }}
                    />
                  </div>
                  <div className="parlamentarier-cell">
                    {memberToLabel(p.member)}
                  </div>
                  <div className="parlamentarier-cell">
                    <input
                      type="checkbox"
                      checked={p.unterstuetzung}
                      onChange={(e) => {
                        const updated = [...parlamentarier]
                        updated[idx].unterstuetzung = e.target.checked
                        setParlamentarier(updated)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

  <input type="file" accept="application/json" className="hidden" ref={fileInputRef} />
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
