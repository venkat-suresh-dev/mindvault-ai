import type { Document, Types } from "mongoose";

type SerializablePrimitive = string | number | boolean | null | undefined;

export type Serialized<T> = T extends Date
  ? string
  : T extends Types.ObjectId
    ? string
    : T extends readonly (infer Item)[]
      ? Serialized<Item>[]
      : T extends object
        ? SerializedObject<T>
        : T extends SerializablePrimitive
          ? T
          : never;

type SerializedObject<T extends object> = {
  [Key in keyof T as Key extends "_id" ? "id" : Key extends "__v" ? never : Key]: Serialized<T[Key]>;
};

type MongooseDocument = Document & { toObject: () => Record<string, unknown> };

export function serialize<T>(value: T): Serialized<T> {
  return serializeValue(value) as Serialized<T>;
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (isObjectId(value)) return value.toString();
  if (Array.isArray(value)) return value.map(serializeValue);

  if (isMongooseDocument(value)) {
    return serializeValue(value.toObject());
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "__v") continue;
      result[key === "_id" ? "id" : key] = serializeValue(nestedValue);
    }
    return result;
  }

  return value;
}

function isMongooseDocument(value: unknown): value is MongooseDocument {
  return typeof value === "object" && value !== null && "toObject" in value && typeof value.toObject === "function";
}

function isObjectId(value: unknown): value is Types.ObjectId {
  return (
    typeof value === "object" &&
    value !== null &&
    "_bsontype" in value &&
    (value._bsontype === "ObjectId" || value._bsontype === "ObjectID")
  );
}
