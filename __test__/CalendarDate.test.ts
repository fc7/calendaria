import {CalendarDate, CalendarType} from '../src/CalendarDate';
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
function numericArray(record: any, columns: string[], zeroPadding?: boolean): number[] {
    let padding = true
    if (zeroPadding !== undefined) {
        padding = zeroPadding
    }
    const arr = columns.map( x => parseInt(record[x]))
    return (padding ? arr.concat([0,0,0]) : arr);
}

describe('test dates1.csv for calendars: JD, Egyptian, Gregorian, Coptic, Julian, Armenian', () => {
    const data1 = fixture('dates1.csv')
    //expect(data1.length).toBeGreaterThan(0);
    data1.forEach((record) => {
        let rd = parseInt(record["RD"])
        test(`test calendar conversions for RD date ${rd}`, () => {
            let d = CalendarDate.fromFixed(rd);
            expect(d.toJulianDayNumber().toString())
                .toBe(record["JD"]);
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
        })
    })
})

describe('test dates2.csv for calendars: Ethiopic, Islamic, Mayan', () => {
    const data2 = fixture('dates2.csv')
    // expect(data2.length).toBeGreaterThan(0);
    data2.forEach( record => {
        let rd = parseInt(record["RD"])
        test(`test calendar conversions for RD date ${rd}`, () => {
            let d = CalendarDate.fromFixed(rd)
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
            let d = CalendarDate.fromFixed(rd)
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
            let d = CalendarDate.fromFixed(rd)
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