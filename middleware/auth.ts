// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser();

  if (!user.value) {
    // Pokud uživatel není přihlášen, přesměruj ho na /login
    return navigateTo('/login');
  }
});