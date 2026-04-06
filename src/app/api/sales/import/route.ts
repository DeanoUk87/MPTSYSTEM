import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// CSV column order (0-indexed, matching the original Laravel import)
// 0:invoice_number, 1:invoice_date, 2:customer_account, 3:customer_name,
// 4:address1, 5:address2, 6:town, 7:country, 8:postcode, 9:spacer1,
// 10:customer_account2(sage), 11:numb1, 12:items, 13:weight, 14:invoice_total,
// 15:numb2, 16:spacer2, 17:job_number, 18:job_date, 19:sending_depot,
// 20:delivery_depot, 21:destination, 22:town2, 23:postcode2, 24:service_type,
// 25:items2, 26:volume_weight, 27:numb3, 28:increased_liability_cover,
// 29:sub_total, 30:spacer3, 31:numb4, 32:sender_reference, 33:numb5,
// 34:percentage_fuel_surcharge, 35:percentage_resourcing_surcharge,
// 36:spacer4, 37:senders_postcode, 38:vat_amount, 39:vat_percent

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const filename = file.name;

  // Check for duplicate upload
  const existingUpload = await prisma.sale.findFirst({ where: { uploadTs: filename } });
  if (existingUpload) {
    return NextResponse.json({ error: `File "${filename}" has already been imported.` }, { status: 409 });
  }

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());

  let imported = 0;
  let skipped = 0;

  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (cols.length < 10) { skipped++; continue; }
    const customerAccount = cols[2]?.trim();
    if (!customerAccount) { skipped++; continue; }

    const uploadCode = Math.random().toString(36).substring(2, 12);

    await prisma.sale.create({
      data: {
        invoiceNumber: cols[0] ?? "",
        invoiceDate: cols[1] ?? "",
        customerAccount,
        customerName: cols[3] ?? null,
        address1: cols[4] ?? null,
        address2: cols[5] ?? null,
        town: cols[6] ?? null,
        country: cols[7] ?? null,
        postcode: cols[8] ?? null,
        customerAccount2: cols[10] ?? null,
        numb1: cols[11] ?? null,
        items: cols[12] ?? null,
        weight: cols[13] ?? null,
        invoiceTotal: cols[14] ?? null,
        numb2: cols[15] ?? null,
        jobNumber: cols[17] ?? null,
        jobDate: cols[18] ?? null,
        sendingDepot: cols[19] ?? null,
        deliveryDepot: cols[20] ?? null,
        destination: cols[21] ?? null,
        town2: cols[22] ?? null,
        postcode2: cols[23] ?? null,
        serviceType: cols[24] ?? null,
        items2: cols[25] ?? null,
        volumeWeight: cols[26] ?? null,
        numb3: cols[27] ?? null,
        increasedLiabilityCover: cols[28] ?? null,
        subTotal: cols[29] ?? null,
        numb4: cols[31] ?? null,
        senderReference: cols[32] ?? null,
        numb5: cols[33] ?? null,
        percentageFuelSurcharge: cols[34] ?? null,
        percentageResourcingSurcharge: cols[35] ?? null,
        sendersPostcode: cols[37] ?? null,
        vatAmount: cols[38] ?? null,
        vatPercent: cols[39] ?? null,
        uploadCode,
        uploadTs: filename,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, filename });
}
