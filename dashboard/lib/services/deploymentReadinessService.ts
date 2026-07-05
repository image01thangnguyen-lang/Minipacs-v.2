import { prisma } from '../../app/db';

export async function getDeploymentReadiness() {
  const checks = [];

  // 1. Env Vars
  const requiredEnvs = ['NODE_ENV', 'DATABASE_URL', 'AUTH_SECRET', 'ORTHANC_API_URL'];
  const envResults = requiredEnvs.map(env => ({
    key: env,
    configured: !!process.env[env]
  }));
  checks.push({
    category: 'Environment Variables',
    items: envResults.map(e => ({
      name: e.key,
      status: e.configured ? 'OK' : 'FAIL',
      message: e.configured ? 'Configured' : 'Missing'
    }))
  });

  // 2. Database
  let dbStatus = 'FAIL';
  let dbMessage = 'Not connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'OK';
    dbMessage = 'Connected successfully';
  } catch (e: any) {
    dbMessage = e.message;
  }
  checks.push({
    category: 'Database Configuration',
    items: [{ name: 'PostgreSQL Connection', status: dbStatus, message: dbMessage }]
  });

  // 3. Orthanc
  let orthancStatus = 'FAIL';
  let orthancMessage = 'Not reachable';
  try {
    const url = process.env.ORTHANC_API_URL;
    if (url) {
      const res = await fetch(`${url}/system`);
      if (res.ok) {
        orthancStatus = 'OK';
        orthancMessage = 'Reachable';
      } else {
        orthancMessage = `HTTP ${res.status}`;
      }
    } else {
      orthancMessage = 'URL missing';
    }
  } catch (e: any) {
    orthancMessage = 'Connection Error (Scrubbed)';
  }
  checks.push({
    category: 'Orthanc Configuration',
    items: [{ name: 'Orthanc API', status: orthancStatus, message: orthancMessage }]
  });

  return checks;
}


