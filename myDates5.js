/* eslint-disable no-console */
const csvparse = require('csv-parse/lib/sync')
const fs = require('fs')
const path = require('path')
const Calendars = require('./dist/src/Calendars').Calendars
const astro = require('astronomia/lib/base')
// const coord = require('astronomia/lib/coord')
// const globe = require('astronomia/lib/globe')
const π = Math.PI
const D2R = π / 180 // to convert degrees to radians
// const deltat = require('astronomia/lib/deltat')
// const eqtime = require('astronomia/lib/eqtime')
// const sexa = require('astronomia/lib/sexagesimal')
const solstice = require('astronomia/lib/solstice')
/* Only necessary for using the high-precision functions solstice.march2, solstice.september2 and eqtime.e
    which take EARTH as second parameter */
// const planetposition = require('astronomia/lib/planetposition')
// const data = require('astronomia/data')
// const EARTH = new planetposition.Planet(data.earth) 
const solar = require('astronomia/lib/solar')
// const julian = require('astronomia/lib/julian')
// const Sunrise = require('astronomia/lib/sunrise').Sunrise
const moonposition = require('astronomia/lib/moonposition')
const moonphase = require('astronomia/lib/moonphase')
// const nutation = require('astronomia/lib/nutation')
// const sidereal = require('astronomia/lib/sidereal')


function fixture(name) {
    const input = fs.readFileSync(path.join(__dirname, '__test__', 'test_data', name), 'utf8')
    return csvparse(input, {
        columns: true
    })
}

const data5 = fixture('dates5.csv')

const OUTPUT_FILE = path.join(__dirname, '__test__', 'test_data', 'mydates5.csv')
let stream = fs.createWriteStream(OUTPUT_FILE, {flags:'a'})
stream.write(['RD', 'DATE', 'JD', 'SolarLongitudeNoonUT', 'solarPos', 'SummerSolsticeRD', 'summer', 
    'LunarLongitudeMidnight', 'lunarPos', 'NextNewMoonRD', 'nextNewMoon', 'DawnInParis', 'sunriseInParis', 
    'DawnInParisHMS', 'sunriseInParisHMS'].join(',') + '\n')
data5.forEach((record) => {
    const rd = parseInt(record['RD'])
    const gDate = Calendars.Gregorian.fromFixed(rd)
    const jde = Calendars.JD.fromFixed(rd)
    // const jde = Calendars.JD.fromFixed(Calendars.Time.dynamicalFromUniversal(rd))
    //SolarLongitudeNoonUT,SummerSolsticeRD,LunarLongitudeMidnight,NextNewMoonRD,DawnInParis,DawnInParisHMS,SunsetInJerusalem,SunsetInJerusalemHMS
    const solarPos = solar.trueLongitude(astro.J2000Century(jde+0.5)).lon/D2R
    const year = gDate[0]
    let summer = Calendars.JD.toFixed(solstice.june(year))
    // SummerSolsticeRD is the solstice AFTER rd, not during the same year
    if (summer < rd) {
        summer = Calendars.JD.toFixed(solstice.june(year+1))
    }
    const lunarPos = moonposition.position(jde).lon/D2R
    const besselianYear = astro.JDEToBesselianYear(jde)
    let nextNewMoon = moonphase.newMoon(besselianYear)
    // console.log(`[${rd}] nextNewMoon1 = ${nextNewMoon} (rd=${nextNewMoon - 1721424.5})`)
    if (!nextNewMoon || isNaN(nextNewMoon) || nextNewMoon < jde) {
        nextNewMoon = moonphase.newMoon(besselianYear+Calendars.Astronomy.MEAN_SYNODIC_MONTH/Calendars.Astronomy.MEAN_TROPICAL_YEAR)
        // console.log(`[${rd}] nextNewMoon2 = ${nextNewMoon} (rd=${nextNewMoon - 1721424.5})`)
    }
    const sunriseInParis = Calendars.Astronomy.sunrise(rd, Calendars.French.PARIS) // standard time
    const formatTime = (x) => {return (x<10 ? '0'+x : String(x))}
    const sunriseInParisHMS = Calendars.Gregorian.fromFixed(sunriseInParis).splice(3).map(formatTime).join(':')

    // const sunriseInParisAstr = Calendars.Time.standardFromUniversal(
    //     Calendars.JD.toFixed(
    //         new Sunrise(
    //             new julian.Calendar(gDate[0], gDate[1], gDate[2]), 
    //             Calendars.French.PARIS.latitude,
    //             -Calendars.French.PARIS.longitude).rise().toJD()
    //     ), 
    //     Calendars.French.PARIS
    // )
    // console.log(`[${rd}] Sunrise R&D ${sunriseInParis} (${Calendars.fromFixed(sunriseInParis).toISOString()}) vs sunrise astronomia ${sunriseInParisAstr} (${Calendars.fromFixed(sunriseInParisAstr).toISOString()})`)
    stream.write([rd, gDate.splice(0,3).join('/'), jde,
        record['SolarLongitudeNoonUT'], solarPos, 
        record['SummerSolsticeRD'], summer, 
        record['LunarLongitudeMidnight'], lunarPos, 
        record['NextNewMoonRD'], Calendars.JD.toFixed(nextNewMoon),
        record['DawnInParis'], sunriseInParis - rd,
        record['DawnInParisHMS'], sunriseInParisHMS
    ].join(',') + '\n')
})
stream.end()