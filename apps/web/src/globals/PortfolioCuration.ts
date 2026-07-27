import type { GlobalConfig } from "payload";
import { isAdmin } from "../access";

// Writing rules the owner sets once and the PAI curator applies to EVERY repo it
// scores. Corrections about a single repo belong in `curation.ownerFeedback` on
// that entry; this global is only for rules that should hold everywhere.
export const PortfolioCuration: GlobalConfig = {
  slug: "portfolio-curation",
  label: "Catatan Kurasi Portfolio",
  access: { read: isAdmin, update: isAdmin },
  admin: { description: "Aturan menulis untuk AI kurator portfolio (PAI)." },
  fields: [
    {
      name: "styleNotes",
      type: "textarea",
      admin: {
        description:
          'Berlaku ke SEMUA entri portfolio. Satu aturan per baris, mis. "maksimal 3 ' +
          'paragraf", "jangan pakai kata innovative". Koreksi khusus satu repo ditulis ' +
          "di kolom Owner Feedback pada entri repo itu, bukan di sini.",
      },
    },
  ],
};
