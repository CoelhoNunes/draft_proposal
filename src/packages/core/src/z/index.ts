export type ValidationIssue = {
  path: Array<string | number>;
  message: string;
};

export class ZodError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super('Validation failed');
    this.name = 'ZodError';
    this.issues = issues;
  }
}

type Parser<T> = (value: unknown, path: Array<string | number>) => T;

type SafeParseSuccess<T> = { success: true; data: T };

type SafeParseFailure = { success: false; error: ZodError };

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export interface InternalSchema<T> {
  parse(value: unknown): T;
  safeParse(value: unknown): SafeParseResult<T>;
  optional(): InternalSchema<T | undefined>;
  default(value: T): InternalSchema<T>;
  parseWithPath(value: unknown, path: Array<string | number>): T;
}

export type Schema<T> = InternalSchema<T>;

function toZodError(error: unknown): ZodError {
  if (error instanceof ZodError) {
    return error;
  }
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new ZodError([{ path: [], message }]);
}

function makeSchema<T>(parser: Parser<T>, acceptUndefined = false): InternalSchema<T> {
  const schema: InternalSchema<T> = {
    parse(value: unknown): T {
      try {
        return schema.parseWithPath(value, []);
      } catch (error) {
        throw toZodError(error);
      }
    },
    parseWithPath(value: unknown, path: Array<string | number>): T {
      if (value === undefined && !acceptUndefined) {
        throw new ZodError([{ path, message: 'Required' }]);
      }
      return parser(value, path);
    },
    safeParse(value: unknown): SafeParseResult<T> {
      try {
        return { success: true, data: schema.parse(value) };
      } catch (error) {
        return { success: false, error: toZodError(error) };
      }
    },
    optional(): InternalSchema<T | undefined> {
      return makeOptional(schema);
    },
    default(value: T): InternalSchema<T> {
      return makeDefault(schema, value);
    },
  };

  return schema;
}

function makeOptional<T>(schema: InternalSchema<T>): InternalSchema<T | undefined> {
  const parser: Parser<T | undefined> = (value, path) => {
    if (value === undefined) {
      return undefined;
    }
    return schema.parseWithPath(value, path);
  };

  return makeSchema(parser, true);
}

function makeDefault<T>(schema: InternalSchema<T>, defaultValue: T): InternalSchema<T> {
  const parser: Parser<T> = (value, path) => {
    if (value === undefined) {
      return defaultValue;
    }
    return schema.parseWithPath(value, path);
  };

  return makeSchema(parser, true);
}

// String schema
interface StringConfig {
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
  uuid?: boolean;
  email?: boolean;
  url?: boolean;
}

export interface StringSchema extends InternalSchema<string> {
  min(length: number): StringSchema;
  max(length: number): StringSchema;
  trim(): StringSchema;
  uuid(): StringSchema;
  email(): StringSchema;
  url(): StringSchema;
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createStringSchema(config: StringConfig = {}): StringSchema {
  const parser: Parser<string> = (value, path) => {
    if (typeof value !== 'string') {
      throw new ZodError([{ path, message: 'Expected string' }]);
    }

    let result = config.trim ? value.trim() : value;

    if (config.minLength !== undefined && result.length < config.minLength) {
      throw new ZodError([{ path, message: `Must contain at least ${config.minLength} characters` }]);
    }

    if (config.maxLength !== undefined && result.length > config.maxLength) {
      throw new ZodError([{ path, message: `Must contain at most ${config.maxLength} characters` }]);
    }

    if (config.uuid && !UUID_REGEX.test(result)) {
      throw new ZodError([{ path, message: 'Invalid UUID' }]);
    }

    if (config.email && !EMAIL_REGEX.test(result)) {
      throw new ZodError([{ path, message: 'Invalid email address' }]);
    }

    if (config.url) {
      try {
        new URL(result);
      } catch {
        throw new ZodError([{ path, message: 'Invalid URL' }]);
      }
    }

    return result;
  };

  const base = makeSchema<string>(parser);
  const schema = base as StringSchema;

  schema.min = (length: number) => createStringSchema({ ...config, minLength: length });
  schema.max = (length: number) => createStringSchema({ ...config, maxLength: length });
  schema.trim = () => createStringSchema({ ...config, trim: true });
  schema.uuid = () => createStringSchema({ ...config, uuid: true });
  schema.email = () => createStringSchema({ ...config, email: true });
  schema.url = () => createStringSchema({ ...config, url: true });

  return schema;
}

// Number schema
interface NumberConfig {
  min?: number;
  max?: number;
  int?: boolean;
  nonnegative?: boolean;
  positive?: boolean;
}

export interface NumberSchema extends InternalSchema<number> {
  min(value: number): NumberSchema;
  max(value: number): NumberSchema;
  int(): NumberSchema;
  nonnegative(): NumberSchema;
  positive(): NumberSchema;
}

function createNumberSchema(config: NumberConfig = {}): NumberSchema {
  const parser: Parser<number> = (value, path) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new ZodError([{ path, message: 'Expected number' }]);
    }

