import type { ProtocolScenario } from "@/lib/protocols/schema";

export const quicHandshakeScenario: ProtocolScenario = {
  id: "quic-handshake",
  title: "QUIC / HTTP/3 Handshake & Multiplexing (RFC 9000)",
  category: "transport",
  summary: "Explore next-generation HTTP/3 transport over UDP: Initial packet with CRYPTO frames, Connection IDs (CID), 1-RTT key derivation, and Head-of-Line blocking elimination.",
  osiLayer: 4,
  overviewDescription: "QUIC is a multiplexed, secure transport protocol running on top of UDP. It powers HTTP/3, integrating TLS 1.3 encryption directly into the transport layer, eliminating TCP Head-of-Line blocking and supporting connection migration across IP changes.",
  defaultPort: "443 (UDP)",
  transportType: "UDP",
  dataFormat: "Binary (QUIC Packets & Frames)",
  commonMethods: "Initial, Handshake, 1-RTT, Stream Frames",
  rfc: "RFC 9000",
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
      id: "server",
      label: "HTTP/3 Edge (katalyst.dev)",
      type: "server",
      ip: "76.76.21.21",
      mac: "00:50:56:fe:dc:ba",
      xPercent: 85,
      yPercent: 50,
    },
  ],
  wires: [
    { id: "wire-c-s", fromNodeId: "client", toNodeId: "server", label: "UDP Datagrams (:443)" },
  ],
  steps: [
    {
      stepIndex: 0,
      timeMs: 0,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "QUIC",
      arrowLabel: "QUIC Initial [CRYPTO: ClientHello, DCID: 0x8394a1...]",
      summary: "Client initiates QUIC connection over UDP port 443 with Long Header (Initial packet), generating random Destination Connection ID (DCID) and Source Connection ID (SCID), carrying TLS 1.3 ClientHello in a CRYPTO frame.",
      status: "normal",
      rawHex: "005056fedcba001a2b3c4d5e0800450000721a2b4000401184f5c0a801694c4c1515ca6c01bb005e0000c300000001088394a1b2c3d4e5f60812a4b3c2d1e0f9a800403a00010600403616030100310100002d03031234567890abcdef1234567890abcdef00000213010100001a0000000f000d00000a6b6174616c7973742e646576002b0003020304",
      layers: [
        {
          name: "Ethernet II",
          layer: "data-link",
          fields: [
            { name: "Destination MAC", value: "00:50:56:fe:dc:ba", byteRange: [0, 6], description: "Default gateway or server MAC" },
            { name: "Source MAC", value: "00:1a:2b:3c:4d:5e", byteRange: [6, 12], description: "Client network interface MAC" },
            { name: "EtherType", value: "IPv4 (0x0800)", byteRange: [12, 14], description: "Encapsulated IPv4 packet" },
          ],
        },
        {
          name: "User Datagram Protocol (UDP)",
          layer: "transport",
          fields: [
            { name: "Source Port", value: "51820", byteRange: [34, 36], description: "Client ephemeral UDP port" },
            { name: "Destination Port", value: "443 (QUIC / HTTPS)", byteRange: [36, 38], description: "QUIC listens on UDP port 443" },
            { name: "Length", value: "94 bytes", byteRange: [38, 40], description: "Length of UDP header + QUIC payload" },
          ],
        },
        {
          name: "QUIC Long Header (Initial Packet)",
          layer: "network",
          fields: [
            { name: "Header Flags", value: "0xc3 (Long Header, Initial)", byteRange: [42, 43], description: "Form bit=1 (Long), Fixed bit=1, Type=00 (Initial)", katContext: "QUIC uses Long Headers during connection establishment to exchange Connection IDs and version information before encryption is fully active." },
            { name: "Version", value: "QUIC v1 (0x00000001)", byteRange: [43, 47], description: "Standard RFC 9000 QUIC version" },
            { name: "Destination Connection ID", value: "8394a1b2c3d4e5f6 (8 bytes)", byteRange: [48, 56], description: "Initial DCID chosen by client to route packets across IP migrations", katContext: "Unlike TCP which identifies connections by the 4-tuple (IP:Port), QUIC uses Connection IDs so mobile devices can seamlessly switch Wi-Fi to Cellular without dropping sockets!" },
            { name: "Source Connection ID", value: "12a4b3c2d1e0f9a8 (8 bytes)", byteRange: [57, 65], description: "Client CID for server return packets" },
            { name: "Packet Number", value: "1", byteRange: [68, 70], description: "Monotonically increasing QUIC packet number" },
          ],
        },
        {
          name: "QUIC Frames (CRYPTO)",
          layer: "application",
          fields: [
            { name: "Frame Type", value: "0x06 (CRYPTO)", byteRange: [70, 71], description: "Carries cryptographic handshake payload" },
            { name: "ClientHello Payload", value: "TLS 1.3 ClientHello (x25519 KeyShare)", byteRange: [74, 128], description: "Cryptographic negotiation embedded directly within QUIC transport" },
          ],
        },
      ],
    },
    {
      stepIndex: 1,
      timeMs: 25,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "QUIC",
      arrowLabel: "QUIC Initial + Handshake [CRYPTO: ServerHello, ACK]",
      summary: "Server acknowledges Client packet 1, returns ServerHello with server ephemeral KeyShare in an Initial packet, and coalesces Handshake packets containing EncryptedExtensions and Finished certificates.",
      status: "normal",
      rawHex: "001a2b3c4d5e005056fedcba08004500006a2b3c40003f1174124c4c1515c0a8016901bbca6c00560000c3000000010812a4b3c2d1e0f9a8088394a1b2c3d4e5f600403200000201000006004028160303002402000020fedcba0987654321fedcba0987654321001301000010002b0002030400330004001d0020",
      layers: [
        {
          name: "User Datagram Protocol (UDP)",
          layer: "transport",
          fields: [
            { name: "Source Port", value: "443 (QUIC)", byteRange: [34, 36], description: "Server UDP port" },
            { name: "Destination Port", value: "51820", byteRange: [36, 38], description: "Client return UDP port" },
          ],
        },
        {
          name: "QUIC Long Header (Server Response)",
          layer: "network",
          fields: [
            { name: "Header Flags", value: "0xc3 (Long Header)", byteRange: [42, 43], description: "Long header format" },
            { name: "Version", value: "QUIC v1", byteRange: [43, 47], description: "RFC 9000" },
            { name: "Destination CID", value: "12a4b3c2d1e0f9a8", byteRange: [48, 56], description: "Echoes client SCID" },
            { name: "Source CID", value: "8394a1b2c3d4e5f6", byteRange: [57, 65], description: "Server selected CID" },
            { name: "Packet Number", value: "0", byteRange: [68, 70], description: "Server packet sequence number" },
          ],
        },
        {
          name: "QUIC Frames (ACK + CRYPTO)",
          layer: "application",
          fields: [
            { name: "ACK Frame", value: "Largest Acknowledged: 1", byteRange: [70, 74], description: "QUIC ACKs are explicitly framed data, never implicit header flags" },
            { name: "CRYPTO Frame (ServerHello)", value: "Selected Cipher: TLS_AES_128_GCM", byteRange: [74, 120], description: "Server Diffie-Hellman KeyShare completing 1-RTT key derivation" },
          ],
        },
      ],
    },
    {
      stepIndex: 2,
      timeMs: 50,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "HTTP/3",
      arrowLabel: "QUIC Handshake [Finished] + 1-RTT [HTTP/3 GET /]",
      summary: "Client derives 1-RTT application keys, confirms handshake with Finished frame, and immediately multiplexes an encrypted HTTP/3 GET request on Stream 0.",
      status: "normal",
      rawHex: "005056fedcba001a2b3c4d5e0800450000621a2c4000401184f4c0a801694c4c1515ca6c01bb004e0000428394a1b2c3d4e5f6000200010300000017a00102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f30",
      layers: [
        {
          name: "QUIC Short Header (1-RTT Encrypted)",
          layer: "transport",
          fields: [
            { name: "Header Form", value: "0x42 (Short Header, 1-RTT)", byteRange: [42, 43], description: "Bit 7=0 indicates Short Header for post-handshake data packets with minimal 1-byte overhead" },
            { name: "Destination CID", value: "8394a1b2c3d4e5f6", byteRange: [43, 51], description: "Identifies connection instance without IP:Port binding" },
            { name: "Packet Number", value: "2", byteRange: [51, 53], description: "Packet number in 1-RTT space" },
          ],
        },
        {
          name: "HTTP/3 Layer (Stream 0)",
          layer: "application",
          fields: [
            { name: "Stream ID", value: "0 (Client-Initiated Bidirectional)", byteRange: [53, 54], description: "Each HTTP/3 request lives on its own isolated QUIC stream" },
            { name: "Frame Type", value: "0x01 (HEADERS)", byteRange: [54, 55], description: "QPACK compressed HTTP/3 request headers" },
            { name: "Encrypted Request Body", value: "GET / HTTP/3 (QPACK Compressed)", byteRange: [56, 107], description: "Zero-RTT / 1-RTT application payload encrypted with AEAD traffic secret" },
          ],
        },
      ],
    },
    {
      stepIndex: 3,
      timeMs: 75,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "HTTP/3",
      arrowLabel: "QUIC 1-RTT [HTTP/3 200 OK + Payload]",
      summary: "Server serves HTTP/3 response headers (status: 200) and payload over Stream 0. Additional concurrent streams transfer independently without Head-of-Line blocking.",
      status: "normal",
      rawHex: "001a2b3c4d5e005056fedcba0800450000642b3d40003f1174104c4c1515c0a8016901bbca6c005000004212a4b3c2d1e0f9a8000100010300000018d00102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f3031",
      layers: [
        {
          name: "QUIC Short Header",
          layer: "transport",
          fields: [
            { name: "Header Form", value: "0x42 (Short Header)", byteRange: [42, 43], description: "1-RTT Application data header" },
            { name: "Destination CID", value: "12a4b3c2d1e0f9a8", byteRange: [43, 51], description: "Client CID" },
            { name: "Packet Number", value: "1", byteRange: [51, 53], description: "Server 1-RTT packet number" },
          ],
        },
        {
          name: "HTTP/3 Stream 0 Response",
          layer: "application",
          fields: [
            { name: "Stream ID", value: "0", byteRange: [53, 54], description: "HTTP/3 Stream identifier" },
            { name: "Frame Type", value: "0x01 (HEADERS) + 0x00 (DATA)", byteRange: [54, 57], description: "QPACK :status 200 response headers followed by DATA frame" },
            { name: "Encrypted HTML Payload", value: "HTTP/3 200 OK [Content-Type: text/html]", byteRange: [57, 108], description: "Stream payload rendered in browser" },
          ],
        },
      ],
    },
  ],
  chaosVariants: [
    {
      id: "quic-packet-loss",
      name: "UDP Packet Loss & Stream Independence",
      description: "Simulate dropping UDP datagram containing Stream 0. In HTTP/2 over TCP, all streams freeze. In QUIC over UDP, Stream 1 and 2 continue processing while only Stream 0 retransmits!",
      triggerStepIndex: 2,
      action: "drop_packet",
      alternateSteps: [
        {
          stepIndex: 2,
          timeMs: 50,
          fromNodeId: "client",
          toNodeId: "server",
          protocolName: "QUIC",
          arrowLabel: "QUIC 1-RTT [HTTP/3 GET /] (LOST in Transit)",
          summary: "Datagram dropped due to network jitter or congested router. Server receives nothing.",
          status: "dropped",
          rawHex: "005056fedcba001a2b3c4d5e0800450000621a2c4000401184f4c0a801694c4c1515ca6c01bb004e0000428394a1b2c3d4e5f6000200010300000017a00102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f30",
          layers: [
            {
              name: "QUIC Retransmission Timer",
              layer: "transport",
              fields: [
                { name: "Drop Status", value: "Packet Lost in Transit", byteRange: [0, 14], description: "Network dropped datagram" },
                { name: "QUIC Advantage", value: "No Head-of-Line Blocking", byteRange: [42, 53], description: "Other independent QUIC streams remain unaffected while this packet is selectively retransmitted." },
              ],
            },
          ],
        },
        {
          stepIndex: 3,
          timeMs: 120,
          fromNodeId: "client",
          toNodeId: "server",
          protocolName: "QUIC",
          arrowLabel: "QUIC 1-RTT [Retransmit Pkt 3, Stream 0]",
          summary: "Probe Timeout (PTO) fires. Client retransmits the lost CRYPTO/STREAM frame under new Packet Number 3 without resetting connection state.",
          status: "retransmission",
          rawHex: "005056fedcba001a2b3c4d5e0800450000621a2c4000401184f4c0a801694c4c1515ca6c01bb004e0000428394a1b2c3d4e5f6000300010300000017a00102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f30",
          layers: [
            {
              name: "QUIC Fast Retransmit",
              layer: "transport",
              fields: [
                { name: "Packet Number", value: "3 (New Pkt Num)", byteRange: [51, 53], description: "QUIC never reuses packet numbers, avoiding TCP retransmission ambiguity" },
              ],
            },
          ],
        },
      ],
    },
  ],
  examChallenge: {
    id: "quic-handshake-order",
    title: "QUIC & HTTP/3 Handshake Assembly",
    prompt: "Arrange the chronological packet flow for establishing a QUIC v1 connection and executing the first multiplexed HTTP/3 GET request.",
    shuffledStepIds: [2, 0, 3, 1],
    correctSequence: [0, 1, 2, 3],
    hints: [
      "QUIC begins with an Initial packet inside a UDP datagram on port 443 carrying ClientHello.",
      "The server returns ServerHello and ACKs the client's Initial packet.",
      "Once 1-RTT keys are derived, the client immediately sends application data (HTTP/3 GET).",
      "Finally, the server serves the HTTP/3 200 OK payload.",
    ],
    explanation: "QUIC Connection flow: 1) Client Initial with CRYPTO ClientHello, 2) Server Initial + Handshake with ServerHello & ACK, 3) Client Handshake Finished + 1-RTT HTTP/3 GET, 4) Server 1-RTT HTTP/3 200 OK DATA.",
  },
  codeSnippetBridge: {
    language: "javascript",
    title: "Node.js HTTP/3 & QUIC Client Concept",
    code: `// QUIC connections multiplex independent streams over UDP
// and avoid TCP Head-of-Line blocking.
import http3 from "node:net";

console.log("QUIC / HTTP/3 connection initialized over UDP 443");
console.log("Connection ID: 0x8394a1b2c3d4e5f6");
console.log("Stream 0: GET / (Status: 200 OK)");
`,
  },
};
