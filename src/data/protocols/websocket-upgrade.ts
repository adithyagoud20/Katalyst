import type { ProtocolScenario } from "@/lib/protocols/schema";

export const websocketUpgradeScenario: ProtocolScenario = {
  id: "websocket-upgrade",
  title: "WebSocket Handshake & Framing (RFC 6455)",
  category: "web",
  summary: "Establish persistent full-duplex communication via HTTP/1.1 101 Switching Protocols upgrade, followed by XOR-masked binary/text frame exchange.",
  osiLayer: 7,
  overviewDescription: "WebSocket provides full-duplex, bidirectional communication channels over a single persistent TCP connection. It begins with an HTTP/1.1 Upgrade handshake (101 Switching Protocols) and transitions to lightweight framed binary or text messages.",
  defaultPort: "80 (ws://) / 443 (wss://)",
  transportType: "TCP",
  dataFormat: "Framed (Opcode + Masked Payload)",
  commonMethods: "Upgrade: websocket, Text, Binary, Ping/Pong",
  rfc: "RFC 6455",
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
      label: "Reverse Proxy / Gateway",
      type: "proxy",
      ip: "172.67.150.90",
      mac: "52:54:00:99:aa:bb",
      xPercent: 50,
      yPercent: 50,
    },
    {
      id: "server",
      label: "Real-Time WebSocket Server",
      type: "server",
      ip: "76.76.21.21",
      mac: "00:50:56:fe:dc:ba",
      xPercent: 85,
      yPercent: 50,
    },
  ],
  wires: [
    { id: "wire-c-p", fromNodeId: "client", toNodeId: "proxy", label: "Client TCP Stream" },
    { id: "wire-p-s", fromNodeId: "proxy", toNodeId: "server", label: "Upstream WebSocket" },
  ],
  steps: [
    {
      stepIndex: 0,
      timeMs: 0,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "HTTP",
      arrowLabel: "GET /chat [Upgrade: websocket]",
      summary: "Client opens standard TCP connection and issues HTTP/1.1 Upgrade request with random Sec-WebSocket-Key nonce.",
      status: "normal",
      // Eth (14) + IP (20) + TCP (20) + HTTP payload (~96 bytes) = 150 bytes
      rawHex: "005056fedcba001a2b3c4d5e0800450000961a2b4000400684f5c0a801694c4c1515c412005000000001000000018018ffff12000000474554202f6368617420485454502f312e310d0a486f73743a206b6174616c7973742e6465760d0a557067726164653a20776562736f636b65740d0a436f6e6e656374696f6e3a20557067726164650d0a5365632d576562536f636b65742d4b65793a206447686c49484e68625842735a5342756232356a5a513d3d0d0a5365632d576562536f636b65742d56657273696f6e3a2031330d0a0d0a",
      layers: [
        {
          name: "Hypertext Transfer Protocol (Upgrade Request)",
          layer: "application",
          fields: [
            { name: "Request Method", value: "GET /chat HTTP/1.1", byteRange: [54, 73], description: "Initiating HTTP request line" },
            { name: "Upgrade Header", value: "websocket", byteRange: [96, 115], description: "Requests protocol upgrade to WebSocket", katContext: "The Upgrade: websocket header signals to the server that the client wants to transition the TCP socket from request-response HTTP to full-duplex WebSocket frames." },
            { name: "Connection Header", value: "Upgrade", byteRange: [117, 136], description: "Hop-by-hop header confirming upgrade" },
            { name: "Sec-WebSocket-Key", value: "dGhlIHNhbXBsZSBub25jZQ==", byteRange: [138, 187], description: "Base64 encoded 16-byte random nonce preventing caching proxy collisions" },
          ],
        },
      ],
    },
    {
      stepIndex: 1,
      timeMs: 25,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "HTTP",
      arrowLabel: "101 Switching Protocols [Upgrade: websocket]",
      summary: "Server verifies key, hashes nonce with GUID (258EAFA5-E914-47DA-95CA-C5AB0DC85B11) using SHA-1, and replies with 101 Switching Protocols.",
      status: "normal",
      rawHex: "001a2b3c4d5e005056fedcba0800450000a22b3c40003f0674064c4c1515c0a801690050c41200000001000000968018ffff54120000485454502f312e312031303120537769746368696e672050726f746f636f6c730d0a557067726164653a20776562736f636b65740d0a436f6e6e656374696f6e3a20557067726164650d0a5365632d576562536f636b65742d4163636570743a20733370504c4d426954786151396b59477a7a685a52624b2b784f6f3d0d0a0d0a",
      layers: [
        {
          name: "Hypertext Transfer Protocol (101 Upgrade Accepted)",
          layer: "application",
          fields: [
            { name: "Status Code", value: "101 Switching Protocols", byteRange: [54, 88], description: "Socket protocol successfully upgraded" },
            { name: "Sec-WebSocket-Accept", value: "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=", byteRange: [141, 162], description: "SHA-1 proof verifying server speaks WebSocket RFC 6455" },
          ],
        },
      ],
    },
    {
      stepIndex: 2,
      timeMs: 40,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "WS",
      arrowLabel: "WebSocket Text Frame [FIN=1, Opcode=1, Masked, Len=4]",
      summary: "Client transmits text frame 'ping'. Client frames MUST be XOR-masked with 4-byte key to prevent cache poisoning attacks on intermediary proxies.",
      status: "normal",
      // Eth (14) + IP (20) + TCP (20) + WS Frame (2B header + 4B mask + 4B payload = 10B) = 64B
      // Byte 54: 0x81 (FIN=1, RSV=0, Opcode=0x1 Text)
      // Byte 55: 0x84 (Mask=1, Len=4)
      // Bytes 56-59: 37 fa 21 3d (Masking key)
      // Bytes 60-63: 7f 92 4f 5a (Masked "ping" -> 0x70 0x69 0x6e 0x67 ^ mask)
      rawHex: "005056fedcba001a2b3c4d5e0800450000403c4d4000400662d3c0a801694c4c1515c412005000000096000000a28018ffff91200000818437fa213d7f924f5a",
      layers: [
        {
          name: "WebSocket Framing Protocol (Client)",
          layer: "application",
          fields: [
            { name: "FIN Bit", value: "1 (Final fragment)", byteRange: [54, 55], description: "Message is not fragmented" },
            { name: "Opcode", value: "0x1 (Text Frame UTF-8)", byteRange: [54, 55], description: "Payload is UTF-8 encoded string" },
            { name: "Mask Flag", value: "1 (Client MUST mask)", byteRange: [55, 56], description: "Client-to-server frames must be masked", katContext: "RFC 6455 requires all client-to-server WebSocket frames to be masked with a random 32-bit key to prevent cache poisoning on transparent HTTP proxies." },
            { name: "Masking Key", value: "0x37fa213d", byteRange: [56, 60], description: "4-byte random XOR mask key" },
            { name: "Payload (Decoded)", value: "ping", byteRange: [60, 64], description: "Unmasked application data payload" },
          ],
        },
      ],
    },
    {
      stepIndex: 3,
      timeMs: 48,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "WS",
      arrowLabel: "WebSocket Text Frame [FIN=1, Opcode=1, Unmasked, Len=4]",
      summary: "Server replies with unmasked text frame 'pong'. Server-to-client frames MUST NOT be masked.",
      status: "normal",
      // Eth (14) + IP (20) + TCP (20) + WS Frame (2B header + 4B payload = 6B) = 60B
      // Byte 54: 0x81 (FIN=1, Opcode=1)
      // Byte 55: 0x04 (Mask=0, Len=4)
      // Bytes 56-59: 70 6f 6e 67 ("pong")
      rawHex: "001a2b3c4d5e005056fedcba08004500003c4d5e40003f0651a24c4c1515c0a801690050c412000000a2000000a08018ffff318200008104706f6e67",
      layers: [
        {
          name: "WebSocket Framing Protocol (Server)",
          layer: "application",
          fields: [
            { name: "FIN Bit", value: "1", byteRange: [54, 55], description: "Single-frame complete message" },
            { name: "Opcode", value: "0x1 (Text)", byteRange: [54, 55], description: "Text response" },
            { name: "Mask Flag", value: "0 (Unmasked)", byteRange: [55, 56], description: "Server-to-client frames are never masked" },
            { name: "Payload", value: "pong", byteRange: [56, 60], description: "Application payload delivered to WebSocket onmessage" },
          ],
        },
      ],
    },
  ],
  chaosVariants: [
    {
      id: "reject-400",
      name: "Missing Upgrade Header (400 Bad Request)",
      description: "Client sends HTTP request without Upgrade headers, causing the server to reject the connection.",
      triggerStepIndex: 1,
      action: "corrupt_checksum",
      alternateSteps: [
        {
          stepIndex: 1,
          timeMs: 25,
          fromNodeId: "server",
          toNodeId: "client",
          protocolName: "HTTP",
          arrowLabel: "400 Bad Request [Upgrade Rejected]",
          summary: "Server inspects headers and detects missing or invalid Sec-WebSocket-Key. Connection rejected.",
          status: "corrupted",
          rawHex: "001a2b3c4d5e005056fedcba08004500005a2b3c40003f0674064c4c1515c0a801690050c41200000001000000968018ffff54120000485454502f312e31203430302042616420526571756573740d0a0d0a",
          layers: [
            {
              name: "Hypertext Transfer Protocol (400 Rejection)",
              layer: "application",
              fields: [
                { name: "Status Code", value: "400 Bad Request", byteRange: [54, 76], description: "Handshake failed; socket closed" },
              ],
            },
          ],
        },
      ],
    },
  ],
  examChallenge: {
    id: "ws-handshake-order",
    title: "Order the WebSocket Upgrade Sequence",
    prompt: "A browser application wants to establish a persistent WebSocket connection. Order the exchange from HTTP request to bidirectional message frame.",
    shuffledStepIds: [2, 0, 3, 1],
    correctSequence: [0, 1, 2, 3],
    hints: [
      "The connection always starts as an HTTP/1.1 GET with Upgrade: websocket.",
      "The server responds with 101 Switching Protocols to confirm the protocol shift.",
      "Once upgraded, the client sends masked frames before receiving unmasked server responses.",
    ],
    explanation: "WebSocket lifecycle: 1) Client HTTP GET with Upgrade headers, 2) Server 101 Switching Protocols, 3) Client masked text frame, 4) Server unmasked text frame.",
  },
  codeSnippetBridge: {
    language: "javascript",
    title: "JavaScript WebSocket Client",
    code: `// Connect to WebSocket server and send framed message
const socket = new WebSocket("wss://katalyst.dev/chat");

socket.addEventListener("open", () => {
  console.log("WebSocket connection established (101 Switching Protocols)!");
  socket.send("ping");
});

socket.addEventListener("message", (event) => {
  console.log("Received server frame:", event.data);
});

socket.addEventListener("close", (event) => {
  console.log("WebSocket closed:", event.code, event.reason);
});
`,
  },
};
