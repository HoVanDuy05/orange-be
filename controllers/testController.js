const db = require('../config/db');

exports.getHealth = async (req, res) => {
  try {
    // Optional: test database connection
    // const result = await db.query('SELECT NOW()');
    res.json({
      status: 'OK',
      timestamp: new Date(),
      database: 'Connected (test disabled)'
    });
  } catch (err) {
    res.status(500).json({ status: 'Error', message: err.message });
  }
};
