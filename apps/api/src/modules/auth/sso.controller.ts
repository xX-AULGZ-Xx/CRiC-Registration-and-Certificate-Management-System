import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, serializeBigInt } from '../../lib/prisma';
import { Role } from '@prisma/client';

const ssoRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'reg-cert-mgmt-system-secret-key-2026';
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || 'http://localhost:8085';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'cric-college';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cric-rcms-app';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || 'cric-rcms-secret-key-2026';
const KEYCLOAK_REDIRECT_URI = process.env.KEYCLOAK_REDIRECT_URI || 'http://localhost:3006/auth/callback';

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
ssoRouter.get('/login-url', (req: Request, res: Response) => {
  try {
    const customRedirectUri = (req.query.redirect_uri as string) || KEYCLOAK_REDIRECT_URI;
    const authEndpoint = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`;

    const url = new URL(authEndpoint);
    url.searchParams.set('client_id', KEYCLOAK_CLIENT_ID);
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
      const tokenEndpoint = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

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
      const userinfoEndpoint = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
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
    const roles: string[] = userInfo.realm_access?.roles || [];

    // Role Mapping:
    // admin -> ADMIN
    // teacher / staff / others -> ORGANIZER
    const isAdmin = roles.includes('admin') || username === 'admin' || email.startsWith('admin@');
    const targetRole: Role = isAdmin ? Role.ADMIN : Role.ORGANIZER;

    // Just-In-Time (JIT) Auto-Provisioning in MySQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (user) {
      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'บัญชีผู้ใช้งานนี้ถูกระงับการใช้งานในระบบ RCMS' });
      }

      // Update user details & role
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          full_name: fullName || user.full_name,
          role: targetRole,
        },
      });
    } else {
      // Auto-create new user
      user = await prisma.user.create({
        data: {
          username,
          email,
          full_name: fullName,
          password_hash: 'SSO_MANAGED_ACCOUNT',
          role: targetRole,
          is_active: true,
          position: targetRole === Role.ADMIN ? 'ผู้ดูแลระบบกลาง' : 'อาจารย์ / ผู้จัดกิจกรรม',
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

export default ssoRouter;
