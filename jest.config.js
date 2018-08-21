module.exports = {
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.{js,jsx}",
    "server/**/*.{js,jsx}",
    "!src/dll.js",
    "!src/vendors.js"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/test/"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 40,
      "functions": 40,
      "lines": 40,
      "statements": 40
    }
  },
  "transform": {
    "^.+\\.(js|jsx)$": "<rootDir>/node_modules/babel-jest"
  },
  "testEnvironment": "node",
  "testMatch": ["<rootDir>/test/unit/**/*.spec.js", "<rootDir>/test/integration/**/*.spec.js"],
  "transformIgnorePatterns": ["[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$"],
  "testPathIgnorePatterns": [
    "<rootDir>/(dist|docs|dll|config|flow-typed|node_modules)/"
  ]
};
