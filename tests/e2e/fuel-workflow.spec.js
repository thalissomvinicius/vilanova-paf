import { expect, test } from "@playwright/test";
import { getDb } from "../../server/db.mjs";

test.describe.serial("controle de abastecimento", () => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const driverName = `Motorista Abastecimento ${suffix}`;
  const plate = `TST${suffix.slice(-4)}`.toUpperCase();
  const requisition = `REQ-${suffix}`;

  test.afterAll(() => {
    const database = getDb();
    database.exec("BEGIN IMMEDIATE");
    try {
      database.prepare("DELETE FROM fuel_records WHERE requisition = ? OR plate = ? OR driver = ?").run(requisition, plate, driverName);
      database.prepare("DELETE FROM fuel_vehicles WHERE plate = ?").run(plate);
      database.prepare("DELETE FROM fuel_drivers WHERE name = ?").run(driverName);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  });

  test("cadastra motorista, veículo, lançamento e preserva histórico ao excluir cadastros", async ({ page }) => {
    const password = process.env.PAF_E2E_ADMIN_PASSWORD;
    test.skip(!password, "Defina PAF_E2E_ADMIN_PASSWORD para validar o abastecimento.");
    await loginAdmin(page, password);
    await page.goto("/admin/abastecimento");

    await page.getByRole("button", { name: "Cadastrar motorista" }).first().click();
    const driverDialog = page.getByRole("dialog", { name: "Cadastrar motorista" });
    await driverDialog.getByLabel("Nome completo").fill(driverName);
    await driverDialog.getByRole("button", { name: "02 Habilitação" }).click();
    await driverDialog.getByLabel("Número da CNH").fill(suffix.slice(-9));
    await driverDialog.getByLabel("Categoria").fill("AB");
    await driverDialog.getByRole("button", { name: "03 Status" }).click();
    await driverDialog.getByRole("button", { name: "Salvar motorista" }).click();
    await expect(driverDialog).toBeHidden();
    await expect(page.getByLabel("Cadastro de motoristas").getByText(driverName, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Cadastrar veículo" }).first().click();
    const vehicleDialog = page.getByRole("dialog", { name: "Cadastrar veículo" });
    await vehicleDialog.getByLabel("Placa").fill(plate);
    await vehicleDialog.getByLabel("Tipo").fill("Caminhonete");
    await vehicleDialog.getByRole("textbox", { name: "Veículo", exact: true }).fill("Veículo de teste do abastecimento");
    await vehicleDialog.getByRole("button", { name: "02 Responsável" }).click();
    await vehicleDialog.getByLabel("Motorista principal").selectOption({ label: driverName });
    await vehicleDialog.getByLabel("Cota mensal em litros").fill("250");
    await vehicleDialog.getByRole("button", { name: "03 Interno" }).click();
    await vehicleDialog.getByLabel("Área").fill("PAF");
    await vehicleDialog.getByRole("button", { name: "Salvar veículo" }).click();
    await expect(vehicleDialog).toBeHidden();
    await expect(page.getByLabel("Cadastro de frota").getByText(plate, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Novo abastecimento" }).first().click();
    const fuelDialog = page.getByRole("dialog", { name: "Novo abastecimento" });
    await fuelDialog.getByLabel("Local").fill("Base PAF");
    await fuelDialog.getByLabel("Condutor").fill(driverName);
    await fuelDialog.getByLabel("Placa").fill(plate);
    await fuelDialog.getByRole("button", { name: "02 Volume e KM" }).click();
    await fuelDialog.getByLabel("Litros solicitados").fill("40");
    await fuelDialog.getByLabel("Litros atendidos").fill("38.5");
    await fuelDialog.getByLabel("KM inicial").fill("1000");
    await fuelDialog.getByLabel("KM final").fill("1120");
    await fuelDialog.getByRole("button", { name: "03 Controle" }).click();
    await fuelDialog.getByLabel("Requisição").fill(requisition);
    await fuelDialog.getByLabel("Observações").fill("Registro temporário da jornada E2E.");
    await fuelDialog.getByRole("button", { name: "Salvar abastecimento" }).click();
    await expect(fuelDialog).toBeHidden();

    const record = getDb().prepare("SELECT supplied_liters, km_start, km_end FROM fuel_records WHERE requisition = ?").get(requisition);
    expect(record.supplied_liters).toBe(38.5);
    expect(record.km_start).toBe(1000);
    expect(record.km_end).toBe(1120);

    const vehicleCard = page.locator(".fuel-vehicle-card").filter({ hasText: plate });
    page.once("dialog", (dialog) => dialog.accept());
    await vehicleCard.getByRole("button", { name: "Excluir veículo" }).click();
    await expect(vehicleCard).toHaveCount(0);

    const driverCard = page.locator(".fuel-driver-card").filter({ hasText: driverName });
    page.once("dialog", (dialog) => dialog.accept());
    await driverCard.getByRole("button", { name: "Excluir motorista" }).click();
    await expect(driverCard).toHaveCount(0);

    expect(getDb().prepare("SELECT count(*) AS total FROM fuel_records WHERE requisition = ?").get(requisition).total).toBe(1);
    await page.request.post("/api/auth/logout");
  });
});

async function loginAdmin(page, password) {
  await page.goto("/admin");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Prontidão do sistema" })).toBeVisible();
}
