import * as csvparse from 'csv-parse/lib/sync';
import * as fs  from 'fs';
import * as path from 'path';

export function fixture(name: string): Array<any> {
    let input = fs.readFileSync(path.join(__dirname, 'test_data', name), {encoding: "utf8"});
    return csvparse(input, {
        columns: true
      })
}

export function numericArray(record: any, columns: string[], zeroPadding = true): number[] {
    const arr = columns.map( x => parseInt(record[x]))
    return (zeroPadding ? arr.concat([0,0,0]) : arr);
}

export function dtfPartsToArray(parts: Array<{type: string, value: string}>): number[] {
    // Intl.DateTimeFormat('en-GB-u-ca-islamic').formatToParts(new Date())
    let result = [0,0,0]
    parts.forEach(part => {
        switch (part.type) {
            case 'day':
                result[2] = parseInt(part.value)
                break;
            case 'month':
                result[1] = parseInt(part.value)
                break;
            case 'year':
                result[0] = parseInt(part.value)
                break;
            default:
                break;
        }
    })
    return result
}
