import {Calendars, Weekday} from "./Calendars"

export enum CalendarType {
    Gregorian,
    Julian,
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

export class CalendarDate {

    public static fromFixed(fixed: number): CalendarDate {
        return new CalendarDate(Calendars.fromFixed(fixed))
    }
    private fixed: number
    private date: Date

    constructor(date: Date) {
        this.date = date
        this.fixed = Calendars.toFixed(date)
    }

    public convertTo(type: CalendarType): number[] {
        switch (type) {
            case CalendarType.Armenian:
                return Calendars.Armenian.fromFixed(this.fixed)
            case CalendarType.Coptic:
                return Calendars.Coptic.fromFixed(this.fixed)
            case CalendarType.Egyptian:
                return Calendars.Egyptian.fromFixed(this.fixed)
            case CalendarType.Ethiopic:
                return Calendars.Ethiopic.fromFixed(this.fixed)
            case CalendarType.Gregorian:
                return Calendars.Gregorian.fromFixed(this.fixed)
            case CalendarType.Hebrew:
                return Calendars.Hebrew.fromFixed(this.fixed)
            case CalendarType.ISO:
                return Calendars.ISO.fromFixed(this.fixed)
            case CalendarType.Islamic:
                return Calendars.Islamic.fromFixed(this.fixed)
            case CalendarType.ObservationalIslamic:
                return Calendars.ObservationalIslamic.fromFixed(this.fixed)
            case CalendarType.Julian:
                return Calendars.Julian.fromFixed(this.fixed)
            case CalendarType.Persian:
                return Calendars.Persian.fromFixed(this.fixed)
            case CalendarType.French:
                return Calendars.French.fromFixed(this.fixed)
            case CalendarType.ModifiedFrench:
                return Calendars.French.Modified.fromFixed(this.fixed)
            case CalendarType.MayanLongCount:
                return Calendars.Mayan.LongCount.fromFixed(this.fixed)
            case CalendarType.MayanHaab:
                return Calendars.Mayan.Haab.fromFixed(this.fixed)
            case CalendarType.MayanTzolkin:
                return Calendars.Mayan.Tzolkin.fromFixed(this.fixed)
            default:
                return Calendars.Gregorian.fromFixed(this.fixed)
        }
    }

    public isLeapYear(type: CalendarType): boolean {
        switch (type) {
            case CalendarType.Armenian:
                return false
            case CalendarType.Coptic:
                return Calendars.Coptic.isLeapYear(Calendars.Coptic.fromFixed(this.fixed)[0])
            case CalendarType.Egyptian:
                return false
            case CalendarType.Ethiopic:
                return Calendars.Coptic.isLeapYear(Calendars.Coptic.fromFixed(this.fixed)[0])
            case CalendarType.Gregorian:
                return Calendars.Gregorian.isLeapYear(Calendars.Gregorian.fromFixed(this.fixed)[0])
            case CalendarType.Hebrew:
                return Calendars.Hebrew.isLeapYear(Calendars.Hebrew.fromFixed(this.fixed)[0])
            case CalendarType.Islamic:
                return Calendars.Islamic.isLeapYear(Calendars.Islamic.fromFixed(this.fixed)[0])
            case CalendarType.Julian:
                return Calendars.Julian.isLeapYear(Calendars.Julian.fromFixed(this.fixed)[0])
            case CalendarType.Persian:
                return Calendars.Persian.isLeapYear(Calendars.Persian.fromFixed(this.fixed)[0])
            case CalendarType.French:
                return Calendars.French.isLeapYear(Calendars.French.fromFixed(this.fixed)[0])
            case CalendarType.ModifiedFrench:
                return Calendars.French.Modified.isLeapYear(Calendars.French.Modified.fromFixed(this.fixed)[0])
            default:
                return Calendars.Gregorian.isLeapYear(Calendars.Gregorian.fromFixed(this.fixed)[0])
        }
    }

    public toJulianDayNumber(): number {
        return Calendars.JD.fromFixed(this.fixed)
    }

    public toDate(): Date {
        return this.date
    }

    public closestWeekdayOnOrBefore(weekday: Weekday): CalendarDate {
        return new CalendarDate(Calendars.fromFixed(Calendars.weekDayOnOrBefore(this.fixed, weekday)))
    }

    public closestWeekdayAfter(weekday: Weekday): CalendarDate {
        return new CalendarDate(Calendars.fromFixed(Calendars.weekDayAfter(this.fixed, weekday)))
    }

    public weekday(): Weekday {
        return Calendars.getWeekday(this.fixed)
    }

    public add(days: number): CalendarDate {
        return new CalendarDate(Calendars.fromFixed(this.fixed + days))
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

    constructor(type: CalendarType) {
        this.t = type
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
        if (z < 12 || z > 14) {
            throw new Error("Illegal Time Zone!")
        }
        this.z = z
        return this
    }
    public build(): CalendarDate {
        const day = this.d + this.hh / 24 + this.mm / (24 * 60) + this.ss / (24 * 60 * 60) + this.z / 24
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
        return new CalendarDate(Calendars.fromFixed(fixed))
    }
}
