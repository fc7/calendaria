const csvparse = require('csv-parse/lib/sync')
const fs = require('fs')
const path = require('path')
const cal = require('./lib/calendars.js')
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
    const input = fs.readFileSync(path.join(__dirname, '__test__', 'test_data', name), "utf8");
    return csvparse(input, {
        columns: true
    })
}

const data5 = fixture('dates5.csv')

const OUTPUT_FILE = path.join(__dirname, '__test__', 'test_data', 'mydates5.csv')
let stream = fs.createWriteStream(OUTPUT_FILE, {flags:'a'});
stream.write(["RD", "SolarLongitudeNoonUT", "solarPos", "SummerSolsticeRD", "summer", 
    "LunarLongitudeMidnight", "lunarPos", "NextNewMoonRD", "nextNewMoon", "DawnInParis", "sunriseInParis", 
    "DawnInParisHMS", "sunriseInParisHMS"].join(",") + "\n")
data5.forEach((record) => {
    const rd = parseInt(record["RD"])
    const jde = cal.julianDayFromFixed(rd)
    //SolarLongitudeNoonUT,SummerSolsticeRD,LunarLongitudeMidnight,NextNewMoonRD,DawnInParis,DawnInParisHMS,SunsetInJerusalem,SunsetInJerusalemHMS
    const solarPos = solar.trueLongitude(astro.J2000Century(jde+0.5)).lon/D2R
    const year = cal.gregorianYearFromFixed(rd)
    const summer = cal.fixedFromJulianDay(solstice.june(year))
    // don't know why ... but SummerSolsticeRD seems always to be the solstice AFTER rd, not during the same year!
    if (record["SummerSolsticeRD"]>summer) {
        summer = cal.fixedFromJulianDay(solstice.june(year+1))
    }
    const lunarPos = moonposition.position(jde).lon/D2R
    const besselianYear = astro.JDEToBesselianYear(jde)
    let nextNewMoon = moonphase.newMoon(besselianYear)
    if (!nextNewMoon || isNaN(nextNewMoon) || nextNewMoon < jde) {
        nextNewMoon = moonphase.newMoon(besselianYear+cal.MEAN_SYNODIC_MONTH/cal.MEAN_TROPICAL_YEAR)
    }
    const sunriseInParis = cal.sunrise(rd, cal.PARIS) - rd
    const sunriseInParisHMS = cal.gregorianFromFixed(sunriseInParis).splice(3).join(":")
    // record["SunsetInJerusalem"],record["SunsetInJerusalemHMS"]
    stream.write([rd, 
        record["SolarLongitudeNoonUT"], solarPos, 
        record["SummerSolsticeRD"], summer, 
        record["LunarLongitudeMidnight"], lunarPos, 
        record["NextNewMoonRD"], cal.fixedFromJulianDay(nextNewMoon), 
        record["DawnInParis"], sunriseInParis-rd, 
        record["DawnInParisHMS"], sunriseInParisHMS
    ].join(",") + "\n")
})
stream.end()