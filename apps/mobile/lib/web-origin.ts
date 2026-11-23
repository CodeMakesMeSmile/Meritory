const NAME = "EXPO_PUBLIC_WEB_ORIGIN";

/** The origin of the configured website, without any path or trailing slash */
export function parseWebOrigin(value: string, dev: boolean) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${NAME} is not a URL: "${value}".`);
  }
  const allowed = dev ? ["https:", "http:"] : ["https:"];
  if (!allowed.includes(url.protocol)) {
    throw new Error(
      `${NAME} must start with https://${dev ? " or http://" : ""}, but is "${value}".`,
    );
  }
  return url.origin;
}
