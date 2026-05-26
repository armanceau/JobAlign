import { test, expect } from '@playwright/test';

test('homepage loads and displays main UI', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'JobAlign' })).toBeVisible();
  await expect(page.getByText('Étape 1: Télécharger votre CV')).toBeVisible();
  await expect(page.getByPlaceholder("Collez ici l'offre d'emploi complète...")).toBeVisible();
});

test('CV upload section contains the expected PDF prompt', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Glissez un PDF ou cliquez pour sélectionner')).toBeVisible();
  await expect(page.locator('#cv-input')).toHaveAttribute('accept', '.pdf');
});

test('Le bouton “Analyser le CV” est désactivé tant que le CV et le texte extrait ne sont pas disponibles.', async ({ page }) => {
  await page.goto('/');

  const analyzeButton = page.getByRole('button', { name: 'Analyser le CV' });
  await expect(analyzeButton).toBeVisible();
  await expect(analyzeButton).toBeDisabled();
});

test('job offer textarea accepts text input', async ({ page }) => {
  await page.goto('/');

  const offerTextarea = page.getByPlaceholder("Collez ici l'offre d'emploi complète...");
  await expect(offerTextarea).toBeVisible();
  await offerTextarea.fill('Offre de test pour développeur front-end');
  await expect(offerTextarea).toHaveValue('Offre de test pour développeur front-end');
});
