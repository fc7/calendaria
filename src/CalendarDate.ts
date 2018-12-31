import * as Calendars from "./Calendars"
import {Weekday} from "./Weekday"

export enum CalendarType {
    Gregorian,
    Julian,
    Roman,
    Egyptian,
    Armenian,
    Coptic,
    Ethiopic,
    ISO,
    Islamic,
    ObservationalIslamic,
    Hebrew,
    Persian,
    French,
    ModifiedFrench,
    MayanLongCount,
    MayanHaab,
    MayanTzolkin,
}

function validateTimezone(z: number): void {
    if (z < -12 || z > 14) {
        throw new Error(`Illegal Time Zone '${z}'!`)
    }
}

export class CalendarDate {

    private rd: number
    private date: Date
    private timeZone: number = 0
    constructor(date?: Date | number, timezone?: number) {
        if (!date) {
            date = new Date()
        }
        if (date instanceof Date) {
            this.date = date
            this.rd = Calendars.toFixed(date)
        } else {
            this.rd = date
            this.date = Calendars.fromFixed(date)
        }
        if (timezone) {
            validateTimezone(timezone)
            this.timeZone = timezone
        }
    }

    public toRD(): number {
        return this.rd
    }

    public toISOString(): string {
        let gDate = this.add(this.timeZone/24).convertTo(CalendarType.Gregorian)
        let padZero = (x:number): string => {
            return (x<10 ? '0'+x : String(x))
        }
        let formatSec = (x:number): string => {
            let str = x<10 ? '0' : ''
            return str + x.toFixed(3)
        }
        let tzStr = 'Z'
        let tzInt = Math.floor(this.timeZone)
        let tzFrac = Math.round((this.timeZone - tzInt)*60)
        if (this.timeZone != 0) {
            tzStr = this.timeZone<0 ? '-' : '+'
            tzStr += padZero(tzInt) + ':' + padZero(tzFrac)
        }
        return gDate.splice(0,3).map(padZero).join('-') 
            + 'T' 
            + gDate.splice(0,2).map(padZero).join(':') 
            + ':' 
            + formatSec(gDate.pop()) 
            + tzStr
    }

    public convertTo(type: CalendarType): number[] {
        switch (type) {
            case CalendarType.Armenian:
                return Calendars.Armenian.fromFixed(this.rd)
            case CalendarType.Coptic:
                return Calendars.Coptic.fromFixed(this.rd)
            case CalendarType.Egyptian:
                return Calendars.Egyptian.fromFixed(this.rd)
            case CalendarType.Ethiopic:
                return Calendars.Ethiopic.fromFixed(this.rd)
            case CalendarType.Gregorian:
                return Calendars.Gregorian.fromFixed(this.rd)
            case CalendarType.Hebrew:
                return Calendars.Hebrew.fromFixed(this.rd)
            case CalendarType.ISO:
                return Calendars.ISO.fromFixed(this.rd)
            case CalendarType.Islamic:
                return Calendars.Islamic.fromFixed(this.rd)
            case CalendarType.ObservationalIslamic:
                return Calendars.ObservationalIslamic.fromFixed(this.rd)
            case CalendarType.Julian:
                return Calendars.Julian.fromFixed(this.rd)
            case CalendarType.Roman:
                const numerify = (x: any): number => {return typeof x == 'boolean' ? (x ? 1 : 0) : x }
                return Calendars.Roman.fromFixed(this.rd).map(numerify)
            case CalendarType.Persian:
                return Calendars.Persian.fromFixed(this.rd)
            case CalendarType.French:
                return Calendars.French.fromFixed(this.rd)
            case CalendarType.ModifiedFrench:
                return Calendars.French.Modified.fromFixed(this.rd)
            case CalendarType.MayanLongCount:
                return Calendars.Mayan.LongCount.fromFixed(this.rd)
            case CalendarType.MayanHaab:
                return Calendars.Mayan.Haab.fromFixed(this.rd)
            case CalendarType.MayanTzolkin:
                return Calendars.Mayan.Tzolkin.fromFixed(this.rd)
            default:
                return Calendars.Gregorian.fromFixed(this.rd)
        }
    }

