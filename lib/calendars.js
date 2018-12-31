/**
 * Straightforward adaptation to JavaScript of the calendar computations featured in 
 * Reingold & Dershowitz, Calendrical Calculations, The Millenium Edition, Cambridge University Press, 2001.
 * 
 * The arithmetic formulae are reproduced almost verbatim from Reingold & Dershowitz. 
 * For the purely astronomical calculations however, I rely mostly on the 
 * npm package astronomia (https://github.com/commenthol/astronomia), 
 * itself derived from the go package meeus (https://github.com/soniakeys/meeus).
 *
 * @author François Charette, 2018
 * @license MIT
 */

const astro = require('astronomia/lib/base')
const coord = require('astronomia/lib/coord')
const globe = require('astronomia/lib/globe')
const π = Math.PI
const D2R = π / 180 // to convert degrees to radians
const deltat = require('astronomia/lib/deltat')
const eqtime = require('astronomia/lib/eqtime')
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
const nutation = require('astronomia/lib/nutation')
const sidereal = require('astronomia/lib/sidereal')

/**
 * Adapted Modulo function to account for negative a or b
 * @param {*} a 
 * @param {*} b 
 * @returns a modulo b
 */
function _mod(a, b) {
    return a - b * Math.floor(a / b)
}

function _amod(a, b) {
    return b + _mod(a, -b)
}

/**
 * Epoch of the Julian Day Number calendar (which counts days)
 */
const JULIAN_DAY_EPOCH = -1721424.5

/**
 * Adjustment factor for the Modified Julian Date
 */
// const MODIFIED_JULIAN_ADJUSTMENT = -2400000.5

/**
 * Returns the date of the weekday k occurring on or before the given date
 * @param {*} date 
 * @param {*} k weekday number (starting with 0 = Sunday)
 */
function kDayOnOrBefore(date, k) {
    return date - _mod((date - k), 7)
}
/**
 * Returns the date of the weekday k occurring after the given date
 * @param {*} date 
 * @param {*} k weekday number (starting with 0 = Sunday)
 */
function kDayAfter(date, k) {
    return kDayOnOrBefore(date + 7, k)
}

//---------------- JAVASCRIPT DATES -------------------//

const UNIX_DATE_EPOCH = 719163; // = fixedFromGregorian(1970,1,1)

const MILLISECONDS_PER_DAY = (1000 * 60 * 60 * 24)

/**
 * Converts a native JavaScript date to an RD date
 * @param {*} jsDate 
 */
function fixedFromJSDate(jsDate) {
    return UNIX_DATE_EPOCH + jsDate.getTime() / MILLISECONDS_PER_DAY
}

/**
 * Converts an RD to a JavaScript Date
 * @param {*} date 
 */
function jsDateFromFixed(date) {
    var ms = (date - UNIX_DATE_EPOCH) * MILLISECONDS_PER_DAY
    return new Date(ms)
}

/**
 * Helper function to represent a year, month and day (potentially with fractional part)
 * as an array [year,month,day,hour,min,sec]
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function dateAsArray(year, month, day) {
    //console.log("formatting y-m-d as array: "+ year +"-"+ month +"-"+ day)
    var rday = Math.floor(day)
    if (rday == day) {
        return [year, month, day, 0, 0, 0]
    }
    var excess = day - rday
    var elapsedHours = excess * 24
    var elapsedMinutes = excess * 24 * 60
    var elapsedSeconds = excess * 24 * 60 * 60
    var hour = Math.floor(elapsedHours)
    var min = Math.floor(elapsedMinutes - hour * 60)
    var sec = elapsedSeconds - min * 60 - hour * 60 * 60
    // fix rounding errors
    if (Math.floor(sec * 10E6) + 1 == 600000000) {
        sec = 0
        min += 1
        if (min == 60) {
            min = 0
            hour += 1
            if (hour == 24) {
                hour = 0
                rday += 1
            }
        }
    }
    return [year, month, rday, hour, min, sec]
}

//---------------- JULIAN DAY NUMBER -------------------//

/**
 * Returns the Julian Day Number for the given RD
 * @param {*} date 
 */
function julianDayFromFixed(date) {
    return date - JULIAN_DAY_EPOCH
}
/**
 * Returns the RD for the given Julian Day
 * @param {*} jd 
 */
function fixedFromJulianDay(jd) {
    return jd + JULIAN_DAY_EPOCH
}

// function mjdFromJD(jd) {
//     return jd + MODIFIED_JULIAN_ADJUSTMENT
// }

