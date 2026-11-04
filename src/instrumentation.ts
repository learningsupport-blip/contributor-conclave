export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { seedSuperAdmin } = await import("@/lib/auth/seed-superadmin");
  try {
    await seedSuperAdmin();
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    console.error(JSON.stringify({ level: "error", event: "superadmin_seed_failed", name }));
  }
}
