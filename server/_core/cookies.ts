import type { CookieOptions, Request } from "express";


function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isSecure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // In development (localhost), allow sameSite=Lax without secure flag
    // In production (https), use sameSite=Strict with secure flag
    sameSite: isSecure ? "strict" : "lax",
    secure: isSecure,
  };
}

