import 'server-only';

export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost || request.headers.get('host');

  if (host) {
    const protocol = forwardedProto || url.protocol.replace(':', '') || 'https';
    return `${protocol}://${host}`;
  }

  return url.origin;
}
