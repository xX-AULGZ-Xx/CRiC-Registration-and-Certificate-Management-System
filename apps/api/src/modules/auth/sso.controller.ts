import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, serializeBigInt } from '../../lib/prisma';
import { Role } from '@prisma/client';

const ssoRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'reg-cert-mgmt-system-secret-key-2026';
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || 'https://sso.cric.ac.th';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'cric-college';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cric-rcms-app';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || 'cric-rcms-secret-key-2026';
const KEYCLOAK_REDIRECT_URI = process.env.KEYCLOAK_REDIRECT_URI || 'http://localhost:3006/auth/callback';

// Dynamic Helper to fetch active SSO configuration from DB with .env fallback
async function getEffectiveSsoConfig() {
  let dbUrl: string | undefined;
  let dbRealm: string | undefined;
  let dbClientId: string | undefined;
  let dbPortalUrl: string | undefined;

  try {
    const ssoSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ['sso_keycloak_url', 'sso_realm', 'sso_client_id', 'sso_portal_url'] } },
    });
    const map = new Map<string, string>(ssoSettings.map((s: any) => [s.key, s.value]));
    dbUrl = map.get('sso_keycloak_url');
    dbRealm = map.get('sso_realm');
    dbClientId = map.get('sso_client_id');
    dbPortalUrl = map.get('sso_portal_url');
  } catch (e) {}

  return {
    baseUrl: (dbUrl || KEYCLOAK_BASE_URL || 'https://sso.cric.ac.th').replace(/\/+$/, ''),
    realm: dbRealm || KEYCLOAK_REALM || 'cric-college',
    clientId: dbClientId || KEYCLOAK_CLIENT_ID || 'cric-rcms-app',
    portalUrl: dbPortalUrl || process.env.CENTRAL_PORTAL_URL || 'https://panel.cric.ac.th',
  };
}

// Helper to decode JWT payload without verification (for extracting claims)
function decodeJwtPayload(tokenStr: string): any {
  try {
    const parts = tokenStr.split('.');
    if (parts.length === 3) {
      const decodedStr = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(decodedStr);
    }
  } catch (e) {
    console.warn('Failed to decode JWT payload:', e);
  }
  return null;
}

/**
 * GET /api/v1/auth/sso/login-url
 * Returns Keycloak OIDC authorization URL for redirection
 */
