# Code Coverage

Source: https://v20.angular.dev/guide/testing/code-coverage

The Angular CLI can run unit tests and create code coverage reports. Code coverage reports show any parts of your code base that might not be properly tested.

## Generate a coverage report

```
ng test --no-watch --code-coverage
```

This creates a new `/coverage` directory. Open `index.html` to see a report with source code and coverage values.

To generate coverage reports on every test run, set in `angular.json`:

```json
"test": {
  "options": {
    "codeCoverage": true
  }
}
```

## Code coverage enforcement

Enforce a minimum coverage level using the `check` property in `karma.conf.js`:

```javascript
coverageReporter: {
  dir: require('path').join(__dirname, './coverage/<project-name>'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' }
  ],
  check: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}
```

The `check` property causes the tool to enforce a minimum of 80% code coverage when unit tests run. Tests will fail if coverage falls below the threshold.

Read more on coverage configuration in the [karma coverage documentation](https://github.com/karma-runner/karma-coverage/blob/master/docs/configuration.md).