// function mjdFromFixed(date) {
//     return mjdFromJD(julianDayFromFixed(date))
// }

//---------------- EGYPTIAN AND ARMENIAN CALENDARS -------------------//

const EGYPTIAN_EPOCH = -272787; // = Math.floor(fixedFromJD(1448638))

/**
 * Returns the RD for the given Egyptian date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromEgyptian(year, month, day) {
    return EGYPTIAN_EPOCH + 365 * (year - 1) + 30 * (month - 1) + day - 1
}

/**
 * Returns the Egyptian date for the given RD
 * @param {*} date 
 */
function egyptianFromFixed(date) {
    var days = date - EGYPTIAN_EPOCH
    var year = Math.floor(days / 365) + 1
    var month = Math.floor((_mod(days, 365)) / 30) + 1
    var day = days - 365 * (year - 1) - 30 * (month - 1) + 1
    return dateAsArray(year, month, day)
}

const ARMENIAN_EPOCH = 201443

/**
 * Returns the RD for the given Armenian date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromArmenian(year, month, day) {
    return ARMENIAN_EPOCH + fixedFromEgyptian(year, month, day) - EGYPTIAN_EPOCH
}
/**
 * Returns the Armenian date for the given RD
 * @param {*} date 
 */
function armenianFromFixed(date) {
    return egyptianFromFixed(date + EGYPTIAN_EPOCH - ARMENIAN_EPOCH)
}

//---------------- GREGORIAN CALENDAR -------------------//

/**
 * Whether the given Gregorian year is a leap year
 * @param {*} year
 */
function isGregorianLeapYear(year) {
    return (_mod(year, 400) == 0) || (_mod(year, 4) == 0 && _mod(year, 100) != 0)
}
/**
 * Returns the "Rate Die" (RD), namely the day count since 1 January 1 Gregorian, for the given Gregorian date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromGregorian(year, month, day) {
    var correction = 0
    if (month > 2) {
        correction = isGregorianLeapYear(year) ? -1 : -2
    }
    return 365 * (year - 1) + Math.floor((year - 1) / 4) - Math.floor((year - 1) / 100) + Math.floor((year - 1) / 400) + Math.floor((367 * month - 362) / 12) + correction + day
}

/**
 * Returns the Gregorian year for the given RD
 * @param {*} date 
 */
function gregorianYearFromFixed(date) {
    var d0 = date - 1
    const c1 = 146097
    const c2 = 36524
    const c3 = 1461
    var n400 = Math.floor(d0 / c1)
    var d1 = _mod(d0, c1)
    var n100 = Math.floor(d1 / c2)
    var d2 = _mod(d1, c2)
    var n4 = Math.floor(d2 / c3)
    var d3 = _mod(d2, c3)
    var n1 = Math.floor(d3 / 365)
    var year = 400 * n400 + 100 * n100 + 4 * n4 + n1
    if (n100 == 4 || n1 == 4) {
        return year
    }
    return year + 1
}

/**
 * Returns the Gregorian date as an array for the given RD
 * @param {*} date 
 */
function gregorianFromFixed(date) {
    var year = gregorianYearFromFixed(date)
    var priorDays = date - fixedFromGregorian(year, 1, 1)
    var corr = 2
    if (date < fixedFromGregorian(year, 3, 1)) {
        corr = 0
    } else if (isGregorianLeapYear(year)) {
        corr = 1
    }

    var month = Math.floor((12 * (priorDays + corr) + 373) / 367)
    var day = date - fixedFromGregorian(year, month, 1) + 1
    return dateAsArray(year, month, day)
}

//---------------- JULIAN CALENDAR -------------------//

/**
 * Whether the given Julian year is a leap year
 * @param {*} year 
 */
function isJulianLeapYear(year) {
    var f = year > 0 ? 0 : 3
    return _mod(year, 4) == f
}

const JULIAN_EPOCH = -1; // in RD, = fixedFromGregorian(0,12,30)

/**
 * Returns the RD for the given Julian date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromJulian(year, month, day) {
    var _y = year < 0 ? year : year - 1; // "_y" here corr. to "y-1" in R&D
    var c = -2
    if (month <= 2) {
        c = 0
    } else if (isJulianLeapYear(year)) {
        c = -1
    }
    return JULIAN_EPOCH - 1 + 365 * _y + Math.floor(_y / 4) + Math.floor((367 * month - 362) / 12) + c + day
}

/**
 * Returns the Julian date as an array for the given RD
 * @param {*} date 
 */