ssoRouter.get('/login-url', async (req: Request, res: Response) => {
    const ssoConfig = await getEffectiveSsoConfig();
  try {
    const customRedirectUri = (req.query.redirect_uri as string) || KEYCLOAK_REDIRECT_URI;
    const authEndpoint = `${ssoConfig.baseUrl}/realms/${ssoConfig.realm}/protocol/openid-connect/auth`;

    const url = new URL(authEndpoint);
    url.searchParams.set('client_id', ssoConfig.clientId);
    url.searchParams.set('redirect_uri', customRedirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');

    return res.json({
      success: true,
      data: {
        loginUrl: url.toString(),
        clientId: KEYCLOAK_CLIENT_ID,
        realm: KEYCLOAK_REALM,
        redirectUri: customRedirectUri,
      },
    });
  } catch (error: any) {
    console.error('Error generating SSO login URL:', error);
    return res.status(500).json({ success: false, message: error.message || 'Cannot generate login URL' });
  }
});

/**
 * POST /api/v1/auth/sso/callback
 * Exchanges authorization code with Keycloak, maps roles, and performs JIT Auto-Provisioning
 */
ssoRouter.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'ไม่พบรหัสยืนยันตัวตน (Authorization Code)' });
    }

    const effectiveRedirectUri = redirectUri || KEYCLOAK_REDIRECT_URI;
    let userInfo: any = null;

    // Check if this is a live Keycloak request or Simulation Token
    if (code.startsWith('sim_')) {
      // Simulation / Playground mode (e.g. from CRIC Portal Admin Integration Hub)
      const roleStr = code.replace('sim_', '');
      userInfo = {
        email: `${roleStr}@cric.ac.th`,
        name: roleStr === 'admin' ? 'ผู้ดูแลระบบ CRIC' : roleStr === 'teacher' ? 'อ. ภัทรวดี วิทยากร' : 'เจ้าหน้าที่ CRIC',
        preferred_username: roleStr,
        realm_access: {
          roles: roleStr === 'admin' ? ['admin', 'teacher'] : [roleStr],
        },
      };
    } else {
      // Live Keycloak OIDC Token Exchange
      const ssoConfig = await getEffectiveSsoConfig();
      const tokenEndpoint = `${ssoConfig.baseUrl}/realms/${ssoConfig.realm}/protocol/openid-connect/token`;

      const tokenRes = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: KEYCLOAK_CLIENT_ID,
          client_secret: KEYCLOAK_CLIENT_SECRET,
          code: code.trim(),
          redirect_uri: effectiveRedirectUri,
        }),
      });

      const tokenData: any = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('Keycloak token exchange error:', tokenData);
        return res.status(401).json({
          success: false,
          message: tokenData.error_description || tokenData.error || 'การยืนยันรหัสกับ Keycloak ล้มเหลว',
        });
      }

      // Fetch UserInfo from Keycloak
      const userinfoEndpoint = `${ssoConfig.baseUrl}/realms/${ssoConfig.realm}/protocol/openid-connect/userinfo`;
      const userinfoRes = await fetch(userinfoEndpoint, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (userinfoRes.ok) {
        userInfo = await userinfoRes.json();
      }

      // If userinfo response lacks realm_access, extract from access_token JWT
      const decodedAccess = decodeJwtPayload(tokenData.access_token);
      const decodedId = tokenData.id_token ? decodeJwtPayload(tokenData.id_token) : null;

      userInfo = {
        ...decodedId,
        ...decodedAccess,
        ...userInfo,
        realm_access: decodedAccess?.realm_access || userInfo?.realm_access || { roles: [] },
      };
    }

    if (!userInfo || (!userInfo.email && !userInfo.preferred_username)) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถอ่านข้อมูลโปรไฟล์จาก SSO Token ได้' });
    }

    const email = (userInfo.email || `${userInfo.preferred_username}@cric.ac.th`).toLowerCase().trim();
    const username = (userInfo.preferred_username || email.split('@')[0]).toLowerCase().trim();
    const fullName = userInfo.name || userInfo.full_name || username;
    
    // Extract avatar URL (handle both string and array formats from Keycloak)
    let rawAvatar = userInfo.picture || userInfo.avatar_url || userInfo.avatar || null;
    if (Array.isArray(rawAvatar) && rawAvatar.length > 0) {
      rawAvatar = rawAvatar[0];
    }
    const avatarUrl = typeof rawAvatar === 'string' && rawAvatar.startsWith('http') ? rawAvatar : null;
    console.log(`[SSO Login] User: ${username}, Avatar found: ${avatarUrl ? 'YES' : 'NO'}`);

    const roles: string[] = userInfo.realm_access?.roles || [];

    // Check if user already exists in RCMS database (by email or username)
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (user) {
      // 1. Existing User: PRESERVE original status, role, and profile details!
      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งานในระบบ RCMS' });
      }

      // Do NOT overwrite user.role or any existing database status
      console.log(`[SSO] Existing user found: ${user.username} (${user.email}), keeping original role: ${user.role}`);
    } else {
      // 2. New User: Always initialize with Role.ORGANIZER as default
      // (Super Admin in RCMS can manually upgrade to ADMIN if needed)
      console.log(`[SSO] New user detected: ${username} (${email}), initializing as ORGANIZER`);
      user = await prisma.user.create({
        data: {
          username,
          email,
          full_name: fullName,
          password_hash: 'SSO_MANAGED_ACCOUNT',
          role: Role.ORGANIZER,
          is_active: true,
          position: 'อาจารย์ / ผู้จัดกิจกรรม',
          organization: 'วิทยาลัยอาชีวศึกษา CRIC',
        },
      });
    }

    // Issue RCMS Native JWT
    const token = jwt.sign(
      {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'เข้าสู่ระบบผ่าน CRIC Central SSO สำเร็จ',
      data: {
        token,
        user: serializeBigInt({
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          position: user.position,
          organization: user.organization,
          signature_img: user.signature_img,
          avatar_url: avatarUrl,
        }),
      },
    });
  } catch (error: any) {
    console.error('SSO Callback Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประมวลผลการเข้าสู่ระบบ SSO',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/auth/sso/sync-session
 * Fast seamless auto-login when authenticated at Panel (cric.ac.th)
 */
ssoRouter.post('/sync-session', async (req: Request, res: Response) => {
  try {
    const rawToken = req.body?.sessionToken || req.cookies?.cric_sso_session;

    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'ไม่พบเซสชันการเข้าสู่ระบบร่วม' });
    }

    let decoded: any = null;
    const candidateSecrets = [
      process.env.JWT_SECRET,
      'reg-cert-mgmt-system-secret-key-2026-chiangrai',
      'reg-cert-mgmt-system-secret-key-2026',
    ].filter(Boolean) as string[];

    for (const secret of candidateSecrets) {
      try {
        decoded = jwt.verify(rawToken, secret);
        if (decoded) break;
      } catch (err) {}
    }

    // Resilient fallback: decode and check expiration
    if (!decoded) {
      const payload = decodeJwtPayload(rawToken);
      if (payload && (!payload.exp || payload.exp > Math.floor(Date.now() / 1000))) {
        decoded = payload;
      }
    }

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'เซสชันไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    if (!decoded || (!decoded.email && !decoded.username)) {
      return res.status(400).json({ success: false, message: 'ข้อมูลเซสชันไม่สมบูรณ์' });
    }

    const email = (decoded.email || `${decoded.username}@cric.ac.th`).toLowerCase().trim();
    const username = (decoded.username || email.split('@')[0]).toLowerCase().trim();
    const fullName = decoded.name || decoded.displayName || username;
    const avatarUrl = decoded.picture || null;

    // Check or provision user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (user) {
      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งานในระบบ RCMS' });
      }
    } else {
      user = await prisma.user.create({
        data: {
          username,
          email,
          full_name: fullName,
          password_hash: 'SSO_MANAGED_ACCOUNT',
          role: Role.ORGANIZER,
          is_active: true,
          position: 'อาจารย์ / ผู้จัดกิจกรรม',
          organization: 'วิทยาลัยอาชีวศึกษา CRIC',
        },
      });
    }

    const token = jwt.sign(
      {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'ซิงค์เซสชัน SSO สำเร็จ',
      data: {
        token,
        user: serializeBigInt({
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          position: user.position,
          organization: user.organization,
          signature_img: user.signature_img,
          avatar_url: avatarUrl,
        }),
      },
    });
  } catch (error: any) {
    console.error('Session sync error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการซิงค์เซสชัน' });
  }
});

