import { Host_Grotesk, IBM_Plex_Mono, Roboto } from "next/font/google";

const sans = Host_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-host-grotesk",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

// Only the provider buttons use it, as Google's sign-in guidelines ask
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-roboto",
});

/** The font variables for the html element, shared by the layout and the page that stands in for it */
export const FONT_CLASSES = `${sans.variable} ${mono.variable} ${roboto.variable}`;
