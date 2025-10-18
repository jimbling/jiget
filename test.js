import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys"
import P from "pino"
import qrcode from "qrcode-terminal" // <-- install ini

async function startSock() {
  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info')

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '120.0.6099.224'],
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    // 🔹 Tampilkan QR code manual
    if (qr) {
      console.log('🟢 Silakan scan QR di bawah ini:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ Terhubung ke WhatsApp!')
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('❌ Koneksi tertutup:', lastDisconnect?.error)
      if (shouldReconnect) startSock()
    }
  })
}

startSock()
