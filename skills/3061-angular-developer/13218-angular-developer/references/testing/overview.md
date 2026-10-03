# Testing Overview

Source: https://v20.angular.dev/guide/testing

Testing your Angular application helps you check that your application is working as you expect.

## Set up testing

The Angular CLI downloads and installs everything you need to test an Angular application with [Jasmine testing framework](https://jasmine.github.io).

The project you create with the CLI is immediately ready to test. Just run:

```
ng test
```

The `ng test` command builds the application in *watch mode*, and launches the [Karma test runner](https://karma-runner.github.io).

Console output:
```
02 11 2022 09:08:28.605:INFO [karma-server]: Karma v6.4.1 server started at http://localhost:9876/
02 11 2022 09:08:28.607:INFO [launcher]: Launching browsers Chrome with concurrency unlimited
...
Chrome: Executed 3 of 3 SUCCESS (0.193 secs / 0.172 secs)
TOTAL: 3 SUCCESS
```

## Configuration

The Angular CLI takes care of Jasmine and Karma configuration for you. It constructs the full configuration in memory, based on options specified in the `angular.json` file.

To customize Karma, generate a `karma.conf.js`:

```
ng generate config karma
```

### Other test frameworks

You can also unit test an Angular application with other testing libraries and test runners.

### Test file name and location

The test file extension **must be `.spec.ts`** so that tooling can identify it as a spec file.

Place spec files next to the source files they test:
- Painless to find
- Reveals parts of your app lacking tests
- Nearby tests reveal how code works in context
- Moving/renaming source = moving/renaming test

For integration specs that cross many folders, create a `tests/` directory instead.

## Testing in continuous integration

```
ng test --no-watch --no-progress --browsers=ChromeHeadless
```

## Testing guides

| Guide | Details |
| --- | --- |
| [Code coverage](guide/testing/code-coverage) | How much of your app is covered and how to enforce minimums |
| [Testing services](guide/testing/services) | How to test the services your app uses |
| [Basics of testing components](guide/testing/components-basics) | Basics of testing Angular components |
| [Component testing scenarios](guide/testing/components-scenarios) | Various component testing scenarios |
| [Testing attribute directives](guide/testing/attribute-directives) | How to test attribute directives |
| [Testing pipes](guide/testing/pipes) | How to test pipes |
| [Debugging tests](guide/testing/debugging) | Common testing bugs |
| [Testing utility APIs](guide/testing/utility-apis) | Angular testing features |
