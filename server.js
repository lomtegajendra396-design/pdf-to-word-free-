const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const ILovePDFApi = require("@ilovepdf/ilovepdf-nodejs");
const ILovePDFFile = require("@ilovepdf/ilovepdf-nodejs/ILovePDFFile");

const app = express();

app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DIR
});

const ilove = new ILovePDFApi(
  process.env.ILOVEPDF_PUBLIC_KEY,
  process.env.ILOVEPDF_SECRET_KEY
);

app.get("/", (req, res) => {
  res.send("PDF Tools Backend is Running!");
});


/* =========================
   HELPER FUNCTIONS
========================= */

async function runTask(taskName, files, params = {}) {

  const task = ilove.newTask(taskName);

  await task.start();

  for (const file of files) {
    const pdfFile = new ILovePDFFile(file.path);
    await task.addFile(pdfFile);
  }

  await task.process(params);

  return await task.download();
}


function cleanupFiles(files) {

  if (!files) return;

  for (const file of files) {

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}


function sendFile(res, data, filename) {

  const outputPath = path.join(
    UPLOAD_DIR,
    `${Date.now()}-${filename}`
  );

  fs.writeFileSync(outputPath, data);

  res.download(outputPath, filename, () => {

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

  });
}


/* =========================
   1. MERGE PDF
========================= */

app.post(
  "/merge",
  upload.array("pdfs", 20),
  async (req, res) => {

    try {

      if (!req.files || req.files.length < 2) {

        return res.status(400).json({
          error: "Kam se kam 2 PDF files select karein"
        });

      }

      const data = await runTask(
        "merge",
        req.files
      );

      cleanupFiles(req.files);

      sendFile(
        res,
        data,
        "merged.pdf"
      );

    } catch (error) {

      cleanupFiles(req.files);

      console.error(error);

      res.status(500).json({
        error: "PDF merge nahi ho paya"
      });

    }

  }
);


/* =========================
   2. SPLIT PDF
========================= */

app.post(
  "/split",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const ranges =
        req.body.ranges || "1";

      const data = await runTask(
        "split",
        [req.file],
        {
          split_mode: "ranges",
          ranges: ranges
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "split-pdf.zip"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF split nahi ho paya"
      });

    }

  }
);


/* =========================
   3. COMPRESS PDF
========================= */

app.post(
  "/compress",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const quality =
        req.body.quality || "recommended";

      const data = await runTask(
        "compress",
        [req.file],
        {
          compression_level: quality
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "compressed.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF compress nahi ho paya"
      });

    }

  }
);


/* =========================
   4. PDF TO JPG
========================= */

app.post(
  "/pdf-to-jpg",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const data = await runTask(
        "pdfjpg",
        [req.file]
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "pdf-to-jpg.zip"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF to JPG nahi ho paya"
      });

    }

  }
);


/* =========================
   5. JPG TO PDF
========================= */

app.post(
  "/jpg-to-pdf",
  upload.array("images", 20),
  async (req, res) => {

    try {

      if (!req.files || req.files.length === 0) {

        return res.status(400).json({
          error: "Images select karein"
        });

      }

      const data = await runTask(
        "imagepdf",
        req.files
      );

      cleanupFiles(req.files);

      sendFile(
        res,
        data,
        "images-to-pdf.pdf"
      );

    } catch (error) {

      cleanupFiles(req.files);

      console.error(error);

      res.status(500).json({
        error: "Images to PDF nahi ho paya"
      });

    }

  }
);


/* =========================
   6. OCR PDF
========================= */

app.post(
  "/ocr",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const language =
        req.body.language || "eng";

      const data = await runTask(
        "pdfocr",
        [req.file],
        {
          language: language
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "ocr-pdf.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "OCR nahi ho paya"
      });

    }

  }
);


/* =========================
   7. ROTATE PDF
========================= */

app.post(
  "/rotate",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const rotation =
        Number(req.body.rotation || 90);

      const data = await runTask(
        "rotate",
        [req.file],
        {
          rotation: rotation
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "rotated.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF rotate nahi ho paya"
      });

    }

  }
);


/* =========================
   8. PROTECT PDF
========================= */

app.post(
  "/protect",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const password =
        req.body.password;

      if (!password) {

        cleanupFiles([req.file]);

        return res.status(400).json({
          error: "Password required hai"
        });

      }

      const data = await runTask(
        "protect",
        [req.file],
        {
          password: password
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "protected.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF protect nahi ho paya"
      });

    }

  }
);


/* =========================
   9. UNLOCK PDF
========================= */

app.post(
  "/unlock",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const password =
        req.body.password || null;

      const fileOptions = {
        password: password
      };

      const task =
        ilove.newTask("unlock");

      await task.start();

      const pdfFile =
        new ILovePDFFile(
          req.file.path,
          fileOptions
        );

      await task.addFile(pdfFile);

      await task.process();

      const data =
        await task.download();

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "unlocked.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF unlock nahi ho paya"
      });

    }

  }
);


/* =========================
   10. WATERMARK PDF
========================= */

app.post(
  "/watermark",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const watermark =
        req.body.watermark || "Watermark";

      const position =
        req.body.position || "center";

      const data = await runTask(
        "watermark",
        [req.file],
        {
          text: watermark,
          position: position
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "watermarked.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "Watermark nahi lag paya"
      });

    }

  }
);


/* =========================
   11. PAGE NUMBERS
========================= */

app.post(
  "/page-numbers",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const position =
        req.body.position ||
        "bottom-center";

      const data = await runTask(
        "pagenumber",
        [req.file],
        {
          position: position
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "page-numbered.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "Page numbers add nahi ho paye"
      });

    }

  }
);


/* =========================
   12. REPAIR PDF
========================= */

app.post(
  "/repair",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const data = await runTask(
        "repair",
        [req.file]
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "repaired.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF repair nahi ho paya"
      });

    }

  }
);


/* =========================
   13. PDF/A
========================= */

app.post(
  "/pdfa",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const profile =
        req.body.profile || "pdfa-1b";

      const data = await runTask(
        "pdfa",
        [req.file],
        {
          conformance: profile
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "converted-pdfa.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "PDF/A conversion nahi ho paya"
      });

    }

  }
);


/* =========================
   14. VALIDATE PDF/A
========================= */

app.post(
  "/validate-pdfa",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const data = await runTask(
        "validatepdfa",
        [req.file]
      );

      cleanupFiles([req.file]);

      res.json({
        valid: true,
        message: "PDF/A validation completed"
      });

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.json({
        valid: false,
        message: "PDF/A validation failed"
      });

    }

  }
);


/* =========================
   15. EXTRACT
========================= */

app.post(
  "/extract",
  upload.single("pdf"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "PDF select karein"
        });

      }

      const pages =
        req.body.pages || "1";

      const data = await runTask(
        "extract",
        [req.file],
        {
          ranges: pages
        }
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "extracted-pages.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "Pages extract nahi ho paye"
      });

    }

  }
);


/* =========================
   16. OFFICE TO PDF
========================= */

app.post(
  "/office-to-pdf",
  upload.single("file"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "Office file select karein"
        });

      }

      const data = await runTask(
        "officepdf",
        [req.file]
      );

      cleanupFiles([req.file]);

      sendFile(
        res,
        data,
        "converted.pdf"
      );

    } catch (error) {

      cleanupFiles([req.file]);

      console.error(error);

      res.status(500).json({
        error: "Office to PDF conversion nahi ho paya"
      });

    }

  }
);


/* =========================
   SERVER
========================= */

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
