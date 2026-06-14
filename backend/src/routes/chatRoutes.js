import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  getConversations, 
  markAsRead,
  markAllAsRead,
  deleteMessage,
  sendImageMessage,
  sendFileMessage,
  sendVoiceMessage
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:userId', getMessages);
router.post('/message', sendMessage);
router.post('/send-image', upload.single('image'), sendImageMessage);
router.post('/send-file', upload.single('file'), sendFileMessage);
router.post('/send-voice', upload.single('voice'), sendVoiceMessage);
router.put('/message/:messageId/read', markAsRead);
router.put('/mark-all-read/:userId', markAllAsRead);
router.delete('/message/:messageId', deleteMessage);

export default router;