function julianFromFixed(date) {
    var approx = Math.floor((4 * (date - JULIAN_EPOCH) + 1464) / 1461)
    var year = approx > 0 ? approx : approx - 1
    var priorDays = date - fixedFromJulian(year, 1, 1)
    var corr = 2
    if (date < fixedFromJulian(year, 3, 1)) {
        corr = 0
    } else if (isJulianLeapYear(year)) {
        corr = 1
    }
    var month = Math.floor((12 * (priorDays + corr) + 373) / 367)
    var day = date - fixedFromJulian(year, month, 1) + 1
    return dateAsArray(year, month, day)
}

//---------------- EASTER (Gregorian and Orthodox) -------------------//

/**
 * Returns the RD of the Gregorian Easter for the given Gregorian year
 * @param {*} year 
 */
function gregorianEaster(year) {
    var c = Math.floor(year / 100) + 1
    var shiftedEpact = _mod(14 + 11 * Math.floor(_mod(year, 19)) - Math.floor(3 * c / 4) + Math.floor((5 + 8 * c) / 25), 30)
    var adjustedEpact = shiftedEpact
    if (shiftedEpact == 0 || (shiftedEpact == 1 && 10 < (_mod(year, 19)))) {
        adjustedEpact += 1
    }
    var paschalMoon = fixedFromGregorian(year, 4, 19) - adjustedEpact
    return kDayAfter(paschalMoon, 0)
}

/**
 * Returns the RD of the Orthodox Easter for the given Gregorian year
 * @param {*} year 
 */
function orthodoxEaster(year) {
    var paschalMoon = 354 * year + 30 * Math.floor((7 * year + 8) / 19) + Math.floor(year / 4) - Math.floor(year / 19) - 272
    return kDayAfter(paschalMoon, 0)
}

//---------------- COPTIC AND ETHIOPIC CALENDARS -------------------//

const COPTIC_EPOCH = 103605; // = fixedFromJulian(284,8,29)
/**
 * Whether the given Coptic year is a leap year
 * @param {*} year 
 */
function isCopticLeapYear(year) {
    return _mod(year, 4) == 3
}

/**
 * Returns the RD for the given Coptic date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromCoptic(year, month, day) {
    return COPTIC_EPOCH - 1 + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day
}

/**
 * Returns the Coptic date as an array for the given RD
 * @param {*} date 
 */
function copticFromFixed(date) {
    var year = Math.floor((4 * (date - COPTIC_EPOCH) + 1463) / 1461)
    var month = Math.floor((date - fixedFromCoptic(year, 1, 1)) / 30) + 1
    var day = date + 1 - fixedFromCoptic(year, month, 1)
    return dateAsArray(year, month, day)
}

const ETHIOPIC_EPOCH = 2796; // = fixedFromJulian(8,8,29)

/**
 * Returns the RD for the given Ethiopic date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromEthiopic(year, month, day) {
    return ETHIOPIC_EPOCH + fixedFromCoptic(year, month, day) - COPTIC_EPOCH
}
/**
 * Returns the Ethiopic date as an array for the given RD
 * @param {*} date 
 */
function ethiopicFromFixed(date) {
    return copticFromFixed(date + COPTIC_EPOCH - ETHIOPIC_EPOCH)
}

//---------------- ISLAMIC CALENDAR -------------------//

const ISLAMIC_EPOCH = 227015; // = fixedFromJulian(622,7,16)

/**
 * Whether the given Islamic year is a leap year
 * @param {*} year 
 */
function isIslamicLeapYear(year) {
    return _mod(14 + 11 * year, 30) < 11
}

/**
 * Returns the RD for the given Islamic date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromIslamic(year, month, day) {
    return day + 29 * (month - 1) + Math.floor((6 * month - 1) / 11) +
        354 * (year - 1) + Math.floor((3 + 11 * year) / 30) + ISLAMIC_EPOCH - 1
}

/**
 * Returns the Islamic date as an array for the given RD
 * @param {*} date 
 */
function islamicFromFixed(date) {
    var year = Math.floor((30 * (date - ISLAMIC_EPOCH) + 10646) / 10631)
    var priorDays = date - fixedFromIslamic(year, 1, 1)
    var month = Math.floor((11 * priorDays + 330) / 325)
    var day = date - fixedFromIslamic(year, month, 1) + 1
    return dateAsArray(year, month, day)
}

//---------------- HEBREW CALENDAR -------------------//

const HEBREW_EPOCH = -1373427; // = fixedFromJulian(-3761,10,7)
const TISHRI = 7