    if (!Number.isFinite(value)) {
      throw new ZodError([{ path, message: 'Number must be finite' }]);
    }

    if (config.int && !Number.isInteger(value)) {
      throw new ZodError([{ path, message: 'Expected integer' }]);
    }

    if (config.nonnegative && value < 0) {
      throw new ZodError([{ path, message: 'Must be non-negative' }]);
    }

    if (config.positive && value <= 0) {
      throw new ZodError([{ path, message: 'Must be positive' }]);
    }

    if (config.min !== undefined && value < config.min) {
      throw new ZodError([{ path, message: `Must be greater than or equal to ${config.min}` }]);
    }

    if (config.max !== undefined && value > config.max) {
      throw new ZodError([{ path, message: `Must be less than or equal to ${config.max}` }]);
    }

    return value;
  };

  const base = makeSchema<number>(parser);
  const schema = base as NumberSchema;

  schema.min = (value: number) => createNumberSchema({ ...config, min: value });
  schema.max = (value: number) => createNumberSchema({ ...config, max: value });
  schema.int = () => createNumberSchema({ ...config, int: true });
  schema.nonnegative = () => createNumberSchema({ ...config, nonnegative: true });
  schema.positive = () => createNumberSchema({ ...config, positive: true });

  return schema;
}

// Boolean schema
function createBooleanSchema(): InternalSchema<boolean> {
  const parser: Parser<boolean> = (value, path) => {
    if (typeof value !== 'boolean') {
      throw new ZodError([{ path, message: 'Expected boolean' }]);
    }
    return value;
  };

  return makeSchema(parser);
}

// Date schema
function createDateSchema(): InternalSchema<Date> {
  const parser: Parser<Date> = (value, path) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    throw new ZodError([{ path, message: 'Expected date' }]);
  };

  return makeSchema(parser);
}

// Enum schema
export interface EnumSchema<T extends [string, ...string[]]> extends InternalSchema<T[number]> {}

function createEnumSchema<T extends [string, ...string[]]>(values: T): EnumSchema<T> {
  const parser: Parser<T[number]> = (value, path) => {
    if (typeof value !== 'string' || !values.includes(value as T[number])) {
      throw new ZodError([{ path, message: `Expected one of: ${values.join(', ')}` }]);
    }
    return value as T[number];
  };

  return makeSchema(parser) as EnumSchema<T>;
}

// Unknown schema
function createUnknownSchema(): InternalSchema<unknown> {
  const parser: Parser<unknown> = (value) => value;
  return makeSchema(parser);
}

// Array schema
export interface ArraySchema<T> extends InternalSchema<T[]> {
  min(length: number): ArraySchema<T>;
  max(length: number): ArraySchema<T>;
}

