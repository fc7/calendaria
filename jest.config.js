module.exports = {
    preset: 'ts-jest',
    testPathIgnorePatterns: ["/lib/", "/dist/", "/node_modules/"],
    testEnvironment: 'node'
};
/*
module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/lib/", "/node_modules/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: true,
};*/