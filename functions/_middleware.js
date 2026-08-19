export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === "shengkai.cc") {
    url.hostname = "www.shengkai.cc";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