    public isLeapYear(type?: CalendarType): boolean {
        switch (type) {
            case CalendarType.Armenian:
                return false
            case CalendarType.Coptic:
                return Calendars.Coptic.isLeapYear(Calendars.Coptic.fromFixed(this.rd)[0])
            case CalendarType.Egyptian:
                return false
            case CalendarType.Ethiopic:
                return Calendars.Coptic.isLeapYear(Calendars.Coptic.fromFixed(this.rd)[0])
            case CalendarType.Gregorian:
            case CalendarType.ISO:
                return Calendars.Gregorian.isLeapYear(Calendars.Gregorian.fromFixed(this.rd)[0])
            case CalendarType.Hebrew:
                return Calendars.Hebrew.isLeapYear(Calendars.Hebrew.fromFixed(this.rd)[0])
            case CalendarType.Islamic:
                return Calendars.Islamic.isLeapYear(Calendars.Islamic.fromFixed(this.rd)[0])
            case CalendarType.Julian:
                return Calendars.Julian.isLeapYear(Calendars.Julian.fromFixed(this.rd)[0])
            case CalendarType.Persian:
                return Calendars.Persian.isLeapYear(Calendars.Persian.fromFixed(this.rd)[0])
            case CalendarType.French:
                return Calendars.French.isLeapYear(Calendars.French.fromFixed(this.rd)[0])
            case CalendarType.ModifiedFrench:
                return Calendars.French.Modified.isLeapYear(Calendars.French.Modified.fromFixed(this.rd)[0])
            default:
                return Calendars.Gregorian.isLeapYear(Calendars.Gregorian.fromFixed(this.rd)[0])
        }
    }

    public dayOfYear(type?: CalendarType): number {
        let firstDay = 0
        switch (type) {
            case CalendarType.Armenian:
                firstDay = Calendars.Armenian.toFixed(Calendars.Armenian.fromFixed(this.rd)[0],1,1)
            case CalendarType.Coptic:
                firstDay = Calendars.Coptic.toFixed(Calendars.Coptic.fromFixed(this.rd)[0],1,1)
            case CalendarType.Egyptian:
                firstDay = Calendars.Egyptian.toFixed(Calendars.Egyptian.fromFixed(this.rd)[0],1,1)
            case CalendarType.Ethiopic:
                firstDay = Calendars.Ethiopic.toFixed(Calendars.Ethiopic.fromFixed(this.rd)[0],1,1)
            case CalendarType.Gregorian:
                firstDay = Calendars.Gregorian.toFixed(Calendars.Gregorian.fromFixed(this.rd)[0],1,1)
            case CalendarType.ISO:
                firstDay = Calendars.ISO.toFixed(Calendars.ISO.fromFixed(this.rd)[0],1,1)
            case CalendarType.Hebrew:
                firstDay = Calendars.Hebrew.toFixed(Calendars.Hebrew.fromFixed(this.rd)[0],1,1)
            case CalendarType.Islamic:
                firstDay = Calendars.Islamic.toFixed(Calendars.Islamic.fromFixed(this.rd)[0],1,1)
            case CalendarType.Julian:
            case CalendarType.Roman:
                firstDay = Calendars.Julian.toFixed(Calendars.Julian.fromFixed(this.rd)[0],1,1)
            case CalendarType.Persian:
                firstDay = Calendars.Persian.toFixed(Calendars.Persian.fromFixed(this.rd)[0],1,1)
            case CalendarType.French:
                firstDay = Calendars.French.toFixed(Calendars.French.fromFixed(this.rd)[0],1,1) 
            case CalendarType.ModifiedFrench:
                firstDay = Calendars.French.Modified.toFixed(Calendars.French.Modified.fromFixed(this.rd)[0],1,1)
            default:
                firstDay = Calendars.Gregorian.toFixed(Calendars.Gregorian.fromFixed(this.rd)[0],1,1)
        }
        return this.rd - firstDay + 1
    }

    public toJulianDayNumber(): number {
        return Calendars.JD.fromFixed(this.rd)
    }

    public toDate(): Date {
        return this.date
    }

