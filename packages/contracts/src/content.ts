import { Bundle } from "@meritory/content";
import Type, { type Static } from "typebox";

/** Every track's chapters, cards, exercises, and rubrics, as the API serves them */
export const ContentResponse = Type.Object(Bundle.properties, {
  $id: "ContentResponse",
  additionalProperties: false,
});
export type ContentResponse = Static<typeof ContentResponse>;