/**
 * Whether the given Hebrew year is a leap year
 * @param {*} year 
 */
function isHebrewLeapYear(year) {
    return _mod(7 * year + 1, 19) < 7
}

function molad(year, month) {
    var y = (month < TISHRI) ? year + 1 : year
    var monthsElapsed = month - TISHRI + Math.floor((235 * y - 234) / 19)
    return HEBREW_EPOCH - 876 / 25920 + monthsElapsed * (29.5 + 793 / 25920)
}

// function hebrewCalendarElapsedDaysALT(year) {
//     var monthsElapsed = Math.floor((235*year - 234)/19)
//     var partsElapsed = 12084 + 13753*monthsElapsed
//     var day = 29*monthsElapsed + Math.floor(partsElapsed/25920)
//     if ((3*(day-1)) % 7 < 3) {
//         return day + 1
//     }
//     return day
// }

function hebrewCalendarElapsedDays(year) {
    let d = Math.floor(molad(year, TISHRI) - HEBREW_EPOCH + 0.5)
    if (_mod(3 * (d + 1), 7) < 3) {
        return d + 1
    }
    return d
}

function hebrewNewYearDelay(year) {
    var ny0 = hebrewCalendarElapsedDays(year - 1)
    var ny1 = hebrewCalendarElapsedDays(year)
    var ny2 = hebrewCalendarElapsedDays(year + 1)
    if (ny2 - ny1 == 356) {
        return 2
    }
    if (ny1 - ny0 == 382) {
        return 1
    }
    return 0
}

function hebrewNewYear(year) {
    return HEBREW_EPOCH + hebrewCalendarElapsedDays(year) + hebrewNewYearDelay(year)
}

function daysInHebrewYear(year) {
    return hebrewNewYear(year + 1) - hebrewNewYear(year)
}

function isLongMarheshvan(year) {
    var d = daysInHebrewYear(year)
    return d == 355 || d == 385
}

function isShortKislev(year) {
    var d = daysInHebrewYear(year)
    return d == 353 || d == 383
}

function lastDayOfHebrewMonth(year, month) {
    if ([2, 4, 6, 10, 13].indexOf(month) != -1 ||
        (month == 12 && !isHebrewLeapYear(year)) ||
        (month == 8 && !isLongMarheshvan(year)) ||
        (month == 9 && isShortKislev(year))) {
        return 29
    }
    return 30
}

/**
 * Returns the RD for the given Hebrew date
 * @param {*} year 
 * @param {*} month 
 * @param {*} day 
 */
function fixedFromHebrew(year, month, day) {
    var lastMonth = isHebrewLeapYear(year) ? 13 : 12
    var sum = 0
    if (month < TISHRI) {
        for (var m = 1; m < month; m++) {
            sum += lastDayOfHebrewMonth(year, m)
        }
        for (var n = TISHRI; n < lastMonth + 1; n++) {
            sum += lastDayOfHebrewMonth(year, n)
        }
    } else {
        for (var q = TISHRI; q < month; q++) {
            sum += lastDayOfHebrewMonth(year, q)
        }
    }
    return hebrewNewYear(year) + day - 1 + sum
}

/**
 * Returns the Hebrew date as an array for the given RD
 * @param {*} date 
 */
function hebrewFromFixed(date) {
    var approx = Math.floor((date - HEBREW_EPOCH) * 98496 / 35975351) + 1
    var year = approx - 1
    for (;;) {
        if (hebrewNewYear(year) > date) {
            year--
            break
        }
        year++
    }
    var startMonth = (date < fixedFromHebrew(year, 1, 1)) ? TISHRI : 1
    var month
    for (var k = 0; k < 13; k++) {
        month = startMonth + k
        if (date <= fixedFromHebrew(year, month, lastDayOfHebrewMonth(year, month))) {
            break
        }
    }
    var day = date - fixedFromHebrew(year, month, 1) + 1
    return dateAsArray(year, month, day)
}

// ASTRONOMICAL CALENDARS

// TIME FUNCTIONS
function universalFromLocal(t, locale) {
    return t - locale.longitude / 360
}

function localFromUniversal(t, locale) {
    return t + locale.longitude / 360
}

function standardFromUniversal(t, locale) {
    return t + locale.zone / 24
}

function universalFromStandard(t, locale) {
    return t - locale.zone / 24
}

function standardFromLocal(t, locale) {
    return standardFromUniversal(universalFromLocal(t, locale), locale)
}

function localFromStandard(t, locale) {
    return localFromUniversal(universalFromStandard(t, locale), locale)
}

