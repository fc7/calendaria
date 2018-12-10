# Calendaria

> Calendrical conversion library

[![NPM version](https://badge.fury.io/js/calendaria.svg)](https://www.npmjs.com/package/calendaria/)
[![Build Status](https://secure.travis-ci.org/fc7/calendaria.svg?branch=master)](https://travis-ci.org/fc7/calendaria)

This library is a straightfoward implementation and adaptation to TypeScript of the calendar computations featured in
[Edward M. Reingold and Nachum Dershowitz, _Calendrical Calculations, The Millenium Edition_, Cambridge University Press, 2001](http://calendarists.com/), also taking into account the [errata published online](http://www.cs.tau.ac.il/~nachum/calendar-book/second-edition/errata.pdf). NB: a [fourth edition](https://www.cambridge.org/fr/academic/subjects/computer-science/computing-general-interest/calendrical-calculations-ultimate-edition-4th-edition) was published in April 2018.

The arithmetic formulae are directly taken from Reingold & Dershowitz, with minor adaptations of the naming 
and cleaner structuring within namespaces.
 
For the purely astronomical calculations however, it relies mostly on the
npm package [astronomia][], itself derived from the go package [meeus][].

 **Calendaria** is the plural of the Latin word [_calendarium_](https://la.wikipedia.org/wiki/Calendarium).

## Installation

```
npm install --save calendaria
```

## Browser usage

Make sure you add `<meta charset="UTF-8">` to your HTML or at least include your
bundle with `<script src="your-bundle.js" charset="UTF-8"></script>` then
this package runs in modern browsers.

- Chrome: >=45
- Firefox: >= 45
- Safari: >=10
- Mobile Safari: >=10
- Edge: >=13
- IE: >=10 (needs `core-js/es6` polyfill)

## Usage

This package offers two complementary modules with a purely functional or purely OO approach, respectively.

### Functional Module: Calendars

```ts
import {Calendars} from 'calendaria'

let today = Calendars.Gregorian.toFixed(2018, 11, 11)
Calendars.Hebrew.fromFixed(today) // ...
Calendars.JD.fromFixed(today) // ...
```

### Object-Oriented Module: CalendarDate

```ts
import {CalendarDate, CalendarType, DateBuilder} from 'calendaria'

let today = new CalendarDate()
today.convertTo(CalendarType.Hebrew)
// -> [yyyy,mm,dd,0,0,0]

...
let d = new DateBuilder(CalendarType.Coptic).year(1712).month(6).day(17).zone(2).build()

d.convertTo(CalendarType.Gregorian)

```

## Running tests

    npm test

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code to be distributed under the MIT license.

You are also implicitly verifying that all code is your original work or correctly attributed with the source of its origin and licence.

## License

MIT Licensed

See [LICENSE][] for more info.

## References

* [astronomia][]
* [meeus][]

[astronomia]: https://github.com/commenthol/astronomia.git
[meeus]: https://github.com/soniakeys/meeus.git
[LICENSE]: ./LICENSE
