module.exports = {
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.{js,jsx}",
    "!src/dll.js",
    "!src/vendors.js"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/test/"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 90,
      "statements": 90
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