function dynamicalFromUniversal(t) {
    return t + deltat.deltaT(julianDayFromFixed(t))
}

function universalFromDynamical(t) {
    return t - deltat.deltaT(julianDayFromFixed(t))
}

function apparentFromLocal(t) {
    return t + eqtime.eSmart(julianDayFromFixed(t))
}

function localFromApparent(t) {
    return t - eqtime.eSmart(julianDayFromFixed(t))
}

function midnight(date, locale) {
    return standardFromLocal(localFromApparent(Math.floor(date)), locale)
}

function midday(date, locale) {
    return standardFromLocal(localFromApparent(Math.floor(date) + 0.5), locale)
}

// TODO add parameter locale, so that equinox occuring on same day in the locale is returned
function _vernalEquinoxOnOrBefore(date) {
    const year = gregorianYearFromFixed(date)
    let spring = fixedFromJulianDay(solstice.march(year))
    if (spring > date) {
        spring = fixedFromJulianDay(solstice.march(year - 1))
    }
    return spring
}

function _autumnalEquinoxOnOrBefore(date) {
    const year = gregorianYearFromFixed(date)
    let autumn = fixedFromJulianDay(solstice.september(year))
    if (autumn > date) {
        autumn = fixedFromJulianDay(solstice.september(year - 1))
    }
    return autumn
}

function momentFromDepression(approx, locale, angle) {
    let t = universalFromLocal(approx, locale)
    let δ = solar.apparentEquatorial(julianDayFromFixed(t)).dec // in radians
    let morning = _mod(approx, 1) < 0.5 ? -1 : 1
    let sineOffset = Math.tan(locale.latitude*D2R) * Math.tan(δ) + Math.sin(angle*D2R)/(Math.cos(δ)*Math.cos(locale.latitude*D2R))
    if (Math.abs(sineOffset) > 1) {
        return null
    }
    return localFromApparent(Math.floor(approx) + 0.5 + morning*(_mod(0.5 + Math.asin(sineOffset)/(2*π), 1) - 0.25))
}

function dawn(date, locale, angle) {
    let approx = momentFromDepression(date + 0.25, locale, angle)
    let x = approx == null ? date : approx
    let result = momentFromDepression(x, locale, angle)
    if (result == null) {
        return null
    }
    return standardFromLocal(result, locale)
}

function dusk(date, locale, angle) {
    let approx = momentFromDepression(date + 0.75, locale, angle)
    let x = approx == null ? date + 0.99 : approx
    let result = momentFromDepression(x, locale, angle)
    if (result == null) {
        return null
    }
    return standardFromLocal(result, locale)
}

function _angle(elevation) {
    let h = Math.max(0, elevation)
    let R = 6.372 * 10E6
    let dip = Math.acos(R/(R+h))/D2R
    return 5/6 + dip
}

function sunrise(date, locale) {
    return dawn(date, locale, _angle(locale.elevation))
}
function sunset(date, locale) {
    return dusk(date, locale, _angle(locale.elevation))
}

function isCrescentVisible(date, locale) {
    // method from meeus: ... should be adapted to 4.5° instead of 6°
    /* 
    let _date = new julian.Calendar().fromJD(julianDayFromFixed(date-1))
    let sr = new Sunrise(_date, locale.latitude, -locale.longitude);  // ADD REFRACTION ???
    let jde = sr.dusk().toJDE()
    */
    // method from Reingold&Dershowitz:
    let t = universalFromStandard(dusk(date-1, locale, 4.5), locale)
    let jde = julianDayFromFixed(t)
    // console.log(`JDE at dusk (astronomia/meeus vs R&D): ${jde} vs ${jde2}`)
    let lunarPos = moonposition.position(jde)
    let solarPos = solar.trueLongitude(astro.J2000Century(jde))
    let phase = _mod(lunarPos.lon - solarPos.lon, 2*π)
    let eclMoon = new coord.Ecliptic(lunarPos.lon, lunarPos.lat)
    let localCoords = new globe.Coord(locale.latitude*D2R, -locale.longitude*D2R)
    const ε = nutation.meanObliquityLaskar(jde)
    const st = sidereal.apparent(jde)
    let lunarAltitude = eclMoon.toEquatorial(ε).toHorizontal(localCoords, st).alt
    let arcOfLight = Math.acos(Math.cos(lunarPos.lat) * Math.cos(phase))
    // let phaseDeg = phase/D2R, arcOfLightDeg = arcOfLight/D2R, lunarAltitudeDeg = lunarAltitude/D2R
    const crit = (0 < phase && phase < 90*D2R 
        && 10.6*D2R <= arcOfLight && arcOfLight <= 90*D2R 
        && lunarAltitude > 4.1*D2R)
    // if (debug) console.log(`>>> at jde ${jde} (${_dusk.toISOString()}): lunarPos ${lunarPos.lon/D2R},${lunarPos.lat/D2R}, visibility ${crit}, criteria: phase=${phase/D2R}, arcOfLight=${arcOfLight/D2R}, altitude=${lunarAltitude/D2R}`)
    return crit
}

