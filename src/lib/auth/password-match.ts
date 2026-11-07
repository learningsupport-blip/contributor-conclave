export function passwordMatchStatus(password: string, confirmPassword: string): "idle" | "match" | "mismatch" {
  if (confirmPassword.length === 0) {
    return "idle";
  }
  return password === confirmPassword ? "match" : "mismatch";
}
