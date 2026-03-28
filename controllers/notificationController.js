const NotificationModel = require('../models/notificationModel');

exports.getNotifications = async (req, res) => {
  const { unread, page, limit } = req.query;
  try {
    const data = await NotificationModel.getAll({ 
      unreadOnly: unread === 'true', 
      page, 
      limit 
    });
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const data = await NotificationModel.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markRead = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await NotificationModel.markRead(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await NotificationModel.markAllRead();
    res.status(200).json({ success: true, message: 'Marked all as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    await NotificationModel.delete(id);
    res.status(200).json({ success: true, message: 'Deleted notification' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await NotificationModel.clearAll();
    res.status(200).json({ success: true, message: 'Cleared all' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
