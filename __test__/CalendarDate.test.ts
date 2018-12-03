import {CalendarDate, CalendarType, DateBuilder} from '../src/CalendarDate';
import {Calendars, Weekday} from "../src/Calendars"
import * as csvparse from 'csv-parse/lib/sync';
import * as fs  from 'fs';
import * as path from 'path';

function fixture(name: string): Array<any> {
    let input = fs.readFileSync(path.join(__dirname, 'test_data', name), {encoding: "utf8"});
    return csvparse(input, {
        columns: true
      })
}

// function numericArray(record: any, y: string, m: string, d: string): number[] {
//     return [parseInt(record[y]),parseInt(record[m]),parseInt(record[d]),0,0,0]
// }
function numericArray(record: any, columns: string[], zeroPadding = true): number[] {
    const arr = columns.map( x => parseInt(record[x]))
    return (zeroPadding ? arr.concat([0,0,0]) : arr);
}

describe('simple tests', () => {
    test('test empty constructor', () => {
        const calDateCurrent = new CalendarDate()
        const jsDateCurrent = new Date()
        expect(calDateCurrent.toJulianDayNumber()).toBeGreaterThan(0)
        expect(calDateCurrent.weekday()).toBeGreaterThanOrEqual(0)
        expect(calDateCurrent.weekday()).toBeLessThan(7)
        expect(calDateCurrent.weekday()).toBe(jsDateCurrent.getDay())
        expect(Math.floor(calDateCurrent.toDate().getMilliseconds()/1000)).toBe(Math.floor(jsDateCurrent.getMilliseconds()/1000))
    })
    test('test constructor with rd argument', () => {
        const cd = new CalendarDate(737031) // Monday 3 December 2018
        expect(cd.toDate().toISOString()).toBe('2018-12-03T00:00:00.000Z')
        expect(cd.weekday()).toBe(Weekday.Monday)
        expect(cd.add(2).weekday()).toBe(Weekday.Wednesday)
        expect(cd.toJulianDayNumber()).toBe(737031 - Calendars.JD.EPOCH)
        expect(cd.closestWeekdayAfter(Weekday.Thursday).toRD()).toBe(cd.add(3).toRD())
        expect(cd.isLeapYear()).toBe(false)
    })
    test('test constructor with specific Date', () => {
        const cd = new CalendarDate(new Date('2018-12-03T00:00:00.000Z')) // 3 December 2018
        expect(cd.toDate().toISOString()).toBe('2018-12-03T00:00:00.000Z')
        expect(cd.toRD()).toBe(737031)
    })
    test('test date builder gregorian with zone', () => {
        const cd = new DateBuilder(CalendarType.Gregorian).year(2018).month(12).day(3).hours(9).min(32).zone(1).build()
        expect(cd.toRD()).toBeCloseTo(737031 + 9/24 + 32/(24*60) - 1/24)
        // expect(cd.toISOString()).toBe('2018-12-03T09:32:00.000+01:00') //FIXME this gives 9:31:59.999 !!!
    })
    test('test iso date', () => {
        const cd = new DateBuilder(CalendarType.ISO).year(2019).week(1).day(1).build()
        expect(cd.convertTo(CalendarType.Gregorian)).toEqual([2018,12,31,0,0,0])
    })
})

describe('test dates1.csv for: JD, MJD, Weekday and calendars: Egyptian, Gregorian, ISO, Coptic, Julian, Roman, Armenian', () => {
    const data1 = fixture('dates1.csv')
    //expect(data1.length).toBeGreaterThan(0);
    data1.forEach((record) => {
        let rd = parseInt(record["RD"])
        test(`test calendar conversions for RD date ${rd}`, () => {
            let d = CalendarDate.fromRD(rd);
            expect(d.toJulianDayNumber().toString())
                .toBe(record["JD"]);
            expect(Calendars.MJD.fromFixed(rd).toString())
                .toBe(record["MJD"]);
            expect(d.weekday())
                .toBe(Weekday[record["Weekday"]]);
            expect(d.convertTo(CalendarType.Egyptian))
                .toEqual(numericArray(record,["EgyptianYear","EgyptianMonth","EgyptianDay"]));
            expect(d.convertTo(CalendarType.Gregorian))
                .toEqual(numericArray(record,["GregorianYear","GregorianMonth","GregorianDay"]));
            expect(d.convertTo(CalendarType.Coptic))
                .toEqual(numericArray(record,["CopticYear","CopticMonth","CopticDay"]));
            expect(d.convertTo(CalendarType.Julian))
                .toEqual(numericArray(record,["JulianYear","JulianMonth","JulianDay"]));
            expect(d.convertTo(CalendarType.Armenian))
                .toEqual(numericArray(record,["ArmenianYear","ArmenianMonth","ArmenianDay"]));
            expect(d.convertTo(CalendarType.ISO))
                .toEqual(numericArray(record,["ISOYear","ISOMonth","ISODay"]));
        })
    })
})

