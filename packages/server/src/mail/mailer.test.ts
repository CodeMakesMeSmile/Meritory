import { once } from "node:events";
import { createServer, type Socket } from "node:net";
import { describe, expect, it } from "vitest";
import { createSmtpMailer, readSmtpConfig, smtpOptions } from "./mailer.ts";

const ses = {
  SMTP_HOST: "email-smtp.ca-central-1.amazonaws.com",
  SMTP_PORT: "587",
  SMTP_USER: "user",
  SMTP_PASSWORD: "password",
};

describe("smtpOptions", () => {
  it("talks to Mailpit without TLS or a password", () => {
    const options = smtpOptions(readSmtpConfig({}));
    expect(options).toMatchObject({
      host: "localhost",
      port: 1025,
      secure: false,
      requireTLS: false,
    });
    expect(options.auth).toBeUndefined();
    for (const host of ["127.0.0.1", "::1"]) {
      expect(smtpOptions(readSmtpConfig({ SMTP_HOST: host })).requireTLS).toBe(
        false,
      );
    }
  });

  it("refuses to send to any other server unless STARTTLS works", () => {
    expect(smtpOptions(readSmtpConfig(ses))).toMatchObject({
      secure: false,
      requireTLS: true,
      auth: { user: "user", pass: "password" },
    });
    for (const host of ["mailpit.evil.example", "localhost.evil.example"]) {
      expect(smtpOptions(readSmtpConfig({ SMTP_HOST: host })).requireTLS).toBe(
        true,
      );
    }
  });

  it("starts with TLS on port 465", () => {
    expect(
      smtpOptions(readSmtpConfig({ ...ses, SMTP_PORT: "465" })),
    ).toMatchObject({ secure: true, requireTLS: false });
  });
});

describe("createSmtpMailer", () => {
  it("stops a send that runs past its deadline and closes the connection", async () => {
    // Accepts the connection and never sends a greeting
    const server = createServer();
    const sockets: Socket[] = [];
    const closed = new Promise<void>((resolve) => {
      server.on("connection", (socket) => {
        sockets.push(socket);
        socket.on("close", () => resolve());
      });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const mailer = createSmtpMailer(
      readSmtpConfig({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(port) }),
      200,
    );
    try {
      await expect(
        mailer.send(
          { to: "rowan@meritory.test", subject: "Hi", text: "Hi" },
          { kind: "reset-password", userId: "u" },
        ),
      ).rejects.toMatchObject({ code: "EABORT" });
      await closed;
    } finally {
      for (const socket of sockets) socket.destroy();
      server.close();
    }
  });
});
