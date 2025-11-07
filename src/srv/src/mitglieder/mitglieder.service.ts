import { Injectable, Logger } from '@nestjs/common'
import { Member } from '@ggr-winti/lib'
import axios from 'axios'
import * as cheerio from 'cheerio'

@Injectable()
export class MitgliederService {
  private mitglieder: Record<string, Member[]> = {}
  private readonly logger = new Logger(MitgliederService.name)

  async fetchAndStoreMitglieder(): Promise<void> {
    const url = 'https://parlament.winterthur.ch/stadtparlament/27428'
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)
    const parteiMap: Record<string, Member[]> = {}
    const table = $('#icmsTable-personList')
    const dataEntities = table.attr('data-entities')
    if (!dataEntities) throw new Error('data-entities not found')
    const entities = JSON.parse(dataEntities)
    if (!entities.data) throw new Error('data-entities.data not found')
    for (const eintrag of entities.data) {
      if (eintrag['_funktionAktiv'] !== 'Mitglied') continue
      const ende = eintrag['_mandatPersonDatumBis']
      if (ende) {
        const endeDate = new Date(ende)
        const now = new Date()
        if (isNaN(endeDate.getTime()) || endeDate < now) continue
      }
      // Name extrahieren
      const nameHtml = eintrag['_nameVorname'] || ''
      const nameText = cheerio.load(nameHtml).text().trim()
      const [vorname, ...rest] = nameText.split(' ')
      const name = rest.join(' ')
      // Partei extrahieren
      const parteiHtml = eintrag['_partei'] || ''
      const parteiText = cheerio.load(parteiHtml).text().trim()
      const parteiMatch = parteiText.match(/\(([^)]+)\)/)
      const partei = parteiMatch ? parteiMatch[1] : parteiText
      
      if (!parteiMap[partei]) parteiMap[partei] = []
      parteiMap[partei].push({ vorname, name, partei })
    }
    // Sortiere Mitglieder pro Partei alphabetisch nach Name
    for (const partei in parteiMap) {
      parteiMap[partei].sort((a, b) => {
        return a.name.localeCompare(b.name, 'de')
      })
    }
    // Parteien nach Mitgliederanzahl sortieren (absteigend)
    const sortedParteiEntries = Object.entries(parteiMap).sort((a, b) => b[1].length - a[1].length)
    // Sorted Map (ES2020: Map preserves order)
    this.mitglieder = Object.fromEntries(sortedParteiEntries)
    this.logger.log(`${Object.values(this.mitglieder).reduce((a, b) => a + b.length, 0)} Parlamentarier eingelesen`)
  }

  getMitglieder() {
    return this.mitglieder
  }
} 