import type { ProtocolScenario } from "@/lib/protocols/schema";

export const tlsHandshakeScenario: ProtocolScenario = {
  id: "tls-handshake",
  title: "TLS 1.3 Cryptographic Handshake",
  category: "security",
  summary: "Explore 1-RTT cryptographic key exchange in Transport Layer Security 1.3 with ClientHello, ServerHello, Diffie-Hellman KeyShare, and encrypted traffic keys.",
  osiLayer: 6,
  overviewDescription: "Transport Layer Security 1.3 provides confidentiality, integrity, and authenticity over TCP. TLS 1.3 reduces handshake latency to 1-RTT (or 0-RTT resumption) using Diffie-Hellman ephemeral key exchange and mandatory forward secrecy.",
  defaultPort: "443",
  transportType: "TCP",
  dataFormat: "Binary (TLS Records & Handshake Frames)",
  commonMethods: "ClientHello, ServerHello, EncryptedExtensions",
  rfc: "RFC 8446",
  nodes: [
    {
      id: "client",
      label: "Client Browser",
      type: "client",
      ip: "192.168.1.105",
      mac: "00:1a:2b:3c:4d:5e",
      xPercent: 15,
      yPercent: 50,
    },
    {
      id: "server",
      label: "Secure Server (katalyst.dev)",
      type: "server",
      ip: "76.76.21.21",
      mac: "00:50:56:fe:dc:ba",
      xPercent: 85,
      yPercent: 50,
    },
  ],
  wires: [
    { id: "wire-c-s", fromNodeId: "client", toNodeId: "server", label: "Encrypted Channel" },
  ],
  steps: [
    {
      stepIndex: 0,
      timeMs: 0,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "TLS",
      arrowLabel: "ClientHello [KeyShare: x25519, SNI: katalyst.dev]",
      summary: "Client initiates TLS 1.3 negotiation with ClientHello, providing ephemeral Diffie-Hellman public key (x25519), supported cipher suites (AES_128_GCM_SHA256), and Server Name Indication (SNI).",
      status: "normal",
      rawHex: "005056fedcba001a2b3c4d5e0800450000d81a2b4000400684f5c0a801694c4c1515c41201bb00000001000000018018ffff1200000016030100a00100009c03031234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0000021301010000510000000f000d00000a6b6174616c7973742e646576002b0003020304003300260024001d0020112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
      layers: [
        {
          name: "Transport Layer Security (Record: Handshake)",
          layer: "security",
          fields: [
            { name: "Content Type", value: "Handshake (22)", byteRange: [54, 55], description: "TLS Record Content Type" },
            { name: "Legacy Version", value: "TLS 1.0 (0x0301)", byteRange: [55, 57], description: "Legacy version preserved for middlebox compatibility" },
            { name: "Handshake Type", value: "ClientHello (1)", byteRange: [59, 60], description: "Initiating handshake message" },
            { name: "Random Bytes", value: "32 bytes (entropy)", byteRange: [64, 96], description: "Client cryptographic nonce" },
            { name: "Cipher Suite", value: "TLS_AES_128_GCM_SHA256 (0x1301)", byteRange: [98, 100], description: "Modern AEAD cipher suite" },
            { name: "Supported Version", value: "TLS 1.3 (0x0304)", byteRange: [122, 126], description: "Actual negotiated TLS version in extension", katContext: "In TLS 1.3, the real protocol version (0x0304) is placed inside the 'supported_versions' extension to prevent older middleboxes from dropping the packet." },
            { name: "Key Share (ECDH)", value: "x25519 (Curve25519)", byteRange: [130, 166], description: "Client ephemeral public key for immediate 1-RTT key agreement" },
          ],
        },
      ],
    },
    {
      stepIndex: 1,
      timeMs: 25,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "TLS",
      arrowLabel: "ServerHello [KeyShare: x25519, SelectedVersion: TLS 1.3]",
      summary: "Server selects TLS 1.3, chooses cipher TLS_AES_128_GCM_SHA256, and responds with its own ephemeral public key. Both sides now independently derive the handshake traffic secret.",
      status: "normal",
      rawHex: "001a2b3c4d5e005056fedcba0800450000a82b3c40003f0674064c4c1515c0a8016901bbc41200000001000000a28018ffff5412000016030300700200006c0303fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321001301000044002b0002030400330024001d0020aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
      layers: [
        {
          name: "Transport Layer Security (ServerHello)",
          layer: "security",
          fields: [
            { name: "Handshake Type", value: "ServerHello (2)", byteRange: [59, 60], description: "Server handshake response" },
            { name: "Server Random", value: "32 bytes (entropy)", byteRange: [64, 96], description: "Server cryptographic nonce" },
            { name: "Selected Cipher", value: "TLS_AES_128_GCM_SHA256", byteRange: [96, 98], description: "Agreed cryptographic suite" },
            { name: "Server Key Share", value: "x25519 public key", byteRange: [110, 146], description: "Server ephemeral public key" },
          ],
        },
      ],
    },
    {
      stepIndex: 2,
      timeMs: 30,
      fromNodeId: "server",
      toNodeId: "client",
      protocolName: "TLS",
      arrowLabel: "EncryptedExtensions, Certificate, Finished",
      summary: "Server transmits EncryptedExtensions, X.509 Certificate, digital signature (CertificateVerify), and HMAC Finished message—all encrypted with Handshake Traffic Keys.",
      status: "normal",
      rawHex: "001a2b3c4d5e005056fedcba0800450000e43c4d40003f0663f54c4c1515c0a8016901bbc41200000072000000a28018ffff2104000017030300b099887766554433221100aabbccddeeff99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff",
      layers: [
        {
          name: "Transport Layer Security (Encrypted Handshake)",
          layer: "security",
          fields: [
            { name: "Record Type", value: "Application Data (23)", byteRange: [54, 55], description: "Encrypted record envelope concealing inner handshake contents" },
            { name: "Encrypted Payload", value: "EncryptedExtensions + Certificate + Finished", byteRange: [59, 139], description: "Zero plaintext exposure of certificates or SNI on wire" },
          ],
        },
      ],
    },
    {
      stepIndex: 3,
      timeMs: 48,
      fromNodeId: "client",
      toNodeId: "server",
      protocolName: "TLS",
      arrowLabel: "Client Finished -> Application Traffic Keys Live",
      summary: "Client verifies certificate signature, computes Master Secret, transmits client Finished message, and switches to Application Traffic Keys. Secure channel established in 1 round trip!",
      status: "normal",
      rawHex: "005056fedcba001a2b3c4d5e0800450000644d5e4000400651e4c0a801694c4c1515c41201bb000000a2000001248018ffff981000001703030030112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
      layers: [
        {
          name: "Transport Layer Security (Finished)",
          layer: "security",
          fields: [
            { name: "Security Status", value: "SECURE CHANNEL ACTIVE", byteRange: [54, 58], description: "1-RTT handshake complete. Symmetric encryption engaged." },
          ],
        },
      ],
    },
  ],
  codeSnippetBridge: {
    language: "python",
    title: "Python TLS 1.3 Context Socket",
    code: `import ssl
import socket

# Create strict TLS 1.3 context
context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
context.minimum_version = ssl.TLSVersion.TLSv1_3
context.load_default_certs()

with socket.create_connection(("katalyst.dev", 443)) as sock:
    with context.wrap_socket(sock, server_hostname="katalyst.dev") as ssock:
        print("Negotiated Protocol:", ssock.version())
        print("Negotiated Cipher:", ssock.cipher())
`,
  },
};
