import {fixture, dtfPartsToArray, numericArray} from './fixture'
import * as Calendars from "../src/Calendars"

// "buddhist", "chinese", "coptic", "ethioaa", "ethiopic", "gregory", "hebrew", "indian", "islamic", "islamicc", "iso8601", "japanese", "persian", "roc"

describe('dates1.csv for calendars: Coptic and ISO', () => {
    const data1 = fixture('dates1.csv')
    //expect(data1.length).toBeGreaterThan(0);
    data1.forEach((record) => {
        const rd = parseInt(record["RD"])
        const date = Calendars.fromFixed(rd)
        test(`test conversions for RD date ${rd}`, () => {
            const copticIntl = dtfPartsToArray(Intl.DateTimeFormat('en-GB-u-ca-coptic').formatToParts(date))
            expect(copticIntl).toEqual(numericArray(record, ['CopticYear', 'CopticMonth', 'CopticDay'], false))
            const isoIntl = dtfPartsToArray(Intl.DateTimeFormat('en-GB-u-ca-iso8601').formatToParts(date))
            expect(isoIntl).toEqual(numericArray(record,["ISOYear","ISOMonth","ISODay"], false));
        })
    })
})

describe('test dates2.csv for calendars: Ethiopic, Islamic', () => {
    const data2 = fixture('dates2.csv')
    data2.forEach( record => {
        const rd = parseInt(record["RD"])
        const date = Calendars.fromFixed(rd)
        test(`test conversions of ES2016 Intl for RD date ${rd}`, () => {
            expect(dtfPartsToArray(Intl.DateTimeFormat('en-GB-u-ca-ethiopic').formatToParts(date)))
                .toEqual(numericArray(record,["EthiopicYear","EthiopicMonth","EthiopicDay"], false))
            expect(dtfPartsToArray(Intl.DateTimeFormat('en-GB-u-ca-islamic').formatToParts(date)))
                .toEqual(numericArray(record,["ObservationalIslamicYear","ObservationalIslamicMonth","ObservationalIslamicDay"], false))
        })
    })
})

describe('test dates3.csv for calendars: Hebrew, Persian', () => {
    const data3 = fixture('dates3.csv')
    data3.forEach( record => {
        const rd = parseInt(record["RD"])
        const date = Calendars.fromFixed(rd)
        test(`test conversions of ES2016 Intl for RD date ${rd}`, () => {
            expect(dtfPartsToArray(Intl.DateTimeFormat('en-GB-u-ca-hebrew').formatToParts(date)))
                .toEqual(numericArray(record,["HebrewYear","HebrewMonth","HebrewDay"], false))
            expect(dtfPartsToArray(Intl.DateTimeFormat('en-GB-u-ca-persian').formatToParts(date)))
                .toEqual(numericArray(record,["PersianYear","PersianMonth","PersianDay"], false))
        })
    })
})