const MEAN_SYNODIC_MONTH = moonphase.meanLunarMonth
                           
function phasisOnOrBefore(date, locale) {
    let jde = julianDayFromFixed(date+1)
    let lunarPos = moonposition.position(jde)
    let solarPos = solar.true2000(astro.J2000Century(jde))
    let phase = _mod(lunarPos.lon - solarPos.lon, 2*π)/(2*π)
    let mean = date - Math.floor(MEAN_SYNODIC_MONTH*phase)
    //console.log(`solar long ${solarPos.lon/D2R}, lunar long ${lunarPos.lon/D2R}, phase = ${phase/D2R}, mean = ${mean}`)
    let tau = mean - 2
    if (date - mean <=3 && !isCrescentVisible(date, locale)) {
        tau = mean - 30
    }
    let crescent = tau
    for (let i=0; i<30; i++) {
        crescent = tau + i
        if (isCrescentVisible(crescent, locale)) {
            break
        }
    }
    return crescent;
}

/*
function lastNewMoon(date) {
    let jde = julianDayFromFixed(date)
    let year = astro.JDEToBesselianYear(jde) // NOT SURE ABOUT THIS ONE !!!
    let newMoon = moonphase.newMoon(year)
    if (newMoon > jde) {
        newMoon = moonphase.newMoon(year-MEAN_SYNODIC_MONTH/MEAN_TROPICAL_YEAR)
    }
    return fixedFromJulianDay(newMoon)
}

function phasisOnOrBeforeAlt(date, locale, debug) {
    let newMoon = lastNewMoon(date)
    if (date - newMoon <= 2 && !isCrescentVisible(date, locale)) {
        newMoon = lastNewMoon(date-29)
    }
    if (debug) console.log(`>>> last new moon = ${newMoon}`)
    let crescent = newMoon
    for (let i=0; i<=2; i++) {
        crescent += i
        if (isCrescentVisible(crescent, locale)) {
            if (debug) console.log(`>>> Crescent visible on ${crescent}`)
            break
        }
    }
    // if (debug) console.log(`YYY crescent = ${crescent}`)
    return crescent
}
*/

const CAIRO = {
    "latitude" : 30.1,
    "longitude": 31.3,
    "elevation": 200,
    "zone" : 2
}

function fixedFromObservationalIslamic(year, month, day, locale) {
    if (!locale) {
        locale = CAIRO
    }
    let midMonth = ISLAMIC_EPOCH + Math.floor((12*(year-1) + month - 0.5)*MEAN_SYNODIC_MONTH)
    return phasisOnOrBefore(midMonth, locale) + day - 1
}

function observationalIslamicFromFixed(date, locale) {
    if (!locale) {
        locale = CAIRO
    }
    // console.log(`>>> date: ${gregorianFromFixed(date)}`)
    let crescent = phasisOnOrBefore(date, locale)
    // console.log(`>>> day of last crescent: ${gregorianFromFixed(crescent)}`)
    let elapsedMonths = Math.round((crescent - ISLAMIC_EPOCH)/MEAN_SYNODIC_MONTH)
    // console.log(`>>> elapsed months: ${elapsedMonths}`)
    let year = Math.floor(elapsedMonths/12) + 1
    let month = _mod(elapsedMonths, 12) + 1
    let day = date - crescent + 1
    return dateAsArray(year, month, day)
}

//---------------- PERSIAN CALENDAR -------------------//

const PERSIAN_EPOCH = 226896; // = fixedFromJulian(622,3,19)

const MEAN_TROPICAL_YEAR = 365.242189; // astro.BesselianYear // NB: Reingold & Dershowitz give 365.242189

const TEHRAN = {
    "latitude": 35.68,
    "longitude": 51.42,
    "elevation": 1100,
    "zone": 3.5
}

function _middayInTehran(date) {
    return universalFromStandard(midday(date, TEHRAN), TEHRAN)
}

