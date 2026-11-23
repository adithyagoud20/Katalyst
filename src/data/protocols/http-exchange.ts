import type { ProtocolScenario } from "@/lib/protocols/schema";

export const httpExchangeScenario: ProtocolScenario = {
  id: "http-exchange",
  title: "HTTP/1.1 Request & Response",
  category: "web",
  summary: "Inspect an HTTP/1.1 GET request pipeline including Host, Accept-Encoding, and Keep-Alive headers, followed by a 200 OK HTML response.",
  osiLayer: 7,
  overviewDescription: "HTTP is the protocol of the web: a client asks for a resource, such as an HTML page, and the server answers with a status code, headers and usually a body. Every exchange is one request and one response, written as readable text in HTTP/1.1.",
  defaultPort: "80 (HTTPS: 443)",
  transportType: "TCP",
  dataFormat: "Text (headers + optional body)",
  commonMethods: "GET, POST, PUT, DELETE, HEAD",
  rfc: "RFC 2616 / RFC 7230",
  nodes: [
    {
      id: "client",
      label: "Browser Client",
      type: "client",
      ip: "192.168.1.105",
      mac: "00:1a:2b:3c:4d:5e",
      xPercent: 15,
      yPercent: 50,
    },
    {
      id: "proxy",
      label: "Reverse Proxy / Cloudflare",
      type: "proxy",
      ip: "172.67.150.90",
      mac: "52:54:00:99:aa:bb",
      xPercent: 50,
      yPercent: 50,
    },
    {
      id: "server",
      label: "Origin Web Server",
      type: "server",
      ip: "76.76.21.21",
      mac: "00:50:56:fe:dc:ba",
      xPercent: 85,
      yPercent: 50,
    },
  ],
  wires: [
    { id: "wire-c-p", fromNodeId: "client", toNodeId: "proxy", label: "Edge Connection" },
    { id: "wire-p-s", fromNodeId: "proxy", toNodeId: "server", label: "Origin Connection" },
  ],
  steps: [
    {
      stepIndex: 0,
      timeMs: 0,
      fromNodeId: "client",
      toNodeId: "proxy",
      protocolName: "HTTP",
      arrowLabel: "GET / HTTP/1.1 (Host: katalyst.dev)",
      summary: "Client dispatches HTTP/1.1 GET request to edge proxy with Keep-Alive connection and gzip accept encoding.",
      status: "normal",
      // Eth (14) + IP (20) + TCP (20) + HTTP payload (~76 bytes)
      rawHex: "52540099aabb001a2b3c4d5e0800450000821f20400040067b2dc0a80169ac43965ac412005000000001000000018018ffff5b200000474554202f20485454502f312e310d0a486f73743a206b6174616c7973742e6465760d0a557365722d4167656e743a204b6174616c7973742f312e300d0a4163636570743a202a2f2a0d0a0d0a",
      layers: [
        {
          name: "Ethernet II",
          layer: "data-link",
          fields: [
            { name: "Destination MAC", value: "52:54:00:99:aa:bb", byteRange: [0, 6], description: "Edge proxy interface MAC" },
            { name: "Source MAC", value: "00:1a:2b:3c:4d:5e", byteRange: [6, 12], description: "Client NIC MAC" },
          ],
        },
        {
          name: "Hypertext Transfer Protocol (Request)",
          layer: "application",
          fields: [
            { name: "Request Method", value: "GET", byteRange: [54, 57], description: "Safe and idempotent resource retrieval method" },
            { name: "Request URI", value: "/", byteRange: [58, 59], description: "Target resource path" },
            { name: "HTTP Version", value: "HTTP/1.1", byteRange: [60, 68], description: "Protocol version supporting persistent TCP connections" },
            { name: "Host Header", value: "katalyst.dev", byteRange: [70, 89], description: "Mandatory HTTP/1.1 header for virtual hosting", katContext: "In HTTP/1.1, the Host header is required. Without it, the server cannot know which virtual domain is being targeted on shared IP addresses." },
            { name: "User-Agent Header", value: "Katalyst/1.0", byteRange: [91, 114], description: "Client identifier" },
          ],
        },
      ],
    },
    {
      stepIndex: 1,
      timeMs: 14,
      fromNodeId: "proxy",
      toNodeId: "server",
      protocolName: "HTTP",
      arrowLabel: "GET / (Forwarded with X-Forwarded-For)",
      summary: "Edge proxy forwards the request to the origin server, appending 'X-Forwarded-For: 192.168.1.105' to preserve client IP.",
      status: "normal",
      rawHex: "005056fedcba52540099aabb0800450000a42f3040003f066b1cac43965a4c4c1515d100005000000001000000018018ffff4c100000474554202f20485454502f312e310d0a486f73743a206b6174616c7973742e6465760d0a582d466f727761726465642d466f723a203139322e3136382e312e3130350d0a0d0a",
      layers: [
        {
          name: "Hypertext Transfer Protocol (Forwarded)",
          layer: "application",
          fields: [
            { name: "X-Forwarded-For", value: "192.168.1.105", byteRange: [91, 124], description: "Proxy header passing original client IP to origin" },
          ],
        },
      ],
    },
    {
      stepIndex: 2,
      timeMs: 38,
      fromNodeId: "server",
      toNodeId: "proxy",
      protocolName: "HTTP",
      arrowLabel: "HTTP/1.1 200 OK (Content-Type: text/html)",
      summary: "Origin server generates 200 OK response with Content-Length and HTML payload.",
      status: "normal",
      rawHex: "52540099aabb005056fedcba0800450000dc3f40400040065b0c4c4c1515ac43965a0050d10000000001000000528018ffff3b050000485454502f312e3120323030204f4b0d0a436f6e74656e742d547970653a20746578742f68746d6c0d0a436f6e74656e742d4c656e6774683a2032350d0a0d0a3c68313e48656c6c6f204b6174616c797374213c2f68313e",
      layers: [
        {
          name: "Hypertext Transfer Protocol (Response)",
          layer: "application",
          fields: [
            { name: "Status Code", value: "200 OK", byteRange: [54, 69], description: "Successful HTTP status code" },
            { name: "Content-Type", value: "text/html", byteRange: [71, 95], description: "MIME type specifying browser should render as HTML" },
            { name: "Content-Length", value: "25 bytes", byteRange: [97, 116], description: "Exact size of HTML payload body" },
            { name: "Response Body", value: "<h1>Hello Katalyst!</h1>", byteRange: [120, 142], description: "HTML body delivered to browser DOM" },
          ],
        },
      ],
    },
    {
      stepIndex: 3,
      timeMs: 50,
      fromNodeId: "proxy",
      toNodeId: "client",
      protocolName: "HTTP",
      arrowLabel: "HTTP/1.1 200 OK [CF-Cache-Status: HIT]",
      summary: "Edge proxy returns cached response with added edge headers (CF-Cache-Status: HIT) to client browser.",
      status: "normal",
      rawHex: "001a2b3c4d5e52540099aabb0800450000dc4f5040003f064afb4c4c1515c0a801690050c41200000001000000528018ffff2b040000485454502f312e3120323030204f4b0d0a436f6e74656e742d547970653a20746578742f68746d6c0d0a436f6e74656e742d4c656e6774683a2032350d0a0d0a3c68313e48656c6c6f204b6174616c797374213c2f68313e",
      layers: [
        {
          name: "Hypertext Transfer Protocol (Response Delivered)",
          layer: "application",
          fields: [
            { name: "Status Code", value: "200 OK", byteRange: [54, 69], description: "Response delivered to client application" },
            { name: "HTML Payload", value: "<h1>Hello Katalyst!</h1>", byteRange: [120, 142], description: "Rendered directly on client display" },
          ],
        },
      ],
    },
  ],
  chaosVariants: [
    {
      id: "server-error-500",
      name: "Origin Internal Server Error 500",
      description: "Simulate an unhandled origin exception resulting in HTTP 500 Internal Server Error.",
      triggerStepIndex: 2,
      action: "corrupt_checksum",
      alternateSteps: [
        {
          stepIndex: 2,
          timeMs: 38,
          fromNodeId: "server",
          toNodeId: "proxy",
          protocolName: "HTTP",
          arrowLabel: "HTTP/1.1 500 Internal Server Error",
          summary: "Origin server encounters unhandled database timeout and returns 500 Internal Server Error.",
          status: "corrupted",
          rawHex: "52540099aabb005056fedcba0800450000dc3f40400040065b0c4c4c1515ac43965a0050d10000000001000000528018ffff3b050000485454502f312e312035303020496e7465726e616c20536572766572204572726f720d0a0d0a",
          layers: [
            {
              name: "Hypertext Transfer Protocol (500 Error)",
              layer: "application",
              fields: [
                { name: "Status Code", value: "500 Internal Server Error", byteRange: [54, 87], description: "Server-side error status" },
              ],
            },
          ],
        },
      ],
    },
  ],
  examChallenge: {
    id: "http-headers-challenge",
    title: "Reconstruct HTTP Request & Response",
    prompt: "Arrange the HTTP client-server exchange in the correct chronological order.",
    shuffledStepIds: [2, 0, 3, 1],
    correctSequence: [0, 1, 2, 3],
    hints: [
      "The client request always initiates the exchange.",
      "The proxy receives the request before forwarding it to the origin.",
      "The origin must reply with a 200 OK before the proxy can deliver it to the client.",
    ],
    explanation: "Chronological flow: 1) Client -> Proxy (GET), 2) Proxy -> Origin (Forwarded), 3) Origin -> Proxy (200 OK), 4) Proxy -> Client (200 OK).",
  },
  codeSnippetBridge: {
    language: "javascript",
    title: "JavaScript Fetch HTTP Client",
    code: `// Fetch HTTP resource and inspect headers
async function fetchResource() {
  try {
    const response = await fetch("https://katalyst.dev");
    console.log("Status:", response.status, response.statusText);
    console.log("Content-Type:", response.headers.get("content-type"));
    const html = await response.text();
    console.log("Received HTML:", html.slice(0, 40));
  } catch (err) {
    console.error("HTTP Fetch failed:", err);
  }
}

fetchResource();
`,
  },
};
