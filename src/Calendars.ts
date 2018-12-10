/**
 * Straightforward adaptation to TypeScript of the calendar computations featured in
 * Reingold & Dershowitz, Calendrical Calculations, The Millenium Edition, Cambridge University Press, 2001.
 *
 * The arithmetic formulae are reproduced almost verbatim from Reingold & Dershowitz.
 * For the purely astronomical calculations however, we rely mostly on the
 * npm package astronomia (https://github.com/commenthol/astronomia),
 * itself derived from the go package meeus (https://github.com/soniakeys/meeus).
 *
 * @author François Charette, 2018
 * @license MIT
 */
import * as astro from 'astronomia/lib/base'
import * as deltat from 'astronomia/lib/deltat'
import * as eqtime from 'astronomia/lib/eqtime'
import * as moonphase from 'astronomia/lib/moonphase'
import * as moonposition from 'astronomia/lib/moonposition'
import * as nutation from 'astronomia/lib/nutation'
import * as sidereal from 'astronomia/lib/sidereal'
/* Only necessary for using the high-precision functions solstice.march2, solstice.september2 and eqtime.e
    which take EARTH as second parameter */
import * as planetposition from 'astronomia/lib/planetposition'
import * as data from 'astronomia/data'
const EARTH = new planetposition.Planet(data.earth)
import * as solar from 'astronomia/lib/solar'
import * as solstice from 'astronomia/lib/solstice'
import * as coord from 'astronomia/lib/coord'
import * as globe from 'astronomia/lib/globe'
const π = Math.PI
const D2R = π / 180 // to convert degrees to radians

/**
 * Representation of a locality on earth:
 * - latitude (in °)
 * - longitude (in °)
 * - elevation (in m)
 * - zone (time zone, denoted by a number counted westwards, between -12 and 14)
 */
interface Locality {
    latitude: number
    longitude: number
    elevation?: number
    zone: number
}

export enum Weekday {
    Sunday = 0,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday
}

export namespace Calendars {

    type DateArray = [number, number, number, number, number, number]

    /**
     * Adapted Modulo function to account for negative a or b
     * @param {number} a
     * @param {number} b
     * @returns a modulo b
     */
    function _mod(a: number, b: number): number {
        return a - b * Math.floor(a / b)
    }

    /**
     * Adjusted remainder function
     * @param {number} a
     * @param {number} b
     * @returns a modulo b
     */
    function _amod(a: number, b: number): number {
        return b + _mod(a, -b)
    }

    /**
     * Adjustment factor for the Modified Julian Date
     */

    /**
     * Returns the date of the weekday k occurring on or before the given date
     * @param {number} date
     * @param {Weekday} k weekday number (starting with 0 = Sunday)
     * @returns {number} an RD date
     */
    export function weekdayOnOrBefore(date: number, k: Weekday): number {
        return date - _mod((date - k), 7)
    }
    /**
     * Returns the date of the weekday k occurring after the given date
     * @param {number} date
     * @param {Weekday} k weekday number (starting with 0 = Sunday)
     * @returns {number} an RD date
     */
    export function weekdayAfter(date: number, k: Weekday): number {
        return weekdayOnOrBefore(date + 7, k)
    }

    /**
     * Returns the date occurring on the nth occurrence of weekday k after date (or before if n is negative)
     * @param n 
     * @param k 
     * @param date 
     * @returns another date
     */
    export function nthWeekday(n: number, k: Weekday, date: number): number {
        if (n>0) {
            return 7*n + weekdayOnOrBefore(date-1, k)
        }
        return 7*n + weekdayAfter(date, k)
    }

    /**
     * Returns the Weekday of the given date
     * @param date 
     * @returns the Weekday
     */
    export function getWeekday(date: number): Weekday {
        return _mod(Math.floor(date), 7)
    }

    // ---------------- JAVASCRIPT DATES -------------------//

    export const UNIX_DATE_EPOCH = 719163 // = Gregorian.toFixed(1970,1,1)

    const MILLISECONDS_PER_DAY = (1000 * 60 * 60 * 24)

    /**
     * Converts a native JavaScript date to an RD date
     * @param {Date} jsDate
     * @returns {number} an RD date
     */
    export function toFixed(jsDate: Date): number {
        return UNIX_DATE_EPOCH + jsDate.getTime() / MILLISECONDS_PER_DAY
    }

    /**
     * Converts an RD to a JavaScript Date
     * @param {number} date
     * @returns {Date} a JavaScript Date
     */
    export function fromFixed(date: number): Date {
        const ms = (date - UNIX_DATE_EPOCH) * MILLISECONDS_PER_DAY
        return new Date(ms)
    }