function _persianNewYearOnOrBefore(date) {
    let previousEquinox = _vernalEquinoxOnOrBefore(date+1) // FIXME 
    if (previousEquinox < _middayInTehran(previousEquinox)) {
        return Math.floor(previousEquinox)
    } else {
        return Math.floor(previousEquinox) + 1
    }
}

function fixedFromPersian(year, month, day) {
    let _y = (year > 0 ? year - 1 : year)
    let newYear = _persianNewYearOnOrBefore(PERSIAN_EPOCH + 180 +
        Math.floor(MEAN_TROPICAL_YEAR * _y))
    let _m = (month > 7 ? 30 * (month - 1) + 6 : 31 * (month - 1))
    return newYear - 1 + _m + day
}

function persianFromFixed(date) {
    let newYear = _persianNewYearOnOrBefore(date)
    let y = Math.round((newYear - PERSIAN_EPOCH) / MEAN_TROPICAL_YEAR) + 1
    let year = (y > 0 ? y : y - 1)
    let dayOfYear = date - fixedFromPersian(year, 1, 1) + 1
    if (Math.floor(dayOfYear) == 1) {
        return dateAsArray(year, 1, dayOfYear)
    }
    let month = (dayOfYear > 186 ? Math.ceil((dayOfYear - 6) / 30) : Math.ceil(dayOfYear / 31))
    let day = date - fixedFromPersian(year, month, 1) + 1
    return dateAsArray(year, month, day)
}

function isPersianLeapYear(year) {
    return (fixedFromPersian(year + 1, 1, 1) - fixedFromPersian(year, 1, 1) == 366)
}

//---------------- FRENCH REVOLUTIONARY CALENDAR -------------------//
const FRENCH_EPOCH = 654415; // fixedFromGregorian(1792,9,22)
const PARIS = {
    "latitude": 48 + 50/60 + 11/3600,
    "longitude": 2 + 20/60 + 15/3600,
    "elevation": 27,
    "zone": 1
}

function _midnightInParis(date) {
    return universalFromStandard(midnight(date+1, PARIS), PARIS)
}

function _frenchNewYearOnOrBefore(date) {
    let previousEquinox = _autumnalEquinoxOnOrBefore(date+1)
    if (previousEquinox < _midnightInParis(previousEquinox)) {
        return Math.floor(previousEquinox)
    } else {
        return Math.floor(previousEquinox) + 1
    }
}

function fixedFromFrench(year, month, day) {
    let newYear = _frenchNewYearOnOrBefore(Math.floor(FRENCH_EPOCH + 180 + MEAN_TROPICAL_YEAR * (year - 1)))
    return newYear - 1 + 30*(month - 1) + day
}

function frenchFromFixed(date) {
    let newYear = _frenchNewYearOnOrBefore(date)
    let year = Math.round((newYear - FRENCH_EPOCH)/MEAN_TROPICAL_YEAR) + 1
    let month = Math.floor((date - newYear)/30) + 1
    let day = _mod(date - newYear, 30) + 1
    return dateAsArray(year, month, day)
}

function isFrenchLeapYear(year) {
    return (fixedFromFrench(year + 1, 1, 1) - fixedFromFrench(year, 1, 1) == 366)
}

function isModifiedFrenchLeapYear(year) {
    return (_mod(year, 4) == 0 
        && [100,200,300].indexOf(_mod(year, 400)) == -1 
        && _mod(year, 4000) != 0)
}

function fixedFromModifiedFrench(year, month, day) {
    return FRENCH_EPOCH - 1 + 365*(year-1) 
        + Math.floor((year-1)/4) 
        - Math.floor((year-1)/100) 
        + Math.floor((year-1)/400) 
        - Math.floor((year-1)/4000) 
        + 30*(month-1) + day
}

function modifiedFrenchFromFixed(date) {
    let year = Math.floor(4000*(date - FRENCH_EPOCH + 2)/1460969) + 1
    if (date < fixedFromModifiedFrench(year,1,1)) {
        year = year - 1
    }
    let month = Math.floor((date - fixedFromModifiedFrench(year,1,1))/30) + 1
    let day = date - fixedFromModifiedFrench(year, month, 1) + 1
    return dateAsArray(year, month, day)
}

//---------------- MAYAN CALENDAR -------------------//

const MAYAN_EPOCH = -1137142

function fixedFromMayanLongCount(baktun, katun, tun, uinal, kin) {
    return MAYAN_EPOCH + baktun * 144000 + katun * 7200 + tun * 360 + uinal * 20 + kin
}