describe('test dates2.csv for calendars: Ethiopic, Islamic, Mayan', () => {
    const data2 = fixture('dates2.csv')
    // expect(data2.length).toBeGreaterThan(0);
    data2.forEach( record => {
        let rd = parseInt(record["RD"])
        test(`test calendar conversions for RD date ${rd}`, () => {
            let d = CalendarDate.fromRD(rd)
            expect(d.convertTo(CalendarType.Ethiopic))
                .toEqual(numericArray(record,["EthiopicYear","EthiopicMonth","EthiopicDay"]));
            expect(d.convertTo(CalendarType.Islamic))
                .toEqual(numericArray(record,["IslamicYear","IslamicMonth","IslamicDay"]));
            expect(d.convertTo(CalendarType.Islamic))
                .toEqual(numericArray(record,["IslamicYear","IslamicMonth","IslamicDay"]));
            expect(d.convertTo(CalendarType.ObservationalIslamic))
                .toEqual(numericArray(record,["ObservationalIslamicYear","ObservationalIslamicMonth","ObservationalIslamicDay"]));
            expect(d.convertTo(CalendarType.MayanLongCount))
                .toEqual(numericArray(record, ["MayanLongCountBaktun","MayanLongCountKatun","MayanLongCountTun","MayanLongCountUinal","MayanLongCountKin"], false))
            expect(d.convertTo(CalendarType.MayanHaab))
                .toEqual(numericArray(record, ["MayanHaabMonth","MayanHaabDay"], false))
            expect(d.convertTo(CalendarType.MayanTzolkin))
                .toEqual(numericArray(record, ["MayanTzolkinNumber","MayanTzolkinName"], false))
        })
    })
})

// STILL MISSING: BALINESE
describe('test dates3.csv for calendars: Hebrew + Persian + French', () => {
    const data3 = fixture('dates3.csv')
    //expect(data3.length).toBeGreaterThan(0);
    data3.forEach( record => {
        let rd = parseInt(record["RD"])
        test(`test calendar conversions for RD date ${rd}`, () => {
            let d = CalendarDate.fromRD(rd)
            expect(d.convertTo(CalendarType.Hebrew))
                .toEqual(numericArray(record,["HebrewYear","HebrewMonth","HebrewDay"]));
            expect(d.convertTo(CalendarType.Persian))
                .toEqual(numericArray(record,["PersianYear","PersianMonth","PersianDay"]));
            expect(d.convertTo(CalendarType.French))
                .toEqual(numericArray(record,["FrenchYear","FrenchMonth","FrenchDay"]));
            expect(d.convertTo(CalendarType.ModifiedFrench))
                .toEqual(numericArray(record,["ModifiedFrenchYear","ModifiedFrenchMonth","ModifiedFrenchDay"]));
        })
    })
})

