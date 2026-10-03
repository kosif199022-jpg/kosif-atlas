# Testing Services

Source: https://v20.angular.dev/guide/testing/services

Services are often the smoothest files to unit test. You can write tests for them with or without Angular testing utilities.

## Services without dependencies (no TestBed)

Simple synchronous and asynchronous unit tests without Angular's testing support:

```typescript
describe('ValueService', () => {
  let service: ValueService;
  beforeEach(() => { service = new ValueService(); });

  it('#getValue should return real value', () => {
    expect(service.getValue()).toBe('real value');
  });

  it('#getObservableValue should return value from observable', (done: DoneFn) => {
    service.getObservableValue().subscribe(value => {
      expect(value).toBe('observable value');
      done();
    });
  });

  it('#getPromiseValue should return value from a promise', (done: DoneFn) => {
    service.getPromiseValue().then(value => {
      expect(value).toBe('promise value');
      done();
    });
  });
});
```

## Services with dependencies

Approaches to testing `MasterService` which depends on `ValueService`:

```typescript
// Use real service
masterService = new MasterService(new ValueService());

// Use a fake subclass
masterService = new MasterService(new FakeValueService());

// Use a fake object
const fake = { getValue: () => 'fake value' };
masterService = new MasterService(fake as ValueService);

// Use a spy (preferred)
const valueServiceSpy = jasmine.createSpyObj('ValueService', ['getValue']);
const stubValue = 'stub value';
valueServiceSpy.getValue.and.returnValue(stubValue);
masterService = new MasterService(valueServiceSpy);
```

**Prefer spies** — they are usually the best way to mock services.

## Testing services with TestBed

`TestBed` creates a dynamically-constructed Angular test module. Use it when you want Angular DI to create and manage services.

```typescript
describe('ValueService', () => {
  let service: ValueService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ValueService] });
    service = TestBed.inject(ValueService);
  });

  it('should use ValueService', () => {
    expect(service.getValue()).toBe('real value');
  });

  it('test should wait for getPromiseValue', waitForAsync(() => {
    service.getPromiseValue().then(value => expect(value).toBe('promise value'));
  }));

  it('should allow the use of fakeAsync', fakeAsync(() => {
    let value: any;
    service.getPromiseValue().then(val => value = val);
    tick(); // flush promises
    expect(value).toBe('promise value');
  }));
});
```

### Testing MasterService with a spy via TestBed

```typescript
describe('MasterService', () => {
  let masterService: MasterService;
  let valueServiceSpy: jasmine.SpyObj<ValueService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ValueService', ['getValue']);
    TestBed.configureTestingModule({
      providers: [MasterService, { provide: ValueService, useValue: spy }],
    });
    masterService = TestBed.inject(MasterService);
    valueServiceSpy = TestBed.inject(ValueService) as jasmine.SpyObj<ValueService>;
  });

  it('#getValue should return stubbed value from a spy', () => {
    const stubValue = 'stub value';
    valueServiceSpy.getValue.and.returnValue(stubValue);
    expect(masterService.getValue()).toBe(stubValue);
    expect(valueServiceSpy.getValue.calls.count()).toBe(1);
  });
});
```

## Testing without `beforeEach()`

An alternative pattern uses a `setup()` function instead:

```typescript
describe('MasterService (no beforeEach)', () => {
  it('#getValue should return stubbed value from a spy', () => {
    const { masterService, stubValue, valueServiceSpy } = setup();
    expect(masterService.getValue()).toBe(stubValue);
    expect(valueServiceSpy.getValue.calls.count()).toBe(1);
  });

  function setup() {
    const valueServiceSpy = jasmine.createSpyObj('ValueService', ['getValue']);
    const stubValue = 'stub value';
    const masterService = new MasterService(valueServiceSpy);
    valueServiceSpy.getValue.and.returnValue(stubValue);
    return { masterService, stubValue, valueServiceSpy };
  }
});
```

## Testing HTTP services

For services that make HTTP calls, use `HttpClientTestingModule`:

```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('HeroesService (with mocks)', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let heroService: HeroService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HeroService],
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    heroService = TestBed.inject(HeroService);
  });

  afterEach(() => {
    httpTestingController.verify(); // assert no pending requests
  });

  it('should return expected heroes (called once)', () => {
    heroService.getHeroes().subscribe({
      next: heroes => expect(heroes).toEqual(expectedHeroes),
      error: fail,
    });

    const req = httpTestingController.expectOne(heroService.heroesUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(expectedHeroes);
  });

  it('should turn 404 into user-friendly error', () => {
    heroService.getHeroes().subscribe({
      next: () => fail('expected to fail'),
      error: error => expect(error.message).toContain('Deliberate 404'),
    });

    const req = httpTestingController.expectOne(heroService.heroesUrl);
    req.flush('Deliberate 404', { status: 404, statusText: 'Not Found' });
  });
});
```

**Important:** HeroService methods return `Observables`. Always subscribe to execute them and always provide both `next` and `error` callbacks to capture errors.

See the [Http testing guide](guide/http/testing) for more on `HttpClientTestingModule`.