function createArraySchema<T>(element: InternalSchema<T>, config: { min?: number; max?: number } = {}): ArraySchema<T> {
  const parser: Parser<T[]> = (value, path) => {
    if (!Array.isArray(value)) {
      throw new ZodError([{ path, message: 'Expected array' }]);
    }

    if (config.min !== undefined && value.length < config.min) {
      throw new ZodError([{ path, message: `Expected at least ${config.min} items` }]);
    }

    if (config.max !== undefined && value.length > config.max) {
      throw new ZodError([{ path, message: `Expected at most ${config.max} items` }]);
    }

    const result: T[] = [];
    value.forEach((item, index) => {
      try {
        result.push(element.parseWithPath(item, [...path, index]));
      } catch (error) {
        throw toZodError(error);
      }
    });

    return result;
  };

  const base = makeSchema<T[]>(parser);
  const schema = base as ArraySchema<T>;
  schema.min = (length: number) => createArraySchema(element, { ...config, min: length });
  schema.max = (length: number) => createArraySchema(element, { ...config, max: length });
  return schema;
}

// Record schema
function createRecordSchema<T>(valueSchema: InternalSchema<T>): InternalSchema<Record<string, T>> {
  const parser: Parser<Record<string, T>> = (value, path) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ZodError([{ path, message: 'Expected object' }]);
    }

    const result: Record<string, T> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      try {
        result[key] = valueSchema.parseWithPath((value as Record<string, unknown>)[key], [...path, key]);
      } catch (error) {
        throw toZodError(error);
      }
    }

    return result;
  };

  return makeSchema(parser);
}

// Object schema
type Shape = Record<string, InternalSchema<any>>;

type InferShape<S extends Shape> = {
  [K in keyof S]: S[K] extends Schema<infer U> ? U : never;
};

export interface ObjectSchema<S extends Shape> extends InternalSchema<InferShape<S>> {
  extend<NS extends Shape>(additional: NS): ObjectSchema<S & NS>;
  omit<K extends keyof S>(keys: Record<K, true>): ObjectSchema<Omit<S, K>>;
  partial(): ObjectSchema<{ [K in keyof S]: InternalSchema<any> }>;
}

function createObjectSchema<S extends Shape>(shape: S): ObjectSchema<S> {
  const parser: Parser<InferShape<S>> = (value, path) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ZodError([{ path, message: 'Expected object' }]);
    }

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      const schema = shape[key];
      const input = (value as Record<string, unknown>)[key];
      try {
        result[key] = schema.parseWithPath(input, [...path, key]);
      } catch (error) {
        throw toZodError(error);
      }
    }

    return result as InferShape<S>;
  };

  const base = makeSchema(parser);
  const schema = base as ObjectSchema<S>;

  schema.extend = <NS extends Shape>(additional: NS): ObjectSchema<S & NS> =>
    createObjectSchema({ ...(shape as Shape), ...additional } as S & NS);

  schema.omit = <K extends keyof S>(keys: Record<K, true>): ObjectSchema<Omit<S, K>> => {
    const newShape = { ...shape } as Shape;
    for (const key of Object.keys(keys as Record<string, true>)) {
      delete newShape[key as keyof Shape];
    }
    return createObjectSchema(newShape as unknown as Omit<S, K>);
  };

  schema.partial = () => {
    const partialShape = Object.keys(shape).reduce((acc, key) => {
      acc[key] = (shape[key] as InternalSchema<any>).optional();
      return acc;
    }, {} as Shape);
    return createObjectSchema(partialShape) as ObjectSchema<{ [K in keyof S]: InternalSchema<any> }>;
  };

  return schema;
}

export const z = {
  string: (): StringSchema => createStringSchema(),
  number: (): NumberSchema => createNumberSchema(),
  boolean: (): Schema<boolean> => createBooleanSchema(),
  date: (): Schema<Date> => createDateSchema(),
  enum: <T extends [string, ...string[]]>(values: T): EnumSchema<T> => createEnumSchema(values),
  array: <T>(schema: Schema<T>): ArraySchema<T> => createArraySchema(schema as InternalSchema<T>),
  object: <S extends Shape>(shape: S): ObjectSchema<S> => createObjectSchema(shape),
  record: <T>(schema: Schema<T>): Schema<Record<string, T>> => createRecordSchema(schema as InternalSchema<T>),
  unknown: (): Schema<unknown> => createUnknownSchema(),
};
