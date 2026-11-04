-- Super admin is assigned only by the startup seed, never by public registration.
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';