/* NOT IMPLEMENTED YET
describe('test dates4.csv for calendars: Chinese + Old Hindu + Hindu', () => {
    const data4 = fixture('dates4.csv')
    //expect(data3.length).toBeGreaterThan(0);
    data4.forEach( record => {
        let rd = parseInt(record["RD"])
        test(`test calendar conversions for RD date ${rd}`, () => {
            let d = CalendarDate.fromRD(rd)
            // expect(d.convertTo(CalendarType.Chinese))
            //     .toEqual(numericArray(record,["ChineseCycle","ChineseYear","ChineseMonth","ChineseDay","ChineseNameOfDayStem","ChineseNameOfDayBranch","ChineseNextZhongqi"]));
            // let expectedLeap = record["ChineseMonthLeap"] == "t" ? true : false;
            // expect(d.isChineseMonthLeap()).toEqual(expectedLeap)
            // expect(d.convertTo(CalendarType.OldHinduSolar))
            //     .toEqual(numericArray(record,["OldHinduSolarYear","OldHinduSolarMonth","OldHinduSolarDay"]));
            // expect(d.convertTo(CalendarType.OldHinduLunar))
            //     .toEqual(numericArray(record,["OldHinduLunarYear","OldHinduLunarMonth","OldHinduLunarDay"]));
            // expectedLeap = record["OldHinduLunarMonthLeap"] == "t" ? true : false;
            // expect(d.isOldHinduLunarMonthLeap()).toEqual(expectedLeap)
            // expect(d.convertTo(CalendarType.HinduSolar))
            //     .toEqual(numericArray(record,["HinduSolarYear","HinduSolarMonth","HinduSolarDay"]));
            // expect(d.convertTo(CalendarType.HinduLunar))
            //     .toEqual(numericArray(record,["HinduLunarYear","HinduLunarMonth","HinduLunarDay"]));
            // expectedLeap = record["HinduLunarMonthLeap"] == "t" ? true : false;
            // expect(d.isHinduLunarMonthLeap()).toEqual(expectedLeap)
            // expectedLeap = record["HinduLunarDayLeap"] == "t" ? true : false;
            // expect(d.isHinduLunarDayLeap()).toEqual(expectedLeap)

        })
    })
})
*/

//dates1.csv: RD,Weekday,JD,MJD,GregorianYear,GregorianMonth,GregorianDay,ISOYear,ISOMonth,ISODay,JulianYear,JulianMonth,JulianDay,RomanYear,RomanMonth,RomanEvent,RomanCount,RomanLeap,EgyptianYear,EgyptianMonth,EgyptianDay,ArmenianYear,ArmenianMonth,ArmenianDay,CopticYear,CopticMonth,CopticDay
//dates2.csv: RD,EthiopicYear,EthiopicMonth,EthiopicDay,IslamicYear,IslamicMonth,IslamicDay,ObservationalIslamicYear,ObservationalIslamicMonth,ObservationalIslamicDay,BahaiMajor,BahaiCycle,BahaiYear,BahaiMonth,BahaiDay,FutureBahaiMajor,FutureBahaiCycle,FutureBahaiYear,FutureBahaiMonth,FutureBahaiDay,MayanLongCountBakun,MayanLongCountKatun,MayanLongCountTun,MayanLongCountUinal,MayanLongCountKin,MayanHaabMonth,MayanHaabDay,MayanTzolkinNumber,MayanTzolkinName
//dates3.csv: RD,HebrewYear,HebrewMonth,HebrewDay,PawukonLuang,PawukonDwiwara,PawukonTriwara,PawukonCaturwara,PawukonPancawara,PawukonSadwara,PawukonSaptawara,PawukonAsatawara,PawukonSangawara,PawukonDasawara,PersianYear,PersianMonth,PersianDay,ArithmeticPersian,ArithmeticPersianMonth,ArithmeticPersianDay,FrenchYear,FrenchMonth,FrenchDay,ModifiedFrenchYear,ModifiedFrenchMonth,ModifiedFrenchDay
// dates4.csv: RD,ChineseCycle,ChineseYear,ChineseMonth,ChineseMonthLeap,ChineseDay,ChineseNameOfDayStem,ChineseNameOfDayBranch,ChineseNextZhongqi,OldHinduSolarYear,OldHinduSolarMonth,OldHinduSolarDay,HinduSolarYear,HinduSolarMonth,HinduSolarDay,OldHinduLunarYear,OldHinduLunarMonth,OldHinduLunarMonthLeap,OldHinduLunarDay,HinduLunarYear,HinduLunarMonth,HinduLunarMonthLeap,HinduLunarDay,HinduLunarDayLeap
// dates5.csv: RD,SolarLongitudeNoonUT,SummerSolsticeRD,LunarLongitudeMidnight,NextNewMoonRD,DawnInParis,DawnInParisHMS,SunsetInJerusalem,SunsetInJerusalemHMS