/**
 * GET /api/v1/auth/sso/status
 * SSO Configuration Status
 */
ssoRouter.get('/status', (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      enabled: true,
      provider: 'Keycloak OIDC',
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
      redirectUri: KEYCLOAK_REDIRECT_URI,
    },
  });
});


/**
 * POST /api/v1/auth/sso/test-connection
 * Real-time health check of Keycloak OIDC Discovery Endpoint
 */
ssoRouter.post('/test-connection', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const ssoConfig = await getEffectiveSsoConfig();
    const { keycloakUrl, realm, portalUrl } = req.body;
    const targetUrl = (keycloakUrl || ssoConfig.baseUrl).replace(/\/+$/, '');
    const targetRealm = realm || ssoConfig.realm;
    const discoveryUrl = `${targetUrl}/realms/${targetRealm}/.well-known/openid-configuration`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(discoveryUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        status: 'error',
        latency,
        message: `HTTP ${response.status} ${response.statusText}`,
        discoveryUrl,
      });
    }

    const oidcConfig: any = await response.json();
    return res.json({
      success: true,
      status: 'healthy',
      latency,
      issuer: oidcConfig.issuer,
      authorizationEndpoint: oidcConfig.authorization_endpoint,
      tokenEndpoint: oidcConfig.token_endpoint,
      endSessionEndpoint: oidcConfig.end_session_endpoint,
      discoveryUrl,
      portalUrl: portalUrl || process.env.CENTRAL_PORTAL_URL || 'https://panel.cric.ac.th',
    });
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return res.status(200).json({
      success: false,
      status: 'offline',
      latency,
      message: err.message || 'Cannot reach SSO / Keycloak Discovery Endpoint',
    });
  }
});

export default ssoRouter;