function mayanLongCountFromFixed(date) {
    const longCount = date - MAYAN_EPOCH
    const baktun = Math.floor(longCount/144000)
    const dayOfBaktun = _mod(longCount, 144000)
    const katun = Math.floor(dayOfBaktun/7200)
    const dayOfKatun = _mod(dayOfBaktun, 7200)
    const tun = Math.floor(dayOfKatun/360)
    const dayOfTun = _mod(dayOfKatun, 360)
    const uinal = Math.floor(dayOfTun/20)
    const kin = _mod(dayOfTun, 20)
    return [baktun, katun, tun, uinal, kin]
}

function mayanHaabOrdinal(month, day) {
    return (month-1)*20 + day
}

const MAYAN_HAAB_EPOCH = MAYAN_EPOCH - mayanHaabOrdinal(18,8)

function mayanHaabFromFixed(date) {
    const count = _mod(date - MAYAN_HAAB_EPOCH, 365)
    const day = _mod(count, 20)
    const month = Math.floor(count/20) + 1
    return [month, day]
}

function mayanHaabOnOrBefore(haabMonth, haabDay, date) {
    return date - _mod(date - MAYAN_HAAB_EPOCH - mayanHaabOrdinal(haabMonth, haabDay), 365)
}

function mayanTzolkinOrdinal(number, name) {
    return _mod(number - 1 + 39*(number-name), 260)
}

const MAYAN_TZOLKIN_EPOCH = MAYAN_EPOCH - mayanTzolkinOrdinal(4,20)

function mayanTzolkinFromFixed(date) {
    const count = date - MAYAN_TZOLKIN_EPOCH + 1
    const number = _amod(count, 13)
    const name = _amod(count, 20)
    return [number, name]
}

function mayanTzolkinOnOrBefore(tzolkinNumber, tzolkinName, date) {
    return date - _mod(date - MAYAN_TZOLKIN_EPOCH - mayanTzolkinOrdinal(tzolkinNumber, tzolkinName), 260)
}

function mayanCalendarRoundOnOrBefore(haabMonth, haabDay, tzolkinNumber, tzolkinName, date) {
    const haabCount = mayanHaabOrdinal(haabMonth, haabDay) + MAYAN_HAAB_EPOCH
    const tzolkinCount = mayanTzolkinOrdinal(tzolkinNumber, tzolkinName) + MAYAN_TZOLKIN_EPOCH
    const diff = tzolkinCount - haabCount
    if (_mod(diff, 5) == 0) {
        return date - _mod(date - haabCount - 365*diff, 18980)
    }
    return null

}

//---------------- exports -------------------//
module.exports = {
    kDayOnOrBefore,
    kDayAfter,
    fixedFromArmenian,
    armenianFromFixed,
    fixedFromCoptic,
    copticFromFixed,
    fixedFromEgyptian,
    egyptianFromFixed,
    fixedFromEthiopic,
    ethiopicFromFixed,
    fixedFromGregorian,
    gregorianFromFixed,
    gregorianYearFromFixed,
    fixedFromHebrew,
    hebrewFromFixed,
    fixedFromIslamic,
    islamicFromFixed,
    fixedFromJSDate,
    jsDateFromFixed,
    fixedFromJulian,
    julianFromFixed,
    fixedFromJulianDay,
    julianDayFromFixed,
    gregorianEaster,
    orthodoxEaster,
    isCopticLeapYear,
    isGregorianLeapYear,
    isHebrewLeapYear,
    isIslamicLeapYear,
    isJulianLeapYear,
    universalFromLocal,
    localFromUniversal,
    standardFromLocal,
    localFromStandard,
    universalFromStandard,
    standardFromUniversal,
    dynamicalFromUniversal,
    universalFromDynamical,
    localFromApparent,
    apparentFromLocal,
    dawn,
    dusk,
    sunrise,
    sunset,
    isCrescentVisible,
    fixedFromPersian,
    persianFromFixed,
    isPersianLeapYear,
    PARIS,
    fixedFromFrench,
    frenchFromFixed,
    isFrenchLeapYear,
    fixedFromModifiedFrench,
    modifiedFrenchFromFixed,
    isModifiedFrenchLeapYear,
    fixedFromObservationalIslamic,
    observationalIslamicFromFixed,
    fixedFromMayanLongCount,
    mayanLongCountFromFixed,
    mayanHaabFromFixed,
    mayanHaabOnOrBefore,
    mayanTzolkinFromFixed,
    mayanTzolkinOnOrBefore,
    mayanCalendarRoundOnOrBefore,
    dateAsArray
}