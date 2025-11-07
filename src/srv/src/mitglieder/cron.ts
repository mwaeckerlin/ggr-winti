import { MitgliederService } from './mitglieder.service'
import cron from 'node-cron'

export function initMitgliederCron(service: MitgliederService) {
  // Run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    try {
      await service.fetchAndStoreMitglieder()
    } catch (e) {
      console.error('Mitglieder Cronjob Fehler:', e)
    }
  })
  // Run once at startup
  service.fetchAndStoreMitglieder().catch(e => {
    console.error('Mitglieder Initial-Load Fehler:', e)
    process.exit(1)
  })
} 