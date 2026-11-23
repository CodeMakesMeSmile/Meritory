import { File, Paths } from "expo-file-system";
import type { ContentStore } from "./content-copy";

// The document folder, because the system may empty the cache folder
const file = () => new File(Paths.document, "content.json");

export const contentFiles: ContentStore = {
  async read() {
    const copy = file();
    return copy.exists ? copy.text() : null;
  },
  async write(text) {
    const copy = file();
    if (!copy.exists) copy.create({ intermediates: true });
    await copy.write(text);
  },
  async clear() {
    const copy = file();
    if (copy.exists) copy.delete();
  },
};