    /**
     * Helper function to represent a year, month and day (potentially with fractional part)
     * as an array [year,month,day,hour,min,sec] (the seconds potentially with fractional part)
     * @param {number} year
     * @param {number} month
     * @param {number} day
     */
    export function toArray(year: number, month: number, day: number): DateArray {
        // console.log("formatting y-m-d as array: "+ year +"-"+ month +"-"+ day)
        let rday = Math.floor(day)
        if (rday === day) {
            return [year, month, day, 0, 0, 0]
        }
        const excess = day - rday
        const elapsedHours = excess * 24
        const elapsedMinutes = excess * 24 * 60
        const elapsedSeconds = excess * 24 * 60 * 60
        let hour = Math.floor(elapsedHours)
        let min = Math.floor(elapsedMinutes - hour * 60)
        let sec = elapsedSeconds - min * 60 - hour * 60 * 60
        // fix rounding errors ... we only need millisecond precision
        sec = Math.round(sec*1000)/1000
        if (Math.floor(sec) == 60) {
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

    // ---------------- JULIAN DAY NUMBER -------------------//
    export namespace JD {
        /**
         * Epoch of the Julian Day Number calendar (which counts days)
         */
        export const EPOCH = -1721424.5

        /**
         * Returns the Julian Day (JD) for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): number {
            return date - EPOCH
        }
        /**
         * Returns the RD for the given JD
         * @param {number} jd
         */
        export function toFixed(jd: number): number {
            return jd + EPOCH
        }
    }
    export namespace MJD {

        const MODIFIED_JULIAN_ADJUSTMENT = 2400000.5

        export const EPOCH = 678576 // = JD.EPOCH - MODIFIED_JULIAN_ADJUSTMENT -> 1858-11-17

        /**
         * Returns the Modified Julian Day (MJD) for the given JD
         * @param {number} jd
         * 
         */
        export function fromJD(jd: number): number {
            return jd - MODIFIED_JULIAN_ADJUSTMENT
        }

        /**
         * Returns the MJD for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): number {
            return date - EPOCH
        }

        /**
         * Returns the RD for the given MJD
         * @param {number} jd
         */
        export function toFixed(mjd: number): number {
            return mjd + EPOCH
        }
    }

    // ---------------- EGYPTIAN AND ARMENIAN CALENDARS -------------------//

    export namespace Egyptian {

        export const EPOCH = -272787 // = Math.floor(JD.toFixed(1448638))

        /**
         * Returns the RD for the given Egyptian date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            return Egyptian.EPOCH + 365 * (year - 1) + 30 * (month - 1) + day - 1
        }

        /**
         * Returns the Egyptian date for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            const days = date - Egyptian.EPOCH
            const year = Math.floor(days / 365) + 1
            const month = Math.floor((_mod(days, 365)) / 30) + 1
            const day = days - 365 * (year - 1) - 30 * (month - 1) + 1
            return toArray(year, month, day)
        }
    }

    export namespace Armenian {

        export const EPOCH = 201443

        /**
         * Returns the RD for the given Armenian date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            return EPOCH + Egyptian.toFixed(year, month, day) - Egyptian.EPOCH
        }
        /**
         * Returns the Armenian date for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            return Egyptian.fromFixed(date + Egyptian.EPOCH - EPOCH)
        }
    }

    // ---------------- GREGORIAN CALENDAR -------------------//

    export namespace Gregorian {

        /**
         * Whether the given Gregorian year is a leap year
         * @param {number} year
         */
        export function isLeapYear(year: number): boolean {
            return (_mod(year, 400) === 0) || (_mod(year, 4) === 0 && _mod(year, 100) !== 0)
        }
        /**
         * Returns the "Rate Die" (RD), namely the day count since 1 January 1 Gregorian, for the given Gregorian date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            let correction = 0
            if (month > 2) {
                correction = isLeapYear(year) ? -1 : -2
            }
            return 365 * (year - 1) + Math.floor((year - 1) / 4)
                - Math.floor((year - 1) / 100) + Math.floor((year - 1) / 400)
                + Math.floor((367 * month - 362) / 12) + correction + day
        }

        /**
         * Returns the Gregorian year for the given RD
         * @param {number} date
         * @returns {number} Gregorian year
         */
        export function yearFromFixed(date: number): number {
            const d0 = date - 1
            const c1 = 146097
            const c2 = 36524
            const c3 = 1461
            const n400 = Math.floor(d0 / c1)
            const d1 = _mod(d0, c1)
            const n100 = Math.floor(d1 / c2)
            const d2 = _mod(d1, c2)
            const n4 = Math.floor(d2 / c3)
            const d3 = _mod(d2, c3)
            const n1 = Math.floor(d3 / 365)
            const year = 400 * n400 + 100 * n100 + 4 * n4 + n1
            if (n100 === 4 || n1 === 4) {
                return year
            }
            return year + 1
        }

        /**
         * Returns the Gregorian date as an array for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            const year = yearFromFixed(date)
            const priorDays = date - toFixed(year, 1, 1)
            let corr = 2
            if (date < toFixed(year, 3, 1)) {
                corr = 0
            } else if (isLeapYear(year)) {
                corr = 1
            }

            const month = Math.floor((12 * (priorDays + corr) + 373) / 367)
            const day = date - toFixed(year, month, 1) + 1
            return toArray(year, month, day)
        }

    }

    // ---------------- JULIAN CALENDAR -------------------//

    export namespace Julian {

        /**
         * Whether the given Julian year is a leap year
         * @param {number} year
         */
        export function isLeapYear(year: number): boolean {
            const f = year > 0 ? 0 : 3
            return _mod(year, 4) === f
        }

        const EPOCH = -1 // in RD, = Gregorian.toFixed(0,12,30)

        /**
         * Returns the RD for the given Julian date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            const y = year < 0 ? year : year - 1 // "y" here corr. to "y-1" in R&D
            let c = -2
            if (month <= 2) {
                c = 0
            } else if (isLeapYear(year)) {
                c = -1
            }
            return EPOCH - 1 + 365 * y + Math.floor(y / 4) + Math.floor((367 * month - 362) / 12) + c + day
        }

        /**
         * Returns the Julian date as an array for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            const approx = Math.floor((4 * (date - EPOCH) + 1464) / 1461)
            const year = approx > 0 ? approx : approx - 1
            const priorDays = date - toFixed(year, 1, 1)
            let corr = 2
            if (date < toFixed(year, 3, 1)) {
                corr = 0
            } else if (isLeapYear(year)) {
                corr = 1
            }
            const month = Math.floor((12 * (priorDays + corr) + 373) / 367)
            const day = date - toFixed(year, month, 1) + 1
            return toArray(year, month, day)
        }
    }

    export namespace Roman {
        export enum RomanEvent {
            Kalends = 1,
            Nones,
            Ides
        }
        function ides(month: number): number {
            if ([3,5,7,10].indexOf(month) != -1) {
                return 15
            }
            return 13
        }
        function nones(month: number): number {
            return ides(month) - 8
        }

        export function toFixed(year: number, month: number, event: RomanEvent, count: number, leap: boolean): number {
            let d = 1
            if (event == RomanEvent.Nones) {
                d = nones(month)
            } else if (event == RomanEvent.Ides) {
                d = ides(month)
            }
            let f = 1
            if (Julian.isLeapYear(year) 
                && month == 3 
                && event == RomanEvent.Kalends 
                && count >= 6 
                && count <= 16) {
                f = 0
            }
            let L = leap ? 1 : 0

            return Julian.toFixed(year, month, d) - count + f + L
        }

        type RomanDate = [number, number, RomanEvent, number, boolean]

        export function fromFixed(date: number): RomanDate {
            const j = Julian.fromFixed(date)
            const year = j[0]
            const month = j[1]
            const day = j[2]
            if (day == 1) {
                return [year, month, RomanEvent.Kalends, 1, false]
            } else if (day <= nones(month)) {
                return [year, month, RomanEvent.Nones, nones(month) - day + 1, false]
            } else if (day <= ides(month)) {
                return [year, month, RomanEvent.Ides, ides(month) - day + 1, false]
            }
            else if (month != 2 || !Julian.isLeapYear(year)) {
                const month2 = _amod(month + 1, 12)
                let year2 = 1
                if (month2 != 1) {
                    year2 = year
                } else if (month2 == 1 && year != -1) {
                    year2 = year + 1
                }
                const kalends1 = toFixed(year2, month2, RomanEvent.Kalends, 1, false)
                return [year2, month2, RomanEvent.Kalends, kalends1 - date + 1, false]
            } else if (day < 25) {
                return [year, 3, RomanEvent.Kalends, 30 - day, false]
            }
            return [year, 3, RomanEvent.Kalends, 31 - day, day == 25]
        }

    }

    // ---------------- EASTER (Gregorian and Orthodox) -------------------//
    export namespace Easter {
        /**
         * Returns the RD of the Gregorian Easter for the given Gregorian year
         * @param {number} year
         */
        export function Gregorian(year: number): number {
            const c = Math.floor(year / 100) + 1
            const shiftedEpact = _mod(14 + 11 * Math.floor(_mod(year, 19))
                - Math.floor(3 * c / 4) + Math.floor((5 + 8 * c) / 25), 30)
            let adjustedEpact = shiftedEpact
            if (shiftedEpact === 0 || (shiftedEpact === 1 && 10 < (_mod(year, 19)))) {
                adjustedEpact += 1
            }
            const paschalMoon = Calendars.Gregorian.toFixed(year, 4, 19) - adjustedEpact
            return weekdayAfter(paschalMoon, Weekday.Sunday)
        }
        /**
         * Returns the RD of the Orthodox Easter for the given Gregorian year
         * @param {number} year
         */
        export function Orthodox(year: number): number {
            const paschalMoon = 354 * year + 30 * Math.floor((7 * year + 8) / 19)
                + Math.floor(year / 4) - Math.floor(year / 19) - 272
            return weekdayAfter(paschalMoon, Weekday.Sunday)
        }

    }

    export namespace Coptic {

        // ---------------- COPTIC AND ETHIOPIC CALENDARS -------------------//

        export const EPOCH = 103605 // = Julian.toFixed(284,8,29)
        /**
         * Whether the given Coptic year is a leap year
         * @param {number} year
         */
        export function isLeapYear(year: number): boolean {
            return _mod(year, 4) === 3
        }

        /**
         * Returns the RD for the given Coptic date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            return EPOCH - 1 + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day
        }

        /**
         * Returns the Coptic date as an array for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            const year = Math.floor((4 * (date - EPOCH) + 1463) / 1461)
            const month = Math.floor((date - toFixed(year, 1, 1)) / 30) + 1
            const day = date + 1 - toFixed(year, month, 1)
            return toArray(year, month, day)
        }
    }

    export namespace Ethiopic {
        export const EPOCH = 2796 // = Julian.toFixed(8,8,29)

        /**
         * Returns the RD for the given Ethiopic date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            return EPOCH + Coptic.toFixed(year, month, day) - Coptic.EPOCH
        }
        /**
         * Returns the Ethiopic date as an array for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            return Coptic.fromFixed(date + Coptic.EPOCH - EPOCH)
        }
    }

    export namespace ISO {

        export function toFixed(year: number, week: number, day: number): number {
            return nthWeekday(week, Weekday.Sunday, Gregorian.toFixed(year-1, 12, 28)) + day
        }

        export function fromFixed(date: number): DateArray {
            let approx = Gregorian.yearFromFixed(date - 3)
            let year = approx
            if (date >= toFixed(approx+1, 1, 1)) {
                year = approx + 1
            }
            const week = Math.floor((date - toFixed(year, 1, 1))/7) + 1
            const day = _amod(date, 7)

            return toArray(year, week, day)
        }
    }

    // ---------------- ISLAMIC CALENDAR -------------------//
    export namespace Islamic {
        export const EPOCH = 227015 // = Julian.toFixed(622,7,16)

        /**
         * Whether the given Islamic year is a leap year
         * @param {number} year
         */
        export function isLeapYear(year: number): boolean {
            return _mod(14 + 11 * year, 30) < 11
        }

        /**
         * Returns the RD for the given Islamic date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            return day + 29 * (month - 1) + Math.floor((6 * month - 1) / 11) +
                354 * (year - 1) + Math.floor((3 + 11 * year) / 30) + EPOCH - 1
        }

        /**
         * Returns the Islamic date as an array for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            const year = Math.floor((30 * (date - EPOCH) + 10646) / 10631)
            const priorDays = date - Islamic.toFixed(year, 1, 1)
            const month = Math.floor((11 * priorDays + 330) / 325)
            const day = date - Islamic.toFixed(year, month, 1) + 1
            return toArray(year, month, day)
        }
    }

    // ---------------- HEBREW CALENDAR -------------------//

    export namespace Hebrew {

        const EPOCH = -1373427 // = Julian.toFixed(-3761,10,7)
        const TISHRI = 7

        /**
         * Whether the given Hebrew year is a leap year
         * @param {number} year
         */
        export function isLeapYear(year: number): boolean {
            return _mod(7 * year + 1, 19) < 7
        }

        function molad(year: number, month: number): number {
            const y = (month < TISHRI) ? year + 1 : year
            const monthsElapsed = month - TISHRI + Math.floor((235 * y - 234) / 19)
            return EPOCH - 876 / 25920 + monthsElapsed * (29.5 + 793 / 25920)
        }

        // function hebrewCalendarElapsedDaysALT(year: number): number {
        //     var monthsElapsed = Math.floor((235*year - 234)/19)
        //     var partsElapsed = 12084 + 13753*monthsElapsed
        //     var day = 29*monthsElapsed + Math.floor(partsElapsed/25920)
        //     if ((3*(day-1)) % 7 < 3) {
        //         return day + 1
        //     }
        //     return day
        // }

        function elapsedDays(year: number): number {
            const d = Math.floor(molad(year, TISHRI) - EPOCH + 0.5)
            if (_mod(3 * (d + 1), 7) < 3) {
                return d + 1
            }
            return d
        }

        function newYearDelay(year: number): number {
            const ny0 = elapsedDays(year - 1)
            const ny1 = elapsedDays(year)
            const ny2 = elapsedDays(year + 1)
            if (ny2 - ny1 === 356) {
                return 2
            }
            if (ny1 - ny0 === 382) {
                return 1
            }
            return 0
        }

        export function newYear(year: number): number {
            return EPOCH + elapsedDays(year) + newYearDelay(year)
        }

        function daysInYear(year: number): number {
            return newYear(year + 1) - newYear(year)
        }

        function isLongMarheshvan(year: number): boolean {
            const d = daysInYear(year)
            return d === 355 || d === 385
        }

        function isShortKislev(year: number): boolean {
            const d = daysInYear(year)
            return d === 353 || d === 383
        }

        function lastDayOfMonth(year: number, month: number): number {
            if ([2, 4, 6, 10, 13].indexOf(month) !== -1 ||
                (month === 12 && !isLeapYear(year)) ||
                (month === 8 && !isLongMarheshvan(year)) ||
                (month === 9 && isShortKislev(year))) {
                return 29
            }
            return 30
        }

        /**
         * Returns the RD for the given Hebrew date
         * @param {number} year
         * @param {number} month
         * @param {number} day
         */
        export function toFixed(year: number, month: number, day: number): number {
            const lastMonth = isLeapYear(year) ? 13 : 12
            let sum = 0
            if (month < TISHRI) {
                for (let m = 1; m < month; m++) {
                    sum += lastDayOfMonth(year, m)
                }
                for (let n = TISHRI; n < lastMonth + 1; n++) {
                    sum += lastDayOfMonth(year, n)
                }
            } else {
                for (let q = TISHRI; q < month; q++) {
                    sum += lastDayOfMonth(year, q)
                }
            }
            return newYear(year) + day - 1 + sum
        }

        /**
         * Returns the Hebrew date as an array for the given RD
         * @param {number} date
         */
        export function fromFixed(date: number): DateArray {
            const approx = Math.floor((date - EPOCH) * 98496 / 35975351) + 1
            let year = approx - 1
            for (;;) {
                if (newYear(year) > date) {
                    year--
                    break
                }
                year++
            }
            const startMonth = (date < toFixed(year, 1, 1)) ? TISHRI : 1
            let month
            for (let k = 0; k < 13; k++) {
                month = startMonth + k
                if (date <= toFixed(year, month, lastDayOfMonth(year, month))) {
                    break
                }
            }
            const day = date - Hebrew.toFixed(year, month, 1) + 1
            return toArray(year, month, day)
        }
    }

    const SECONDS_PER_DAY = 86400;
    // ASTRONOMICAL CALENDARS

    // TIME FUNCTIONS
    export namespace Time {
        export function universalFromLocal(t: number, locale: Locality): number {
            return t - locale.longitude / 360
        }

        export function localFromUniversal(t: number, locale: Locality): number {
            return t + locale.longitude / 360
        }

        export function standardFromUniversal(t: number, locale: Locality): number {
            return t + locale.zone / 24
        }

        export function universalFromStandard(t: number, locale: Locality): number {
            return t - locale.zone / 24
        }

        export function standardFromLocal(t: number, locale: Locality): number {
            return standardFromUniversal(universalFromLocal(t, locale), locale)
        }

        export function localFromStandard(t: number, locale: Locality): number {
            return localFromUniversal(universalFromStandard(t, locale), locale)
        }

        export function dynamicalFromUniversal(t: number): number {
            const dyear = astro.JDEToBesselianYear(JD.fromFixed(t))
            return t + deltat.deltaT(dyear)/SECONDS_PER_DAY
        }

        export function universalFromDynamical(t: number): number {
            const dyear = astro.JDEToBesselianYear(JD.fromFixed(t))
            return t - deltat.deltaT(dyear)/SECONDS_PER_DAY
        }

        export function apparentFromLocal(t: number): number {
            return t + eqtime.e(JD.fromFixed(t), EARTH)/(2*π)
        }

        export function localFromApparent(t: number): number {
            return t - eqtime.e(JD.fromFixed(t), EARTH)/(2*π)
        }

        export function midnight(date: number, locale: Locality) {
            return standardFromLocal(localFromApparent(Math.floor(date)), locale)
        }

        export function midday(date: number, locale: Locality) {
            return standardFromLocal(localFromApparent(Math.floor(date) + 0.5), locale)
        }
    }

    // MOVE TO namespace Astronomy?
    // TODO add parameter locale, so that equinox occuring on same day in the locale is returned
    function _vernalEquinoxOnOrBefore(date: number): number {
        const year = Gregorian.yearFromFixed(date)
        let spring = JD.toFixed(solstice.march(year))
        if (spring > date) {
            spring = JD.toFixed(solstice.march(year - 1))
        }
        return spring
    }

    function _autumnalEquinoxOnOrBefore(date: number): number {
        const year = Gregorian.yearFromFixed(date)
        let autumn = JD.toFixed(solstice.september(year))
        if (autumn > date) {
            autumn = JD.toFixed(solstice.september(year - 1))
        }
        return autumn
    }

    export function momentFromDepression(approx: number, locale: Locality, angle: number): number {
        const t = Time.universalFromLocal(approx, locale)
        const δ = solar.apparentEquatorial(JD.fromFixed(t)).dec // in radians
        const morning = _mod(approx, 1) < 0.5 ? -1 : 1
        const sineOffset = Math.tan(locale.latitude * D2R) * Math.tan(δ)
            + Math.sin(angle * D2R) / (Math.cos(δ) * Math.cos(locale.latitude * D2R))
        if (Math.abs(sineOffset) > 1) {
            return null
        }
        return Time.localFromApparent(Math.floor(approx) + 0.5
            + morning * (_mod(0.5 + Math.asin(sineOffset) / (2 * π), 1) - 0.25))
    }

    export function dawn(date: number, locale: Locality, angle: number): number {
        const approx = momentFromDepression(date + 0.25, locale, angle)
        const x = approx == null ? date : approx
        const result = momentFromDepression(x, locale, angle)
        if (result == null) {
            return null
        }
        return Time.standardFromLocal(result, locale)
    }

    export function dusk(date: number, locale: Locality, angle: number): number {
        const approx = momentFromDepression(date + 0.75, locale, angle)
        const x = approx == null ? date + 0.99 : approx
        const result = momentFromDepression(x, locale, angle)
        if (result == null) {
            return null
        }
        return Time.standardFromLocal(result, locale)
    }

    export namespace Astronomy {

        // = astro.BesselianYear // NB: Reingold & Dershowitz give 365.242189
        export const MEAN_TROPICAL_YEAR = 365.242189

        export const MEAN_SYNODIC_MONTH: number = moonphase.meanLunarMonth

        function _angle(elevation: number): number {
            const h = Math.max(0, elevation)
            const R = 6371000 // earth radius in meters
            const dip = Math.acos(R / (R + h)) / D2R
            return 5 / 6 + dip
        }

        export function sunrise(date: number, locale: Locality): number {
            return dawn(date, locale, _angle(locale.elevation))
        }
        export function sunset(date: number, locale: Locality): number {
            return dusk(date, locale, _angle(locale.elevation))
        }

        export function isCrescentVisible(date: number, locale: Locality): boolean {
            // method from meeus: ... should be adapted to 4.5° instead of 6°
            /*
            let _date = new julian.Calendar().fromJD(JD.fromFixed(date-1))
            let sr = new Sunrise(_date, locale.latitude, -locale.longitude);  // ADD REFRACTION ???
            let jde = sr.dusk().toJDE()
            */
            // method from Reingold&Dershowitz:
            const t = Time.universalFromStandard(dusk(date - 1, locale, 4.5), locale)
            const jde = JD.fromFixed(t)
            // console.log(`JDE at dusk (astronomia/meeus vs R&D): ${jde} vs ${jde2}`)
            const lunarPos = moonposition.position(jde)
            const solarPos = solar.trueLongitude(astro.J2000Century(jde))
            const phase = _mod(lunarPos.lon - solarPos.lon, 2 * π)
            const eclMoon = new coord.Ecliptic(lunarPos.lon, lunarPos.lat)
            const localCoords = new globe.Coord(locale.latitude * D2R, -locale.longitude * D2R)
            const ε = nutation.meanObliquityLaskar(jde)
            const st = sidereal.apparent(jde)
            const lunarAltitude = eclMoon.toEquatorial(ε).toHorizontal(localCoords, st).alt
            const arcOfLight = Math.acos(Math.cos(lunarPos.lat) * Math.cos(phase))
            // let phaseDeg = phase/D2R, arcOfLightDeg = arcOfLight/D2R, lunarAltitudeDeg = lunarAltitude/D2R
            const crit = (0 < phase && phase < 90 * D2R
                && 10.6 * D2R <= arcOfLight && arcOfLight <= 90 * D2R
                && lunarAltitude > 4.1 * D2R)
            // tslint:disable-next-line:max-line-length
            // if (debug) console.log(`>>> at jde ${jde} (${_dusk.toISOString()}): lunarPos ${lunarPos.lon/D2R},${lunarPos.lat/D2R}, visibility ${crit}, criteria: phase=${phase/D2R}, arcOfLight=${arcOfLight/D2R}, altitude=${lunarAltitude/D2R}`)
            return crit
        }

        export function phasisOnOrBefore(date: number, locale: Locality): number {
            // const t = Time.dynamicalFromUniversal(Time.universalFromStandard(date + 1, locale))
            const jde = JD.fromFixed(date + 1)
            const lunarPos = moonposition.position(jde)
            const solarPos = solar.true2000(astro.J2000Century(jde))
            const phase = _mod(lunarPos.lon - solarPos.lon, 2 * π) / (2 * π)
            const mean = date - Math.floor(MEAN_SYNODIC_MONTH * phase)
            // tslint:disable-next-line:max-line-length
            // console.log(`solar long ${solarPos.lon/D2R}, lunar long ${lunarPos.lon/D2R}, phase = ${phase/D2R}, mean = ${mean}`)
            let tau = mean - 2
            if (date - mean <= 3 && !isCrescentVisible(date, locale)) {
                tau = mean - 30
            }
            let crescent = tau
            for (let i = 0; i < 30; i++) {
                crescent = tau + i
                if (isCrescentVisible(crescent, locale)) {
                    break
                }
            }
            return crescent
        }

        /*
        export function lastNewMoon(date: number): number {
            let jde = JD.fromFixed(date)
            let year = astro.JDEToBesselianYear(jde) // NOT SURE ABOUT THIS ONE !!!
            let newMoon = moonphase.newMoon(year)
            if (newMoon > jde) {
                newMoon = moonphase.newMoon(year-MEAN_SYNODIC_MONTH/MEAN_TROPICAL_YEAR)
            }
            return JD.toFixed(newMoon)
        }

        export function phasisOnOrBeforeAlt(date, locale, debug) {
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
    }
    export namespace ObservationalIslamic {

        const CAIRO: Locality = {
            latitude : 30.1,
            longitude: 31.3,
            elevation: 200,
            zone : 2,
        }

        export function toFixed(year: number, month:number, day:number, locale?: Locality): number {
            if (!locale) {
                locale = CAIRO
            }
            const midMonth = Islamic.EPOCH + Math.floor((12 * (year - 1) + month - 0.5) * Astronomy.MEAN_SYNODIC_MONTH)
            return Astronomy.phasisOnOrBefore(midMonth, locale) + day - 1
        }

        export function fromFixed(date: number, locale?: Locality): DateArray {
            if (!locale) {
                locale = CAIRO
            }
            // console.log(`>>> date: ${gregorianFromFixed(date)}`)
            const crescent = Astronomy.phasisOnOrBefore(date, locale)
            // console.log(`>>> day of last crescent: ${gregorianFromFixed(crescent)}`)
            const elapsedMonths = Math.round((crescent - Islamic.EPOCH) / Astronomy.MEAN_SYNODIC_MONTH)
            // console.log(`>>> elapsed months: ${elapsedMonths}`)
            const year = Math.floor(elapsedMonths / 12) + 1
            const month = _mod(elapsedMonths, 12) + 1
            const day = date - crescent + 1
            return toArray(year, month, day)
        }
    }

    // ---------------- PERSIAN CALENDAR -------------------//
    export namespace Persian {

        export const EPOCH = 226896 // = Julian.toFixed(622,3,19)

        export const TEHRAN: Locality = {
            latitude: 35.68,
            longitude: 51.42,
            elevation: 1100,
            zone: 3.5,
        }

        function middayInTehran(date: number): number {
            return Time.universalFromStandard(Time.midday(date, TEHRAN), TEHRAN)
        }

        function newYearOnOrBefore(date: number): number {
            const previousEquinox = _vernalEquinoxOnOrBefore(date + 1) // FIXME
            if (previousEquinox < middayInTehran(previousEquinox)) {
                return Math.floor(previousEquinox)
            } else {
                return Math.floor(previousEquinox) + 1
            }
        }

        export function toFixed(year: number, month: number, day: number): number {
            const _y = (year > 0 ? year - 1 : year)
            const newYear = newYearOnOrBefore(EPOCH + 180 +
                Math.floor(Astronomy.MEAN_TROPICAL_YEAR * _y))
            const _m = (month > 7 ? 30 * (month - 1) + 6 : 31 * (month - 1))
            return newYear - 1 + _m + day
        }

        export function fromFixed(date: number): DateArray {
            const newYear = newYearOnOrBefore(date)
            const y = Math.round((newYear - EPOCH) / Astronomy.MEAN_TROPICAL_YEAR) + 1
            const year = (y > 0 ? y : y - 1)
            const dayOfYear = date - Persian.toFixed(year, 1, 1) + 1
            if (Math.floor(dayOfYear) === 1) {
                return toArray(year, 1, dayOfYear)
            }
            const month = (dayOfYear > 186 ? Math.ceil((dayOfYear - 6) / 30) : Math.ceil(dayOfYear / 31))
            const day = date - Persian.toFixed(year, month, 1) + 1
            return toArray(year, month, day)
        }

        export function isLeapYear(year: number): boolean {
            return (toFixed(year + 1, 1, 1) - toFixed(year, 1, 1) === 366)
        }
    }

    // ---------------- FRENCH REVOLUTIONARY CALENDAR -------------------//
    export namespace French {
        export const EPOCH = 654415 // Gregorian.toFixed(1792,9,22)
        export const PARIS: Locality = {
            latitude: 48 + 50 / 60 + 11 / 3600,
            longitude: 2 + 20 / 60 + 14 / 3600,
            elevation: 27,
            zone: 1,
        }

        function midnightInParis(date: number): number {
            return Time.universalFromStandard(Time.midnight(date + 1, PARIS), PARIS)
        }

        function newYearOnOrBefore(date: number): number {
            const previousEquinox = _autumnalEquinoxOnOrBefore(date + 1)
            if (previousEquinox < midnightInParis(previousEquinox)) {
                return Math.floor(previousEquinox)
            } else {
                return Math.floor(previousEquinox) + 1
            }
        }

        export function toFixed(year: number, month: number, day: number): number {
            const newYear = newYearOnOrBefore(Math.floor(EPOCH + 180 + Astronomy.MEAN_TROPICAL_YEAR * (year - 1)))
            return newYear - 1 + 30 * (month - 1) + day
        }

        export function fromFixed(date: number): DateArray {
            const newYear = newYearOnOrBefore(date)
            const year = Math.round((newYear - EPOCH) / Astronomy.MEAN_TROPICAL_YEAR) + 1
            const month = Math.floor((date - newYear) / 30) + 1
            const day = _mod(date - newYear, 30) + 1
            return toArray(year, month, day)
        }

        export function isLeapYear(year: number): boolean {
            return (toFixed(year + 1, 1, 1) - toFixed(year, 1, 1) === 366)
        }
        /**
         * Modified French Revolutionary Calendar (arithmetical)
         */
        export namespace Modified {

            export function isLeapYear(year: number): boolean {
                return (_mod(year, 4) === 0
                    && [100, 200, 300].indexOf(_mod(year, 400)) === -1
                    && _mod(year, 4000) !== 0)
            }
    
            export function toFixed(year: number, month: number, day: number): number {
                return EPOCH - 1 + 365 * (year - 1)
                    + Math.floor((year - 1) / 4)
                    - Math.floor((year - 1) / 100)
                    + Math.floor((year - 1) / 400)
                    - Math.floor((year - 1) / 4000)
                    + 30 * (month - 1) + day
            }
    
            export function fromFixed(date: number): DateArray {
                let year = Math.floor(4000 * (date - EPOCH + 2) / 1460969) + 1
                if (date < toFixed(year, 1, 1)) {
                    year = year - 1
                }
                const month = Math.floor((date - toFixed(year, 1, 1)) / 30) + 1
                const day = date - toFixed(year, month, 1) + 1
                return toArray(year, month, day)
            }
        }
    }

    // ---------------- MAYAN CALENDAR -------------------//
    export namespace Mayan {

        export namespace LongCount {

            export const EPOCH = -1137142

            export function toFixed(baktun: number, katun: number, tun: number, uinal: number, kin: number): number {
                return EPOCH + baktun * 144000 + katun * 7200 + tun * 360 + uinal * 20 + kin
            }

            export function fromFixed(date: number): [number, number, number, number, number] {
                const longCount = date - EPOCH
                const baktun = Math.floor(longCount / 144000)
                const dayOfBaktun = _mod(longCount, 144000)
                const katun = Math.floor(dayOfBaktun / 7200)
                const dayOfKatun = _mod(dayOfBaktun, 7200)
                const tun = Math.floor(dayOfKatun / 360)
                const dayOfTun = _mod(dayOfKatun, 360)
                const uinal = Math.floor(dayOfTun / 20)
                const kin = _mod(dayOfTun, 20)
                return [baktun, katun, tun, uinal, kin]
            }
        }
        export namespace Haab {

            export function ordinal(month:number, day:number): number {
                return (month - 1) * 20 + day
            }

            export const EPOCH = Mayan.LongCount.EPOCH - ordinal(18, 8)

            export function fromFixed(date: number): [number, number] {
                const count = _mod(date - EPOCH, 365)
                const day = _mod(count, 20)
                const month = Math.floor(count / 20) + 1
                return [month, day]
            }

            export function onOrBefore(haabMonth: number, haabDay: number, date: number) {
                return date - _mod(date - EPOCH - ordinal(haabMonth, haabDay), 365)
            }
        }
        export namespace Tzolkin {

            export function ordinal(number: number, name: number): number {
                return _mod(number - 1 + 39 * (number - name), 260)
            }

            export const EPOCH = Mayan.LongCount.EPOCH - ordinal(4, 20)

            export function fromFixed(date: number): [number, number] {
                const count = date - EPOCH + 1
                const number = _amod(count, 13)
                const name = _amod(count, 20)
                return [number, name]
            }

            export function onOrBefore(tzolkinNumber: number, tzolkinName: number, date: number): number {
                return date - _mod(date - EPOCH - ordinal(tzolkinNumber, tzolkinName), 260)
            }
        }

        export function roundOnOrBefore(haabMonth: number, haabDay: number, tzolkinNumber: number, tzolkinName: number, date: number): number {
            const haabCount = Haab.ordinal(haabMonth, haabDay) + LongCount.EPOCH
            const tzolkinCount = Tzolkin.ordinal(tzolkinNumber, tzolkinName) + LongCount.EPOCH
            const diff = tzolkinCount - haabCount
            if (_mod(diff, 5) === 0) {
                return date - _mod(date - haabCount - 365 * diff, 18980)
            }
            return null
        }
    }
}