    public closestWeekdayOnOrBefore(weekday: Weekday): CalendarDate {
        return new CalendarDate(Calendars.fromFixed(Calendars.weekdayOnOrBefore(this.rd, weekday)))
    }

    public closestWeekdayAfter(weekday: Weekday): CalendarDate {
        return new CalendarDate(Calendars.fromFixed(Calendars.weekdayAfter(this.rd, weekday)))
    }

    public weekday(): Weekday {
        return Calendars.getWeekday(this.rd)
    }

    public add(days: number): CalendarDate {
        return new CalendarDate(Calendars.fromFixed(this.rd + days))
    }
}

export class DateBuilder {
    public t: CalendarType
    public y: number = 1
    public m: number = 1
    public w: number = 1
    public d: number = 1
    public hh: number = 0
    public mm: number = 0
    public ss: number = 0
    public z: number = 0

    constructor(type: CalendarType, ...date: number[]) {
        this.t = type
        const len = date.length
        if (len>0) {
                this.y = date[0]
            if (len>1) {
                if (type == CalendarType.ISO) {
                    this.w = date[1]
                } else {
                    this.m = date[1]
                }
            }
            if (len>2) {
                this.d = date[2]
            }
            if (len>3) {
                this.hh = date[3]
            }
            if (len>4) {
                this.mm = date[4]
            }
            if (len>5) {
                this.ss = date[5]
            }
            if (len>6) {
                this.z = date[6]
            }
        }
    }

    public year(y: number): DateBuilder {
        this.y = y
        return this
    }
    public month(m: number): DateBuilder {
        this.m = m
        return this
    }
    public week(w: number): DateBuilder {
        if (this.t != CalendarType.ISO) {
            throw new Error("The week method only applies for the ISO calendar")
        }
        this.w = w
        return this
    }
    public day(d: number): DateBuilder {
        this.d = d
        return this
    }
    public hours(hh: number): DateBuilder {
        this.hh = hh
        return this
    }
    public min(mm: number): DateBuilder {
        this.mm = mm
        return this
    }
    public sec(ss: number): DateBuilder {
        this.ss = ss
        return this
    }
    public zone(z: number): DateBuilder {
        validateTimezone(z)
        this.z = z
        return this
    }
    public build(): CalendarDate {
        const day = this.d + this.hh / 24 + this.mm / (24 * 60) + this.ss / (24 * 60 * 60) - this.z / 24
        let fixed
        switch (this.t) {
            case CalendarType.Armenian:
                fixed = Calendars.Armenian.toFixed(this.y, this.m, day)
                break
            case CalendarType.Coptic:
                fixed = Calendars.Coptic.toFixed(this.y, this.m, day)
                break
            case CalendarType.Egyptian:
                fixed = Calendars.Egyptian.toFixed(this.y, this.m, day)
                break
            case CalendarType.Ethiopic:
                fixed = Calendars.Ethiopic.toFixed(this.y, this.m, day)
                break
            case CalendarType.Gregorian:
                fixed = Calendars.Gregorian.toFixed(this.y, this.m, day)
                break
            case CalendarType.Hebrew:
                fixed = Calendars.Hebrew.toFixed(this.y, this.m, day)
                break
            case CalendarType.Islamic:
                fixed = Calendars.Islamic.toFixed(this.y, this.m, day)
                break
            case CalendarType.ISO:
                fixed = Calendars.ISO.toFixed(this.y, this.w, day)
                break
            case CalendarType.ObservationalIslamic:
                fixed = Calendars.ObservationalIslamic.toFixed(this.y, this.m, day)
                break
            case CalendarType.Julian:
                fixed = Calendars.Julian.toFixed(this.y, this.m, day)
                break
            case CalendarType.Persian:
                fixed = Calendars.Persian.toFixed(this.y, this.m, day)
                break
            case CalendarType.French:
                fixed = Calendars.French.toFixed(this.y, this.m, day)
                break
            case CalendarType.ModifiedFrench:
                fixed = Calendars.French.Modified.toFixed(this.y, this.m, day)
                break
            default:
                fixed = Calendars.Gregorian.toFixed(this.y, this.m, day)
                break
        }
        return new CalendarDate(fixed, this.z)
    }
}
