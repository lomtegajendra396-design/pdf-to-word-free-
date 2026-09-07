const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const ILovePDFApi = require("@ilovepdf/ilovepdf-nodejs");
const ILovePDFFile = require("@ilovepdf/ilovepdf-nodejs/ILovePDFFile");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/"
});

// iLovePDF API
const ilove = new ILovePDFApi(
  process.env.ILOVEPDF_PUBLIC_KEY,
  process.env.ILOVEPDF_SECRET_KEY
);

// Home
app.get("/", (req, res) => {
  res.send("PDF Tools Backend is Running!");
});

// Merge PDF
app.post("/merge", upload.array("pdfs", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        error: "Kam se kam 2 PDF files select karein"
      });
    }

    const task = ilove.newTask("merge");

    await task.start();

    for (const file of req.files) {
      const pdfFile = new ILovePDFFile(file.path);
      await task.addFile(pdfFile);
    }

    await task.process();

    const data = await task.download();

    const outputPath = `uploads/merged-${Date.now()}.pdf`;

    fs.writeFileSync(outputPath, data);

    // Temporary uploaded files delete
    for (const file of req.files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    res.download(outputPath, "merged.pdf", () => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "PDF merge nahi ho paya"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
