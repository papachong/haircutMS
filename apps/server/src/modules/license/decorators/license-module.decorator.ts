import { SetMetadata } from '@nestjs/common';

export const LICENSE_MODULE_KEY = 'licenseModule';

/**
 * Decorator that sets the required license module(s) for a route.
 * The LicenseGuard will check if the current license includes
 * access to the specified module.
 *
 * @example
 * @LicenseModule('report')
 * @Get('reports')
 * getReports() {}
 *
 * @example
 * @LicenseModule(['report', 'analytics'])
 * @Get('dashboard')
 * getDashboard() {}
 */
export const LicenseModule = (module: string | string[]) =>
  SetMetadata(LICENSE_MODULE_KEY, Array.isArray(module) ? module : [module]);
