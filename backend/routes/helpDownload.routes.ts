// src/routes/helpDownload.routes.ts
// -------------------------------------------------
import express from 'express';
import * as helpDownloadController from '../controllers/helpDownload.controller';

const router = express.Router();

router.get('/getOs', helpDownloadController.getOs)
router.get('/download-script', helpDownloadController.downloadScript);
router.post('/postData', helpDownloadController.postData)
router.get('/user-guide', helpDownloadController.downloadUserGuide);

export default router;