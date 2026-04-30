const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CODES_FILE = path.join(DATA_DIR, 'codes.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Helper: Generate random code (6 characters, alphanumeric)
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper: Ensure data files exist
async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  
  try {
    await fs.access(CODES_FILE);
  } catch {
    await fs.writeFile(CODES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Helper: Read codes
async function readCodes() {
  await ensureDataFiles();
  const raw = await fs.readFile(CODES_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

// Helper: Write codes
async function writeCodes(codes) {
  await fs.writeFile(CODES_FILE, JSON.stringify(codes, null, 2), 'utf-8');
}

// Helper: Read users
async function readUsers() {
  await ensureDataFiles();
  const raw = await fs.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

// Helper: Write users
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Clean up expired codes (older than 5 minutes)
async function cleanupExpiredCodes() {
  const codes = await readCodes();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const validCodes = codes.filter(code => (now - code.createdAt) < fiveMinutes && !code.linked);
  if (validCodes.length !== codes.length) {
    await writeCodes(validCodes);
  }
  return validCodes;
}

// POST /api/generate-code - Generate a new verification code
app.post('/api/generate-code', async (req, res) => {
  try {
    // Clean up expired codes first
    await cleanupExpiredCodes();
    
    const codes = await readCodes();
    
    // Check if there's already an unlinked code (prevent spam)
    const existingUnlinked = codes.find(c => !c.linked);
    if (existingUnlinked) {
      return res.json({ 
        success: false, 
        message: 'Du hast bereits einen aktiven Code. Verwende diesen oder warte bis er abläuft.',
        code: existingUnlinked.code 
      });
    }
    
    // Generate new code
    const newCode = generateCode();
    const codeEntry = {
      code: newCode,
      linked: false,
      robloxUserId: null,
      createdAt: Date.now()
    };
    
    codes.push(codeEntry);
    await writeCodes(codes);
    
    return res.json({ 
      success: true, 
      code: newCode,
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Error generating code:', error);
    return res.status(500).json({ success: false, message: 'Fehler beim Generieren des Codes.' });
  }
});

// POST /api/verify-code - Verify a code from Roblox game
app.post('/api/verify-code', async (req, res) => {
  try {
    const { code, robloxUserId } = req.body;
    
    if (!code || !robloxUserId) {
      return res.status(400).json({ success: false, message: 'Code und Roblox UserId erforderlich.' });
    }
    
    const codes = await readCodes();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Find the code
    const codeIndex = codes.findIndex(c => c.code === code.toUpperCase());
    
    if (codeIndex === -1) {
      return res.status(404).json({ success: false, message: 'Ungültiger Code.' });
    }
    
    const codeEntry = codes[codeIndex];
    
    // Check if already linked
    if (codeEntry.linked) {
      return res.status(400).json({ success: false, message: 'Dieser Code wurde bereits verwendet.' });
    }
    
    // Check if expired
    if ((now - codeEntry.createdAt) >= fiveMinutes) {
      codes.splice(codeIndex, 1);
      await writeCodes(codes);
      return res.status(400).json({ success: false, message: 'Code ist abgelaufen.' });
    }
    
    // Mark as linked
    codeEntry.linked = true;
    codeEntry.robloxUserId = robloxUserId;
    codeEntry.linkedAt = now;
    
    await writeCodes(codes);
    
    // Add/update user in users database
    const users = await readUsers();
    let user = users.find(u => u.robloxUserId === robloxUserId);
    
    if (user) {
      user.codesVerified = (user.codesVerified || 0) + 1;
      user.lastVerified = now;
    } else {
      user = {
        robloxUserId: robloxUserId,
        codesVerified: 1,
        firstVerified: now,
        lastVerified: now
      };
      users.push(user);
    }
    
    await writeUsers(users);
    
    return res.json({ 
      success: true, 
      message: 'Account erfolgreich verknüpft!',
      robloxUserId: robloxUserId
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ success: false, message: 'Fehler beim Verifizieren des Codes.' });
  }
});

// GET /api/status/:code - Check status of a code
app.get('/api/status/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const codes = await readCodes();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    const codeEntry = codes.find(c => c.code === code.toUpperCase());
    
    if (!codeEntry) {
      return res.json({ 
        found: false, 
        linked: false,
        message: 'Code nicht gefunden.'
      });
    }
    
    const isExpired = (now - codeEntry.createdAt) >= fiveMinutes;
    
    return res.json({ 
      found: true,
      linked: codeEntry.linked,
      expired: isExpired,
      robloxUserId: codeEntry.linked ? codeEntry.robloxUserId : null,
      createdAt: codeEntry.createdAt
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({ found: false, linked: false, message: 'Fehler beim Prüfen des Status.' });
  }
});

// GET /api/user/:robloxUserId - Get user info by Roblox ID
app.get('/api/user/:robloxUserId', async (req, res) => {
  try {
    const { robloxUserId } = req.params;
    const users = await readUsers();
    
    const user = users.find(u => u.robloxUserId === parseInt(robloxUserId));
    
    if (!user) {
      return res.json({ 
        found: false, 
        verified: false
      });
    }
    
    return res.json({ 
      found: true,
      verified: true,
      robloxUserId: user.robloxUserId,
      codesVerified: user.codesVerified,
      firstVerified: user.firstVerified,
      lastVerified: user.lastVerified
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ found: false, verified: false, message: 'Fehler beim Laden der User-Daten.' });
  }
});

// Serve homepage
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  await ensureDataFiles();
  console.log(`Roblox Account Linking Server läuft auf http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log('  POST /api/generate-code - Generate new verification code');
  console.log('  POST /api/verify-code   - Verify code from Roblox game');
  console.log('  GET  /api/status/:code  - Check code status');
  console.log('  GET  /api/user/:id      - Get user info by Roblox ID');
});
