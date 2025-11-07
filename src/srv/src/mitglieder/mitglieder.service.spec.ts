import { MitgliederService } from './mitglieder.service'

const MITGLIEDER = Number(process.env.MITGLIEDER) || 60

describe('MitgliederService (Integration)', () => {
  it('lädt echte Mitglieder von der externen Webseite', async () => {
    const realService = new MitgliederService()
    await realService.fetchAndStoreMitglieder()
    const mitgliederObj = realService.getMitglieder()
    const count = Object.values(mitgliederObj).reduce((sum, arr) => sum + arr.length, 0)
    expect(count).toEqual(MITGLIEDER)
  }, 20000)
}) 